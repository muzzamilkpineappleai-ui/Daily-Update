import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

export const fetchCurrentMonthReport = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/report/current-month`);
    return response.data;
  } catch (error) {
    console.error('Error fetching current month report:', error);
    throw error;
  }
};

export const fetchStudentPaymentHistory = async (studentId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/report/student/${studentId}/history`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching payment history for student ${studentId}:`, error);
    throw error;
  }
};

export { API_BASE_URL };
