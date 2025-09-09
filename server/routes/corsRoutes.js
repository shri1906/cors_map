// routes/corsRoutes.js
import express from "express";
import {  getAllStations, } from "../controllers/corsController.js";

const router = express.Router();
router.get("/realtime", getAllStations);       // GET 

export default router;

