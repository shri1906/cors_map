import { useEffect, useRef } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import "@arcgis/core/assets/esri/themes/light/main.css";
import axios from "axios";

export default function CorsMap() {
  const mapDiv = useRef(null);

  useEffect(() => {
    const map = new Map({ basemap: "satellite" });

    const view = new MapView({
      container: mapDiv.current,
      map,
      center: [78.9629, 22.5937], // India center
      zoom: 5,
      ui: { components: [] }, // hide zoom/search
    });

    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);
    const fetchStations = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/cors/realtime");
        const data = res.data;
        console.log(data.sites[0]);
        graphicsLayer.removeAll();

        if (data.sites && Array.isArray(data.sites)) {
          data.sites.forEach((st) => {
            if (!st.longitude || !st.latitude) return;

            const radToDeg = (rad) => rad * (180 / Math.PI);

            const point = {
              type: "point",
              longitude: radToDeg(st.longitude),
              latitude: radToDeg(st.latitude),
            };

  
            let color = "grey";
            if (!st.connected && !st.receivingData && !st.started) {
              color = "grey";
            }
            else if (st.connected && st.receivingData && st.started) {
              color = "green";
            }
            else if (st.connected && st.started && !st.receivingData) {
              color = "red";
            }
            const markerSymbol = {
              type: "simple-marker",
              color,
              size: "12px",
              outline: { color: "white", width: 1 },
            };

            // Popup info
            const popupTemplate = {
              title: st.siteCode || `Station ${st.id}`,
              content: `
                <b>Name:</b> ${st.siteCode}<br/>
                <b>Status:</b> ${st.connected ? "Online" : "Offline"}<br/>
                <b>Latitude:</b> ${radToDeg(st.latitude)}<br/>
                <b>Longitude:</b> ${radToDeg(st.longitude)}<br/>
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
    const interval = setInterval(fetchStations, 5000); // refresh every 15s

    return () => {
      clearInterval(interval);
      view?.destroy();
    };
  }, []);

  return (
    <div
      ref={mapDiv}
      style={{ width: "100%", height: "90vh", border: "1px solid #ccc" }}
    />
  );
}
