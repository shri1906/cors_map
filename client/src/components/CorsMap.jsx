import { useEffect, useRef } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import "@arcgis/core/assets/esri/themes/light/main.css";
import axios from "axios";
import Compass from "@arcgis/core/widgets/Compass";
import "./corsMap.css";

export default function CorsMap() {
  const mapDiv = useRef(null);

  useEffect(() => {
    const map = new Map({ basemap: "osm" });

    const view = new MapView({
      container: mapDiv.current,
      map,
      center: [78.9629, 22.5937], // India center
      zoom: 5,
      ui: { components: [] },
    });

    const compass = new Compass({
      view,
    });

    view.ui.add(compass, "top-left");
    const geojsonLayer = new GeoJSONLayer({
      url: "/india.geojson",
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-fill",
          color: [0, 0, 0, 0],
          outline: { color: "teal", width: 1.5 },
        },
      },
    });
    map.add(geojsonLayer);

    // Station layer
    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);

    const fetchStations = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/cors/stations");
        const stations = res.data;
        graphicsLayer.removeAll();

        if (Array.isArray(stations)) {
          stations.forEach((st) => {
            if (!st.longitude || !st.latitude) return;

            let color = "lightgrey";
            if (st.health === 1) color = "green";
            else if (st.health === 3) color = "red";
            else color = "orange";

            const point = {
              type: "point",
              longitude: st.longitude,
              latitude: st.latitude,
            };

            const markerSymbol = {
              type: "simple-marker",
              color,
              size: "14px",
              outline: { color: "white", width: 1 },
            };

            const popupTemplate = {
              title: st.name || `Station ${st.code}`,
              content: `
                <div class="custom-popup">
                  <p><b>Code:</b> ${st.code}</p>
                  <p><b>Source:</b> ${st.source}</p>
                  <p><b>Status:</b> ${
                    st.health === 1
                      ? "🟢 Online"
                      : st.health === 3
                        ? "🔴 Offline"
                        : "🟠 Connected, No Data"
                  }</p>
                  <p><b>Latitude:</b> ${st.latitude.toFixed(6)}</p>
                  <p><b>Longitude:</b> ${st.longitude.toFixed(6)}</p>
                  <p><b>Height:</b> ${st.height || "N/A"}</p>
                </div>
              `,
            };

            const pointGraphic = new Graphic({
              geometry: point,
              symbol: markerSymbol,
              attributes: st,
              popupTemplate,
            });

            graphicsLayer.add(pointGraphic);
          });
        }
      } catch (err) {
        console.error("Failed to fetch stations:", err);
      }
    };

    fetchStations();
    const interval = setInterval(fetchStations, 15000);

    return () => {
      clearInterval(interval);
      view?.destroy();
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "80%", height: "80vh" }}>
      {/* Map container */}
      <div
        ref={mapDiv}
        style={{ width: "100%", height: "100%", border: "2px solid #000" }}
      />

      {/* Custom Legend */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "white",
          padding: "10px 15px",
          borderRadius: "8px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          fontSize: "14px",
          width: "160px",
        }}
      >
        <div style={{ marginBottom: "6px", fontWeight: "bold" }}>
          📍 Station Status
        </div>
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "green",
              display: "inline-block",
              marginRight: 8,
            }}
          />
          Online
        </div>
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "orange",
              display: "inline-block",
              marginRight: 8,
            }}
          />
          Connected, No Data
        </div>
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "red",
              display: "inline-block",
              marginRight: 8,
            }}
          />
          Offline
        </div>
      </div>
    </div>
  );
}
