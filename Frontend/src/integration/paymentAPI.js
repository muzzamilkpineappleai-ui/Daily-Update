import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  params: {
    _t: () => Date.now(),
  },
});

const handleError = (error, customMessage) => {
  const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
  console.error(`${customMessage}:`, error);
  throw new Error(`${customMessage}: ${message}`);
};


const paymentApi = {
  async fetchAllStudents() {
    try {
      const response = await apiClient.get('/payments/students');
      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      return data.map(student => ({
        ...student,
        
      }));
    } catch (error) {
      return handleError(error, 'Failed to fetch all students');
    }
  },

  async searchStudents(query) {
    try {
      const params = {};
      if (/^[a-zA-Z0-9\-_]+$/.test(query) && !/\s/.test(query) && query.toLowerCase().startsWith('st-')) {
        params.student_no = query.trim();
      } else {
        params.name = query.trim();
      }
      const response = await apiClient.get('/payments/student/search', { params });
      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      return data.map(student => ({
        ...student,
      }));
    } catch (error) {
      return handleError(error, `Failed to search students for query "${query}"`);
    }
  },

  async searchStudentByStudentNo(student_no) {
    try {
      const response = await apiClient.get('/payments/student/search', { params: { student_no } });
      const student = Array.isArray(response.data) ? response.data[0] : response.data.data?.[0] || null;
      if (student) {
        return {
          ...student,
        };
      }
      return null;
    } catch (error) {
      return handleError(error, `Failed to search student by student_no "${student_no}"`);
    }
  },

  async fetchFeeDetails(student_details_id, months = []) {
    try {
      const monthsQuery = months.join(',');
      const response = await apiClient.get(`/payments/payment/${student_details_id}`, {
        params: months.length > 0 ? { months: monthsQuery } : {},
      });
      return response.data;
    } catch (error) {
      return handleError(error, `Failed to fetch fee details for student_details_id "${student_details_id}"`);
    }
  },

  async submitPayment(student_details_id, paymentData) {
    try {
      const response = await apiClient.post(`/payments/payment/${student_details_id}`, paymentData);
      return response.data;
    } catch (error) {
      return handleError(error, `Failed to submit payment for student_details_id "${student_details_id}"`);
    }
  },

async fetchPaymentHistory(student_details_id) {
  try {
    const response = await apiClient.get(`/payments/payment-history/${student_details_id}`);
    return {
      paidHistory: response.data.paidHistory || [],
      pendingHistory: response.data.pendingHistory || [],
      course: response.data.course || null,
      grade: response.data.grade || null,
      name: response.data.name || null
    };
  } catch (error) {
    return handleError(error, `Failed to fetch payment history for student_details_id "${student_details_id}"`);
  }
},

  async fetchPayments({ state, status } = {}) {
    try {
      const params = {};
      if (state && state !== 'State') params.state = state;
      if (status && status !== 'All') params.status = status;
      const response = await apiClient.get('/payments/searchmain', { params });
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    } catch (error) {
      if (error.response?.status === 404) {
        try {
          const params = {};
          if (state && state !== 'State') params.state = state;
          if (status && status !== 'All') params.status = status;
          const response = await apiClient.get('/payments/searchmain', { params });
          return Array.isArray(response.data) ? response.data : response.data.data || [];
        } catch (fallbackError) {
          return handleError(fallbackError, 'Failed to fetch payments from /api/searchmain');
        }
      }
      return handleError(error, 'Failed to fetch payments from /searchmain');
    }
  },

  async searchPayments({ status, search } = {}) {
    try {
      const params = {};
      if (status && status !== 'All') params.status = status.toLowerCase();
      if (search) params.search = search;
      const response = await apiClient.get('/payments/filterstatus/search', { params });
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    } catch (error) {
      return handleError(error, `Failed to search payments with status "${status}" and query "${search}"`);
    }
  },

  async fetchGrades(student_details_id) {
    try {
      const response = await apiClient.get(`schedule/master/grades`, {
        params: { student_details_id },
      });
      return response.data;
    } catch (error) {
      return handleError(error, `Failed to fetch grades for student_details_id "${student_details_id}"`);
    }
  },
};

export default paymentApi;