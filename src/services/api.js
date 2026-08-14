// Centralized API Base URL for Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Generic fetch wrapper for standard JSON requests with automatic JWT token injection
 */
async function request(endpoint, options = {}) {
  // Check for admin token first, fallback to standard token
  const token = localStorage.getItem('civicsync_admin_token') || localStorage.getItem('civicsync_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.reason || data.message || 'An error occurred');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================
  
  // Citizen Sign In (Email & Password)
  login: (email, password) =>
    request('/auth/citizen/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Citizen Sign Up
  signup: (full_name, email, password) =>
    request('/auth/citizen/signup', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password }),
    }),

  // Google OAuth Authentication
  googleAuth: (idToken) =>
    request('/auth/citizen/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),

  // ==========================================
  // COMPLAINT / GRIEVANCE ENDPOINTS
  // ==========================================

  /**
   * Submit new complaint with photo upload, EXIF metadata, and Gemini AI verification
   * @param {FormData} formData - Contains 'image' (file), 'description', 'latitude', 'longitude'
   */
  submitComplaint: async (formData) => {
    const token = localStorage.getItem('civicsync_token');

    const response = await fetch(`${API_BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.error || data.reason || 'Failed to submit complaint');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  },

  // Fetch complaints submitted by logged-in citizen
  getMyComplaints: () => request('/complaints/my-complaints'),

  // Fetch all complaints (Admin View)
  getAllComplaintsAdmin: () => request('/complaints/admin/all'),

  // ==========================================
  // LIVE TRACKING & FLEET ENDPOINTS
  // ==========================================
  
  getAssignedDriversTracking: () => request('/tracking/assigned-drivers'),
};

// Also export individual helper if needed by other components
export const getAssignedDriversTracking = api.getAssignedDriversTracking;