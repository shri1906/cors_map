import CorsStation from "../models/corsModel.js";
import { toGeoJSON } from "../utils/geojson.js";

export const getStations = async (req, res) => {
  try {
    const stations = await CorsStation.findAll();
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStationsGeoJSON = async (req, res) => {
  try {
    const stations = await CorsStation.findAll();
    res.json(toGeoJSON(stations));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
