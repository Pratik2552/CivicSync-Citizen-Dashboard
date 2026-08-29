import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft, Camera, UploadCloud, QrCode, AlertCircle, CheckCircle, RefreshCcw, Info } from 'lucide-react';
import './TrackReportPage.css'; // Reusing your existing CSS for layout consistency

export default function ScanSmartBinPage() {
  const navigate = useNavigate();
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
        html5QrCode.stop().catch(console.error);
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

      const cameraConfig = { facingMode: mode };
      const scanConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      try {
        await scanner.start(
          cameraConfig,
          scanConfig,
          (decodedText) => handleSuccessfulScan(decodedText),
          () => {}
        );
      } catch (modeErr) {
        console.warn(`Scanner mode ${mode} failed, retrying with default user camera:`, modeErr);
        // Fallback to default camera facing mode
        await scanner.start(
          { facingMode: 'user' },
          scanConfig,
          (decodedText) => handleSuccessfulScan(decodedText),
          () => {}
        );
      }
      
      setIsScanning(true);
      setCameraMode(mode);
    } catch (err) {
      console.error(err);
      setError('Could not access camera. Please allow camera permissions or upload a QR image from gallery.');
      setIsScanning(false);
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
      setError('Could not detect a valid QR code in this image. Please try another image.');
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
    
    try {
      const audio = new Audio('/beep.mp3');
      audio.play().catch(() => {}); 
    } catch (e) {}
  };

  const proceedWithScannedBin = () => {
    setIsProcessing(true);
    
    console.log('🔍 Scanned QR Code:', scanResult);
    
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
    
    const targetCode = vehicleQRCode || scanResult.split('/').pop() || scanResult;
    
    // Navigate to scan photo capture page with code parameter
    setTimeout(() => {
      navigate(`/citizen/scan?vehicle=${encodeURIComponent(targetCode)}`);
      setIsProcessing(false);
    }, 400);
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
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                <QrCode color="var(--color-primary)" /> QR Scanner
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
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
                <CheckCircle size={40} color="#16a34a" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ color: '#166534', margin: '0 0 8px 0' }}>QR Code Scanned Successfully!</h3>
                <code style={{ background: '#dcfce7', padding: '6px 12px', borderRadius: '4px', color: '#15803d', wordBreak: 'break-all' }}>
                  {scanResult}
                </code>
                
                <button 
                  className="btn btn-primary btn-lg btn-full mt-4" 
                  onClick={proceedWithScannedBin}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Verifying...' : 'Proceed to Action'}
                </button>
                <button 
                  className="btn btn-secondary btn-full mt-2" 
                  onClick={() => setScanResult('')}
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
                  minHeight: isScanning ? '300px' : '0px'
                }}
              ></div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '1.5rem', maxWidth: '400px', margin: '1.5rem auto 0' }}>
                
                {!isScanning ? (
                  <button className="btn btn-primary btn-lg" onClick={() => startScanner('user')}>
                    <Camera size={18} /> Open Front Camera
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={toggleCamera}>
                      <RefreshCcw size={18} /> Switch Camera
                    </button>
                    <button className="btn btn-secondary" style={{ flex: 1, backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }} onClick={stopScanner}>
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