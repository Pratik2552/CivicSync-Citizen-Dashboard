import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import jsQR from 'jsqr';
import {
  Building2, Droplets, Zap, Bus, QrCode, ShieldCheck, CheckCircle2,
  AlertCircle, ArrowRight, CreditCard, Lock, Sparkles, RefreshCw, Upload
} from 'lucide-react';
import { api } from '../services/api';
import './GreenRewardsPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const UTILITY_TYPES = [
  { id: 'PROPERTY_TAX', label: 'Property Tax (Annual)', icon: Building2, defaultBill: 5000, color: '#16a34a' },
  { id: 'WATER_TAX', label: 'Water Supply Bill (Annual)', icon: Droplets, defaultBill: 1500, color: '#0891b2' },
  { id: 'ELECTRICITY_BILL', label: 'Electricity Bill (Monthly)', icon: Zap, defaultBill: 1200, color: '#d97706' },
  { id: 'BUS_PASS', label: 'Municipal Bus Pass (Monthly)', icon: Bus, defaultBill: 800, color: '#2563eb' },
];

export default function UtilityDiscountSimulator() {
  const qrFileInputRef = useRef();

  // Form state
  const [utilityType, setUtilityType] = useState('PROPERTY_TAX');
  const [consumerNo, setConsumerNo] = useState('NMC-2026-8841');
  const [billAmount, setBillAmount] = useState(5000);
  const [applyDiscountChecked, setApplyDiscountChecked] = useState(true);

  // QR / Identity Input
  const [inputMode, setInputMode] = useState('CARD_ID'); // 'CARD_ID' or 'QR_UPLOAD'
  const [cardIdInput, setCardIdInput] = useState('');
  const [qrPayloadInput, setQrPayloadInput] = useState('');
  const [qrScanning, setQrScanning] = useState(false); // true while jsQR is decoding image

  // Verification & Discount State
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifyError, setVerifyError] = useState('');

  // Payment Processing & Receipt State
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [paymentError, setPaymentError] = useState('');

  const currentUtility = UTILITY_TYPES.find(u => u.id === utilityType) || UTILITY_TYPES[0];

  // Handle Utility Type change
  const handleUtilityChange = (typeId) => {
    setUtilityType(typeId);
    const selected = UTILITY_TYPES.find(u => u.id === typeId);
    if (selected) setBillAmount(selected.defaultBill);
    setVerificationResult(null);
    setPaymentSuccess(null);
    setVerifyError('');
  };

  // Verify Carbon Card with Backend External API
  const handleVerifyCard = async (overridePayload = null) => {
    const payloadToSend = overridePayload || qrPayloadInput;
    if (!payloadToSend && !cardIdInput) {
      setVerifyError('Please scan/upload QR Code or enter a Carbon Member Card ID.');
      return;
    }

    setVerifying(true);
    setVerifyError('');
    setVerificationResult(null);

    try {
      const requestPayload = payloadToSend
        ? { qr_payload: payloadToSend }
        : { card_id: cardIdInput.trim() };

      const res = await api.externalVerifyPayload(requestPayload);

      if (res.success && res.valid) {
        setVerificationResult(res);
      } else {
        setVerifyError(res.message || 'Carbon Card verification failed.');
      }
    } catch (err) {
      setVerifyError(err.message || 'Could not verify Carbon Card ID / QR Code.');
    } finally {
      setVerifying(false);
    }
  };

  // Handle QR Image Upload — decoded via jsQR (pixel-level decoding using Canvas API)
  const handleQrFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset any previous error
    setVerifyError('');
    setVerificationResult(null);
    setQrScanning(true);

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      // Draw onto an off-screen canvas so jsQR can read pixel data
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      URL.revokeObjectURL(objectUrl);

      if (code && code.data) {
        const decoded = code.data.trim();
        console.log('[QR Decoded raw string]', decoded.slice(0, 40) + '...');

        // ── AES-256-GCM Encrypted QR (v2 — current format) ───────────────────
        // The payload is opaque: "ENC:v2:<iv_hex>:<cipher_b64>:<tag_hex>"
        // We CANNOT and should NOT try to decrypt it on the frontend.
        // Send it directly to the backend /external-verify which holds the key.
        if (decoded.startsWith('ENC:v2:')) {
          setQrPayloadInput(decoded);
          setQrScanning(false);
          handleVerifyCard(decoded);
          return;
        }

        // ── Legacy HMAC-signed plaintext JSON (v1) ───────────────────────────
        if (decoded.startsWith('{')) {
          setQrPayloadInput(decoded);
          setQrScanning(false);
          handleVerifyCard(decoded);
          return;
        }

        // ── Raw Card ID (CARD-XXXXXXXX) or citizen UUID ──────────────────────
        const cardIdMatch = decoded.match(/CARD-[A-Z0-9]+/i);
        const cidMatch = decoded.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);

        if (cardIdMatch) {
          setInputMode('CARD_ID');
          setCardIdInput(cardIdMatch[0]);
          setQrScanning(false);
          handleVerifyCard(null);
        } else if (cidMatch) {
          setInputMode('CARD_ID');
          setCardIdInput(cidMatch[0]);
          setQrScanning(false);
          handleVerifyCard(null);
        } else {
          // Fallback: send entire decoded string as qr_payload and let backend decide
          setQrPayloadInput(decoded);
          setQrScanning(false);
          handleVerifyCard(decoded);
        }
      } else {
        setQrScanning(false);
        setVerifyError('⚠️ Could not read QR code from this image. Please make sure the image is clear and well-lit, or enter your Card ID manually.');
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setQrScanning(false);
      setVerifyError('Failed to load image. Please upload a valid PNG or JPEG QR code image.');
    };

    img.src = objectUrl;
  };

  // Execute Payment & Apply Carbon Discount
  const handleExecuteGovtPayment = async (e) => {
    e.preventDefault();
    if (!verificationResult) {
      setPaymentError('Please verify your Carbon Card QR before proceeding to payment.');
      return;
    }

    setPaying(true);
    setPaymentError('');

    try {
      const claimPayload = {
        qr_payload: qrPayloadInput || null,
        card_id: verificationResult.card_id || cardIdInput || null,
        user_id: verificationResult.citizen_id || null,
        benefit_type: utilityType,
        bill_reference: consumerNo || 'NMC-TAX-BILL-2026',
        bill_amount: parseFloat(billAmount),
        use_wallet: (utilityType === 'PROPERTY_TAX' || utilityType === 'WATER_TAX'),
      };

      const res = await api.externalClaimDiscount(claimPayload);

      if (res.success) {
        setPaymentSuccess(res);
      } else {
        setPaymentError(res.message || 'Payment failed.');
      }
    } catch (err) {
      setPaymentError(err.message || 'Govt Payment Gateway error.');
    } finally {
      setPaying(false);
    }
  };

  // Calculate discount figures for live display
  const availablePts = verificationResult?.available_points || 0;
  const walletPts = verificationResult?.tax_wallet_points || 0;
  const isTaxBill = utilityType === 'PROPERTY_TAX' || utilityType === 'WATER_TAX';
  const totalUsablePoints = isTaxBill ? (walletPts > 0 ? walletPts : availablePts) : availablePts;
  
  // 1 Point = ₹1.00 discount (capped at bill amount)
  const estimatedDiscountInr = applyDiscountChecked && verificationResult
    ? Math.min(billAmount, totalUsablePoints)
    : 0;
  const finalPayableInr = Math.max(0, billAmount - estimatedDiscountInr);

  return (
    <div className="gr-page-layout" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div className="container" style={{ maxWidth: 960, margin: '0 auto', paddingTop: '2rem' }}>
        
        {/* Government Portal Simulated Header */}
        <div style={{ background: '#0f172a', color: '#fff', padding: '1.5rem 2rem', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} /> Official Municipal e-Governance Portal (Nashik)
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0 0 0' }}>Utility &amp; Tax Online Payment Gateway</h1>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 6, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={14} color="#4ade80" /> 256-bit Secure Gateway
          </div>
        </div>

        {/* Main Simulator Card */}
        <div className="card" style={{ borderRadius: '0 0 12px 12px', borderTop: 'none', padding: '2rem', background: '#ffffff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
          
          {paymentSuccess ? (
            /* 🧾 SUCCESSFUL PAYMENT RECEIPT */
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: 64, height: 64, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <CheckCircle2 size={40} color="#16a34a" />
              </div>
              <h2 style={{ color: '#15803d', fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>
                Payment Successful &amp; Rebate Applied!
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Your payment of <strong>₹{paymentSuccess.final_payable_amount_inr}</strong> for {currentUtility.label} has been processed by the Municipal Treasury.
              </p>

              {/* Official Receipt Box */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem', maxWidth: 520, margin: '0 auto 1.5rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Govt Voucher Code</span>
                  <strong style={{ fontFamily: 'monospace', color: '#0369a1', fontSize: '0.95rem' }}>{paymentSuccess.voucher_code}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.875rem' }}>
                  <span>Consumer / Tax Bill Ref:</span>
                  <strong>{consumerNo}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.875rem' }}>
                  <span>Original Bill Amount:</span>
                  <span>₹{paymentSuccess.original_bill_amount || billAmount}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.875rem', color: '#15803d', fontWeight: 700 }}>
                  <span>CivicSync Carbon Discount:</span>
                  <span>− ₹{paymentSuccess.discount_applied_inr}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0f172a', paddingTop: 10, marginTop: 10, fontSize: '1.05rem', fontWeight: 800 }}>
                  <span>Net Amount Paid:</span>
                  <span style={{ color: '#15803d' }}>₹{paymentSuccess.final_payable_amount_inr}</span>
                </div>

                <div style={{ marginTop: 12, fontSize: '0.78rem', color: '#64748b', background: '#edf2f7', padding: '8px 12px', borderRadius: 6 }}>
                  ⭐ <strong>{paymentSuccess.points_claimed} Carbon Points</strong> deducted from citizen account. Remaining balance: {paymentSuccess.remaining_available_points} Pts (Available), {paymentSuccess.remaining_tax_wallet_points} Pts (Tax Wallet).
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={() => { setPaymentSuccess(null); setVerificationResult(null); }}
                  className="btn btn-secondary"
                >
                  Pay Another Bill
                </button>
                <Link to="/my-carbon-card" className="btn btn-primary">
                  View Carbon Card Balance
                </Link>
              </div>
            </div>
          ) : (
            /* 💳 SIMULATOR FORM */
            <form onSubmit={handleExecuteGovtPayment}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  Select Municipal Utility / Tax Category
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {UTILITY_TYPES.map(ut => {
                    const IconC = ut.icon;
                    const isSel = utilityType === ut.id;
                    return (
                      <div
                        key={ut.id}
                        onClick={() => handleUtilityChange(ut.id)}
                        style={{
                          padding: '1rem',
                          borderRadius: 8,
                          border: `2px solid ${isSel ? ut.color : '#e2e8f0'}`,
                          background: isSel ? `${ut.color}0a` : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: `${ut.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ut.color }}>
                          <IconC size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSel ? ut.color : '#1e293b' }}>{ut.label}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Avg ₹{ut.defaultBill}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bill Reference & Amount */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Consumer / Tax Property Account No.</label>
                  <input
                    type="text"
                    className="form-input"
                    value={consumerNo}
                    onChange={e => setConsumerNo(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Bill Amount Payable (₹)</label>
                  <input
                    type="number"
                    min="50"
                    className="form-input"
                    value={billAmount}
                    onChange={e => setBillAmount(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              {/* 🟢 CARBON CARD DISCOUNT CHECKBOX SECTION */}
              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 700, fontSize: '1rem', color: '#14532d' }}>
                  <input
                    type="checkbox"
                    checked={applyDiscountChecked}
                    onChange={e => setApplyDiscountChecked(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: '#16a34a' }}
                  />
                  <span>☑ Apply CivicSync Carbon Points / Green Card Rebate</span>
                </label>
                <p style={{ margin: '4px 0 0 28px', fontSize: '0.825rem', color: '#166534' }}>
                  {isTaxBill
                    ? 'Uses points locked in your Annual Tax Wallet (or Available Points) for Property/Water tax rebate.'
                    : 'Redeems available carbon points for instant bill discount (1 Point = ₹1.00 OFF).'
                  }
                </p>

                {applyDiscountChecked && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid #bbf7d0', paddingTop: '1rem' }}>
                    
                    {/* Input Mode Selector */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: '1rem' }}>
                      <button
                        type="button"
                        onClick={() => setInputMode('CARD_ID')}
                        className={`btn btn-sm ${inputMode === 'CARD_ID' ? 'btn-primary' : 'btn-outline'}`}
                      >
                        Enter Carbon Card ID
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMode('QR_UPLOAD')}
                        className={`btn btn-sm ${inputMode === 'QR_UPLOAD' ? 'btn-primary' : 'btn-outline'}`}
                      >
                        Upload / Scan Green QR
                      </button>
                    </div>

                    {/* Mode A: Card ID */}
                    {inputMode === 'CARD_ID' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. CARD-A1B2C3D4 or citizen user ID"
                          value={cardIdInput}
                          onChange={e => setCardIdInput(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => handleVerifyCard(null)}
                          disabled={verifying}
                          className="btn btn-success"
                          style={{ minWidth: 140 }}
                        >
                          {verifying ? 'Verifying...' : 'Verify Card'}
                        </button>
                      </div>
                    )}

                    {/* Mode B: QR Upload */}
                    {inputMode === 'QR_UPLOAD' && (
                      <div>
                        <input
                          ref={qrFileInputRef}
                          type="file"
                          accept="image/*,.json,.txt"
                          style={{ display: 'none' }}
                          onChange={handleQrFileUpload}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => qrFileInputRef.current.click()}
                            disabled={qrScanning || verifying}
                            className="btn btn-secondary"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                          >
                            {qrScanning ? (
                              <><RefreshCw size={16} className="spin" /> Scanning QR Code...</>
                            ) : (
                              <><Upload size={16} /> Choose QR Image File (PNG / JPG)</>
                            )}
                          </button>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <textarea
                            className="form-input"
                            rows={2}
                            placeholder="Or paste QR payload string directly..."
                            value={qrPayloadInput}
                            onChange={e => setQrPayloadInput(e.target.value)}
                            style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleVerifyCard(qrPayloadInput)}
                            disabled={verifying || !qrPayloadInput}
                            className="btn btn-success"
                            style={{ marginTop: 6, width: '100%' }}
                          >
                            {verifying ? 'Verifying Payload...' : 'Verify QR Payload'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Verification Error */}
                    {verifyError && (
                      <div style={{ marginTop: 10, background: '#fef2f2', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: 6, color: '#991b1b', fontSize: '0.85rem' }}>
                        ⚠️ {verifyError}
                      </div>
                    )}

                    {/* Verification Success Box */}
                    {verificationResult && (
                      <div style={{ marginTop: 12, background: '#ffffff', border: '1px solid #86efac', borderRadius: 8, padding: '12px', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle2 size={16} /> Verified Citizen: {verificationResult.citizen_name}
                          </span>
                          <span className="badge badge-success">{verificationResult.tier} Tier ({verificationResult.max_rebate_percentage} Rebate)</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8, marginTop: 8, textAlign: 'center', background: '#f8fafc', padding: 8, borderRadius: 6 }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Available Pts</div>
                            <div style={{ fontWeight: 700, color: '#16a34a' }}>{verificationResult.available_points}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Tax Wallet Pts</div>
                            <div style={{ fontWeight: 700, color: '#0891b2' }}>{verificationResult.tax_wallet_points}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Usable for Bill</div>
                            <div style={{ fontWeight: 800, color: '#ea580c' }}>{totalUsablePoints} Pts</div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* Bill Summary Calculation */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1.25rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 10px 0' }}>Bill Payment Breakdown</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.875rem' }}>
                  <span>Original Bill Amount:</span>
                  <strong>₹{billAmount.toLocaleString()}</strong>
                </div>
                {applyDiscountChecked && verificationResult && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.875rem', color: '#15803d' }}>
                    <span>CivicSync Carbon Discount ({estimatedDiscountInr} Pts):</span>
                    <strong>− ₹{estimatedDiscountInr.toLocaleString()}</strong>
                  </div>
                )}
                <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: 8, marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  <span>Final Net Payable:</span>
                  <span style={{ color: applyDiscountChecked && verificationResult ? '#15803d' : '#0f172a' }}>
                    ₹{finalPayableInr.toLocaleString()}
                  </span>
                </div>
              </div>

              {paymentError && (
                <div style={{ marginBottom: 12, background: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: 6, color: '#991b1b', fontSize: '0.85rem' }}>
                  ⚠️ {paymentError}
                </div>
              )}

              {/* Proceed Button */}
              <button
                type="submit"
                disabled={paying}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {paying ? (
                  <>
                    <RefreshCw size={18} className="spin" /> Processing Govt Gateway Payment...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} /> Proceed to Pay ₹{finalPayableInr.toLocaleString()} via Govt Gateway
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
