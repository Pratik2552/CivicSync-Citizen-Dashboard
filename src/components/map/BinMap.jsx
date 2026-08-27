import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { binLocations } from '../../data/mockData';
import './BinMap.css';

const BIN_COLORS = {
  empty: '#2e7d32',
  half:  '#f9a825',
  full:  '#c62828',
};

const BIN_LABELS = {
  empty: 'Empty — Available',
  half:  'Half Full',
  full:  'Full — Needs Attention',
};

export default function BinMap({ height = '460px', centerLat = 18.518, centerLng = 73.856, zoom = 14 }) {
  return (
    <div className="bin-map-wrapper" id="map">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={zoom}
        style={{ height, width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        {binLocations.map(bin => (
          <CircleMarker
            key={bin.id}
            center={[bin.lat, bin.lng]}
            radius={10}
            pathOptions={{
              fillColor: BIN_COLORS[bin.status],
              color: '#fff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.85,
            }}
          >
            <Popup>
              <div className="bin-popup">
                <div className="bin-popup__id">{bin.id}</div>
                <div className="bin-popup__zone">📍 {bin.zone}</div>
                <div
                  className="bin-popup__status"
                  style={{ color: BIN_COLORS[bin.status] }}
                >
                  ● {BIN_LABELS[bin.status]}
                </div>
                <div className="bin-popup__emptied">
                  Last emptied: {bin.lastEmptied}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="bin-map-legend" aria-label="Map legend">
        <div className="bin-map-legend__title">Bin Status</div>
        {Object.entries(BIN_COLORS).map(([key, color]) => (
          <div key={key} className="bin-map-legend__item">
            <span className="bin-map-legend__dot" style={{ background: color }} />
            <span className="bin-map-legend__label">{BIN_LABELS[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
