import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import "@arcgis/core/assets/esri/themes/light/main.css";
import App from './App.jsx'
import esriConfig from "@arcgis/core/config";
esriConfig.log.level = "off";

window.addEventListener("unhandledrejection", (event) => {
  if (event.reason && event.reason.name === "AbortError") {
    event.preventDefault(); // stop console error
  }
});


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
