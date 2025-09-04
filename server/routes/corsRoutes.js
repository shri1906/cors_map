import express from "express";
import { getStations, getStationsGeoJSON } from "../controllers/corsController.js";

const router = express.Router();

router.get("/", getStations);          // plain JSON
router.get("/geojson", getStationsGeoJSON); // GeoJSON for ArcGIS

export default router;
