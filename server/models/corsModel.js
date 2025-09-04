import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const CorsStation = sequelize.define(
  "CorsStation",
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    name: { type: DataTypes.STRING },
    agency: { type: DataTypes.STRING },
    network: { type: DataTypes.STRING },
    lat: { type: DataTypes.FLOAT, allowNull: false },
    lon: { type: DataTypes.FLOAT, allowNull: false },
    status: {
      type: DataTypes.ENUM("online", "offline", "warning"),
      defaultValue: "offline",
    },
    lastSeen: { type: DataTypes.DATE },
    constellations: { type: DataTypes.JSON },
  },
  {
    tableName: "cors_stations",
    timestamps: true,
  }
);

export default CorsStation;
