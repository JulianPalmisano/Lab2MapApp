import React, { useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from 'react-leaflet';
// Note: In some environments (like Canvas/Code sandbox), direct import of CSS may cause resolution errors.
// This is typically handled outside the JSX file, but we keep it for standard project structure.
// If you see errors about this file, remove this line and add the link in index.html instead.
import 'leaflet/dist/leaflet.css';
import './App.css'; 

// Fix for Leaflet marker icons in React/Vite environments
import L from 'leaflet';
// Fix: The original code used invalid assignment syntax. This correctly deletes the default icon method.
delete L.Icon.Default.prototype._getIconUrl; 
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to handle map clicks
const LocationMarkerHandler = ({ onMapClick, isAdding }) => {
    useMapEvents({
        click: (e) => {
            if (isAdding) {
                onMapClick(e.latlng);
            }
        },
        mousemove: (e) => {
            const map = e.target;
            map._container.style.cursor = isAdding ? 'crosshair' : '';
        }
    });
    return null;
};

const App = () => {
    // Stores the list of all saved locations
    const [locations, setLocations] = useState([]);
    // Controls the app state: true allows adding locations, false locks the view
    const [isAdding, setIsAdding] = useState(true);
    // Holds coordinates temporarily after a map click
    const [tempLocation, setTempLocation] = useState(null);
    // State for the user input form
    const [locationInfo, setLocationInfo] = useState({ name: '', details: '' });

    const formRef = useRef(null);

    // Handles a map click event, setting the temporary location
    const handleMapClick = useCallback((latlng) => {
        if (isAdding) {
            setTempLocation(latlng);
            // Scrolls to the form for user focus
            setTimeout(() => {
                formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [isAdding]);

    // Updates form input state
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setLocationInfo(prev => ({ ...prev, [name]: value }));
    };

    // Saves the temporary location as a permanent entry
    const handleSaveLocation = (e) => {
        e.preventDefault();

        if (tempLocation && locationInfo.name.trim()) {
            const newLocation = {
                id: Date.now(),
                lat: tempLocation.lat,
                lng: tempLocation.lng,
                name: locationInfo.name.trim(),
                details: locationInfo.details.trim() || 'No details provided.',
            };

            setLocations(prev => [...prev, newLocation]);
            setTempLocation(null);
            setLocationInfo({ name: '', details: '' });
        }
    };

    // Switches the application to viewing mode
    const handleDone = () => {
        setIsAdding(false);
        setTempLocation(null);
    };

    // Clears all data and resets to the initial adding mode
    const handleReset = () => {
        setIsAdding(true);
        setLocations([]);
        setTempLocation(null);
        setLocationInfo({ name: '', details: '' });
    };

    // Component to render the list of entered locations
    const LocationsList = () => (
        <div className="locations-list">
            <h2>Entered Locations ({locations.length})</h2>
            {locations.length === 0 ? (
                <p>Click on the map to start adding places!</p>
            ) : (
                <ul>
                    {locations.map(loc => (
                        <li key={loc.id}>
                            <strong>{loc.name}</strong>
                            <p className="details">{loc.details.substring(0, 50)}...</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    // Component to render the location input form
    const LocationInputForm = () => (
        <div ref={formRef} className="location-form-container">
            <h3>Add Location Details</h3>
            <p>Lat: {tempLocation.lat.toFixed(4)}, Lng: {tempLocation.lng.toFixed(4)}</p>
            <form onSubmit={handleSaveLocation} className="location-form">
                <input
                    type="text"
                    name="name"
                    placeholder="Location Name (e.g., Home, Dream Vacation)"
                    value={locationInfo.name}
                    onChange={handleInputChange}
                    required
                />
                <textarea
                    name="details"
                    placeholder="Details (e.g., lived here 2015-2020, favorite restaurant)"
                    value={locationInfo.details}
                    onChange={handleInputChange}
                />
                <button type="submit" className="button-save">
                    Save Location
                </button>
                <button type="button" onClick={() => setTempLocation(null)} className="button-cancel">
                    Cancel
                </button>
            </form>
        </div>
    );

    return (
        <div className="app-container">
            <header>
                <h1>My Places Map 🌍</h1>
                <p>
                    {isAdding
                        ? "Click on the map to mark a location and enter its details."
                        : "Click on the markers to see the details you entered."
                    }
                </p>
                <div className="controls">
                    {isAdding ? (
                        <button onClick={handleDone} className="button-primary">
                            ✅ Done Adding Locations
                        </button>
                    ) : (
                        <button onClick={() => setIsAdding(true)} className="button-secondary">
                            ➕ Continue Adding
                        </button>
                    )}
                    <button onClick={handleReset} className="button-reset">
                        🔄 Reset Map
                    </button>
                </div>
            </header>

            <div className="content-area">
                <div className="map-wrapper">
                    <MapContainer
                        center={[34.0522, -118.2437]}
                        zoom={3}
                        scrollWheelZoom={true}
                        className="leaflet-map"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        
                        <LocationMarkerHandler onMapClick={handleMapClick} isAdding={isAdding} />
                        
                        {locations.map(loc => (
                            <Marker position={[loc.lat, loc.lng]} key={loc.id}>
                                <Popup>
                                    <div className="popup-content">
                                        <h4>{loc.name}</h4>
                                        <p>{loc.details}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {tempLocation && (
                            <Marker position={[tempLocation.lat, tempLocation.lng]} opacity={0.6}>
                                <Popup autoClose={false} closeOnClick={false}>
                                    Waiting for details...
                                </Popup>
                            </Marker>
                        )}
                    </MapContainer>
                </div>

                <div className="sidebar">
                    {/* Conditional rendering for the input form and list */}
                    {isAdding && tempLocation && <LocationInputForm />}
                    {isAdding && !tempLocation && <LocationsList />}
                    {!isAdding && <LocationsList />}
                </div>
            </div>
        </div>
    );
};

export default App;
