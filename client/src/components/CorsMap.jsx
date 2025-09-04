import { useEffect, useRef } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import "@arcgis/core/assets/esri/themes/light/main.css";

export default function CorsMap() {
  const mapDiv = useRef(null);

  useEffect(() => {
    const map = new Map({
      basemap: "osm" // simple basemap
    });

    const view = new MapView({
      container: mapDiv.current,
      map,
      center: [78.9629, 22.5937], // India center
      zoom: 5,
      ui: { components: [] } // ❌ removes zoom, search, etc.
    });

    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);

    // ✅ Dummy CORS stations
    const dummyStations = [
      { id: 1, name: "Delhi", latitude: 28.7041, longitude: 77.1025, status: "active" },
      { id: 2, name: "Mumbai", latitude: 19.0760, longitude: 72.8777, status: "inactive" },
      { id: 3, name: "Kolkata", latitude: 22.5726, longitude: 88.3639, status: "error" },
      { id: 4, name: "Chennai", latitude: 13.0827, longitude: 80.2707, status: "active" },
      { id: 5, name: "Bangalore", latitude: 12.9716, longitude: 77.5946, status: "active" }
    ];

    // ✅ Add station markers with popups
    dummyStations.forEach(st => {
      const point = {
        type: "point",
        longitude: st.longitude,
        latitude: st.latitude
      };

      // Symbol color based on status
      let color = "green";
      if (st.status === "inactive") color = "red";
      if (st.status === "error") color = "orange";

      const markerSymbol = {
        type: "simple-marker",
        color,
        size: "12px",
        outline: { color: "white", width: 1 }
      };

      // Popup template
      const popupTemplate = {
        title: st.name,
        content: `
          <b>Status:</b> ${st.status}<br/>
          <b>Latitude:</b> ${st.latitude}<br/>
          <b>Longitude:</b> ${st.longitude}
        `
      };

      // Marker graphic
      const pointGraphic = new Graphic({
        geometry: point,
        symbol: markerSymbol,
        attributes: st,
        popupTemplate
      });

      graphicsLayer.add(pointGraphic);
    });

    return () => view?.destroy();
  }, []);

  return (
    <div
      ref={mapDiv}
      style={{ width: "100%", height: "90vh", border: "1px solid #ccc" }}
    />
  );
}
