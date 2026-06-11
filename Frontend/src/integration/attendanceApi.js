import axios from 'axios';

const API_URL = 'http://localhost:5000/api/attendance';
 

export const fetchAttendance = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
};

export const markAttendance = async (userId) => {
  try {
    const response = await axios.post(`${API_URL}/mark`, {
      user_id: userId,
    });
    return response.data;
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw new Error(error.response?.data?.error || 'Failed to mark attendance');
  }
};

export const markAbsentStudents = async (slotId, entryDate) => {
  try {
    const response = await axios.post(`${API_URL}/mark-absent`, {
      slot_id: slotId,
      entry_date: entryDate,
    });
    return response.data;
  } catch (error) {
    console.error('Error marking absent students:', error);
    throw error;
  }
};

export const resolveQRCode = async (qrData) => {
  try {
    console.log('Scanning QR code with data:', qrData);
    const response = await axios.post(`${API_URL}/resolve-qr`, {
      qrData,
    });
    console.log('API response:', response.data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to resolve QR code');
    }
    return response.data;
  } catch (error) {
    console.error('Error resolving QR code:', error);
    throw error;
  }
};