import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="container footer__top-inner">
          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo">
              <span>♻</span>
            </div>
            <div>
              <div className="footer__brand-name">CivicSync</div>
              <div className="footer__brand-sub">Smart Waste Management System</div>
            </div>
          </div>

          {/* Links */}
          <div className="footer__cols">
            <div className="footer__col">
              <h4 className="footer__col-title">Services</h4>
              <ul className="footer__links">
                <li><Link to="/report-issue">Report an Issue</Link></li>
                <li><Link to="/my-reports">Track My Complaint</Link></li>
                <li><a href="#map">Find Nearby Bins</a></li>
                <li><a href="#education">Waste Segregation</a></li>
              </ul>
            </div>
            <div className="footer__col">
              <h4 className="footer__col-title">Citizen</h4>
              <ul className="footer__links">
                <li><Link to="/login">Register / Login</Link></li>
                <li><Link to="/profile">My Profile</Link></li>
                <li><a href="#how">How It Works</a></li>
              </ul>
            </div>
            <div className="footer__col">
              <h4 className="footer__col-title">Contact</h4>
              <ul className="footer__links">
                <li><a href="tel:1800111222">Helpline: 1800-111-222</a></li>
                <li><a href="mailto:help@civicsync.gov.in">help@civicsync.gov.in</a></li>
                <li><span>Mon–Sat, 8 AM – 8 PM</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p>© 2026 CivicSync — Municipal Smart Waste Management. All rights reserved.</p>
          <p className="footer__disclaimer">
            This is an official digital service portal. Complaints lodged here are processed by the respective municipal ward office.
          </p>
        </div>
      </div>
    </footer>
  );
}
