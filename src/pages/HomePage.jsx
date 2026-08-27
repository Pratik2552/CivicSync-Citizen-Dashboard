import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import BinMap from '../components/map/BinMap';
import { cityStats, wasteTypes } from '../data/mockData';
import { AlertTriangle, Truck, CheckCircle, MapPin, ArrowRight, ChevronDown } from 'lucide-react';
import './HomePage.css';

export default function HomePage() {
  const mapRef = useRef(null);

  const scrollToMap = () => {
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="page-wrapper">

      {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero__stripe" />
        <div className="container hero__inner">
          <div className="hero__badge">
            <span className="hero__badge-dot" />
            Official CivicSync Portal — Nashik Municipal Corporation
          </div>
          <h1 className="hero__title">
            Cleaner Communities Through<br />
            <span className="hero__title-highlight">Smarter Waste Management</span>
          </h1>
          <p className="hero__desc">
            CivicSync connects Nashik residents with municipal waste services.
            Report garbage problems, track bin status, and follow your complaint — all in one place.
          </p>
          <div className="hero__actions">
            <Link to="/report-issue" className="btn btn-primary btn-lg hero__cta-primary" id="hero-report-btn">
              <AlertTriangle size={18} />
              Report Garbage Hotspot
            </Link>
            <Link to="/report-dead-animal" className="btn btn-primary btn-lg" style={{ background: '#b91c1c', borderColor: '#991b1b', color: '#fff' }} id="hero-dead-animal-btn">
              🐾 Report Dead Animal
            </Link>
            <button onClick={scrollToMap} className="btn btn-outline-light btn-lg" id="hero-map-btn">
              <MapPin size={18} />
              Find Nearby Bins
            </button>
          </div>
          <div className="hero__scroll-hint" onClick={scrollToMap} role="button" tabIndex={0} aria-label="Scroll down">
            <ChevronDown size={20} />
          </div>
        </div>
      </section>

      {/* ── CITY STATS BAR ───────────────────────────────────────────────── */}
      <section className="stats-bar" aria-label="Live city statistics">
        <div className="container stats-bar__inner">
          <div className="stats-bar__item">
            <div className="stats-bar__icon stats-bar__icon--green"><CheckCircle size={22} /></div>
            <div className="stats-bar__data">
              <div className="stats-bar__value">{cityStats.binsEmptiedToday.toLocaleString()}</div>
              <div className="stats-bar__label">Bins Emptied Today</div>
            </div>
          </div>
          <div className="stats-bar__divider" />
          <div className="stats-bar__item">
            <div className="stats-bar__icon stats-bar__icon--blue"><CheckCircle size={22} /></div>
            <div className="stats-bar__data">
              <div className="stats-bar__value">{cityStats.complaintsResolved.toLocaleString()}</div>
              <div className="stats-bar__label">Complaints Resolved</div>
            </div>
          </div>
          <div className="stats-bar__divider" />
          <div className="stats-bar__item">
            <div className="stats-bar__icon stats-bar__icon--orange"><Truck size={22} /></div>
            <div className="stats-bar__data">
              <div className="stats-bar__value">{cityStats.activeVehicles}</div>
              <div className="stats-bar__label">Active Collection Vehicles</div>
            </div>
          </div>
          <div className="stats-bar__divider" />
          <div className="stats-bar__item">
            <div className="stats-bar__icon stats-bar__icon--red"><AlertTriangle size={22} /></div>
            <div className="stats-bar__data">
              <div className="stats-bar__value">{cityStats.pendingComplaints}</div>
              <div className="stats-bar__label">Pending Complaints</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PUBLIC MAP ───────────────────────────────────────────────────── */}
      <section className="section section--alt" id="map-section">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Live Bin Tracking</div>
            <h2 className="section-title">Find Bins Near You</h2>
            <p className="section-subtitle">
              Real-time status of public waste bins across Nashik. Click any bin marker for details.
            </p>
          </div>
          <BinMap height="460px" />
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="section" id="how">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Simple Process</div>
            <h2 className="section-title">How CivicSync Works</h2>
            <p className="section-subtitle">Three easy steps to a cleaner neighbourhood.</p>
          </div>
          <div className="how-steps">
            {[
              {
                num: '01',
                icon: '📸',
                title: 'Spot a Problem',
                desc: 'Notice an overflowing bin, missed pickup, or illegal dump? Take a photo with your phone.',
              },
              {
                num: '02',
                icon: '📝',
                title: 'Report It Online',
                desc: 'Fill the short report form — your location is auto-detected. Takes less than 60 seconds.',
              },
              {
                num: '03',
                icon: '✅',
                title: 'Track Resolution',
                desc: 'Get updates as your complaint is verified, assigned, and resolved by the municipal team.',
              },
            ].map((step, i) => (
              <div key={i} className="how-step" id={`how-step-${i + 1}`}>
                <div className="how-step__num">{step.num}</div>
                <div className="how-step__icon">{step.icon}</div>
                <h3 className="how-step__title">{step.title}</h3>
                <p className="how-step__desc">{step.desc}</p>
                {i < 2 && <div className="how-step__arrow"><ArrowRight size={20} /></div>}
              </div>
            ))}
          </div>
          <div className="how-cta">
            <Link to="/report-issue" className="btn btn-primary btn-lg" id="how-cta-btn">
              Report an Issue Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── WASTE SEGREGATION EDUCATION ──────────────────────────────────── */}
      <section className="section section--alt" id="education">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Public Education</div>
            <h2 className="section-title">How to Segregate Your Waste</h2>
            <p className="section-subtitle">
              Proper waste segregation helps the environment and speeds up municipal collection.
              Use the correct bin for each type of waste.
            </p>
          </div>
          <div className="waste-cards">
            {wasteTypes.map((w, i) => (
              <div key={i} className="waste-card" id={`waste-${w.type.toLowerCase().replace(' ', '-')}`}>
                <div className="waste-card__icon-wrap" style={{ background: w.color + '15', border: `2px solid ${w.color}30` }}>
                  <span className="waste-card__icon">{w.icon}</span>
                </div>
                <div className="waste-card__bin-badge" style={{ background: w.color }}>
                  {w.bin}
                </div>
                <h3 className="waste-card__title" style={{ color: w.color }}>{w.type}</h3>
                <p className="waste-card__examples"><strong>Examples:</strong> {w.examples}</p>
                <p className="waste-card__tip">💡 {w.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA STRIP ─────────────────────────────────────────────── */}
      <section className="cta-strip">
        <div className="container cta-strip__inner">
          <div>
            <h2 className="cta-strip__title">Notice a garbage problem in your area?</h2>
            <p className="cta-strip__sub">Report it now and the municipal team will act on it.</p>
          </div>
          <div className="cta-strip__btns">
            <Link to="/report-issue" className="btn btn-primary btn-lg" id="bottom-cta-btn">Report Garbage Hotspot</Link>
            <Link to="/login" className="btn btn-outline-light btn-lg" id="bottom-register-btn">Register / Sign In</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
