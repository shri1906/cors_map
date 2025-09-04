import { useEffect, useRef } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import esriConfig from "@arcgis/core/config";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import * as watchUtils from "@arcgis/core/core/watchUtils";

const INDIA_EXTENT = {
  xmin: 67.0,
  ymin: 6.0,
  xmax: 98.0,
  ymax: 37.0,
  spatialReference: { wkid: 4326 },
};

const popupTemplate = {
  title: "{name}",
  content: (feature) => {
    const attrs = feature.graphic.attributes;
    return `
      <b>Agency:</b> ${attrs.agency || "-"}<br/>
      <b>Network:</b> ${attrs.network || "-"}<br/>
      <b>Status:</b> ${attrs.status || "-"}<br/>
      <b>Last Seen:</b> ${attrs.lastSeen || "-"}<br/>
      <b>Constellations:</b> ${(attrs.constellations || []).join(", ") || "-"}
    `;
  },
};

// Renderer: color by status, size fixed
const renderer = {
  type: "unique-value",
  field: "status",
  defaultSymbol: { type: "simple-marker", size: 10, outline: { width: 0.5 } },
  uniqueValueInfos: [
    {
      value: "online",
      symbol: { type: "simple-marker", size: 12, outline: { width: 0.5 } },
    },
    {
      value: "warning",
      symbol: { type: "simple-marker", size: 12, outline: { width: 0.5 } },
    },
    {
      value: "offline",
      symbol: { type: "simple-marker", size: 12, outline: { width: 0.5 } },
    },
  ],
  // optional: visual variable to fade older stations
  visualVariables: [
    {
      type: "opacity",
      field: "ageMinutes",
      stops: [
        { value: 0, opacity: 1.0 },
        { value: 10, opacity: 0.8 },
        { value: 30, opacity: 0.4 },
        { value: 120, opacity: 0.2 },
      ],
    },
  ],
};

export default function CorsMap({
  mode = "poll", // "poll" | "ws"
  geojsonUrl, // used in poll mode
  pollSeconds = 15,
  wsUrl, // used in ws mode
}) {
  const mapDiv = useRef(null);
  const viewRef = useRef(null);
  const layerRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    esriConfig.assetsPath = "/"; // adjust if serving assets elsewhere

    const map = new Map({ basemap: "streets-navigation-vector" });

    const view = new MapView({
      container: mapDiv.current,
      map,
      constraints: { snapToZoom: false },
      center: [78.9629, 22.5937], // India center
      zoom: 4,
    });
    viewRef.current = view;

    let layer;

    if (mode === "poll" && geojsonUrl) {
      // OPTION A: GeoJSON polling (auto-refresh)
      layer = new GeoJSONLayer({
        url: geojsonUrl,
        title: "CORS Stations",
        popupTemplate,
        renderer,
        // cluster to keep map clean
        featureReduction: {
          type: "cluster",
          clusterMinSize: 18,
          clusterMaxSize: 40,
          labelingInfo: [
            {
              deconflictionStrategy: "none",
              labelExpressionInfo: {
                expression: "Text($feature.cluster_count, '#,###')",
              },
              symbol: {
                type: "text",
                font: { size: 10, weight: "bold" },
              },
            },
          ],
        },
        refreshInterval: pollSeconds / 60, // minutes
      });
      map.add(layer);
      layerRef.current = layer;
    } else {
      // OPTION B: Custom WebSocket pushing to a GraphicsLayer
      layer = new GraphicsLayer({ title: "CORS (Live)" });
      map.add(layer);
      layerRef.current = layer;

      // Fit to India on first render
      watchUtils.whenTrueOnce(view, "ready", () => {
        view.goTo(INDIA_EXTENT);
      });

      // Open the WS and update graphics as messages arrive
      if (wsUrl) {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        const byId = new Map(); // id -> Graphic

        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data);

            // Support full station or patch update
            // Expect msg to contain: id, lat, lon plus attributes
            if (!msg.id) return;

            const gExisting = byId.get(msg.id);
            if (gExisting) {
              // patch attributes & geometry
              if (typeof msg.lat === "number" && typeof msg.lon === "number") {
                gExisting.geometry = {
                  type: "point",
                  longitude: msg.lon,
                  latitude: msg.lat,
                };
              }
              gExisting.attributes = { ...gExisting.attributes, ...msg };
              layer.refresh();
            } else {
              if (typeof msg.lat === "number" && typeof msg.lon === "number") {
                const g = new Graphic({
                  geometry: {
                    type: "point",
                    longitude: msg.lon,
                    latitude: msg.lat,
                  },
                  attributes: msg,
                });
                byId.set(msg.id, g);
                layer.add(g);
              }
            }
          } catch {
            console.warn("CORS WS invalid message", evt.data);
          }
        };

        ws.onopen = () => console.log("CORS WS connected");
        ws.onerror = (e) => console.warn("CORS WS error", e);
        ws.onclose = () => console.log("CORS WS closed");
      }
    }

    return () => {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          /* ignore */
        }
      }
      if (view) view.destroy();
    };
  }, [mode, geojsonUrl, pollSeconds, wsUrl]);

  return <div ref={mapDiv} className="w-full h-[80vh] rounded-2xl shadow" />;
}
