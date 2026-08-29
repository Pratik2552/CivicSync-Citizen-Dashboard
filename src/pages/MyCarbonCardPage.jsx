import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Leaf, Award, InfoIcon, RefreshCw, Flame, Calendar, Star,
  Download, ShieldCheck, CheckCircle2, Ticket, Building2, Droplets, Bus, Lock
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './TrackReportPage.css';
import './MyCarbonCardPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function maskId(id) {
  if (!id) return 'CARD-XXXX';
  return `CARD-${id.slice(0, 8).toUpperCase()}`;
}

function maskName(name) {
  if (!name) return 'Citizen';
  const parts = name.trim().split(' ');
  return parts.map((p, i) => i === 0 ? p : p[0] + '***').join(' ');
}

export default function MyCarbonCardPage() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [qrValue, setQrValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tokenExpired, setTokenExpired] = useState(false);

  // Claim modal state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState('PROPERTY_TAX');
  const [pointsToClaim, setPointsToClaim] = useState(100);
  const [billRef, setBillRef] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(null);
  const [claimError, setClaimError] = useState('');

  // Tax Wallet lock/release state
  const [walletLockInput, setWalletLockInput] = useState(50);
  const [walletActionLoading, setWalletActionLoading] = useState(false);
  const [walletMsg, setWalletMsg] = useState({ text: '', type: '' });

  const cardRef = useRef(null);

  useEffect(() => {
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    setLoading(true);
    setError('');
    setTokenExpired(false);
    try {
      const token = localStorage.getItem('civicsync_token');
      if (!token) { 
        setError('Please log in to view your Digital Carbon Card & Eco-Points.'); 
        setTokenExpired(true);
        setLoading(false); 
        return; 
      }

      const res = await fetch(`${API_URL}/carbon-points/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      
      if (!res.ok) {
        if (res.status === 401 || (json.error && json.error.toLowerCase().includes('token'))) {
          setTokenExpired(true);
          if (logout) logout();
          throw new Error('Your session has expired. Please log in again to access your Carbon Card.');
        }
        throw new Error(json.error || 'Failed to fetch points');
      }

      setData(json);
      // Format QR Payload string to give clean, readable output when scanned by phone camera QR scanners
      const qrPayload = json.secure_qr_payload || JSON.stringify({
        title: "CivicSync Carbon Card",
        card_id: json.card_id,
        name: user?.full_name ? user.full_name.split(' ')[0] : 'Citizen',
        v: 1,
        cid: json.citizen_id,
        pts: json.available_points,
      });
      setQrValue(qrPayload);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Capture & Download WHOLE Credit Card Component as PNG Image
  const downloadCardImage = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // Crisp high DPI rendering
        useCORS: true,
        backgroundColor: null,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `CivicSync-Carbon-Card-${data?.card_id || 'card'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to capture card canvas:', err);
      // Fallback to QR canvas download if DOM capture encounters cross-origin restriction
      const qrCanvas = document.querySelector('.cc-qr-container canvas');
      if (qrCanvas) {
        const image = qrCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `CivicSync-Carbon-QR-${data?.card_id || 'card'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  // Handle claiming points for bill payment rebate
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setClaiming(true);
    setClaimError('');
    setClaimSuccess(null);

    try {
      const res = await api.claimBenefit({
        qr_payload: data?.secure_qr_payload,
        points_to_claim: pointsToClaim,
        benefit_type: selectedBenefit,
        bill_reference: billRef || 'ONLINE-MUNICIPAL-BILL',
      });

      setClaimSuccess(res);
      // Refresh points
      fetchPoints();
    } catch (err) {
      setClaimError(err.message || 'Failed to redeem carbon points.');
    } finally {
      setClaiming(false);
    }
  };

  // Tax Wallet Lock Handler
  const handleLockTaxWallet = async () => {
    setWalletActionLoading(true);
    setWalletMsg({ text: '', type: '' });
    try {
      const res = await api.lockTaxWallet(walletLockInput);
      setWalletMsg({ text: res.message, type: 'success' });
      fetchPoints();
    } catch (err) {
      setWalletMsg({ text: err.message || 'Failed to lock points into Tax Wallet.', type: 'error' });
    } finally {
      setWalletActionLoading(false);
    }
  };

  // Tax Wallet Release Handler
  const handleReleaseTaxWallet = async () => {
    setWalletActionLoading(true);
    setWalletMsg({ text: '', type: '' });
    try {
      const res = await api.releaseTaxWallet();
      setWalletMsg({ text: res.message, type: 'success' });
      fetchPoints();
    } catch (err) {
      setWalletMsg({ text: err.message || 'Failed to release points from Tax Wallet.', type: 'error' });
    } finally {
      setWalletActionLoading(false);
    }
  };

  const tier = data?.tier || 'BRONZE';
  const tierColors = {
    PLATINUM: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
    GOLD:     'linear-gradient(135deg, #78350f 0%, #d97706 100%)',
    SILVER:   'linear-gradient(135deg, #374151 0%, #6b7280 100%)',
    BRONZE:   'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
  };

  const validThru = new Date();
  validThru.setFullYear(validThru.getFullYear() + 1);
  const validStr = `${String(validThru.getMonth() + 1).padStart(2, '0')}/${String(validThru.getFullYear()).slice(2)}`;

  return (
    <div className="page-wrapper">
      <div className="page-hero">
        <div className="container">
          <Link to="/" className="track-back-link" id="back-link">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1>My Carbon Card &amp; Benefits</h1>
          <p>Claim property tax, water tax, transport tax, and eco bazaar discounts using your verifiable eco-points.</p>
        </div>
      </div>

      <div className="container track-layout">
        <div className="track-main">
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award color="#10b981" /> Digital Carbon Card
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={fetchPoints} style={{ background: 'none', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: '16px', background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: 8, color: '#991b1b', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>⚠️ Session Notification</div>
                <div style={{ fontSize: '0.9rem', marginBottom: tokenExpired ? 12 : 0 }}>{error}</div>
                {tokenExpired && (
                  <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.9rem', textDecoration: 'none', marginTop: 8 }}>
                    🔐 Log In Again to View Carbon Card
                  </Link>
                )}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <RefreshCw size={32} className="spin" style={{ color: '#10b981', margin: '0 auto' }} />
                <p style={{ marginTop: 12, color: 'var(--color-text-secondary)' }}>Calculating your synchronized points...</p>
              </div>
            ) : data ? (
              <>
                {/* 💳 Digital Carbon Card Component */}
                <div className="carbon-card-wrapper">
                  <div className="carbon-credit-card" ref={cardRef} style={{ background: tierColors[tier] }}>
                    <div className="cc-header">
                      <div className="cc-brand"><Leaf size={20} /> CivicSync Carbon Card</div>
                      <div className="cc-tier-badge">{tier} · {data.rebate} Tax Rebate</div>
                    </div>

                    <div className="cc-body">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div className="cc-qr-container" style={{ width: 132, height: 132, padding: 6, background: '#fff', borderRadius: 8, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                          {qrValue
                            ? <QRCodeCanvas value={qrValue} size={120} level="M" bgColor="#ffffff" fgColor="#000000" />
                            : <RefreshCw size={24} className="spin" />
                          }
                        </div>
                        <span style={{ fontSize: '0.65rem', color: '#fff', opacity: 0.9, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ShieldCheck size={12} color="#4ade80" /> AES-256-GCM Secure
                        </span>
                      </div>

                      <div className="cc-info">
                        <div className="cc-info-group">
                          <span className="cc-label">Net Available Points</span>
                          <span className="cc-value points" style={{ fontSize: '1.4rem', color: '#fef08a' }}>
                            ⭐ {(data.available_points || 0).toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#fef3c7' }}>pts</span>
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#dcfce7' }}>
                            Wallet: {(data.tax_wallet_points || 0).toLocaleString()} pts
                          </span>
                        </div>
                        <div className="cc-info-group">
                          <span className="cc-label">Card Holder</span>
                          <span className="cc-value">{maskName(user?.full_name || user?.email || 'Citizen')}</span>
                        </div>
                        <div className="cc-info-group">
                          <span className="cc-label">Member Card ID</span>
                          <span className="cc-value" style={{ fontSize: '0.9rem', fontFamily: 'monospace', color: '#67e8f9' }}>
                            {maskId(data.citizen_id)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="cc-footer">
                      <div className="cc-id" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                        Municipal Eco-Pass Token
                      </div>
                      <div className="cc-date">
                        <span className="cc-label">Valid Thru</span>
                        <div className="cc-value" style={{ fontSize: '0.95rem' }}>{validStr}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ⬇ Card Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
                  <a
                    href={`${API_URL}/carbon-points/card-pdf/${data.citizen_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ flex: 1, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 8, textDecoration: 'none', background: '#065f46' }}
                  >
                    <Download size={16} /> Download Official PDF Card
                  </a>
                  <button
                    onClick={downloadCardImage}
                    className="btn btn-secondary"
                    style={{ flex: 1, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
                  >
                    <Download size={16} /> Download QR Image (PNG)
                  </button>
                  <button
                    onClick={() => setShowClaimModal(true)}
                    className="btn"
                    style={{ flex: 1, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 8, background: '#ea580c', color: '#fff', border: 'none' }}
                  >
                    <Ticket size={16} /> Claim Benefit on Bill
                  </button>
                </div>

                {/* 🔒 Annual Tax Wallet & 2-Month Expiry Management Section */}
                <div className="card" style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#166534', margin: 0 }}>
                      <Lock color="#16a34a" size={20} /> Annual Municipal Tax Wallet ({data.tax_wallet_points || 0} / {data.wallet_cap || 250} Pts)
                    </h3>
                    <span className={`badge ${data.is_wallet_locked ? 'badge-warning' : 'badge-success'}`}>
                      {data.is_wallet_locked ? '🔒 Locked at Cap Limit' : '🔓 Wallet Active'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#14532d', marginBottom: 12 }}>
                    Property &amp; Water Taxes are billed annually. Points saved in your <strong>Tax Wallet</strong> are <strong>locked out of the spendable balance</strong> until you release them.
                  </p>

                  {data.tax_wallet_points > 0 && (
                    <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 6, background: '#fff7ed', border: '1px solid #fdba74', color: '#9a3412', fontSize: '0.85rem' }}>
                      {data.tax_wallet_points} points are currently locked in the annual wallet. Release them before locking another wallet amount.
                    </div>
                  )}

                  {walletMsg.text && (
                    <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 6, fontSize: '0.85rem', background: walletMsg.type === 'success' ? '#dcfce7' : '#fef2f2', color: walletMsg.type === 'success' ? '#166534' : '#991b1b', border: `1px solid ${walletMsg.type === 'success' ? '#86efac' : '#fca5a5'}` }}>
                      {walletMsg.text}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 240 }}>
                      <input
                        type="number"
                        min="1"
                        max={data.available_points || 100}
                        value={walletLockInput}
                        onChange={e => setWalletLockInput(Number(e.target.value))}
                        disabled={data.is_wallet_locked || walletActionLoading}
                        className="form-input"
                        placeholder="Points to lock..."
                        style={{ background: '#fff' }}
                      />
                      <button
                        onClick={handleLockTaxWallet}
                        disabled={data.is_wallet_locked || walletActionLoading || !data.available_points || data.tax_wallet_points > 0}
                        className="btn btn-primary btn-sm"
                        style={{ background: '#16a34a', border: 'none', whiteSpace: 'nowrap' }}
                      >
                        {walletActionLoading ? 'Locking...' : '🔒 Save into Wallet'}
                      </button>
                    </div>

                    {data.tax_wallet_points > 0 && (
                      <button
                        onClick={handleReleaseTaxWallet}
                        disabled={walletActionLoading}
                        className="btn btn-outline btn-sm"
                        style={{ borderColor: '#16a34a', color: '#15803d', whiteSpace: 'nowrap' }}
                      >
                        🔓 Release Points
                      </button>
                    )}
                  </div>
                </div>

                {/* 🏛️ Test Govt Utility Payment Simulator Link */}
                <div style={{ marginTop: '1.25rem', background: '#eff6ff', border: '1px dashed #3b82f6', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#1e40af', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      🏛️ Test External Govt Utility Portal Integration
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: '#1d4ed8', display: 'block', marginTop: 2 }}>
                      Test claiming points on Property Tax, Water Tax, Transport Tax, or Eco Bazaar coupons on the simulated portal using your QR code or Card ID.
                    </span>
                  </div>
                  <Link
                    to="/utility-tax-discount-simulator"
                    className="btn btn-primary btn-sm"
                    style={{ background: '#2563eb', textDecoration: 'none', whiteSpace: 'nowrap', marginLeft: 12 }}
                  >
                    Open Govt Billing Simulator ➔
                  </Link>
                </div>

                {/* 🏷️ Bill Payment Benefit Redemption Hub */}
                <div className="card" style={{ marginTop: '2rem', padding: '1.5rem', background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: 12 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#1c1917' }}>
                    <Ticket color="#ea580c" size={20} /> Municipal Bill Payment Rebate Partners
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#78716c', marginBottom: 16 }}>
                    Redeem your accumulated carbon points for discounts on property tax, water tax, transport tax, and eco bazaar partner coupons.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: '#fff', padding: '1rem', borderRadius: 8, border: '1px solid #e7e5e4' }}>
                      <Building2 size={24} color="#0284c7" style={{ marginBottom: 6 }} />
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Property Tax Rebate</div>
                      <div style={{ fontSize: '0.8rem', color: '#57534e', margin: '4px 0' }}>1 Pt = ₹1.00 Discount</div>
                      <button
                        onClick={() => { setSelectedBenefit('PROPERTY_TAX'); setShowClaimModal(true); }}
                        className="btn btn-sm"
                        style={{ marginTop: 8, width: '100%', background: '#e0f2fe', color: '#0369a1', border: 'none', fontWeight: 600 }}
                      >
                        Redeem Property Tax
                      </button>
                    </div>

                    <div style={{ background: '#fff', padding: '1rem', borderRadius: 8, border: '1px solid #e7e5e4' }}>
                      <Droplets size={24} color="#0891b2" style={{ marginBottom: 6 }} />
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Water Bill Rebate</div>
                      <div style={{ fontSize: '0.8rem', color: '#57534e', margin: '4px 0' }}>1 Pt = ₹1.00 Discount</div>
                      <button
                        onClick={() => { setSelectedBenefit('WATER_TAX'); setShowClaimModal(true); }}
                        className="btn btn-sm"
                        style={{ marginTop: 8, width: '100%', background: '#cffafe', color: '#0e7490', border: 'none', fontWeight: 600 }}
                      >
                        Redeem Water Tax
                      </button>
                    </div>

                    <div style={{ background: '#fff', padding: '1rem', borderRadius: 8, border: '1px solid #e7e5e4' }}>
                      <Bus size={24} color="#16a34a" style={{ marginBottom: 6 }} />
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Transport Tax Rebate</div>
                      <div style={{ fontSize: '0.8rem', color: '#57534e', margin: '4px 0' }}>1 Pt = ₹1.00 Discount</div>
                      <button
                        onClick={() => { setSelectedBenefit('TRANSPORT_TAX'); setShowClaimModal(true); }}
                        className="btn btn-sm"
                        style={{ marginTop: 8, width: '100%', background: '#dcfce7', color: '#15803d', border: 'none', fontWeight: 600 }}
                      >
                        Redeem Transport Tax
                      </button>
                    </div>

                    <div style={{ background: '#fff', padding: '1rem', borderRadius: 8, border: '1px solid #e7e5e4' }}>
                      <Leaf size={24} color="#0f766e" style={{ marginBottom: 6 }} />
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Eco Bazaar Coupon</div>
                      <div style={{ fontSize: '0.8rem', color: '#57534e', margin: '4px 0' }}>1 Pt = ₹1.00 Discount</div>
                      <button
                        onClick={() => { setSelectedBenefit('ECO_BAZAAR'); setShowClaimModal(true); }}
                        className="btn btn-sm"
                        style={{ marginTop: 8, width: '100%', background: '#ccfbf1', color: '#115e59', border: 'none', fontWeight: 600 }}
                      >
                        Redeem Eco Bazaar
                      </button>
                    </div>
                  </div>
                </div>

                {/* 📜 Redemption History */}
                {data.redemptions && data.redemptions.length > 0 && (
                  <div className="card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>Claimed Benefits &amp; Voucher History</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', textAlign: 'left', color: '#64748b' }}>
                            <th style={{ padding: '8px 12px' }}>Voucher Code</th>
                            <th style={{ padding: '8px 12px' }}>Benefit Type</th>
                            <th style={{ padding: '8px 12px' }}>Points Claimed</th>
                            <th style={{ padding: '8px 12px' }}>Discount</th>
                            <th style={{ padding: '8px 12px' }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.redemptions.map(r => (
                            <tr key={r.id || r.voucher_code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#0369a1' }}>{r.voucher_code}</td>
                              <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.benefit_type}</td>
                              <td style={{ padding: '10px 12px', color: '#dc2626', fontWeight: 700 }}>-{r.points_claimed} pts</td>
                              <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: 700 }}>₹{r.discount_amount} OFF</td>
                              <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Points Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
                  <div style={{ textAlign: 'center', padding: '1rem', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                    <Calendar size={20} color="#16a34a" style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d' }}>{data.total_scan_days}</div>
                    <div style={{ fontSize: '0.75rem', color: '#166534' }}>Scan Days</div>
                    <div style={{ fontSize: '0.7rem', color: '#4ade80', marginTop: 2 }}>+{data.base_points} earned</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '1rem', background: '#fff7ed', borderRadius: 8, border: '1px solid #fed7aa' }}>
                    <Flame size={20} color="#ea580c" style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c2410c' }}>{data.current_streak}d</div>
                    <div style={{ fontSize: '0.75rem', color: '#9a3412' }}>Current Streak</div>
                    <div style={{ fontSize: '0.7rem', color: '#fb923c', marginTop: 2 }}>+{data.weekly_bonus} wk bonus</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '1rem', background: '#fefce8', borderRadius: 8, border: '1px solid #fef08a' }}>
                    <Star size={20} color="#ca8a04" style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a16207' }}>{data.available_points}</div>
                    <div style={{ fontSize: '0.75rem', color: '#854d0e' }}>Spendable Balance</div>
                    <div style={{ fontSize: '0.7rem', color: '#ca8a04', marginTop: 2 }}>{data.tax_wallet_points || 0} in wallet</div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Sidebar */}
        <div className="track-sidebar">
          <div className="card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 16 }}>
            <h3 className="track-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={18} color="#2563eb" /> Security &amp; Verification API
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.6, marginTop: 8 }}>
              External civic billing portals call CivicSync API (<code>/api/carbon-points/external-verify</code>) with encrypted QR verification to check your points securely.
            </p>
          </div>

          <div className="card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 className="track-section-title">Rebate Tier Thresholds</h3>
            <ul style={{ paddingLeft: 20, color: '#475569', fontSize: '0.85rem', lineHeight: 1.8, marginTop: 12 }}>
              <li>🥉 <strong>Bronze</strong> — 0 pts (0% tax rebate)</li>
              <li>🥈 <strong>Silver</strong> — 2,000 pts (2% tax rebate)</li>
              <li>🥇 <strong>Gold</strong> — 5,000 pts (3% tax rebate)</li>
              <li>💎 <strong>Platinum</strong> — 10,000 pts (5% tax rebate)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 🎟️ Claim Benefit Modal */}
      {showClaimModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 480, borderRadius: 12, padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ticket color="#ea580c" /> Claim Bill Benefit
              </h3>
              <button onClick={() => { setShowClaimModal(false); setClaimSuccess(null); setClaimError(''); }} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            {claimSuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1.1rem', color: '#15803d', marginBottom: 4 }}>Benefit Claimed Successfully!</h4>
                <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: 16 }}>
                  Voucher code generated for your bill payment platform:
                </p>
                <div style={{ background: '#f0fdf4', border: '2px dashed #4ade80', padding: '12px', borderRadius: 8, fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 800, color: '#166534', marginBottom: 16 }}>
                  {claimSuccess.voucher_code}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#1e293b', marginBottom: 16 }}>
                  <strong>Discount: ₹{claimSuccess.discount_applied_inr || claimSuccess.discount_amount_inr || 0} OFF</strong> on {claimSuccess.redemption_details?.benefit_type}
                </div>
                <button onClick={() => { setShowClaimModal(false); setClaimSuccess(null); }} className="btn btn-primary" style={{ width: '100%' }}>Done</button>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit}>
                {claimError && (
                  <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#991b1b', fontSize: '0.85rem', marginBottom: 12 }}>
                    ⚠️ {claimError}
                  </div>
                )}

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>Benefit Type</label>
                  <select value={selectedBenefit} onChange={e => setSelectedBenefit(e.target.value)} className="form-select" style={{ width: '100%', padding: '8px 12px' }}>
                    <option value="PROPERTY_TAX">Property Tax Discount</option>
                    <option value="WATER_TAX">Water Bill Rebate</option>
                    <option value="TRANSPORT_TAX">Transport Tax Rebate</option>
                    <option value="ECO_BAZAAR">Eco Bazaar Coupon</option>
                  </select>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>Points to Redeem</label>
                  <input
                    type="number"
                    min="10"
                    max={data?.available_points || 100}
                    value={pointsToClaim}
                    onChange={e => setPointsToClaim(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px' }}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    1 Point = ₹1.00 Discount (Max available: {data?.available_points || 0} pts)
                  </span>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>Bill Reference ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. PROP-TAX-2026-98"
                    value={billRef}
                    onChange={e => setBillRef(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>

                <button type="submit" disabled={claiming} className="btn btn-primary" style={{ width: '100%', background: '#ea580c' }}>
                  {claiming ? 'Processing Claim...' : `Confirm & Claim ₹${pointsToClaim || 0} Discount`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
