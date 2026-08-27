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

  // Fetch complaints & dead animal alerts belonging exclusively to the logged-in user
  useEffect(() => {
    let isMounted = true;
    const fetchUserComplaints = async () => {
      try {
        setLoading(true);
        setError('');

        // 1. Fetch regular complaints
        const compPromise = api.getMyComplaints().catch(() => ({ complaints: [] }));

        // 2. Fetch dead animal reports (uses same auth pipeline)
        const deadAnimalPromise = api.getMyDeadAnimalReports().catch(() => ({ reports: [] }));

        const [compData, deadAnimalData] = await Promise.all([compPromise, deadAnimalPromise]);

        if (isMounted) {
          // Normalize regular complaints
          const regularReports = (compData.complaints || []).map(r => ({
            id: r.id,
            category: r.category || 'Garbage Issue',
            description: r.description || 'No description provided.',
            location: r.latitude && r.longitude ? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}` : 'Location pinned',
            status: r.status ? r.status.toLowerCase() : 'open',
            severity: r.priority || 'Normal',
            submittedAt: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recently',
            updatedAt: r.updated_at ? new Date(r.updated_at).toLocaleDateString() : null,
          }));

          // Normalize dead animal reports
          const deadAnimalReports = (deadAnimalData.reports || []).map(r => ({
            id: r.id,
            category: '🐾 Dead Animal Alert',
            description: r.description || 'Dead animal carcass alert reported.',
            location: r.location_address || `${parseFloat(r.latitude).toFixed(4)}, ${parseFloat(r.longitude).toFixed(4)}`,
            status: r.status ? r.status.toLowerCase() : 'pending',
            severity: 'High',
            image_url: r.image_url,
            assigned_driver: r.assigned_driver_name,
            submittedAt: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recently',
            updatedAt: r.resolved_at ? new Date(r.resolved_at).toLocaleDateString() : null,
          }));

          // Combine and sort by date descending
          const combined = [...deadAnimalReports, ...regularReports];
          setReports(combined);
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
      (filter === 'submitted' && (normalizedStatus === 'open' || normalizedStatus === 'submitted' || normalizedStatus === 'pending'));

    return matchSearch && matchFilter;
  });

  const resolvedCount = reports.filter(r => r.status === 'cleaned' || r.status === 'resolved').length;
  const pendingCount = reports.length - resolvedCount;

  return (
    <div className="page-wrapper">
      <div className="page-hero">
        <div className="container">
          <h1>My Complaints &amp; Alerts</h1>
          <p>View and track all garbage issues and dead animal alerts you have submitted.</p>
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
              <option value="submitted">Submitted / Pending</option>
              <option value="assigned">Assigned to Driver</option>
              <option value="cleaned">Cleaned / Resolved</option>
            </select>
          </div>
        </div>

        {/* Summary Chips */}
        <div className="report-summary-chips">
          <div className="summary-chip">
            <span className="summary-chip__value">{reports.length}</span>
            <span className="summary-chip__label">Total Alerts</span>
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
            <span style={{ marginLeft: '0.75rem', color: 'var(--color-text-secondary)' }}>Loading your complaints &amp; alerts…</span>
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
                ? "You haven't submitted any complaints or dead animal alerts yet." 
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
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem',
                  marginBottom: '1rem',
                  background: '#fff',
                  border: report.category.includes('Dead Animal') ? '2px solid #fca5a5' : '1px solid var(--color-border)',
                  borderRadius: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <div className="report-card__left" style={{ flex: 1, paddingRight: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="report-card__id" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#334155', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem' }}>
                      {report.id}
                    </span>
                    <span className="report-card__category" style={{ fontWeight: 700, color: report.category.includes('Dead Animal') ? '#b91c1c' : '#2563eb', fontSize: '0.9rem' }}>
                      {report.category}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.9rem', color: '#1e293b', marginBottom: 4, fontWeight: 500 }}>
                    {report.description}
                  </div>

                  <div className="report-card__location" style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 4 }}>
                    📍 {report.location}
                  </div>

                  {report.assigned_driver && (
                    <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600, marginTop: 2 }}>
                      🚛 Sanitation Team Assigned: {report.assigned_driver}
                    </div>
                  )}

                  <div className="report-card__date" style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                    Submitted: {report.submittedAt}
                    {report.updatedAt && ` · Resolved: ${report.updatedAt}`}
                  </div>
                </div>

                {report.image_url && (
                  <div style={{ marginRight: '1rem' }}>
                    <img
                      src={report.image_url}
                      alt="Complaint Photo"
                      style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                    />
                  </div>
                )}

                <div className="report-card__right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <StatusBadge status={report.status} />
                  <SeverityBadge severity={report.severity} />
                  <ChevronRight size={18} style={{ color: '#94a3b8', marginTop: 4 }} />
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