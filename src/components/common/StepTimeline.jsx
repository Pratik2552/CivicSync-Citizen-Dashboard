import React from 'react';
import './StepTimeline.css';

const STEPS = [
  { key: 'submitted',        label: 'Submitted' },
  { key: 'verified',         label: 'Verified' },
  { key: 'driver_assigned',  label: 'Driver Assigned' },
  { key: 'cleaned',          label: 'Cleaned' },
];

export default function StepTimeline({ timeline }) {
  // Build a lookup from step key → done/time
  const lookup = {};
  (timeline || []).forEach(t => { lookup[t.step] = t; });

  return (
    <div className="timeline" role="list" aria-label="Complaint status timeline">
      {STEPS.map((step, idx) => {
        const info = lookup[step.key] || {};
        const done = !!info.done;
        const isLast = idx === STEPS.length - 1;

        return (
          <div key={step.key} className="timeline__item" role="listitem">
            <div className="timeline__track">
              <div className={`timeline__dot ${done ? 'timeline__dot--done' : ''}`}>
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span className="timeline__dot-num">{idx + 1}</span>
                )}
              </div>
              {!isLast && <div className={`timeline__line ${done ? 'timeline__line--done' : ''}`} />}
            </div>
            <div className="timeline__content">
              <div className={`timeline__label ${done ? 'timeline__label--done' : ''}`}>
                {step.label}
              </div>
              {info.time && (
                <div className="timeline__time">{info.time}</div>
              )}
              {!done && !info.time && (
                <div className="timeline__pending">Pending</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
