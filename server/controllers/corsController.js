import fs from "fs";
import path from "path";
import axios from "axios";


export const getAuthToken = async () => {
  try {
    const userName = process.env.SBC_USER;
    const password = process.env.SBC_PASS;

    const loginResponse = await axios.post(
      "http://103.206.29.4/SBC/API/login",
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
   const token = loginResponse.headers["x-sbc-auth"];
   return token;

  } catch (error) {
    console.error(error.message);
    return error.response ? error.response.data : null;
  }
};

// 🔹 Fetch stations directly from SBC API
export const getStationsFromSBC = async (req, res) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return res.status(401).json({ error: "Failed to authenticate with SBC" });
    }

    const response = await axios.get("http://103.206.29.4/SBC/API/sites", {
      headers: {
        Accept: "application/json",
        "X-SBC-Auth": token, // only token string
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("❌ Error fetching SBC stations:", error.message);
    if (error.response) {
      console.error("Response:", error.response.data);
    }
    res.status(500).json({ error: "Failed to fetch SBC stations" });
  }
};

// 🔹 Return plain JSON from local file
export const getStations = async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), "utils", "region2.json");
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        return res.status(500).json({ error: "Failed to read region2.json" });
      }
      res.json(JSON.parse(data));
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
