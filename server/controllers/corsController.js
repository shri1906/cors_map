import axios from "axios";
import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const stationNameMap = {};

export const loadStationNames = () => {
  return new Promise((resolve, reject) => {
    const csvPath = path.join(__dirname, "stations.csv");
  
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        // Normalize keys to lowercase + trim
        const keys = Object.keys(row).reduce((acc, key) => {
          acc[key.trim().toLowerCase()] = row[key].trim();
          return acc;
        }, {});

        if (keys.sitecode && keys.stationname) {
          stationNameMap[keys.sitecode] = keys.stationname;
        } else {
          console.log("Skipped row:", row);
        }
      })
      .on("end", () => {
        resolve();
      })
      .on("error", (err) => {
        console.error("CSV load error:", err);
        reject(err);
      });
  });
};

const toDegrees = (radian) => radian * (180 / Math.PI);

const normalizeSBCStations = (data) => {
  return data.sites.map((site) => {
    let health = 0;
    if (
      site.connected &&
      site.usedForNetworkProcessing &&
      !site.receivingData
    ) {
      health = 3;
    } else if (
      site.connected &&
      site.usedForNetworkProcessing &&
      site.receivingData
    ) {
      health = 1;
    }

    return {
      code: site.siteCode,
      name: stationNameMap[site.siteCode] || site.siteServerName, 
      type: site.receiverType,
      latitude: toDegrees(site.latitude), 
      longitude: toDegrees(site.longitude), 
      height: site.height,
      health,
      source: "LEICA",
    };
  });
};

const normalizeTrimbleStations = (data) => {
  return data.d.StationMarkerList.map((station) => ({
    code: station.StationCode,
    name: station.StationName,
    type: station.SensorType,
    latitude: station.Latitude,
    longitude: station.Longitude,
    height: station.Height,
    health: station.HealthInfoObject?.SensorHealth?.Health ?? 0,
    source: "TRIMBLE",
  }));
};
// ============= SBC API =============
// Get SBC auth token

export const getAuthToken = async () => {
  try {
    const userName = process.env.SBC_USER;
    const password = process.env.SBC_PASS;
    const returnUrl = process.env.SBC_LOGIN_API;

    const loginResponse = await axios.post(
      returnUrl,
      {
        userName,
        password,
        returnUrl: "",
        rememberMe: true,
      },
      {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json-patch+json",
        },
      }
    );

    return loginResponse.headers["x-sbc-auth"];
  } catch (error) {
    return null;
  }
};

const getStationsFromSBCInternal = async () => {
  const getStationsUrl = process.env.SBC_GET_STATIONS_API;
  const token = await getAuthToken();
  if (!token) throw new Error("SBC auth failed");

  const response = await axios.get(getStationsUrl, {
    headers: {
      Accept: "application/json",
      "X-SBC-Auth": token,
    },
  });

  return normalizeSBCStations(response.data);
};

export const getStationsFromSBC = async (req, res) => {
  try {
    const stations = await getStationsFromSBCInternal();
    res.json(stations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch SBC stations" });
  }
};

// ============= Trimble API =============

const getStationsFromTrimbleInternal = async () => {
  const trimbleUrl = process.env.TRIMBLE_API_URL;
  const response = await axios.post(
    trimbleUrl,
    {},
    {
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    }
  );

  return normalizeTrimbleStations(response.data);
};

export const getStationsFromTrimble = async (req, res) => {
  try {
    const stations = await getStationsFromTrimbleInternal();
    res.json(stations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Trimble stations" });
  }
};

// ============= Combined API =============

export const getAllStations = async (req, res) => {
  try {
    const [sbcStations, trimbleStations] = await Promise.all([
      getStationsFromSBCInternal(),
      getStationsFromTrimbleInternal(),
    ]);
    res.json([...sbcStations, ...trimbleStations]);  
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stations" });
  }
};
