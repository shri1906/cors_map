import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import sequelize from "./config/db.js";
import corsRoutes from "./routes/corsRoutes.js";
import { loadStationNames } from "./controllers/corsController.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/cors", corsRoutes);


const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("MySQL connected & tables synced");

    await loadStationNames(); 

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Startup failed:", err);
  }
};

startServer();
