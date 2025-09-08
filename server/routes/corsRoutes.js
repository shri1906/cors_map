// routes/corsRoutes.js
import express from "express";
import { getAuthToken, getStations, getStationsFromSBC } from "../controllers/corsController.js";



const router = express.Router();

router.get("/", getStations);  
router.get("/realtime", getStationsFromSBC);       // GET 

export default router;

