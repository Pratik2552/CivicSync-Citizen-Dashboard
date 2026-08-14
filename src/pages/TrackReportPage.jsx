import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockReports } from '../data/mockData';
import { StatusBadge, SeverityBadge } from '../components/common/StatusBadge';
import StepTimeline from '../components/common/StepTimeline';
import { ArrowLeft, ImageOff, Star } from 'lucide-react';
import './TrackReportPage.css';

export default function TrackReportPage() {
  const { reportId } = useParams();
  const report = mockReports.find(r => r.id === reportId);
  const [rating, setRating] = useState(report?.rating || 0);
  const [hovered, setHovered] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(!!report?.rating);

  if (!report) {
    return (
      <div className="page-wrapper">
        <div className="page-hero">
          <div className="container"><h1>Complaint Not Found</h1></div>
        </div>
        <div className="container track-notfound" id="report-not-found">
          <p>No complaint found with ID <strong>{reportId}</strong>.</p>
          <Link to="/my-reports" className="btn btn-primary mt-4" id="back-to-reports-btn">← Back to My Reports</Link>
        </div>
      </div>
    );
  }

  const handleRating = (val) => {
    setRating(val);
  };

  const submitRating = () => {
    // In production: call api.submitRating(report.id, rating)
    setRatingSubmitted(true);
  };

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
                  <dt>Description</dt>
                  <dd>{report.description}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Proof of Work */}
          <div className="card track-proof" id="proof-of-work">
            <h3 className="track-section-title">Driver Proof of Work</h3>
            <p className="track-section-sub">
              Photos uploaded by the collection driver upon completing the job.
            </p>
            <div className="proof-photos">
              <div className="proof-photo" id="before-photo">
                <div className="proof-photo__label">Before</div>
                {report.beforePhoto ? (
                  <img src={report.beforePhoto} alt="Before cleanup" />
                ) : (
                  <div className="proof-photo__placeholder">
                    <ImageOff size={28} />
                    <span>{report.status === 'cleaned' ? 'Not uploaded' : 'Not yet available'}</span>
                  </div>
                )}
              </div>
              <div className="proof-photo" id="after-photo">
                <div className="proof-photo__label">After</div>
                {report.afterPhoto ? (
                  <img src={report.afterPhoto} alt="After cleanup" />
                ) : (
                  <div className="proof-photo__placeholder">
                    <ImageOff size={28} />
                    <span>{report.status === 'cleaned' ? 'Not uploaded' : 'Not yet available'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="card track-feedback" id="feedback-section">
            <h3 className="track-section-title">Rate the Resolution</h3>
            {report.status !== 'cleaned' ? (
              <p className="track-section-sub">
                You can rate the resolution once your complaint is marked as Cleaned.
              </p>
            ) : ratingSubmitted ? (
              <div className="feedback-submitted" id="rating-submitted-msg">
                <div className="feedback-stars">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={28} fill={s <= rating ? '#f9a825' : 'none'} color={s <= rating ? '#f9a825' : '#ccc'} />
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
                  {[1,2,3,4,5].map(s => (
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
                  <span>Poor</span><span>Excellent</span>
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
