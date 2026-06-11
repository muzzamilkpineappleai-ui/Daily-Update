import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const IMAGE_BASE_URL = 'http://localhost:5000';

export const getUserQR = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/users/${userId}/qr`);
    return response.data.qr_code_image || null;
  } catch (error) {
    console.error("Error fetching user QR:", error);
    return null;
  }
};


export const getDropdownOptions = async (type, params = {}) => {
  try {
    let url;
    switch (type) {
      case 'courses':
        url = `${API_URL}/courses`;
        break;
      case 'grades':
        if (!params.courseId) throw new Error('Course ID is required');
        url = `${API_URL}/courses/course/${params.courseId}/grades`;
        break;
      case 'branches':
        url = `${API_URL}/branches`;
        break;
      case 'slots':
        if (!params.branchId || !params.courseId || !params.gradeId) {
          throw new Error('branchId, courseId, and gradeId are required for slot fetching');
        }
        url = `${API_URL}/slots/available?branchId=${params.branchId}&courseId=${params.courseId}&gradeId=${params.gradeId}`;
        break;
      case 'roles':
        url = `${API_URL}/roles`;
        break;
      default:
        throw new Error(`Invalid dropdown type: ${type}`);
    }

    const response = await axios.get(url);
    const data = response.data;

    if (type === 'slots') {
      return data.map(slot => ({
        id: slot.id,
        branch_id: slot.branch_id,
        day: slot.day,
        time: `${slot.start_time || slot.st_time}-${slot.end_time}`,
      }));
    } else if (type === 'roles') {
      return data.map(role => ({
        id: role.id,
        role_name: role.role_name,
      }));
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching ${type}:`, error.message);
    throw new Error(error.response?.data?.error || `Failed to fetch ${type}`);
  }
};

export const getStudentSlots = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/users/students/${userId}/slots`);
    return response.data.map(slot => ({
      id: slot.id || Date.now(),
      day: slot.day || 'N/A',
      time: slot.st_time && slot.end_time ? `${slot.st_time}-${slot.end_time}` : 'N/A',
      branch_id: slot.branch_id || null,
      course_id: slot.course_id || null,
      grade_id: slot.grade_id || null,
      course: slot.course || 'N/A',
      grade: slot.grade || 'N/A',
    }));
  } catch (error) {
    console.error(`Error fetching slots for user ${userId}:`, error);
    return [];
  }
};

export const getStudentBranches = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/users/students/${userId}/branches`);
    return response.data.map(branch => ({
      id: branch.id || null,
      branch_name: branch.branch_name || 'N/A',
    }));
  } catch (error) {
    console.error(`Error fetching branches for user ${userId}:`, error);
    return [];
  }
};

export const resolveQRCode = async (qrData) => {
  try {
    const response = await axios.post(`${API_URL}/users/resolve-qr`, { qrData });

    const photoUrl = response.data.user.photo_url
      ? `${IMAGE_BASE_URL}${response.data.user.photo_url}`
      : null;

    return {
      ...response.data.user,
      photo_url: photoUrl,
      qr_code_image: response.data.user.qr_code_image || null,
    };
  } catch (error) {
    console.error('Error resolving QR code:', error);
    throw new Error(error.response?.data?.error || 'Failed to resolve QR code');
  }
};


