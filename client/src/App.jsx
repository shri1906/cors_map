import './App.css'
import CorsMap from '../src/components/CorsMap.jsx'

function App() {

  return (
     <div className="p-4">
      <h1>CORS Live Tracker (India)</h1>
      <CorsMap
        mode="poll"
        geojsonUrl="/cors.geojson"
        pollSeconds={15}
      />
    </div>
  )
}

export default App
