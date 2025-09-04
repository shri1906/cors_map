export function toGeoJSON(stations) {
  return {
    type: "FeatureCollection",
    features: stations.map((st) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [st.lon, st.lat],
      },
      properties: {
        id: st.id,
        name: st.name,
        agency: st.agency,
        network: st.network,
        status: st.status,
        lastSeen: st.lastSeen,
        constellations: st.constellations || [],
      },
    })),
  };
}
