// Centralized API Base URL for Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Attempt to refresh the Supabase token using the stored refresh_token
async function tryRefreshToken() {
  const refreshToken = localStorage.getItem('civicsync_refresh_token');
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/citizen/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('civicsync_token', data.access_token);
      if (data.refresh_token) localStorage.setItem('civicsync_refresh_token', data.refresh_token);
      if (data.expires_at)   localStorage.setItem('civicsync_token_expires_at', data.expires_at);
      return data.access_token;
    }
  } catch (_) {}
  return null;
}

function handle401() {
  localStorage.removeItem('civicsync_token');
  localStorage.removeItem('civicsync_refresh_token');
  localStorage.removeItem('civicsync_token_expires_at');
  localStorage.removeItem('civicsync_user');
  window.location.href = '/login';
}

/**
 * Generic fetch wrapper for standard JSON requests with automatic JWT token injection
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('civicsync_token');

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
    if (response.status === 401) {
      const newToken = await tryRefreshToken();
      if (newToken) {
        // Retry once with new token
        const retry = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: { ...headers, Authorization: `Bearer ${newToken}` },
        });
        const retryData = await retry.json().catch(() => ({}));
        if (retry.ok) return retryData;
      }
      handle401();
      return;
    }

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
  
  // Citizen Signup - creates new citizen account
  signup: (full_name, email, password) =>
    request('/auth/citizen/signup', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password }),
    }),

  // Citizen Login - returns access_token, refresh_token, user object
  login: (email, password) =>
    request('/auth/citizen/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Google OAuth - sign in with Google credential (not implemented in backend yet)
  googleAuth: (access_token) =>
    request('/auth/citizen/google', {
      method: 'POST',
      body: JSON.stringify({ access_token }),
    }),

  // Send OTP for email verification (optional - for OTP-based signup)
  sendOtp: (email) =>
    request('/auth/citizen/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // ==========================================
  // PROFILE ENDPOINTS
  // ==========================================

  // Get current citizen profile
  getProfile: () => request('/citizen/profile'),

  // Update citizen profile  
  updateProfile: (profileData) =>
    request('/citizen/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    }),

  // ==========================================
  // CARBON CARD ENDPOINTS
  // ==========================================

  // Get citizen's carbon card (points, tier, etc.)
  getCarbonCard: () => request('/carbon-points/card'),

  // Get carbon points history
  getCarbonHistory: () => request('/carbon-points/history'),

  // ==========================================
  // COMPLAINT / GRIEVANCE ENDPOINTS
  // ==========================================

  /**
   * Background image verification endpoint (Checks validity & EXIF without uploading to Cloudinary)
   * @param {FormData} formData - Contains 'image' (file)
   */
  verifyImage: async (formData) => {
    const token = localStorage.getItem('civicsync_token');

    const response = await fetch(`${API_BASE_URL}/complaints/verify-image`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.reason || data.error || 'Failed to verify image');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  },

  /**
   * Submit complaint with image and details via FormData (Uploads image to Cloudinary and saves database record)
   * @param {FormData} formData - Contains 'image' (file), 'description', 'category', 'latitude', 'longitude', etc.
   */
  submitComplaint: async (formData) => {
    const token = localStorage.getItem('civicsync_token');

    let response = await fetch(`${API_BASE_URL}/complaints`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });

    // Auto-refresh on 401 and retry once
    if (response.status === 401) {
      const newToken = await tryRefreshToken();
      if (newToken) {
        response = await fetch(`${API_BASE_URL}/complaints`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${newToken}` },
          body: formData,
        });
      } else {
        handle401();
        return;
      }
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || data.reason || 'Failed to submit complaint');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  },

  // Get citizen's own complaints
  getMyComplaints: () => request('/complaints/my-complaints'),

  // Get complaint timeline/history
  getComplaintTimeline: (id) => request(`/complaints/${id}/timeline`),

  // Get all complaints (admin only)
  getAllComplaintsAdmin: () => request('/complaints/admin/all'),

  // ==========================================
  // LIVE TRACKING & FLEET ENDPOINTS
  // ==========================================
  
  // Get assigned drivers for tracking
  getAssignedDriversTracking: () => request('/tracking/assigned-drivers'),

  // Get all vehicles (for live tracking map)
  getVehicles: () => request('/vehicles'),

  // ==========================================
  // DEAD ANIMAL ALERT ENDPOINTS
  // ==========================================

  // Get citizen's own dead animal complaints
  getMyDeadAnimalReports: () => request('/dead-animal-reports/me'),

  // ==========================================
  // CARBON POINTS REDEMPTION ENDPOINTS
  // ==========================================

  externalVerify: (qrPayload) =>
    request('/carbon-points/external-verify', {
      method: 'POST',
      body: JSON.stringify({ qr_payload: qrPayload }),
    }),

  externalVerifyPayload: (payload) =>
    request('/carbon-points/external-verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  claimBenefit: (claimData) =>
    request('/carbon-points/claim-benefit', {
      method: 'POST',
      body: JSON.stringify(claimData),
    }),

  externalClaimDiscount: (claimData) =>
    request('/carbon-points/claim-benefit', {
      method: 'POST',
      body: JSON.stringify(claimData),
    }),

  lockTaxWallet: (points) =>
    request('/carbon-points/wallet/lock', {
      method: 'POST',
      body: JSON.stringify({ points }),
    }),

  releaseTaxWallet: (points) =>
    request('/carbon-points/wallet/release', {
      method: 'POST',
      body: JSON.stringify({ points }),
    }),

  getMunicipalRewardSummary: () => request('/carbon-points/rewards/summary'),

  simulateMunicipalTaxRebate: (billAmount, billType, annualGreenScore) =>
    request('/carbon-points/rewards/tax-simulate', {
      method: 'POST',
      body: JSON.stringify({
        bill_amount: billAmount,
        bill_type: billType,
        annual_green_score: annualGreenScore,
      }),
    }),

  redeemTransportCoupon: (couponValue) =>
    request('/carbon-points/rewards/transport/redeem', {
      method: 'POST',
      body: JSON.stringify({ coupon_value: couponValue }),
    }),

  redeemEcoBazaarCoupon: (couponValue) =>
    request('/carbon-points/rewards/ecobazaar/redeem', {
      method: 'POST',
      body: JSON.stringify({ coupon_value: couponValue }),
    }),
};

export const verifyImage = api.verifyImage;
export const submitComplaint = api.submitComplaint;
export const getAssignedDriversTracking = api.getAssignedDriversTracking;