export const createUser = async (data) => {
  try {
    const formData = data instanceof FormData ? data : new FormData();

    const response = await axios.post(`${API_URL}/users`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const userId = response.data.user_id;

    let grades = [], slots = [], branches = [], assignedCourses = [];

    const parsedUser = JSON.parse(formData.get('user'));

    if (parsedUser.role_name === 'student') {
      const gradesResponse = await axios.get(`${API_URL}/courses/student/${userId}/grades`);
      grades = gradesResponse.data;

      [slots, branches] = await Promise.all([
        getStudentSlots(userId),
        getStudentBranches(userId),
      ]);

      const coursesResponse = await axios.get(`${API_URL}/courses`);
      const courseMap = new Map(coursesResponse.data.map(c => [c.id, c.name]));

      assignedCourses = grades.map(grade => ({
        id: Date.now() + Math.random(),
        course: courseMap.get(grade.Grade?.Course?.id) || 'N/A',
        grade: grade.Grade?.grade_name || 'N/A',
        course_id: grade.Grade?.Course?.id,
        grade_id: grade.Grade?.id,
      }));
    }

    const photoUrl = response.data.photo_url
      ? `${IMAGE_BASE_URL}${response.data.photo_url}`
      : null;

    return {
      ...response.data,
      photo_url: photoUrl,
      id_code: response.data.id_code || null,
      qr_code_image: response.data.qr_code_image || null, 
      assignedCourses,
      schedules: slots,
      branch: branches[0]?.branch_name || 'N/A',
      course: assignedCourses.map(c => c.course).join(', ') || 'N/A',
      grade: assignedCourses.map(c => c.grade).join(', ') || 'N/A',
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error(error.response?.data?.error || 'Failed to create user');
  }
};

export const updateUser = async (userId, data) => {
  try {
    const formData = data instanceof FormData ? data : new FormData();

    const userDetails = JSON.parse(formData.get('user') || '{}');
    const additionalDetails = JSON.parse(formData.get('additional_details') || '{}');

    const response = await axios.patch(`${API_URL}/users/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    let grades = [], slots = [], branches = [], assignedCourses = [];

    if (userDetails.role_name === 'student') {
      const gradesResponse = await axios.get(`${API_URL}/courses/student/${userId}/grades`);
      grades = gradesResponse.data;

      [slots, branches] = await Promise.all([
        getStudentSlots(userId),
        getStudentBranches(userId),
      ]);

      const coursesResponse = await axios.get(`${API_URL}/courses`);
      const courseMap = new Map(coursesResponse.data.map(c => [c.id, c.name]));

      assignedCourses = grades.map(grade => ({
        id: Date.now() + Math.random(),
        course: courseMap.get(grade.Grade?.Course?.id) || 'N/A',
        grade: grade.Grade?.grade_name || 'N/A',
        course_id: grade.Grade?.Course?.id,
        grade_id: grade.Grade?.id,
      }));
    }

    const photoUrl = response.data.photo_url
      ? `${IMAGE_BASE_URL}${response.data.photo_url}`
      : userDetails.photo_url || null;

    return {
      ...response.data,
      user_id: userId,
      ...userDetails,
      ...additionalDetails,
      photo_url: photoUrl,
      id_code: response.data.id_code || null,
      qr_code_image: response.data.qr_code_image || null, 
      assignedCourses,
      schedules: slots,
      branch: branches[0]?.branch_name || 'N/A',
      course: assignedCourses.map(c => c.course).join(', ') || 'N/A',
      grade: assignedCourses.map(c => c.grade).join(', ') || 'N/A',
    };
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error(error.response?.data?.error || 'Failed to update user');
  }
};

export const getAllUsers = async (page = 1, limit = 9, role = null) => {
  try {
    // Build URL with pagination + role filter
    let url = `${API_URL}/users?page=${page}&limit=${limit}`;
    if (role) url += `&role=${role}`;

    // Fetch paginated users
    const response = await axios.get(url);

    if (!response.data.success) {
      throw new Error("Failed to load users");
    }

    const rawUsers = response.data.data;        // paginated user list
    const pagination = response.data.pagination; // page info

    // Fetch all courses (used for mapping)
    const coursesResponse = await axios.get(`${API_URL}/courses`);
    const courseMap = new Map(
      coursesResponse.data.map(c => [c.id, (c.name || "N/A").trim()])
    );

    // Enhance user data
    const users = await Promise.all(
      rawUsers.map(async (user) => {
        try {
          let grades = [], slots = [], branches = [], assignedCourses = [];

          // --- Student Enhancements ---
          if (user.role_name === "student") {
            const gradesResponse = await axios.get(
              `${API_URL}/courses/student/${user.id}/grades`
            );
            grades = gradesResponse.data;

            [slots, branches] = await Promise.all([
              getStudentSlots(user.id),
              getStudentBranches(user.id),
            ]);

            assignedCourses = grades.map((grade) => ({
              id: Date.now() + Math.random(),
              course:
                courseMap.get(grade.Grade?.Course?.id) || "N/A",
              grade: grade.Grade?.grade_name || "N/A",
              course_id: grade.Grade?.Course?.id,
              grade_id: grade.Grade?.id,
            }));
          }

          // Profile photo
          let photoUrl = null;
          if (user.photo_url) {
            photoUrl = `${IMAGE_BASE_URL}${user.photo_url}`;
          } else if (user.details?.photo_url) {
            photoUrl = `${IMAGE_BASE_URL}${user.details.photo_url}`;
          }

          return {
            ...user,
            student_no:
              user.role_name === "student"
                ? user.details?.student_no || "N/A"
                : "N/A",
            photo_url: photoUrl,
            id_code: user.id_code || null,
            qr_code_image: null,
            salutation: user.details?.salutation || null,
            ice_contact: user.details?.ice_contact || "N/A",
            phn_num: user.phn_num || "N/A",
            details: user.details || {},
            status: (user.status || "active").trim().toLowerCase(),

            course:
              user.role_name === "student"
                ? assignedCourses.map((c) => c.course).join(", ") || "N/A"
                : "N/A",

            grade:
              user.role_name === "student"
                ? assignedCourses.map((c) => c.grade).join(", ") || "N/A"
                : "N/A",

            assignedCourses,
            schedules: user.role_name === "student" ? slots : [],
            branch:
              user.role_name === "student"
                ? branches[0]?.branch_name || "N/A"
                : "N/A",
          };
        } catch (err) {
          // fallback user
          return {
            ...user,
            photo_url: null,
            id_code: user.id_code || null,
            qr_code_image: null,
            student_no: "N/A",
            course: "N/A",
            grade: "N/A",
            schedules: [],
            assignedCourses: [],
            branch: "N/A",
          };
        }
      })
    );

    return { users, pagination };

  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch users");
  }
};


export const getUserProfile = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/users/${userId}/profile`);

    let grades = [], slots = [], branches = [], assignedCourses = [];

    if (response.data.role_name === 'student') {
      const gradesResponse = await axios.get(`${API_URL}/courses/student/${userId}/grades`);
      grades = gradesResponse.data;

      [slots, branches] = await Promise.all([
        getStudentSlots(userId),
        getStudentBranches(userId),
      ]);

      const coursesResponse = await axios.get(`${API_URL}/courses`);
      const courseMap = new Map(coursesResponse.data.map(c => [c.id, c.name]));

      assignedCourses = grades.map(grade => ({
        id: Date.now() + Math.random(),
        course: courseMap.get(grade.Grade?.Course?.id) || 'N/A',
        grade: grade.Grade?.grade_name || 'N/A',
        course_id: grade.Grade?.Course?.id,
        grade_id: grade.Grade?.id,
      }));
    }

    const photoUrl = response.data.photo_url
      ? `${IMAGE_BASE_URL}${response.data.photo_url}`
      : response.data.details?.photo_url
      ? `${IMAGE_BASE_URL}${response.data.details.photo_url}`
      : null;

    return {
      ...response.data,
      student_no: response.data.role_name === 'student'
        ? (response.data.details?.student_no || 'N/A')
        : 'N/A',
      photo_url: photoUrl,
      id_code: response.data.id_code || null,
      qr_code_image: null, 
      salutation: response.data.details?.salutation || null,
      ice_contact: response.data.details?.ice_contact || 'N/A',
      details: response.data.details || {},
      status: (response.data.status || 'active').trim().toLowerCase(),
      course: assignedCourses.length > 0
        ? assignedCourses.map(c => c.course).join(', ')
        : 'N/A',
      grade: assignedCourses.length > 0
        ? assignedCourses.map(c => c.grade).join(', ')
        : 'N/A',
      assignedCourses,
      schedules: slots,
      branch: branches[0]?.branch_name || 'N/A',
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile');
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`${API_URL}/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error.message);
    throw new Error(error.response?.data?.error || 'Failed to delete user');
  }
};

export const searchUsers = async (query) => {
  try {
    const students = await getAllUsers();
    if (!query) return students;

    return students.filter(
      (student) =>
        student.name?.toLowerCase().includes(query.toLowerCase()) ||
        student.email?.toLowerCase().includes(query.toLowerCase())
    );
  } catch (error) {
    throw new Error(error.message || 'Failed to search users');
  }
};

export const filterStudents = async (filters) => {
  try {
    const url = filters.status
      ? `${API_URL}/users/students?status=${filters.status}`
      : `${API_URL}/users/students`;

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to filter students');
  }
};

export const filterStudentsByCourse = async (courseId) => {
  try {
    const url = courseId
      ? `${API_URL}/users/students?courseId=${courseId}`
      : `${API_URL}/users/students`;

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to filter students by course');
  }
};

// Check if student_no already exists
export const checkStudentNoExists = async (studentNo) => {
  try {
    const response = await axios.get(`${API_URL}/users/check-student-no/${studentNo}`);
    return response.data.exists; // assuming backend returns { exists: true/false }
  } catch (error) {
    if (error.response?.status === 404) {
      return false; // not found → available
    }
    console.error('Error checking student number:', error);
    throw error;
  }
};

export const checkEmailExists = async (email) => {
  try {
    const response = await axios.get(`${API_URL}/users/check-email`, {
      params: { email }
    });
    return response.data.exists;
  } catch (error) {
    console.error('Error checking email:', error);
    throw new Error(error.response?.data?.error || 'Failed to check email');
  }
};

// Add these two functions
export const sendVerificationCode = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/users/send-email-code`, { email });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to send verification code');
  }
};

export const verifyEmailCode = async (email, code) => {
  try {
    const response = await axios.post(`${API_URL}/users/verify-email-code`, { email, code });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Invalid or expired code');
  }
};