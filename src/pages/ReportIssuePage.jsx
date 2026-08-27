import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { issueCategories } from '../data/mockData';
import { SeverityBadge } from '../components/common/StatusBadge';
import { Upload, MapPin, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import './ReportIssuePage.css';

// Fix default marker icons for Leaflet + Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function DraggableMarker({ position, setPosition }) {
  useMapEvents({
    click(e) { setPosition([e.latlng.lat, e.latlng.lng]); },
  });
  return position ? <Marker position={position} draggable eventHandlers={{ dragend: e => setPosition([e.target.getLatLng().lat, e.target.getLatLng().lng]) }} /> : null;
}

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const [step, setStep] = useState(1); // 1=form, 2=success
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [verifyingImage, setVerifyingImage] = useState(false);
  const [verificationData, setVerificationData] = useState(null);

  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [pinPosition, setPinPosition] = useState(null);
  const [gpsSource, setGpsSource] = useState('USER_PIN');
  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const severity = category ? (issueCategories.find(c => c.id === category)?.severity || 'Normal') : null;

  // Background Image Verification Handler
  const handleImageFile = async (file) => {
    if (!file) return;

    setImageFile(file);
    setSubmitError('');
    setVerifyingImage(true);
    setVerificationData(null);

    // 1. Immediate local thumbnail preview
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    // 2. Background image verification request
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.verifyImage(formData);

      if (res.success) {
        setVerificationData(res.verification);

        // Auto-select category if matched
        const matchedCategory = issueCategories.find(
          c => c.label.toLowerCase().includes((res.verification.category || '').toLowerCase()) ||
               (res.verification.category || '').toLowerCase().includes(c.id.toLowerCase())
        );
        if (matchedCategory) {
          setCategory(matchedCategory.id);
        }

        // Auto-detect location if EXIF GPS metadata exists
        if (res.exifGps && res.exifGps.hasMetadataGps) {
          const { latitude, longitude } = res.exifGps;
          setPinPosition([latitude, longitude]);
          setAddress(`GPS Photo Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          setGpsSource('EXIF_METADATA');
        }
      }
    } catch (err) {
      console.error('Image verification failed:', err);
      const errMsg = err.data?.reason || err.message || 'The uploaded photo could not be verified. Please upload a clear image of waste.';
      setSubmitError(errMsg);
      setImagePreview(null);
      setImageFile(null);
    } finally {
      setVerifyingImage(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleImageFile(file);
  };

  const detectLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setPinPosition([latitude, longitude]);
        setAddress(`Detected Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        setGpsSource('USER_PIN');
        setLocLoading(false);
      },
      () => {
        setPinPosition([18.5204, 73.8567]);
        setAddress('Shivajinagar, Pune (approximate)');
        setGpsSource('USER_PIN');
        setLocLoading(false);
      },
      { timeout: 6000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setSubmitError('Please upload a photo of the waste site.');
      return;
    }
    if (verifyingImage) {
      setSubmitError('Please wait for photo analysis to complete.');
      return;
    }
    if (!address && !pinPosition) {
      setSubmitError('Please select or detect a location for the problem.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const lat = pinPosition ? pinPosition[0] : 18.5204;
      const lng = pinPosition ? pinPosition[1] : 73.8567;

      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('description', description);
      formData.append('category', issueCategories.find(c => c.id === category)?.label || 'Roadside Litter');
      formData.append('latitude', lat);
      formData.append('longitude', lng);
      formData.append('gps_source', gpsSource);

      if (verificationData) {
        formData.append('ai_confidence', verificationData.confidence || 0.95);
        formData.append('ai_reason', verificationData.reason || 'Verified waste');
      }

      const response = await api.submitComplaint(formData);

      if (response.success && response.complaint) {
        setReferenceId(response.complaint.id);
        setStep(2);
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit complaint. Please check your image and location.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 2) {
    return (
      <div className="page-wrapper">
        <div className="page-hero">
          <div className="container">
            <h1>Report Submitted</h1>
            <p>Your complaint has been received by the municipal office.</p>
          </div>
        </div>
        <div className="container report-success">
          <div className="report-success__icon"><CheckCircle size={56} /></div>
          <h2>Thank you for reporting!</h2>
          <p className="report-success__desc">
            Your complaint has been successfully verified and submitted. The municipal team will process it shortly.
          </p>
          <div className="report-success__id-box">
            <div className="report-success__id-label">Your Complaint Reference ID</div>
            <div className="report-success__id" id="complaint-reference-id">{referenceId}</div>
            <p className="report-success__id-hint">Save this ID to track your complaint status.</p>
          </div>
          <div className="report-success__actions">
            <button
              className="btn btn-primary btn-lg"
              id="go-to-my-reports-btn"
              onClick={() => navigate('/my-reports')}
            >
              Track My Complaint
            </button>
            <button
              className="btn btn-secondary"
              id="report-another-btn"
              onClick={() => {
                setStep(1);
                setImageFile(null);
                setImagePreview(null);
                setCategory('');
                setDescription('');
                setAddress('');
                setPinPosition(null);
                setVerificationData(null);
                setSubmitError('');
              }}
            >
              Report Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="page-hero">
        <div className="container">
          <h1>Report a Garbage Problem</h1>
          <p>Tell us what's wrong and we'll make sure the right team addresses it.</p>
        </div>
      </div>

      <div className="container report-layout">
        <form className="report-form card" onSubmit={handleSubmit} id="report-issue-form">

          {/* Step 1: Image Upload */}
          <div className="report-section" id="upload-section">
            <div className="report-section__header">
              <span className="report-section__num">1</span>
              <h2 className="report-section__title">Upload a Photo</h2>
              <span className="report-section__required">Required</span>
            </div>
            {!imagePreview ? (
              <div
                className={`upload-zone ${dragOver ? 'upload-zone--over' : ''}`}
                id="image-upload-zone"
                onClick={() => fileInputRef.current.click()}
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                role="button"
                tabIndex={0}
                aria-label="Upload photo"
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current.click()}
              >
                <Upload size={32} className="upload-zone__icon" />
                <div className="upload-zone__text">
                  <strong>Click to upload</strong> or drag and drop
                </div>
                <div className="upload-zone__hint">JPG, PNG, WEBP — max 10 MB</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="photo-file-input"
                  onChange={e => handleImageFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="upload-preview" id="image-preview">
                <img src={imagePreview} alt="Uploaded preview" className="upload-preview__img" />
                <button
                  type="button"
                  className="upload-preview__remove"
                  onClick={() => {
                    setImagePreview(null);
                    setImageFile(null);
                    setVerificationData(null);
                  }}
                  aria-label="Remove photo"
                >
                  <X size={16} />
                </button>

                {/* Processing Progress Bar */}
                {verifyingImage && (
                  <div className="upload-progress-wrap" style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-secondary, #666)', marginBottom: 4 }}>
                      <span>Processing image...</span>
                    </div>
                    <div className="loading-bar-track" style={{ height: 4, background: 'var(--color-border, #e5e7eb)', borderRadius: 2, overflow: 'hidden' }}>
                      <div className="loading-bar-pulse" style={{ height: '100%', background: 'var(--color-primary, #16a34a)', animation: 'progressPulse 1.2s infinite ease-in-out' }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <hr className="divider" />

          {/* Step 2: Category */}
          <div className="report-section" id="category-section">
            <div className="report-section__header">
              <span className="report-section__num">2</span>
              <h2 className="report-section__title">What is the Problem?</h2>
              <span className="report-section__required">Required</span>
            </div>
            <div className="category-grid" role="radiogroup" aria-label="Issue category">
              {issueCategories.map(cat => (
                <label
                  key={cat.id}
                  className={`category-card ${category === cat.id ? 'category-card--selected' : ''}`}
                  id={`category-${cat.id}`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat.id}
                    checked={category === cat.id}
                    onChange={() => setCategory(cat.id)}
                    style={{ display: 'none' }}
                  />
                  <span className="category-card__icon">{cat.icon}</span>
                  <span className="category-card__label">{cat.label}</span>
                </label>
              ))}
            </div>
            {severity && (
              <div className="severity-result" id="severity-indicator">
                <AlertTriangle size={15} />
                <span>Urgency Level:</span>
                <SeverityBadge severity={severity} />
              </div>
            )}
          </div>

          <hr className="divider" />

          {/* Step 3: Location */}
          <div className="report-section" id="location-section">
            <div className="report-section__header">
              <span className="report-section__num">3</span>
              <h2 className="report-section__title">Where is the Problem?</h2>
              <span className="report-section__required">Required</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary detect-btn"
              id="detect-location-btn"
              onClick={detectLocation}
              disabled={locLoading}
            >
              <MapPin size={16} />
              {locLoading ? 'Detecting…' : 'Auto-Detect My Location'}
            </button>
            {pinPosition && (
              <div className="location-map-wrap">
                <MapContainer
                  center={pinPosition}
                  zoom={15}
                  style={{ height: 260 }}
                  scrollWheelZoom={false}
                  id="location-picker-map"
                >
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                  />
                  <DraggableMarker position={pinPosition} setPosition={pos => { setPinPosition(pos); setAddress(`${pos[0].toFixed(5)}, ${pos[1].toFixed(5)}`); setGpsSource('USER_PIN'); }} />
                </MapContainer>
                <p className="form-hint" style={{ marginTop: 6 }}>
                  <MapPin size={13} style={{ display: 'inline' }} /> Drag the pin to adjust the exact location.
                </p>
              </div>
            )}
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label" htmlFor="address-input">
                Address / Landmark <span>*</span>
              </label>
              <input
                id="address-input"
                className="form-input"
                placeholder="e.g. Near Deccan Gymkhana Gate, Pune"
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
              />
            </div>
          </div>

          <hr className="divider" />

          {/* Step 4: Description */}
          <div className="report-section" id="description-section">
            <div className="report-section__header">
              <span className="report-section__num">4</span>
              <h2 className="report-section__title">Additional Details</h2>
              <span className="report-section__optional">(optional)</span>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="description-input">Describe the problem</label>
              <textarea
                id="description-input"
                className="form-textarea"
                placeholder="E.g. The bin on the corner has been overflowing since yesterday. There is waste spilling on the footpath."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <hr className="divider" />

          {/* Submit */}
          <div className="report-submit" id="submit-section">
            {submitError && (
              <div className="alert alert-error" style={{ marginBottom: 12 }}>
                {submitError}
              </div>
            )}
            {(!category || !address || !imageFile) && !submitError && (
              <div className="alert alert-warning">
                Please upload an image, select a problem category, and provide the location before submitting.
              </div>
            )}
            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              id="submit-report-btn"
              disabled={!category || !address || !imageFile || submitting || verifyingImage}
            >
              {submitting ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, margin: 0, borderWidth: 2 }} />
                  Submitting Complaint…
                </>
              ) : (
                'Submit Complaint'
              )}
            </button>
            <p className="report-submit__note">
              By submitting, you confirm this is a genuine waste-related complaint. False reports may result in account suspension.
            </p>
          </div>

        </form>

        {/* Sidebar */}
        <aside className="report-sidebar">
          <div className="report-tip card">
            <h3 className="report-tip__title">Tips for a Good Report</h3>
            <ul className="report-tip__list">
              <li>Upload a clear photo of the problem.</li>
              <li>Make sure the location pin is accurate.</li>
              <li>Provide a local landmark in the address field.</li>
              <li>Choose the most appropriate category.</li>
            </ul>
          </div>
          <div className="report-tip card" style={{ marginTop: 16 }}>
            <h3 className="report-tip__title">Need Help?</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: 8 }}>
              Call our helpline:<br />
              <a href="tel:1800111222" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                1800-111-222
              </a>
              <br />
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Mon–Sat, 8 AM – 8 PM</span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}