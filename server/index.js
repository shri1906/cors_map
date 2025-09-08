import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import sequelize from "./config/db.js";
import corsRoutes from "./routes/corsRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/cors", corsRoutes);

// Start server after DB sync
sequelize
  .sync({ alter: true }) // { force: true } only if you want to drop & recreate tables
  .then(() => {
    console.log("✅ MySQL connected & tables synced");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("❌ DB connection failed:", err));
