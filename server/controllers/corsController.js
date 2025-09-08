import axios from "axios";

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
   const token = loginResponse.headers["x-sbc-auth"];
   return token;

  } catch (error) {
    console.error(error.message);
    return error.response ? error.response.data : null;
  }
};

//  Fetch stations directly from SBC API
export const getStationsFromSBC = async (req, res) => {
  const getStationsUrl = process.env.SBC_GET_STATIONS_API;
  try {
    const token = await getAuthToken();
    if (!token) {
      return res.status(401).json({ error: "Failed to authenticate with SBC" });
    }

    const response = await axios.get(getStationsUrl, {
      headers: {
        Accept: "application/json",
        "X-SBC-Auth": token, // only token string
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error(" Error fetching SBC stations:", error.message);
    if (error.response) {
      console.error("Response:", error.response.data);
    }
    res.status(500).json({ error: "Failed to fetch SBC stations" });
  }
};

