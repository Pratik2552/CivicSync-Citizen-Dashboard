import React from 'react';

const statusMap = {
  submitted:      { label: 'Submitted',       className: 'badge-submitted' },
  verified:       { label: 'Verified',         className: 'badge-verified' },
  driver_assigned:{ label: 'Driver Assigned',  className: 'badge-assigned' },
  cleaned:        { label: 'Cleaned',          className: 'badge-cleaned' },
};

const severityMap = {
  'Normal':       'badge-normal',
  'High Priority':'badge-high',
  'Urgent':       'badge-urgent',
};

export function StatusBadge({ status }) {
  const info = statusMap[status] || { label: status, className: 'badge-submitted' };
  return <span className={`badge ${info.className}`}>{info.label}</span>;
}

export function SeverityBadge({ severity }) {
  const cls = severityMap[severity] || 'badge-normal';
  return <span className={`badge ${cls}`}>{severity}</span>;
}
