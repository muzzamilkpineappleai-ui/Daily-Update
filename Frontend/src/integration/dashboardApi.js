import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

 
const handleApiError = (error, defaultMessage) => {
  const message = error.response?.data?.message || defaultMessage;
  console.error(`${defaultMessage}:`, error);
  throw new Error(message);
};

 
export const fetchDashboardSchedule = async (branchId = null) => {
  try {
    const url = branchId
      ? `${API_BASE_URL}/dashboard?branchId=${branchId}`
      : `${API_BASE_URL}/dashboard`;
    const res = await axios.get(url);
    if (res.data.success) {
      return res.data.data;
    } else {
      throw new Error(res.data.message || 'Failed to fetch dashboard schedule');
    }
  } catch (err) {
    handleApiError(err, 'Error fetching dashboard schedule');
  }
};

 
export const fetchBranches = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/dashboard/branches`);
    if (res.data.success) {
      return res.data.data; 
    } else {
      throw new Error(res.data.message || 'Failed to fetch branches');
    }
  } catch (err) {
    handleApiError(err, 'Error fetching branches');
  }
};