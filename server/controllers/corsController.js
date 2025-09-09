import axios from "axios";
import fs from "fs";
import csv from "csv-parser";

let stationNameMap = {};

// Load station names from CSV (run once at startup)
export const loadStationNames = () => {
  return new Promise((resolve, reject) => {
    fs.createReadStream("stations.csv")
      .pipe(csv())
      .on("data", (row) => {
        if (row.siteCode && row.stationName) {
          stationNameMap[row.siteCode.trim()] = row.stationName.trim();
        }
      })
      .on("end", () => {
        console.log("✅ Station names loaded from CSV:", Object.keys(stationNameMap).length);
        resolve();
      })
      .on("error", reject);
  });
};

// Helper: radians → degrees
const toDegrees = (radian) => radian * (180 / Math.PI);

// Normalize SBC data
const normalizeSBCStations = (data) => {
  return data.sites.map((site) => {
    let health = 0;
    if (site.connected && site.usedForNetworkProcessing && !site.receivingData) {
      health = 3;
    } else if (site.connected && site.usedForNetworkProcessing && site.receivingData) {
      health = 1;
    }

    return {
      code: site.siteCode,
      name: stationNameMap[site.siteCode] || site.siteServerName, // lookup CSV → fallback
      type: site.receiverType,
      latitude: toDegrees(site.latitude),
      longitude: toDegrees(site.longitude),
      height: site.height,
      health: health,
      source: "SBC",
    };
  });
};

// Normalize Trimble data
const normalizeTrimbleStations = (data) => {
  return data.d.StationMarkerList.map((station) => ({
    code: station.StationCode,
    name: station.StationName,
    type: station.SensorType,
    latitude: station.Latitude,
    longitude: station.Longitude,
    height: station.Height,
    health: station.HealthInfoObject?.SensorHealth?.Health ?? 0,
    source: "Trimble",
  }));
};

// ============= SBC API =============

// Auth
export const getAuthToken = async () => {
  try {
    const userName = process.env.SBC_USER;
    const password = process.env.SBC_PASS;
    const returnUrl = process.env.SBC_LOGIN_API;

    const loginResponse = await axios.post(
      returnUrl,
      {
        userName: userName,
        password: password,
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
    console.error("Auth error:", error.message);
    return null;
  }
};

// Internal SBC fetch (returns normalized data)
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

// Express handler
export const getStationsFromSBC = async (req, res) => {
  try {
    const stations = await getStationsFromSBCInternal();
    res.json(stations);
  } catch (error) {
    console.error("Error fetching SBC stations:", error.message);
    res.status(500).json({ error: "Failed to fetch SBC stations" });
  }
};

// ============= Trimble API =============

const getStationsFromTrimbleInternal = async () => {
  const trimbleUrl = process.env.TRIMBLE_API_URL;
  const response = await axios.post(trimbleUrl, {}, {
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
    },
  });

  return normalizeTrimbleStations(response.data);
};

// Express handler
export const getStationsFromTrimble = async (req, res) => {
  try {
    const stations = await getStationsFromTrimbleInternal();
    res.json(stations);
  } catch (error) {
    console.error("Error fetching Trimble stations:", error.message);
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
    console.error("Error fetching combined stations:", error.message);
    res.status(500).json({ error: "Failed to fetch stations" });
  }
};
