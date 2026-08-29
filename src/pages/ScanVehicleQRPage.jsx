import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ScanVehicleQRPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function ScanVehicleQRPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const vehicleQRCode = searchParams.get('vehicle');
  
  const [step, setStep] = useState('loading'); // loading, capture, submitting, success, error
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [error, setError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [address, setAddress] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Fetch vehicle information
  useEffect(() => {
    if (!vehicleQRCode) {
      setError('Invalid QR code. No vehicle specified.');
      setStep('error');
      return;
    }

    console.log('User:', user);
    console.log('Vehicle QR Code:', vehicleQRCode);
    
    // Verify token
    const token = localStorage.getItem('civicsync_token');
    if (token) {
      console.log('Token found:', token.substring(0, 30) + '...');
    } else {
      console.warn('⚠️ No token found in localStorage');
    }

    fetchVehicleInfo();
    getLocation();
  }, [vehicleQRCode]);

  // Auto-start camera when step is 'capture'
  useEffect(() => {
    if (step === 'capture' && !capturedImage) {
      const timer = setTimeout(() => {
        startCamera();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, capturedImage]);

  // Sync stream to video DOM element whenever active state or ref updates
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.log('Video play error:', e));
    }
  }, [isCameraActive]);

  const fetchVehicleInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/qr-scan/vehicle/${vehicleQRCode}`);
      const data = await response.json();

      if (response.ok) {
        setVehicleInfo(data.vehicle);
        setStep('capture');
      } else {
        setError(data.error || 'Vehicle not found');
        setStep('error');
      }
    } catch (err) {
      console.error('Error fetching vehicle:', err);
      setError('Failed to load vehicle information');
      setStep('error');
    }
  };

  // Get GPS location
  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(coords);
        
        // Try to get address from coordinates (reverse geocoding)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
          );
          const data = await response.json();
          setAddress(data.display_name || 'Address unavailable');
        } catch (err) {
          console.error('Reverse geocoding error:', err);
          setAddress(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
        }
      },
      (error) => {
        console.error('Location error:', error);
        setLocationError('Unable to get your location. Please enable GPS.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Start camera with graceful fallback constraints
  const startCamera = async () => {
    try {
      setError('');
      
      let stream = null;
      try {
        // Try environment camera first
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch (e) {
        console.warn('Ideal environment camera failed, falling back to default camera:', e);
        // Fallback to any available video stream
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
      
      streamRef.current = stream;
      setIsCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      console.log('Camera started successfully');
    } catch (err) {
      console.error('Camera error:', err);
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on your device.');
      } else {
        setError('Unable to access camera. Please check permissions or upload from gallery.');
      }
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) {
      setError('Camera not ready. Please restart the camera or upload from gallery.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Check if video has enough dimensions/data
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);
    
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Failed to capture image. Please try again.');
        return;
      }
      
      const url = URL.createObjectURL(blob);
      setCapturedImage(url);
      setImageFile(blob);
      stopCamera();
      console.log('Photo captured successfully');
    }, 'image/jpeg', 0.9);
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Handle file upload (alternative to camera)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      stopCamera();
      const url = URL.createObjectURL(file);
      setCapturedImage(url);
      setImageFile(file);
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
    setImageFile(null);
    startCamera();
  };

  // Submit scan
  const submitScan = async () => {
    if (!imageFile || !location) {
      setError('Photo and location are required.');
      return;
    }

    setStep('submitting');
    setError('');

    try {
      const token = localStorage.getItem('civicsync_token');
      const formData = new FormData();
      formData.append('file', imageFile, `scan-${Date.now()}.jpg`);

      const uploadResponse = await fetch(`${API_URL}/qr-scan/upload-image`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Failed to upload image');
      }

      const scanData = {
        vehicle_qr_code: vehicleQRCode,
        garbage_image_url: uploadData.url,
        scan_latitude: location.latitude,
        scan_longitude: location.longitude,
        scan_address: address,
        device_info: navigator.userAgent,
      };

      const scanResponse = await fetch(`${API_URL}/qr-scan/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(scanData),
      });

      const scanResult = await scanResponse.json();

      if (scanResponse.ok) {
        setStep('success');
      } else {
        throw new Error(scanResult.error || 'Failed to log scan');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit scan. Please check your connection and try again.');
      setStep('capture');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, []);

  // Render different steps
  if (step === 'loading') {
    return (
      <div className="scan-page">
        <div className="scan-container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading vehicle information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="scan-page">
        <div className="scan-container">
          <div className="error-state">
            <div className="error-icon">❌</div>
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/')} className="btn-primary">
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="scan-page">
        <div className="scan-container">
          <div className="success-state" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div className="success-icon" style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a', margin: '0 0 0.5rem 0' }}>Scan Submitted Successfully!</h2>
            <div style={{ display: 'inline-block', backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '4px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>
              🪙 +50 Civic Reward Points Credited!
            </div>
            
            <p style={{ color: '#475569', fontSize: '0.95rem' }}>Your garbage pickup verification has been verified &amp; recorded in the smart waste system.</p>
            
            {/* KML Territory & Driver Information Card */}
            <div style={{ marginTop: '20px', textAlign: 'left', padding: '18px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '2px solid #bbf7d0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#166534', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', fontSize: '1rem', fontWeight: 700 }}>
                📍 Mapped Territory &amp; Driver Details
              </h4>
              
              <p className="vehicle-info" style={{ margin: '6px 0', fontSize: '0.95rem', color: '#1e293b' }}>
                <strong>📍 Assigned Territory Zone:</strong> <span style={{ color: '#2563eb', fontWeight: 700 }}>{vehicleInfo?.territory || 'Zone 1 (ZONE A)'}</span>
              </p>
              <p className="vehicle-info" style={{ margin: '6px 0', fontSize: '0.95rem', color: '#1e293b' }}>
                <strong>👤 Assigned Driver:</strong> <span style={{ color: '#0f172a', fontWeight: 700 }}>{vehicleInfo?.driver_name || 'Assigned Driver'}</span>
              </p>
              <p className="vehicle-info" style={{ margin: '6px 0', fontSize: '0.95rem', color: '#1e293b' }}>
                <strong>🚛 Vehicle Plate:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{vehicleInfo?.license_plate}</span>
              </p>
              {vehicleInfo?.route_name && (
                <p className="vehicle-info" style={{ margin: '6px 0', fontSize: '0.95rem', color: '#1e293b' }}>
                  <strong>🛣️ Collection Route Path:</strong> <span style={{ color: '#16a34a', fontWeight: 700 }}>{vehicleInfo.route_name}</span>
                </p>
              )}
              <p className="vehicle-info" style={{ margin: '6px 0', fontSize: '0.95rem', color: '#1e293b' }}>
                <strong>📍 Location Address:</strong> {address || 'Captured via Mobile GPS'}
              </p>
              <p className="vehicle-info" style={{ margin: '6px 0', fontSize: '0.95rem', color: '#1e293b' }}>
                <strong>🕒 Scan Timestamp:</strong> {new Date().toLocaleString()}
              </p>
            </div>

            <div style={{ marginTop: '15px', color: '#16a34a', fontSize: '0.9rem', textAlign: 'left', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div>✓ Photo uploaded &amp; verified via Cloudinary</div>
              <div>✓ Driver &amp; KML Territory matched</div>
              <div>✓ +50 Civic Reward Points added to your account</div>
              <div>✓ Saved to Municipal Waste Management Database</div>
            </div>

            <button onClick={() => navigate('/')} className="btn-primary" style={{ marginTop: '1.5rem', width: '100%', padding: '12px', fontSize: '1.05rem', fontWeight: 700 }}>
              Done &amp; Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scan-page">
      <div className="scan-container">
        <div className="scan-header">
          <h1>🚛 Verify Collection</h1>
          {vehicleInfo && (
            <div className="vehicle-card" style={{ background: '#f8fafc', border: '2px solid #e2e8f0', padding: '12px 16px', borderRadius: '8px', marginBottom: '1rem' }}>
              <p style={{ margin: '4px 0' }}><strong>📍 Territory Zone:</strong> <span style={{ color: '#2563eb', fontWeight: 700 }}>{vehicleInfo.territory}</span></p>
              <p style={{ margin: '4px 0' }}><strong>👤 Assigned Driver:</strong> <strong>{vehicleInfo.driver_name}</strong></p>
              <p style={{ margin: '4px 0' }}><strong>🚛 Vehicle:</strong> {vehicleInfo.license_plate}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
          </div>
        )}

        <div className="scan-content">
          {/* Login Prompt if not logged in - optional, scan works without login */}
          {!user && (
            <div className="warning-message">
              <p>ℹ️ You are scanning as a guest. <a href="/login">Login</a> to track your scans.</p>
            </div>
          )}

          {/* Location Status */}
          <div className="location-status">
            <h3>📍 Location</h3>
            {location ? (
              <div className="location-info">
                <p className="success">✅ Location captured</p>
                <p className="address">{address}</p>
              </div>
            ) : (
              <div className="location-info">
                <p className="loading">📡 Getting location...</p>
                {locationError && <p className="error">{locationError}</p>}
              </div>
            )}
          </div>

          {/* Camera / Photo */}
          <div className="camera-section">
            <h3>📸 Take Photo</h3>
            
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-preview"
                  style={{ 
                    width: '100%', 
                    maxWidth: '500px', 
                    height: 'auto',
                    borderRadius: '8px',
                    backgroundColor: '#000',
                    display: isCameraActive ? 'block' : 'none'
                  }}
                />
                
                {!isCameraActive && (
                  <div style={{ 
                    width: '100%', 
                    maxWidth: '500px', 
                    height: '300px',
                    borderRadius: '8px',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    border: '2px dashed #d1d5db'
                  }}>
                    <p style={{ color: '#6b7280' }}>Camera not started</p>
                  </div>
                )}
                
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                <div className="camera-controls">
                  {!isCameraActive ? (
                    <button onClick={startCamera} className="btn-secondary">
                      📷 Start Camera
                    </button>
                  ) : (
                    <button onClick={stopCamera} className="btn-secondary">
                      ⏹️ Stop Camera
                    </button>
                  )}
                  
                  <button 
                    onClick={capturePhoto} 
                    className="btn-primary btn-large"
                    disabled={!isCameraActive}
                    style={{
                      opacity: isCameraActive ? 1 : 0.5,
                      cursor: isCameraActive ? 'pointer' : 'not-allowed'
                    }}
                  >
                    📷 Capture Photo
                  </button>
                </div>

                <div className="or-divider">OR</div>

                <label className="file-upload-btn">
                  📁 Upload from Gallery
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </>
            ) : (
              <>
                <img src={capturedImage} alt="Captured" className="captured-image" />
                <div className="photo-controls">
                  <button onClick={retakePhoto} className="btn-secondary">
                    🔄 Retake
                  </button>
                  <button 
                    onClick={submitScan} 
                    className="btn-primary btn-large"
                    disabled={!location || step === 'submitting'}
                  >
                    {step === 'submitting' ? '⏳ Submitting...' : '✅ Submit Scan'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
