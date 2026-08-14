import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockReports } from '../data/mockData';
import { StatusBadge, SeverityBadge } from '../components/common/StatusBadge';
import { FileText, ChevronRight, Search, Filter } from 'lucide-react';
import './MyReportsPage.css';

export default function MyReportsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = mockReports.filter(r => {
    const matchSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || r.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="page-wrapper">
      <div className="page-hero">
        <div className="container">
          <h1>My Complaints</h1>
          <p>View and track all complaints you have submitted.</p>
        </div>
      </div>

      <div className="container my-reports-layout">

        {/* Controls */}
        <div className="my-reports-controls" id="reports-controls">
          <div className="search-wrap">
            <Search size={16} className="search-wrap__icon" />
            <input
              className="form-input search-wrap__input"
              placeholder="Search by ID, category, or location…"
              id="report-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-wrap">
            <Filter size={16} style={{ color: 'var(--color-text-muted)' }} />
            <select
              className="form-select"
              id="status-filter-select"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ minWidth: 160 }}
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="verified">Verified</option>
              <option value="driver_assigned">Driver Assigned</option>
              <option value="cleaned">Cleaned</option>
            </select>
          </div>
        </div>

        {/* Summary Chips */}
        <div className="report-summary-chips">
          <div className="summary-chip">
            <span className="summary-chip__value">{mockReports.length}</span>
            <span className="summary-chip__label">Total</span>
          </div>
          <div className="summary-chip">
            <span className="summary-chip__value">{mockReports.filter(r => r.status === 'cleaned').length}</span>
            <span className="summary-chip__label">Resolved</span>
          </div>
          <div className="summary-chip">
            <span className="summary-chip__value">{mockReports.filter(r => r.status !== 'cleaned').length}</span>
            <span className="summary-chip__label">Pending</span>
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="reports-empty" id="no-reports-msg">
            <FileText size={48} />
            <p>No complaints found matching your search.</p>
          </div>
        ) : (
          <div className="reports-list" id="reports-list">
            {filtered.map(report => (
              <Link
                to={`/track/${report.id}`}
                key={report.id}
                className="report-card"
                id={`report-card-${report.id}`}
              >
                <div className="report-card__left">
                  <div className="report-card__id">{report.id}</div>
                  <div className="report-card__category">{report.category}</div>
                  <div className="report-card__location">📍 {report.location}</div>
                  <div className="report-card__date">
                    Submitted: {report.submittedAt}
                    {report.updatedAt && ` · Updated: ${report.updatedAt}`}
                  </div>
                </div>
                <div className="report-card__right">
                  <StatusBadge status={report.status} />
                  <SeverityBadge severity={report.severity} />
                  <ChevronRight size={18} className="report-card__arrow" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Register Nudge */}
        <div className="reports-register-nudge card" id="register-nudge">
          <FileText size={20} />
          <div>
            <strong>Want to report a new issue?</strong>
            <p>Use the report form to flag a garbage problem in your area.</p>
          </div>
          <Link to="/report-issue" className="btn btn-primary btn-sm" id="new-report-nudge-btn">
            Report an Issue
          </Link>
        </div>

      </div>
    </div>
  );
}
