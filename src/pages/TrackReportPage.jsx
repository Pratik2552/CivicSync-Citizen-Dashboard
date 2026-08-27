import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { StatusBadge, SeverityBadge } from '../components/common/StatusBadge';
import StepTimeline from '../components/common/StepTimeline';
import { ArrowLeft, ImageOff, Star, Loader2, Navigation, UserCheck, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import './TrackReportPage.css';

// Pipeline order for evaluating step completion
const STATUS_PIPELINE = ['open', 'under review', 'assigned', 'in progress', 'work in progress', 'resolved', 'cleaned'];

const getStatusIndex = (statusStr) => {
  const s = (statusStr || '').toLowerCase();
  if (s === 'driver assigned') return STATUS_PIPELINE.indexOf('assigned');
  if (s === 'work in progress') return STATUS_PIPELINE.indexOf('in progress');
  const idx = STATUS_PIPELINE.indexOf(s);
  return idx !== -1 ? idx : 0;
};

export default function TrackReportPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timelineVisible, setTimelineVisible] = useState(true);

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError('');

        // 1. Fetch both regular complaints and dead animal reports
        const compPromise = api.getMyComplaints().catch(() => ({ complaints: [] }));
        const deadAnimalPromise = api.getMyDeadAnimalReports().catch(() => ({ reports: [] }));

        const [compRes, deadAnimalRes] = await Promise.all([compPromise, deadAnimalPromise]);

        const userComplaints = compRes.complaints || [];
        const deadAnimalReports = deadAnimalRes.reports || [];

        // 2. Search in regular complaints first
        let found = userComplaints.find((c) => String(c.id) === String(reportId));
        let isDeadAnimalReport = false;

        // 3. If not found, search in dead animal reports
        if (!found) {
          found = deadAnimalReports.find((r) => String(r.id) === String(reportId));
          if (found) {
            isDeadAnimalReport = true;
          }
        }

        if (!found) {
          if (isMounted) {
            setError('Complaint not found or you do not have permission to view it.');
            setReport(null);
          }
          return;
        }

        // Standardize structure based on complaint type
        if (isDeadAnimalReport) {
          const currentStatus = (found.status || 'Pending').toLowerCase();
          const isAssigned = currentStatus === 'assigned' || currentStatus === 'in progress' || currentStatus === 'cleaned' || currentStatus === 'resolved';
          const isResolved = currentStatus === 'resolved' || currentStatus === 'cleaned';

          const timelineSteps = [
            {
              title: 'Complaint Registered',
              description: 'Dead animal alert received by municipal dispatch.',
              date: found.created_at ? new Date(found.created_at).toLocaleString() : 'N/A',
              completed: true,
            },
            {
              title: 'Sanitation Dispatch Review',
              description: 'GPS coordinates verified for emergency sanitation response.',
              date: found.created_at ? new Date(found.created_at).toLocaleString() : 'Verified',
              completed: true,
            },
            {
              title: 'Driver / Truck Assigned',
              description: found.assigned_driver_name ? `Sanitation Driver ${found.assigned_driver_name} assigned.` : 'Dispatching nearest sanitation truck.',
              date: isAssigned ? 'Assigned' : 'Pending',
              completed: isAssigned,
            },
            {
              title: 'Carcass Removal & Chemical Spray',
              description: 'Sanitation team en route to site for carcass disposal and disinfection.',
              date: currentStatus === 'in progress' || isResolved ? 'Active' : 'Pending',
              completed: currentStatus === 'in progress' || isResolved,
            },
            {
              title: 'Resolved & Site Sanitized',
              description: 'Site safely cleared, sanitized, and disinfected.',
              date: isResolved ? (found.resolved_at ? new Date(found.resolved_at).toLocaleString() : 'Completed') : 'Pending',
              completed: isResolved,
            },
          ];

          if (isMounted) {
            setTimelineVisible(true);
            setReport({
              id: found.id,
              category: '🐾 Dead Animal Alert',
              status: found.status || 'Pending',
              severity: 'High Priority',
              location: found.location_address || `${parseFloat(found.latitude).toFixed(4)}, ${parseFloat(found.longitude).toFixed(4)}`,
              latitude: found.latitude,
              longitude: found.longitude,
              submittedAt: found.created_at ? new Date(found.created_at).toLocaleString() : 'N/A',
              updatedAt: found.resolved_at ? new Date(found.resolved_at).toLocaleString() : (found.created_at ? new Date(found.created_at).toLocaleString() : 'N/A'),
              description: found.description || 'Dead animal alert reported on locality road.',
              citizenName: found.citizen_name || 'Anonymous Citizen',
              citizenPhone: found.citizen_phone || 'N/A',
              beforePhoto: found.image_url || null,
              afterPhoto: found.resolved_image_url || null,
              assignedDriverName: found.assigned_driver_name || null,
              assignedDriverId: found.assigned_driver_id || null,
              isAssigned,
              isDeadAnimal: true,
              timeline: timelineSteps,
              rating: found.rating || 0,
            });

            if (found.rating) {
              setRating(found.rating);
              setRatingSubmitted(true);
            }
          }
        } else {
          // Regular Complaint Structure
          const currentStatus = (found.status || 'Open').toLowerCase();
          const currentIdx = getStatusIndex(currentStatus);
          const isResolvedOrCleaned = currentStatus === 'resolved' || currentStatus === 'cleaned';
          const isAssigned = currentIdx >= getStatusIndex('assigned');

          let timelineSteps = [];
          let isVisible = true;

          try {
            const timelineRes = api.getComplaintTimeline 
              ? await api.getComplaintTimeline(reportId)
              : await (await fetch(`/api/complaints/${reportId}/timeline`, {
                  headers: { Authorization: `Bearer ${localStorage.getItem('civicsync_token')}` }
                })).json();

            if (timelineRes && timelineRes.timeline) {
              isVisible = timelineRes.timeline_visible ?? true;
              timelineSteps = timelineRes.timeline.map((item) => {
                const itemIdx = getStatusIndex(item.status);
                return {
                  title: item.event,
                  description: item.description,
                  date: itemIdx <= currentIdx && item.created_at ? new Date(item.created_at).toLocaleString() : 'Pending',
                  completed: itemIdx <= currentIdx,
                };
              });
            }
          } catch (tErr) {
            console.warn('Could not fetch custom timeline, using default steps fallback:', tErr.message);
          }

          if (!timelineSteps || timelineSteps.length === 0) {
            timelineSteps = [
              {
                title: 'Submitted',
                description: 'Complaint received and logged.',
                date: found.created_at ? new Date(found.created_at).toLocaleString() : 'N/A',
                completed: true,
              },
              {
                title: 'Under Review',
                description: `Verified via ${found.gps_source === 'EXIF_METADATA' ? 'GPS Metadata' : 'User Location'}`,
                date: currentIdx >= getStatusIndex('under review') && found.created_at ? new Date(found.created_at).toLocaleString() : 'Pending',
                completed: currentIdx >= getStatusIndex('under review'),
              },
              {
                title: 'Driver Assigned',
                description: found.assigned_driver_id ? `Assigned to Driver Unit #${found.assigned_driver_id}` : 'Collection vehicle dispatch pending.',
                date: isAssigned ? 'In Progress' : 'Pending',
                completed: isAssigned,
              },
              {
                title: 'Work In Progress',
                description: 'Driver is en route to the site location.',
                date: currentIdx >= getStatusIndex('in progress') ? 'Active' : 'Pending',
                completed: currentIdx >= getStatusIndex('in progress'),
              },
              {
                title: 'Resolved',
                description: 'Waste collected and site cleared with photo proof.',
                date: isResolvedOrCleaned ? (found.resolved_at ? new Date(found.resolved_at).toLocaleString() : 'Completed') : 'Pending',
                completed: isResolvedOrCleaned,
              },
            ];
          }

          if (isMounted) {
            setTimelineVisible(isVisible);
            setReport({
              id: found.id,
              category: found.category || 'Garbage Issue',
              status: found.status || 'Open',
              severity: found.priority || 'High',
              location: found.latitude && found.longitude ? `${found.latitude.toFixed(4)}, ${found.longitude.toFixed(4)}` : 'Pinned Location',
              latitude: found.latitude,
              longitude: found.longitude,
              submittedAt: found.created_at ? new Date(found.created_at).toLocaleDateString() : 'N/A',
              updatedAt: found.resolved_at ? new Date(found.resolved_at).toLocaleDateString() : (found.created_at ? new Date(found.created_at).toLocaleDateString() : 'N/A'),
              description: found.description || found.ai_reason || '',
              beforePhoto: found.image_url || null,
              afterPhoto: found.resolved_image_url || found.after_image_url || null,
              assignedDriverId: found.assigned_driver_id || null,
              assignedDriverName: found.assigned_driver_name || null,
              isAssigned,
              isDeadAnimal: false,
              timeline: timelineSteps,
              rating: found.rating || 0,
            });

            if (found.rating) {
              setRating(found.rating);
              setRatingSubmitted(true);
            }
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

    fetchReportData();
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
                <div className="track-summary__category" style={{ color: report.isDeadAnimal ? '#b91c1c' : '#2563eb', fontWeight: 700 }}>
                  {report.category}
                </div>
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
                <dd style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  📍 {report.location}
                  {report.latitude && report.longitude && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none', marginLeft: 6 }}
                    >
                      (Open Map 🗺️)
                    </a>
                  )}
                </dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{report.submittedAt}</dd>
              </div>
              <div>
                <dt>Last Updated</dt>
                <dd>{report.updatedAt}</dd>
              </div>
              {report.citizenName && (
                <div>
                  <dt>Reporter Name</dt>
                  <dd>👤 {report.citizenName} {report.citizenPhone ? `(${report.citizenPhone})` : ''}</dd>
                </div>
              )}
              {report.description && (
                <div>
                  <dt>Description / Details</dt>
                  <dd>{report.description}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* 🚚 Assigned Authority / Live Tracking Callout Card */}
          <div className="card" style={{ background: report.isDeadAnimal ? '#fef2f2' : '#f8fafc', border: report.isDeadAnimal ? '1px solid #fecaca' : '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: report.isDeadAnimal ? '#991b1b' : '#1e293b' }}>
                  <UserCheck size={18} color={report.isDeadAnimal ? '#dc2626' : '#2563eb'} />
                  {report.isDeadAnimal ? 'Sanitation Emergency Dispatch Unit' : 'Assigned Authority & Field Unit'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  {report.assignedDriverName
                    ? `Sanitation Driver ${report.assignedDriverName} has been assigned to clear & disinfect this site.`
                    : report.assignedDriverId
                    ? `Field Unit #${report.assignedDriverId} is assigned to clear this site.`
                    : 'Municipal sanitation dispatch will assign a driver unit shortly.'}
                </p>
              </div>

              {(report.assignedDriverId || report.assignedDriverName) && (
                <Link 
                  to={`/live-tracking?complaintId=${report.id}`} 
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
                    <span>{report.status.toLowerCase() === 'resolved' || report.status.toLowerCase() === 'cleaned' ? 'Not uploaded' : 'Pending resolution'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="card track-feedback" id="feedback-section">
            <h3 className="track-section-title">Rate the Resolution</h3>
            {report.status.toLowerCase() !== 'resolved' && report.status.toLowerCase() !== 'cleaned' ? (
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
            {timelineVisible ? (
              <StepTimeline timeline={report.timeline} />
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#64748b' }}>
                <EyeOff size={32} style={{ margin: '0 auto 8px auto', display: 'block', opacity: 0.6 }} />
                <p style={{ fontSize: '0.875rem', margin: 0 }}>Timeline updates are currently hidden for this complaint by administrative review.</p>
              </div>
            )}
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