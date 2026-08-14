import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Truck, RefreshCw, MapPin, UserCheck, ArrowLeft } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAssignedDriversTracking } from '../services/api.js';
import './LiveTrackingPage.css';

// Fix Leaflet Default Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const truckIcon = L.divIcon({
  className: 'truck-marker-icon',
  html: '<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚚</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

export default function LiveTrackingPage() {
  const [searchParams] = useSearchParams();
  const targetComplaintId = searchParams.get('complaintId');

  const [vehicles, setVehicles] = useState([]);
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  const fetchLiveTrackingData = async () => {
    try {
      setLoading(true);
      const res = await getAssignedDriversTracking();
      if (res) {
        setVehicles(res.vehicles || []);
        setAssignedComplaints(res.assignedComplaints || []);
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load live tracking data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveTrackingData();
    const interval = setInterval(fetchLiveTrackingData, 5000);
    return () => clearInterval(interval);
  }, []);

  // 1. Find the exact complaint being tracked
  const currentComplaint = targetComplaintId 
    ? assignedComplaints.find((c) => String(c.id) === String(targetComplaintId))
    : assignedComplaints[0];

  // 2. Extract the assigned driver identifier (ID or Name)
  const assignedDriverId = currentComplaint ? String(currentComplaint.assigned_driver_id).trim() : null;

  // 3. STRICT FILTER: Match ONLY the single vehicle assigned to this specific complaint
  const targetVehicle = vehicles.find((v) => {
    if (!assignedDriverId) return false;
    const vId = String(v.id || v.vehicle_id || '').trim();
    const dName = String(v.driver_name || v.driverName || '').trim().toLowerCase();
    const target = assignedDriverId.toLowerCase();

    return vId === target || dName === target;
  });

  // Array containing at most ONE vehicle (the assigned authority)
  const displayVehicles = targetVehicle ? [targetVehicle] : [];

  return (
    <div className="lt-page" style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <Link to={targetComplaintId ? `/track/${targetComplaintId}` : '/my-reports'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#2563eb', textDecoration: 'none', marginBottom: 8 }}>
            <ArrowLeft size={16} /> Back to Complaint Details
          </Link>
          <h1>Assigned Authority Live Tracking</h1>
          <p className="page-subheading">
            {currentComplaint ? `Tracking dispatch unit for Complaint #${currentComplaint.id.substring(0, 8)}...` : 'Real-time GPS telemetry of your assigned municipal driver.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Last Synced: <strong>{lastUpdated}</strong></span>
          <button className="btn btn-outline" onClick={fetchLiveTrackingData} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="lt-body">
        
        {/* LEFT: Live Map */}
        <div className="lt-map-col panel" style={{ background: '#fff', borderRadius: 8, padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="panel-header" style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3><MapPin size={16} style={{ marginRight: 6 }} /> Assigned Unit Radar (Nashik)</h3>
            <span className="badge badge-primary" style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
              {displayVehicles.length > 0 ? 'Assigned Unit Tracked' : 'Waiting for Assignment'}
            </span>
          </div>

          <div style={{ borderRadius: 6, overflow: 'hidden' }}>
            <MapContainer 
              center={displayVehicles.length > 0 ? [parseFloat(displayVehicles[0].latitude || 19.9975), parseFloat(displayVehicles[0].longitude || 73.7898)] : [19.9975, 73.7898]} 
              zoom={14} 
              style={{ height: '560px', width: '100%', zIndex: 0 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />

              {displayVehicles.map((vehicle) => {
                const vId = String(vehicle.id || vehicle.vehicle_id);
                const lat = parseFloat(vehicle.latitude || 19.9975);
                const lng = parseFloat(vehicle.longitude || 73.7898);
                if (isNaN(lat) || isNaN(lng)) return null;

                return (
                  <Marker key={`vehicle-${vId}`} position={[lat, lng]} icon={truckIcon}>
                    <Popup>
                      <div style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                        <strong>🚚 {vehicle.driver_name || vehicle.driverName || `Driver ${vId}`}</strong><br/>
                        License Plate: {vehicle.license_plate || 'MH-15-EX-1001'}<br/>
                        Speed: {vehicle.speed || 18} km/h<br/>
                        {currentComplaint && (
                          <span style={{ color: '#2563eb', fontWeight: 600 }}>
                            Assigned Task: {currentComplaint.category}
                          </span>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* RIGHT: Assigned Driver Details Card */}
        <div className="lt-sidebar">
          <div className="panel-header" style={{ marginBottom: '0.25rem' }}>
            <h3><UserCheck size={16} style={{ marginRight: 6 }} /> Assigned Authority Card</h3>
            <small className="text-muted">Field unit details &amp; active work task</small>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '530px', overflowY: 'auto', paddingRight: '4px' }}>
            {displayVehicles.length > 0 ? (
              displayVehicles.map((v) => {
                const vId = String(v.id || v.vehicle_id);

                return (
                  <div key={`card-${vId}`} className="driver-card" style={{ borderLeftColor: '#2563eb', background: '#fff', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div className="driver-card__header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                        {v.driver_name || v.driverName || `Driver Unit ${vId}`}
                      </strong>
                      <span className="badge" style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#dbeafe', color: '#1d4ed8', borderRadius: 4 }}>
                        Dispatched
                      </span>
                    </div>

                    <div className="driver-card__kv" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>Vehicle / Plate:</span>
                      <strong style={{ color: '#0f172a' }}>{v.license_plate || 'MH-15-AX-4021'}</strong>
                    </div>
                    <div className="driver-card__kv" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>Current GPS:</span>
                      <strong style={{ color: '#0f172a' }}>{parseFloat(v.latitude || 19.9975).toFixed(4)}, {parseFloat(v.longitude || 73.7898).toFixed(4)}</strong>
                    </div>
                    <div className="driver-card__kv" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '4px 0' }}>
                      <span style={{ color: '#64748b' }}>Vehicle Speed:</span>
                      <strong style={{ color: '#0f172a' }}>{v.speed || 20} km/h</strong>
                    </div>

                    {currentComplaint ? (
                      <div style={{ marginTop: '0.75rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '10px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', display: 'block', marginBottom: 4 }}>
                          📋 Complaint Task Details:
                        </span>
                        <p style={{ fontSize: '0.8rem', color: '#1e3a8a', margin: '2px 0' }}>
                          <strong>Category:</strong> {currentComplaint.category}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: '#1e3a8a', margin: '2px 0' }}>
                          <strong>Priority:</strong> {currentComplaint.priority}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: '#1e3a8a', margin: '2px 0' }}>
                          <strong>Status:</strong> {currentComplaint.status}
                        </p>
                      </div>
                    ) : (
                      <div style={{ marginTop: '0.75rem', background: '#f8fafc', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Assigned unit active</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#fff', borderRadius: '8px' }}>
                <Truck size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5, display: 'block' }} />
                <span>No specific driver has been assigned to this complaint yet, or the assigned driver ID does not match any vehicle records.</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}