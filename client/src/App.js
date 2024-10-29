// client/src/App.js
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import L from 'leaflet';

// Correction pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Composant pour gérer les clics sur la carte
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick([lat, lng]);
    },
  });
  return null;
}

function App() {
  const [start, setStart] = useState([48.8566, 2.3522]); // Format [lat, lng]
  const [end, setEnd] = useState([48.8566, 2.3622]); // Format [lat, lng]
  const [mines, setMines] = useState([]);
  const [path, setPath] = useState([]);
  const [newMine, setNewMine] = useState({ lat: '', lng: '' });
  const [mapCenter] = useState([48.8566, 2.3522]);
  const [mapZoom] = useState(13);
  const [placementMode, setPlacementMode] = useState('none'); // 'none', 'start', 'end', 'mine'
  const [routePath, setRoutePath] = useState([]); // Initialiser avec un tableau vide
  const [routeInfo, setRouteInfo] = useState(null);
  const [selectedMineType, setSelectedMineType] = useState('PFM-1');

  useEffect(() => {
    fetchMines();
  }, []);

  const fetchMines = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/mines');
      const data = await response.json();
      setMines(data.mines);
    } catch (error) {
      console.error("Erreur lors de la récupération des mines:", error);
    }
  };

  const handleMapClick = (coords) => {
    switch (placementMode) {
      case 'start':
        setStart(coords);
        setPlacementMode('none');
        break;
      case 'end':
        setEnd(coords);
        setPlacementMode('none');
        break;
      case 'mine':
        addMineAtCoords(coords);
        break;
      default:
        break;
    }
  };

  const addMineAtCoords = async (coords) => {
    try {
      const mineToAdd = {
        lat: coords[0],
        lng: coords[1],
        type: selectedMineType
      };
      const response = await fetch('http://localhost:5000/api/mines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mineToAdd),
      });
      const data = await response.json();
      setMines(data.mines);
    } catch (error) {
      console.error("Erreur lors de l'ajout d'une mine:", error);
    }
  };

  const addMine = async () => {
    try {
      const mineToAdd = {
        lat: parseFloat(newMine.lat),
        lng: parseFloat(newMine.lng),
        type: selectedMineType
      };
      const response = await fetch('http://localhost:5000/api/mines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mineToAdd),
      });
      const data = await response.json();
      setMines(data.mines);
      setNewMine({ lat: '', lng: '' });
    } catch (error) {
      console.error("Erreur lors de l'ajout d'une mine:", error);
    }
  };

  const removeMine = async (index) => {
    try {
      const response = await fetch(`http://localhost:5000/api/mines/${index}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMines(data.mines);
    } catch (error) {
      console.error("Erreur lors de la suppression d'une mine:", error);
    }
  };

  const calculatePath = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          start: { lat: start[0], lng: start[1] },
          end: { lat: end[0], lng: end[1] },
          minesList: mines 
        }),
      });
      const data = await response.json();
      if (data.path) {
        setPath(data.path.instructions || []);
        setRoutePath(data.path.coordinates || []);
        setRouteInfo({
          distance: (data.path.distance / 1000).toFixed(2),
          duration: Math.round(data.path.duration / 60)
        });
      } else {
        setPath([]);
        setRoutePath([]);
        setRouteInfo(null);
        alert("Impossible de trouver un chemin sûr. Veuillez essayer un autre itinéraire.");
      }
    } catch (error) {
      console.error("Erreur lors du calcul du chemin:", error);
      setPath([]);
      setRoutePath([]);
      setRouteInfo(null);
      alert("Erreur lors du calcul de l'itinéraire");
    }
  };

  const mineIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const startIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const endIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const pfmIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const tmIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  return (
    <div>
      <h1>Pathfinding App</h1>
      
      <div className="controls">
        <h2>Mode de placement</h2>
        <button 
          onClick={() => setPlacementMode('start')}
          className={placementMode === 'start' ? 'active' : ''}
        >
          Placer le départ
        </button>
        <button 
          onClick={() => setPlacementMode('end')}
          className={placementMode === 'end' ? 'active' : ''}
        >
          Placer l'arrivée
        </button>
        <button 
          onClick={() => setPlacementMode('mine')}
          className={placementMode === 'mine' ? 'active' : ''}
        >
          Placer des mines
        </button>
        <button 
          onClick={() => setPlacementMode('none')}
          className={placementMode === 'none' ? 'active' : ''}
        >
          Mode navigation
        </button>
      </div>

      <div className="controls">
        <h2>Type de mine</h2>
        <select 
          value={selectedMineType} 
          onChange={(e) => setSelectedMineType(e.target.value)}
        >
          <option value="PFM-1">PFM-1/PFM-1S (1m)</option>
          <option value="TM-62">TM-62 (10m)</option>
        </select>
      </div>

      <div>
        <h2>Ajouter une mine manuellement</h2>
        <input 
          type="text" 
          value={newMine.lat} 
          onChange={e => setNewMine({ ...newMine, lat: e.target.value })} 
          placeholder="Latitude"
        />
        <input 
          type="text" 
          value={newMine.lng} 
          onChange={e => setNewMine({ ...newMine, lng: e.target.value })} 
          placeholder="Longitude"
        />
        <button onClick={addMine}>Ajouter</button>
      </div>

      <button onClick={calculatePath}>Calculer le chemin</button>

      <div>
        <h2>Mines</h2>
        {Array.isArray(mines) && mines.length > 0 ? (
          <ul>
            {mines.map((mine, index) => (
              <li key={index}>
                Mine {mine.type} at ({mine.lat}, {mine.lng})
                <button onClick={() => removeMine(index)}>Supprimer</button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucune mine ajoutée.</p>
        )}
      </div>

      <div>
        <h2>Instructions</h2>
        {routeInfo ? (
          <div className="route-info">
            <p>Distance totale : {routeInfo.distance} km</p>
            <p>Durée estimée : {routeInfo.duration} minutes</p>
          </div>
        ) : null}
        {Array.isArray(path) && path.length > 0 ? (
          <ul>
            {path.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        ) : (
          <p>Aucun chemin calculé.</p>
        )}
      </div>

      <div className="map-container">
        <h2>Carte GPS</h2>
        <p>Mode actuel : {placementMode === 'none' ? 'Navigation' : 
          placementMode === 'start' ? 'Placement du départ' :
          placementMode === 'end' ? 'Placement de l\'arrivée' :
          'Placement des mines'}</p>
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          style={{ height: '400px', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <MapClickHandler onMapClick={handleMapClick} />
          
          {Array.isArray(routePath) && routePath.length > 0 && (
            <Polyline
              positions={routePath}
              color="blue"
              weight={3}
              opacity={0.7}
            />
          )}

          <Marker position={start} icon={startIcon}>
            <Popup>Point de départ</Popup>
          </Marker>

          <Marker position={end} icon={endIcon}>
            <Popup>Point d'arrivée</Popup>
          </Marker>

          {Array.isArray(mines) && mines.map((mine, index) => (
            <Marker 
              key={index} 
              position={[mine.lat, mine.lng]} 
              icon={mine.type === 'PFM-1' ? pfmIcon : tmIcon}
            >
              <Popup>
                Mine {mine.type} {index + 1}
                <br />
                Rayon d'action : {mine.type === 'PFM-1' ? '1m' : '10m'}
                <br />
                <button onClick={() => removeMine(index)}>Supprimer</button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;
