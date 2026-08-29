import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft, Camera, UploadCloud, QrCode, AlertCircle, CheckCircle, RefreshCcw, Info } from 'lucide-react';
import './TrackReportPage.css'; // Reusing your existing CSS for layout consistency
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function ScanSmartBinPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraMode, setCameraMode] = useState('user'); // 'user' = front camera, 'environment' = back camera
  const [scanResult, setScanResult] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize Scanner Instance
  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    setScanner(html5QrCode);

    // Cleanup on unmount
    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => {
          console.error('Error stopping scanner on unmount:', err);
        });
      }
    };
  }, []);

  const startScanner = async (mode = cameraMode) => {
    if (!scanner) return;
    
    try {
      setError('');
      setScanResult('');
      
      // Stop existing stream if switching cameras
      if (scanner.isScanning) {
        await scanner.stop();
      }

      // Enhanced configuration for better mobile support
      const config = {
        fps: 10,
        qrbox: function(viewfinderWidth, viewfinderHeight) {
          // Make QR box responsive to screen size
          const minEdgePercentage = 0.7;
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
          return {
            width: qrboxSize,
            height: qrboxSize
          };
        },
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      await scanner.start(
        { facingMode: mode },
        config,
        (decodedText) => {
          handleSuccessfulScan(decodedText);
        },
        (errorMessage) => {
          // Ignore frequent frame errors, only log if needed
        }
      );
      
      setIsScanning(true);
      setCameraMode(mode);
    } catch (err) {
      console.error('Camera start error:', err);
      
      // Provide specific error messages
      if (err.name === 'NotAllowedError' || err.message.includes('Permission')) {
        setError('Camera access denied. Please allow camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.message.includes('No camera')) {
        setError('No camera found on your device.');
      } else if (err.name === 'NotReadableError' || err.message.includes('in use')) {
        setError('Camera is already in use by another application. Please close other apps and try again.');
      } else if (err.message.includes('Overconstrained') || err.name === 'OverconstrainedError') {
        // Try again with simpler constraints
        setError('Trying alternative camera settings...');
        try {
          await scanner.start(
            { facingMode: mode },
            {
              fps: 10,
              qrbox: 250,
              aspectRatio: 1.0
            },
            (decodedText) => {
              handleSuccessfulScan(decodedText);
            },
            () => {}
          );
          setIsScanning(true);
          setCameraMode(mode);
          setError('');
        } catch (retryErr) {
          setError('Unable to start camera with available settings. Please try a different device or browser.');
          setIsScanning(false);
        }
      } else {
        setError('Could not access camera. Please check permissions and try again.');
      }
      
      if (!scanner.isScanning) {
        setIsScanning(false);
      }
    }
  };

  const stopScanner = async () => {
    if (scanner && scanner.isScanning) {
      try {
        await scanner.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner', err);
      }
    }
  };

  const toggleCamera = () => {
    const newMode = cameraMode === 'user' ? 'environment' : 'user';
    startScanner(newMode);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !scanner) return;

    try {
      setError('');
      setScanResult('');
      
      // Stop live camera if running
      if (scanner.isScanning) {
        await stopScanner();
      }

      const decodedText = await scanner.scanFile(file, true);
      handleSuccessfulScan(decodedText);
    } catch (err) {
      setError('Could not detect a valid QR code in this image. Please try another.');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSuccessfulScan = (text) => {
    // Stop scanner immediately on success
    stopScanner();
    setScanResult(text);
    
    // Example: Play a beep sound
    try {
      const audio = new Audio('/beep.mp3'); // Optional: add a beep sound to public folder
      audio.play().catch(() => {}); 
    } catch (e) {}
  };

  const proceedWithScannedBin = () => {
    setIsProcessing(true);
    
    console.log('🔍 Scanned QR Code:', scanResult);
    
    // Parse vehicle QR code from various formats:
    // 1. Direct: "QR-uuid"
    // 2. URL with ?vehicle=QR-uuid
    // 3. URL with ?v=QR-uuid (legacy)
    let vehicleQRCode = null;
    
    if (scanResult.startsWith('QR-')) {
      vehicleQRCode = scanResult;
    } else if (scanResult.includes('?')) {
      try {
        const url = new URL(scanResult.includes('://') ? scanResult : `http://dummy${scanResult}`);
        vehicleQRCode = url.searchParams.get('vehicle') || url.searchParams.get('v') || null;
      } catch (e) {
        const match = scanResult.match(/[?&](?:vehicle|v)=(QR-[\w-]+)/i);
        if (match) vehicleQRCode = match[1];
      }
    }
    
    // If we found a vehicle QR code, navigate to vehicle scan page
    if (vehicleQRCode) {
      navigate(`/citizen/scan?vehicle=${vehicleQRCode}`);
      setIsProcessing(false);
      return;
    }
    
    // Otherwise treat as bin QR
    const binId = scanResult.split('/').pop();
    const isBin001 = binId.includes('BIN-001') || binId.includes('BIN001') || binId.includes('0B5FE4F1354173061944');
    
    if (isBin001) {
      // Overriding user's location to BIN-001's mock coordinates for Nashik area
      const mockLat = 19.89672417697726;
      const mockLng = 74.4928126172459;
      
      const token = localStorage.getItem('civicsync_token');
      // Mock vehicle QR code corresponding to an active vehicle in Zone B/A territory
      const mockVehicleQRCode = 'QR-097a1371-4311-48af-91f9-5821f9ebbcd1-8bcb7m6arai';
      
      fetch(`${API_URL}/qr-scan/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          vehicle_qr_code: mockVehicleQRCode,
          garbage_image_url: 'https://ouyoxuhnuxjhgdzvotdv.supabase.co/storage/v1/object/public/vehicle-scan-photos/scans/a33e8e73-330f-46fb-b960-296ce7a160d6.jpg',
          scan_latitude: mockLat,
          scan_longitude: mockLng,
          scan_address: 'BIN-001 Mock Location Override (Nashik)',
          device_info: `Mock GPS Device (zandu@gmail.com - Mapped to BIN-001)`,
        })
      })
      .then(res => res.json())
      .then(data => {
        setIsProcessing(false);
        alert(`🎉 Mock GPS Map Activated!\nLogged citizen scan at BIN-001 coordinates (19.896724, 74.492812) for user: ${user?.email || 'zandu@gmail.com'}.\n\nYou can now go to the Driver Portal and collect BIN-001!`);
        setScanResult('');
      })
      .catch(err => {
        console.error(err);
        setIsProcessing(false);
        alert('Failed to log mock GPS scan.');
      });
      return;
    }
    
    // Simulate API delay before redirecting to the specific bin's action page
    setTimeout(() => {
      alert(`User ${user?.email || 'guest'} is not mapped to Bin: ${binId}. Only BIN-001 mapping is simulated.`);
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="page-wrapper">
      {/* Hero Section */}
      <div className="page-hero">
        <div className="container">
          <Link to="/" className="track-back-link" id="back-link">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1>Scan Smart Bin</h1>
          <p>Scan your society's QR code to report, collect, or view Eco-Points.</p>
        </div>
      </div>

      <div className="container track-layout">
        
        {/* LEFT COLUMN: SCANNER UI */}
        <div className="track-main">
          <div className="card" style={{ padding: 'clamp(1rem, 4vw, 2rem)', textAlign: 'center' }}>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 1.5rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <QrCode color="var(--color-primary)" /> QR Scanner
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'clamp(0.8rem, 3vw, 0.9rem)' }}>
                Position the QR code inside the frame or upload an image.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem', textAlign: 'left', display: 'flex', gap: 8 }}>
                <AlertCircle size={18} /> {error}
              </div>
            )}

            {/* Success Message */}
            {scanResult && (
              <div style={{ padding: '1.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <CheckCircle size={40} color="#16a34a" style={{ margin: '0 auto 12px', display: 'block' }} />
                <h3 style={{ color: '#166534', margin: '0 0 8px 0', fontSize: 'clamp(1rem, 4vw, 1.2rem)', textAlign: 'center' }}>QR Code Scanned Successfully!</h3>
                <code style={{ background: '#dcfce7', padding: '6px 12px', borderRadius: '4px', color: '#15803d', wordBreak: 'break-all', display: 'block', fontSize: 'clamp(0.75rem, 3vw, 0.9rem)', textAlign: 'center', marginBottom: '1rem' }}>
                  {scanResult}
                </code>
                
                <button 
                  className="btn btn-primary btn-lg btn-full mt-4" 
                  onClick={proceedWithScannedBin}
                  disabled={isProcessing}
                  style={{ width: '100%', fontSize: 'clamp(0.9rem, 3.5vw, 1rem)' }}
                >
                  {isProcessing ? 'Verifying...' : 'Proceed to Action'}
                </button>
                <button 
                  className="btn btn-secondary btn-full mt-2" 
                  onClick={() => setScanResult('')}
                  style={{ width: '100%', fontSize: 'clamp(0.9rem, 3.5vw, 1rem)' }}
                >
                  Scan Another Code
                </button>
              </div>
            )}

            {/* Camera Viewfinder (Hidden when successful scan exists) */}
            <div style={{ display: scanResult ? 'none' : 'block' }}>
              
              {/* The HTML5 QR Code Mount Point */}
              <div 
                id="qr-reader" 
                style={{ 
                  width: '100%', 
                  maxWidth: '500px', 
                  margin: '0 auto', 
                  borderRadius: '12px', 
                  overflow: 'hidden',
                  border: '2px solid var(--color-border)',
                  minHeight: isScanning ? '300px' : '0px',
                  backgroundColor: '#000'
                }}
              ></div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '1.5rem', maxWidth: '400px', margin: '1.5rem auto 0' }}>
                
                {!isScanning ? (
                  <button className="btn btn-primary btn-lg" onClick={() => startScanner('environment')} style={{ width: '100%' }}>
                    <Camera size={18} /> Open Camera
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" style={{ flex: '1 1 calc(50% - 4px)', minWidth: '120px' }} onClick={toggleCamera}>
                      <RefreshCcw size={18} /> Switch Camera
                    </button>
                    <button className="btn btn-secondary" style={{ flex: '1 1 calc(50% - 4px)', minWidth: '120px', backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }} onClick={stopScanner}>
                      Stop Camera
                    </button>
                  </div>
                )}

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', margin: '10px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
                  <span style={{ padding: '0 10px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>OR</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
                </div>

                <button 
                  type="button" 
                  className="btn btn-secondary btn-lg" 
                  onClick={() => fileInputRef.current.click()}
                  style={{ width: '100%' }}
                >
                  <UploadCloud size={18} /> Upload QR Image
                </button>
                
                {/* Hidden File Input */}
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload} 
                />
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INFORMATION SIDEBAR */}
        <div className="track-sidebar">
          
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 className="track-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Info size={18} color="var(--color-primary)" /> How It Works
            </h3>
            <ul style={{ paddingLeft: '20px', color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '8px' }}><strong>Secretaries:</strong> Scan to report a full bin. Eco-Points are credited when the driver completes the pickup.</li>
              <li style={{ marginBottom: '8px' }}><strong>Drivers:</strong> Scan to mark the bin as collected. This logs your GPS to ensure transparency.</li>
              <li><strong>Citizens:</strong> Scan to view your society's 3 R's environmental impact (Reduce, Reuse, Recycle).</li>
            </ul>
          </div>

          <div className="card" style={{ background: '#fefce8', border: '1px solid #fef08a' }}>
            <h3 className="track-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ca8a04' }}>
              🏆 Gamification & Rewards
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#a16207', marginBottom: '12px' }}>
              1 Standard Bin Collected = <strong>100 Eco-Points</strong>
            </p>
            <p style={{ fontSize: '0.82rem', color: '#854d0e', margin: 0 }}>
              Societies accumulating over 10,000 points annually are eligible for a 2-5% municipal tax rebate! Ensure accurate scanning to claim your rewards.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}