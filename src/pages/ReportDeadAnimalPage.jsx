import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, UploadCloud, MapPin, CheckCircle, AlertTriangle, RefreshCw, Send, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './TrackReportPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Zero-dependency Native Browser JPEG EXIF GPS Parser
function extractExifGpsFromBuffer(buffer) {
  try {
    const dataView = new DataView(buffer);
    if (dataView.getUint16(0, false) !== 0xFFD8) return null; // Not JPEG

    let offset = 2;
    const length = dataView.byteLength;

    while (offset < length) {
      const marker = dataView.getUint16(offset, false);
      offset += 2;

      if (marker === 0xFFE1) { // APP1 Marker
        const app1Length = dataView.getUint16(offset, false);
        const exifHeader = dataView.getUint32(offset + 2, false);
        if (exifHeader !== 0x45786966) return null; // Not 'Exif'

        const isLittleEndian = dataView.getUint16(offset + 8, false) === 0x4949;
        const tiffOffset = offset + 8;

        const getUint16 = (off) => dataView.getUint16(tiffOffset + off, isLittleEndian);
        const getUint32 = (off) => dataView.getUint32(tiffOffset + off, isLittleEndian);

        const ifd0Offset = getUint32(4);
        const numEntries = getUint16(ifd0Offset);
        let gpsOffset = null;

        for (let i = 0; i < numEntries; i++) {
          const entryOffset = ifd0Offset + 2 + i * 12;
          const tag = getUint16(entryOffset);
          if (tag === 0x8825) { // GPS IFD Pointer
            gpsOffset = getUint32(entryOffset + 8);
            break;
          }
        }

        if (!gpsOffset) return null;

        const numGpsEntries = getUint16(gpsOffset);
        let latNums = null, latRef = 'N', lngNums = null, lngRef = 'E';

        for (let i = 0; i < numGpsEntries; i++) {
          const entryOffset = gpsOffset + 2 + i * 12;
          const tag = getUint16(entryOffset);
          const valueOffset = getUint32(entryOffset + 8);

          if (tag === 0x0001) {
            latRef = String.fromCharCode(dataView.getUint8(tiffOffset + entryOffset + 8));
          } else if (tag === 0x0002) {
            latNums = parseRationals(dataView, tiffOffset + valueOffset, isLittleEndian);
          } else if (tag === 0x0003) {
            lngRef = String.fromCharCode(dataView.getUint8(tiffOffset + entryOffset + 8));
          } else if (tag === 0x0004) {
            lngNums = parseRationals(dataView, tiffOffset + valueOffset, isLittleEndian);
          }
        }

        if (latNums && lngNums && latNums.length >= 3 && lngNums.length >= 3) {
          let lat = latNums[0] + latNums[1] / 60 + latNums[2] / 3600;
          let lng = lngNums[0] + lngNums[1] / 60 + lngNums[2] / 3600;
          if (latRef === 'S') lat = -lat;
          if (lngRef === 'W') lng = -lng;
          return { latitude: lat, longitude: lng };
        }
      } else if ((marker & 0xFF00) !== 0xFF00) {
        break;
      } else {
        offset += dataView.getUint16(offset, false);
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function parseRationals(dataView, offset, isLittleEndian) {
  try {
    const getUint32 = (off) => dataView.getUint32(offset + off, isLittleEndian);
    return [
      getUint32(0) / (getUint32(4) || 1),
      getUint32(8) / (getUint32(12) || 1),
      getUint32(16) / (getUint32(20) || 1),
    ];
  } catch (e) {
    return null;
  }
}

export default function ReportDeadAnimalPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedCloudinaryUrl, setUploadedCloudinaryUrl] = useState('');
  
  // Location States
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [exifExtracted, setExifExtracted] = useState(false);
  const [fetchingGPS, setFetchingGPS] = useState(false);

  // Additional Fields
  const [description, setDescription] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');

  // Auto-fill full_name from logged-in user profile
  useEffect(() => {
    if (user) {
      if (user.full_name) setCitizenName(user.full_name);
      else if (user.name) setCitizenName(user.name);
      else if (user.email) setCitizenName(user.email.split('@')[0]);

      if (user.phone) setCitizenPhone(user.phone);
    }
  }, [user]);

  // Status States
  const [submitting, setSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Extract EXIF GPS data natively in browser without third-party package dependencies
  const processImageEXIF = async (file) => {
    try {
      const buffer = await file.arrayBuffer();
      const gps = extractExifGpsFromBuffer(buffer);
      if (gps && gps.latitude && gps.longitude) {
        setLatitude(gps.latitude.toFixed(6));
        setLongitude(gps.longitude.toFixed(6));
        setExifExtracted(true);
        return;
      }
    } catch (e) {
      console.log('Browser EXIF extraction notice:', e.message);
    }
    setExifExtracted(false);
  };

  // Handle Image File Selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrorMsg('');

    // Extract EXIF in browser
    await processImageEXIF(file);
  };

  // Get live mobile GPS location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setFetchingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setLatitude(lat);
        setLongitude(lng);
        setFetchingGPS(false);

        // Reverse geocoding
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          if (data && data.display_name) {
            setLocationAddress(data.display_name);
          }
        } catch (e) {
          // ignore fallback
        }
      },
      (err) => {
        console.error(err);
        setErrorMsg('Unable to retrieve your mobile GPS location. Please enter coordinates manually.');
        setFetchingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile && !uploadedCloudinaryUrl) {
      setErrorMsg('Please upload a photo of the dead animal location.');
      return;
    }

    if (!latitude || !longitude) {
      setErrorMsg('Location coordinates (Latitude & Longitude) are required. Use GPS button or manual input.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      let finalImageUrl = uploadedCloudinaryUrl;

      // 1. Upload photo to Cloudinary via backend API if not uploaded yet
      if (!finalImageUrl && imageFile) {
        const token = localStorage.getItem('civicsync_token');
        const formData = new FormData();
        formData.append('file', imageFile);

        const uploadRes = await fetch(`${API_URL}/dead-animal-reports/upload-image`, {
          method: 'POST',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || 'Failed to upload photo to Cloudinary.');
        }

        finalImageUrl = uploadData.image_url;

        // If backend returned extracted GPS and user hasn't set custom coords, use backend EXIF GPS
        if (uploadData.extracted_gps && (!latitude || !longitude)) {
          setLatitude(uploadData.extracted_gps.latitude);
          setLongitude(uploadData.extracted_gps.longitude);
        }
      }

      // 2. Submit report payload to backend
      const token = localStorage.getItem('civicsync_token');
      const reportPayload = {
        image_url: finalImageUrl,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        location_address: locationAddress || `Near ${latitude}, ${longitude}`,
        description: description || 'Dead animal alert reported by citizen on locality road.',
        citizen_name: citizenName,
        citizen_phone: citizenPhone,
      };

      const res = await fetch(`${API_URL}/dead-animal-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(reportPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit complaint.');
      }

      setSubmittedReport(data.report);
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMsg(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedReport) {
    return (
      <div className="page-wrapper">
        <div className="page-hero" style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)' }}>
          <div className="container">
            <Link to="/" className="track-back-link">
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
            <h1>Complaint Registered</h1>
            <p>Your dead animal cleanup alert has been sent to municipal sanitation teams.</p>
          </div>
        </div>

        <div className="container" style={{ maxWidth: 700, padding: '2rem 1rem' }}>
          <div className="card" style={{ padding: '2rem', textAlign: 'center', borderTop: '6px solid #10b981' }}>
            <CheckCircle size={56} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#065f46', marginBottom: 6 }}>
              Alert Submitted Successfully!
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Reference ID: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{submittedReport.id}</strong>
            </p>

            <div style={{ textAlign: 'left', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.25rem', borderRadius: 8, marginBottom: '1.5rem' }}>
              <p style={{ margin: '6px 0', fontSize: '0.95rem' }}>
                <strong>📍 Status:</strong> <span style={{ background: '#fef08a', color: '#854d0e', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{submittedReport.status || 'Pending'}</span>
              </p>
              <p style={{ margin: '6px 0', fontSize: '0.95rem' }}>
                <strong>📍 Coordinates:</strong> {submittedReport.latitude}, {submittedReport.longitude}
              </p>
              <p style={{ margin: '6px 0', fontSize: '0.95rem' }}>
                <strong>🏠 Address:</strong> {submittedReport.location_address}
              </p>
              <p style={{ margin: '6px 0', fontSize: '0.95rem' }}>
                <strong>📝 Description:</strong> {submittedReport.description}
              </p>
              <p style={{ margin: '6px 0', fontSize: '0.95rem' }}>
                <strong>🕒 Reported At:</strong> {new Date(submittedReport.created_at).toLocaleString()}
              </p>
            </div>

            <button onClick={() => navigate('/')} className="btn btn-primary btn-lg btn-full">
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="page-hero" style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)' }}>
        <div className="container">
          <Link to="/" className="track-back-link">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldAlert size={32} /> Report Dead Animal Alert
          </h1>
          <p>Report dead animal carcasses on roads or localities for fast municipal sanitation dispatch.</p>
        </div>
      </div>

      <div className="container track-layout" style={{ marginTop: '1.5rem' }}>
        <div className="track-main">
          <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>
            
            {errorMsg && (
              <div className="alert alert-error" style={{ marginBottom: '1.5rem', display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertTriangle size={18} /> {errorMsg}
              </div>
            )}

            {/* 1. PHOTO UPLOAD SECTION */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#1e293b' }}>
                <Camera color="#b91c1c" /> 1. Upload Photo of Carcass / Spot *
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 12 }}>
                Photo metadata will be scanned automatically to extract GPS coordinates.
              </p>

              {previewUrl ? (
                <div style={{ position: 'relative', textAlign: 'center', marginBottom: 12 }}>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ maxHeight: 280, maxWidth: '100%', borderRadius: 8, border: '2px solid #cbd5e1', objectFit: 'contain' }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera size={14} /> Change Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: 10,
                    padding: '2.5rem 1rem',
                    textAlign: 'center',
                    background: '#f8fafc',
                    cursor: 'pointer',
                  }}
                >
                  <UploadCloud size={40} color="#b91c1c" style={{ margin: '0 auto 10px' }} />
                  <p style={{ fontWeight: 700, margin: '0 0 4px 0', color: '#1e293b' }}>Click to Upload or Snap Photo</p>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>JPEG, PNG, WebP or HEIC formats</p>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {exifExtracted && (
                <div style={{ marginTop: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: 6, color: '#166534', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={16} /> GPS Coordinates extracted automatically from image EXIF metadata!
                </div>
              )}
            </div>

            {/* 2. LOCATION & COORDINATES SECTION */}
            <div style={{ marginBottom: '1.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8, margin: 0, color: '#1e293b' }}>
                  <MapPin color="#b91c1c" /> 2. Location Coordinates *
                </h3>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="btn btn-secondary btn-sm"
                  disabled={fetchingGPS}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}
                >
                  <RefreshCw size={12} className={fetchingGPS ? 'spin' : ''} />
                  {fetchingGPS ? 'Fetching GPS…' : '📍 Use Mobile GPS'}
                </button>
              </div>

              <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 12 }}>
                If your photo does not contain embedded GPS metadata, click "Use Mobile GPS" or manually type the latitude and longitude coordinates.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 4 }}>Latitude *</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="19.8951"
                    value={latitude}
                    onChange={(e) => { setLatitude(e.target.value); setExifExtracted(false); }}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 600 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 4 }}>Longitude *</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="74.4866"
                    value={longitude}
                    onChange={(e) => { setLongitude(e.target.value); setExifExtracted(false); }}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 600 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 4 }}>Location Address / Landmark</label>
                <input
                  type="text"
                  placeholder="Near MG Road bus stop, opposite Sector 3 bin..."
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            {/* 3. DETAILS & DESCRIPTION SECTION */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: '#1e293b' }}>
                📝 3. Complaint Description &amp; Details
              </h3>

              <textarea
                rows={3}
                placeholder="Specify details (e.g. Stray animal carcass on road, requires urgent disposal)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>

            {/* 4. CONTACT DETAILS */}
            <div style={{ marginBottom: '1.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 4 }}>Your Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Rahul Sharma"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 4 }}>Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={citizenPhone}
                  onChange={(e) => setCitizenPhone(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-lg btn-full"
              style={{ background: '#b91c1c', borderColor: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {submitting ? <RefreshCw size={18} className="spin" /> : <Send size={18} />}
              {submitting ? 'Submitting Report…' : '🚨 Submit Dead Animal Alert'}
            </button>
          </form>
        </div>

        {/* SIDEBAR GUIDE */}
        <div className="track-sidebar">
          <div className="card" style={{ background: '#fef2f2', border: '1px solid #fca5a5', marginBottom: 16 }}>
            <h3 className="track-section-title" style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={18} /> Urgent Sanitation Response
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#7f1d1d', lineHeight: 1.6, margin: 0 }}>
              Dead animal alerts are treated with <strong>Top Priority</strong>. Submitting GPS coordinates and photo allows our quick response sanitation vehicles to locate and clear the carcass immediately.
            </p>
          </div>

          <div className="card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 className="track-section-title">📍 How EXIF GPS Works</h3>
            <ul style={{ paddingLeft: 18, color: '#475569', fontSize: '0.85rem', lineHeight: 1.7, margin: '8px 0 0 0' }}>
              <li>Photos taken with mobile cameras usually include embedded GPS tags.</li>
              <li>Uploading a photo auto-fills Latitude and Longitude!</li>
              <li>If no EXIF data is found, click "Use Mobile GPS" or manually enter coordinates.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
