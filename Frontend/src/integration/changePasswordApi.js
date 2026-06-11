import axios from 'axios';

export const API_BASE_URL = 'http://localhost:5000';

export const changePasswordAPI = async (currentPass, newPass) => {
  try {
    const token = localStorage.getItem("token");

    const response = await axios.post(
      `${API_BASE_URL}/api/users/change-password`,
      {
        current_password: currentPass,
        new_password: newPass,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;

  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};
