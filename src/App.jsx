import React, { useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css'; 
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl; 
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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
    const [locations, setLocations] = useState([]);
    const [isAdding, setIsAdding] = useState(true);
    const [tempLocation, setTempLocation] = useState(null);
    const [locationInfo, setLocationInfo] = useState({ name: '', details: '' });

    const formRef = useRef(null);

    const handleMapClick = useCallback((latlng) => {
        if (isAdding) {
            setTempLocation(latlng);
            setTimeout(() => {
                formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [isAdding]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setLocationInfo(prev => ({ ...prev, [name]: value }));
    };

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

    const handleDone = () => {
        setIsAdding(false);
        setTempLocation(null);
    };

    const handleReset = () => {
        setIsAdding(true);
        setLocations([]);
        setTempLocation(null);
        setLocationInfo({ name: '', details: '' });
    };

    const handleEdit = (index) => {
        const updatedName = prompt("Enter new name:", locations[index].name);
        const updatedDetails = prompt("Enter new details:", locations[index].details);
        if (updatedName !== null && updatedDetails !== null) {
            const updatedLocations = [...locations];
            updatedLocations[index] = {
                ...updatedLocations[index],
                name: updatedName,
                details: updatedDetails,
            };
            setLocations(updatedLocations);
        }
    };

    const handleDelete = (index) => {
        if (window.confirm("Are you sure you want to delete this location?")) {
            const updatedLocations = locations.filter((_, i) => i !== index);
            setLocations(updatedLocations);
        }
    };

    const LocationsList = () => (
        <div className="locations-list">
            <h2>Entered Locations ({locations.length})</h2>
            {locations.length === 0 ? (
                <p>Click on the map to start adding places!</p>
            ) : (
                <ul>
                    {locations.map((loc, index) => (
                        <li key={loc.id}>
                            <strong>{loc.name}</strong>
                            <p className="details">{loc.details.substring(0, 50)}...</p>
                            <div style={{ marginTop: '6px' }}>
                                <button onClick={() => handleEdit(index)} style={{ marginRight: '6px', padding: '4px 8px', fontSize: '0.8rem' }}>Edit</button>
                                <button onClick={() => handleDelete(index)} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

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
                    {isAdding && tempLocation && <LocationInputForm />}
                    {isAdding && !tempLocation && <LocationsList />}
                    {!isAdding && <LocationsList />}
                </div>
            </div>
        </div>
    );
};

export default App;
