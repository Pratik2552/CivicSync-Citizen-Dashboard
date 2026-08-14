import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { StatusBadge, SeverityBadge } from '../components/common/StatusBadge';
import StepTimeline from '../components/common/StepTimeline';
import { ArrowLeft, ImageOff, Star, Loader2, Navigation, Truck, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import './TrackReportPage.css';

export default function TrackReportPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Fetch the specific complaint and verify ownership
  useEffect(() => {
    let isMounted = true;

    const fetchReport = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch user's complaints
        const response = await api.getMyComplaints();
        const userComplaints = response.complaints || [];

        // Find the specific complaint by ID
        const found = userComplaints.find((c) => String(c.id) === String(reportId));

        if (!found) {
          if (isMounted) {
            setError('Complaint not found or you do not have permission to view it.');
            setReport(null);
          }
          return;
        }

        // Build status timeline based on backend status
        const currentStatus = (found.status || 'Open').toLowerCase();
        const isResolvedOrCleaned = currentStatus === 'resolved' || currentStatus === 'cleaned';
        const isAssigned = currentStatus === 'assigned' || currentStatus === 'driver_assigned' || currentStatus === 'in_progress' || isResolvedOrCleaned;
        
        const timelineSteps = [
          {
            title: 'Submitted',
            description: 'Complaint received and verified.',
            date: found.created_at ? new Date(found.created_at).toLocaleString() : 'N/A',
            completed: true,
          },
          {
            title: 'Verified',
            description: `Verified via ${found.gps_source === 'EXIF_METADATA' ? 'GPS Metadata' : 'User Location'}`,
            date: found.created_at ? new Date(found.created_at).toLocaleString() : 'N/A',
            completed: true,
          },
          {
            title: 'Driver Assigned',
            description: found.assigned_driver_id ? `Assigned to Unit #${found.assigned_driver_id}` : 'Collection vehicle dispatch pending.',
            date: isAssigned ? 'In Progress' : 'Pending',
            completed: isAssigned,
          },
          {
            title: 'Cleaned / Resolved',
            description: 'Waste successfully collected and site cleared with photo proof.',
            date: isResolvedOrCleaned ? (found.resolved_at ? new Date(found.resolved_at).toLocaleString() : 'Completed') : 'Pending',
            completed: isResolvedOrCleaned,
          },
        ];

        if (isMounted) {
          setReport({
            id: found.id,
            category: found.category || 'Garbage Issue',
            status: currentStatus,
            severity: found.priority || 'High',
            location: found.latitude && found.longitude ? `${found.latitude.toFixed(4)}, ${found.longitude.toFixed(4)}` : 'Pinned Location',
            submittedAt: found.created_at ? new Date(found.created_at).toLocaleDateString() : 'N/A',
            updatedAt: found.resolved_at ? new Date(found.resolved_at).toLocaleDateString() : (found.created_at ? new Date(found.created_at).toLocaleDateString() : 'N/A'),
            description: found.description || found.ai_reason || '',
            beforePhoto: found.image_url || null,
            afterPhoto: found.resolved_image_url || found.after_image_url || null,
            assignedDriverId: found.assigned_driver_id || null,
            isAssigned: isAssigned,
            timeline: timelineSteps,
            rating: found.rating || 0,
          });

          if (found.rating) {
            setRating(found.rating);
            setRatingSubmitted(true);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load complaint details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReport();
    return () => { isMounted = false; };
  }, [reportId]);

  const handleRating = (val) => {
    setRating(val);
  };

  const submitRating = async () => {
    setRatingSubmitted(true);
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Loader2 className="spinner" size={36} style={{ color: 'var(--color-primary)' }} />
          <span style={{ marginLeft: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Loading complaint details...
          </span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="page-wrapper">
        <div className="page-hero">
          <div className="container">
            <h1>Complaint Not Found</h1>
          </div>
        </div>
        <div className="container track-notfound" id="report-not-found">
          <p>{error || `No complaint found with ID ${reportId}.`}</p>
          <Link to="/my-reports" className="btn btn-primary mt-4" id="back-to-reports-btn">
            ← Back to My Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="page-hero">
        <div className="container">
          <Link to="/my-reports" className="track-back-link" id="back-link">
            <ArrowLeft size={16} /> Back to My Reports
          </Link>
          <h1>Complaint Details</h1>
          <p>Reference ID: <strong>{report.id}</strong></p>
        </div>
      </div>

      <div className="container track-layout">

        {/* LEFT COLUMN */}
        <div className="track-main">

          {/* Summary Card */}
          <div className="card track-summary" id="complaint-summary">
            <div className="track-summary__row">
              <div>
                <div className="track-summary__id">{report.id}</div>
                <div className="track-summary__category">{report.category}</div>
              </div>
              <div className="track-summary__badges">
                <StatusBadge status={report.status} />
                <SeverityBadge severity={report.severity} />
              </div>
            </div>
            <hr className="divider" />
            <dl className="track-summary__dl">
              <div>
                <dt>Location</dt>
                <dd>📍 {report.location}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{report.submittedAt}</dd>
              </div>
              <div>
                <dt>Last Updated</dt>
                <dd>{report.updatedAt}</dd>
              </div>
              {report.description && (
                <div>
                  <dt>Description / AI Reason</dt>
                  <dd>{report.description}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* 🚚 Assigned Authority / Live Tracking Callout Card */}
          <div className="card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <UserCheck size={18} color="#2563eb" /> Assigned Authority &amp; Field Unit
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                 {report.assignedDriverId && (
  <Link 
    to={`/live-tracking?complaintId=${report.id}`} 
    className="btn btn-primary btn-sm" 
    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
  >
    <Navigation size={14} /> See Assigned Authority Live
  </Link>
)}
                </p>
              </div>

              {report.assignedDriverId && (
                <Link 
                  to="/live-tracking" 
                  className="btn btn-primary btn-sm" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                >
                  <Navigation size={14} /> See Assigned Authority Live
                </Link>
              )}
            </div>
          </div>

          {/* Proof of Work */}
          <div className="card track-proof" id="proof-of-work">
            <h3 className="track-section-title">Driver Proof of Work</h3>
            <p className="track-section-sub">
              Photos uploaded by the citizen and collection driver upon completing the job.
            </p>
            <div className="proof-photos">
              <div className="proof-photo" id="before-photo">
                <div className="proof-photo__label">Before (Uploaded Photo)</div>
                {report.beforePhoto ? (
                  <img src={report.beforePhoto} alt="Before cleanup" />
                ) : (
                  <div className="proof-photo__placeholder">
                    <ImageOff size={28} />
                    <span>Not available</span>
                  </div>
                )}
              </div>
              <div className="proof-photo" id="after-photo">
                <div className="proof-photo__label">After (Driver Cleaned Proof)</div>
                {report.afterPhoto ? (
                  <img src={report.afterPhoto} alt="After cleanup proof" />
                ) : (
                  <div className="proof-photo__placeholder">
                    <ImageOff size={28} />
                    <span>{report.status === 'resolved' || report.status === 'cleaned' ? 'Not uploaded' : 'Pending resolution'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="card track-feedback" id="feedback-section">
            <h3 className="track-section-title">Rate the Resolution</h3>
            {report.status !== 'resolved' && report.status !== 'cleaned' ? (
              <p className="track-section-sub">
                You can rate the resolution once your complaint is marked as Resolved.
              </p>
            ) : ratingSubmitted ? (
              <div className="feedback-submitted" id="rating-submitted-msg">
                <div className="feedback-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={28}
                      fill={s <= rating ? '#f9a825' : 'none'}
                      color={s <= rating ? '#f9a825' : '#ccc'}
                    />
                  ))}
                </div>
                <p style={{ marginTop: 8, color: 'var(--color-secondary)', fontWeight: 600 }}>
                  ✓ Thank you for your feedback!
                </p>
              </div>
            ) : (
              <div className="feedback-form" id="rating-form">
                <p className="track-section-sub">How satisfied are you with the resolution?</p>
                <div className="feedback-stars" role="group" aria-label="Rating stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`star-btn ${s <= (hovered || rating) ? 'active' : ''}`}
                      onMouseEnter={() => setHovered(s)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => handleRating(s)}
                      aria-label={`${s} star`}
                      id={`star-${s}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <div className="feedback-labels">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
                <button
                  className="btn btn-primary mt-4"
                  disabled={!rating}
                  onClick={submitRating}
                  id="submit-rating-btn"
                >
                  Submit Rating
                </button>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT: Timeline */}
        <div className="track-sidebar">
          <div className="card" id="status-timeline">
            <h3 className="track-section-title" style={{ marginBottom: 20 }}>Complaint Status</h3>
            <StepTimeline timeline={report.timeline} />
          </div>
          <div className="card track-help" style={{ marginTop: 16 }} id="help-section">
            <h4 style={{ marginBottom: 8, fontSize: '0.9rem' }}>Need help with this complaint?</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              Quote your complaint ID <strong>{report.id}</strong> when calling our helpline.
            </p>
            <a href="tel:1800111222" className="btn btn-secondary btn-sm mt-4" style={{ display: 'inline-flex' }}>
              Call 1800-111-222
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}