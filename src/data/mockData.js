// CivicSync Mock Data — ready to be replaced with real API responses

export const cityStats = {
  binsEmptiedToday: 284,
  complaintsResolved: 1042,
  activeVehicles: 37,
  totalBins: 612,
  pendingComplaints: 58,
};

export const binLocations = [
  { id: 'BIN-001', lat: 18.5204, lng: 73.8567, status: 'empty',    lastEmptied: '2026-08-14 07:30', zone: 'Shivajinagar' },
  { id: 'BIN-002', lat: 18.5220, lng: 73.8600, status: 'half',     lastEmptied: '2026-08-14 05:00', zone: 'Shivajinagar' },
  { id: 'BIN-003', lat: 18.5180, lng: 73.8540, status: 'full',     lastEmptied: '2026-08-13 18:00', zone: 'Deccan' },
  { id: 'BIN-004', lat: 18.5160, lng: 73.8580, status: 'empty',    lastEmptied: '2026-08-14 08:00', zone: 'Deccan' },
  { id: 'BIN-005', lat: 18.5250, lng: 73.8620, status: 'full',     lastEmptied: '2026-08-13 20:00', zone: 'Kothrud' },
  { id: 'BIN-006', lat: 18.5100, lng: 73.8500, status: 'half',     lastEmptied: '2026-08-14 06:00', zone: 'Swargate' },
  { id: 'BIN-007', lat: 18.5130, lng: 73.8620, status: 'empty',    lastEmptied: '2026-08-14 09:00', zone: 'Swargate' },
  { id: 'BIN-008', lat: 18.5270, lng: 73.8540, status: 'half',     lastEmptied: '2026-08-14 04:00', zone: 'Kothrud' },
  { id: 'BIN-009', lat: 18.5090, lng: 73.8560, status: 'full',     lastEmptied: '2026-08-13 16:00', zone: 'Swargate' },
  { id: 'BIN-010', lat: 18.5240, lng: 73.8490, status: 'empty',    lastEmptied: '2026-08-14 10:00', zone: 'Kothrud' },
  { id: 'BIN-011', lat: 18.5195, lng: 73.8650, status: 'half',     lastEmptied: '2026-08-14 03:00', zone: 'Camp' },
  { id: 'BIN-012', lat: 18.5170, lng: 73.8700, status: 'full',     lastEmptied: '2026-08-13 14:00', zone: 'Camp' },
];

export const mockReports = [
  {
    id: 'CMP-2026-00142',
    category: 'Overflowing bin',
    status: 'cleaned',
    severity: 'High Priority',
    location: 'Near Deccan Gymkhana, Pune',
    submittedAt: '2026-08-12 10:25',
    updatedAt: '2026-08-13 15:00',
    description: 'Large bin near the main gate is overflowing since yesterday.',
    beforePhoto: null,
    afterPhoto: null,
    rating: 4,
    timeline: [
      { step: 'submitted',        label: 'Submitted',        time: '2026-08-12 10:25', done: true },
      { step: 'verified',         label: 'Verified',         time: '2026-08-12 11:00', done: true },
      { step: 'driver_assigned',  label: 'Driver Assigned',  time: '2026-08-12 13:30', done: true },
      { step: 'cleaned',          label: 'Cleaned',          time: '2026-08-13 15:00', done: true },
    ],
  },
  {
    id: 'CMP-2026-00189',
    category: 'Missed pickup',
    status: 'driver_assigned',
    severity: 'Normal',
    location: 'Kothrud Main Road, Pune',
    submittedAt: '2026-08-14 08:00',
    updatedAt: '2026-08-14 10:15',
    description: 'Garbage van did not come today morning.',
    beforePhoto: null,
    afterPhoto: null,
    rating: null,
    timeline: [
      { step: 'submitted',       label: 'Submitted',       time: '2026-08-14 08:00', done: true },
      { step: 'verified',        label: 'Verified',        time: '2026-08-14 09:30', done: true },
      { step: 'driver_assigned', label: 'Driver Assigned', time: '2026-08-14 10:15', done: true },
      { step: 'cleaned',         label: 'Cleaned',         time: null,               done: false },
    ],
  },
  {
    id: 'CMP-2026-00201',
    category: 'Illegal dumping site',
    status: 'verified',
    severity: 'Urgent',
    location: 'Behind Swargate Bus Stand, Pune',
    submittedAt: '2026-08-14 12:00',
    updatedAt: '2026-08-14 12:45',
    description: 'Large pile of construction debris dumped illegally.',
    beforePhoto: null,
    afterPhoto: null,
    rating: null,
    timeline: [
      { step: 'submitted',       label: 'Submitted',       time: '2026-08-14 12:00', done: true },
      { step: 'verified',        label: 'Verified',        time: '2026-08-14 12:45', done: true },
      { step: 'driver_assigned', label: 'Driver Assigned', time: null,               done: false },
      { step: 'cleaned',         label: 'Cleaned',         time: null,               done: false },
    ],
  },
];

export const mockUser = {
  id: 'CIT-00291',
  name: 'Priya Sharma',
  phone: '+91 98765 43210',
  email: 'priya.sharma@email.com',
  address: '14, Tilak Road, Deccan Gymkhana',
  locality: 'Deccan, Pune',
  points: 340,
  badges: ['First Reporter', 'Eco Champion'],
  notifications: {
    sms: true,
    push: false,
    whatsapp: true,
  },
};

export const issueCategories = [
  { id: 'overflowing_bin',    label: 'Overflowing Bin',     icon: '🗑️',  severity: 'High Priority' },
  { id: 'missed_pickup',      label: 'Missed Pickup',        icon: '🚛',  severity: 'Normal' },
  { id: 'broken_bin',         label: 'Broken Bin',           icon: '🔧',  severity: 'Normal' },
  { id: 'illegal_dumping',    label: 'Illegal Dumping Site', icon: '⚠️',  severity: 'Urgent' },
];

export const wasteTypes = [
  {
    type: 'Wet Waste',
    color: '#2e7d32',
    icon: '🥬',
    examples: 'Food scraps, vegetable peels, cooked food',
    bin: 'Green Bin',
    tip: 'Can be composted into manure.',
  },
  {
    type: 'Dry Waste',
    color: '#1565c0',
    icon: '📦',
    examples: 'Paper, cardboard, plastic bottles, glass, metal',
    bin: 'Blue Bin',
    tip: 'Rinse containers before disposal.',
  },
  {
    type: 'E-Waste',
    color: '#b71c1c',
    icon: '💻',
    examples: 'Old phones, batteries, wires, electronics',
    bin: 'Red Bin / Drop Point',
    tip: 'Never mix with regular waste. Use authorised drop points.',
  },
];
