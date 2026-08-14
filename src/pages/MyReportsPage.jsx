import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge, SeverityBadge } from '../components/common/StatusBadge';
import { FileText, ChevronRight, Search, Filter, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import './MyReportsPage.css';

export default function MyReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  // Fetch complaints belonging exclusively to the logged-in user
  useEffect(() => {
    let isMounted = true;
    const fetchUserComplaints = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.getMyComplaints();
        
        if (isMounted) {
          // Normalize response data structure from backend
          const userReports = (response.complaints || []).map(r => ({
            id: r.id,
            category: r.category || 'Garbage Issue',
            description: r.description || 'No description provided.',
            location: r.latitude && r.longitude ? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}` : 'Location pinned',
            status: r.status ? r.status.toLowerCase() : 'open',
            severity: r.priority || 'Normal',
            submittedAt: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recently',
            updatedAt: r.updated_at ? new Date(r.updated_at).toLocaleDateString() : null
          }));
          setReports(userReports);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load your complaints.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserComplaints();
    return () => { isMounted = false; };
  }, []);

  // Filter complaints based on user's search query and status dropdown
  const filtered = reports.filter(r => {
    const matchSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    
    const normalizedStatus = r.status.toLowerCase();
    const matchFilter = 
      filter === 'all' || 
      normalizedStatus === filter.toLowerCase() ||
      (filter === 'submitted' && (normalizedStatus === 'open' || normalizedStatus === 'submitted'));

    return matchSearch && matchFilter;
  });

  const resolvedCount = reports.filter(r => r.status === 'cleaned' || r.status === 'resolved').length;
  const pendingCount = reports.length - resolvedCount;

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
              <option value="submitted">Submitted / Open</option>
              <option value="verified">Verified</option>
              <option value="driver_assigned">Driver Assigned</option>
              <option value="cleaned">Cleaned / Resolved</option>
            </select>
          </div>
        </div>

        {/* Summary Chips */}
        <div className="report-summary-chips">
          <div className="summary-chip">
            <span className="summary-chip__value">{reports.length}</span>
            <span className="summary-chip__label">Total</span>
          </div>
          <div className="summary-chip">
            <span className="summary-chip__value">{resolvedCount}</span>
            <span className="summary-chip__label">Resolved</span>
          </div>
          <div className="summary-chip">
            <span className="summary-chip__value">{pendingCount}</span>
            <span className="summary-chip__label">Pending</span>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem 0' }}>
            <Loader2 className="spinner" size={32} style={{ color: 'var(--color-primary)' }} />
            <span style={{ marginLeft: '0.75rem', color: 'var(--color-text-secondary)' }}>Loading your complaints…</span>
          </div>
        )}

        {/* Error Alert */}
        {error && !loading && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {/* List */}
        {!loading && !error && filtered.length === 0 ? (
          <div className="reports-empty" id="no-reports-msg">
            <FileText size={48} />
            <p>
              {reports.length === 0 
                ? "You haven't submitted any complaints yet." 
                : "No complaints found matching your search criteria."}
            </p>
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

        {/* Register / New Report Nudge */}
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