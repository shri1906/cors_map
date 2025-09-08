// routes/corsRoutes.js
import express from "express";
import {  getStationsFromSBC } from "../controllers/corsController.js";

const router = express.Router();
router.get("/realtime", getStationsFromSBC);       // GET 

export default router;

