import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Attach token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// AUTH
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const getUsers = () => API.get('/auth/users');
export const createUser = (data) => API.post('/auth/register', data);
export const updateUser = (id, data) => API.put(`/auth/users/${id}`, data);

// INSTITUTIONS
export const getInstitutions = () => API.get('/institutions');
export const createInstitution = (data) => API.post('/institutions', data);
export const updateInstitution = (id, data) => API.put(`/institutions/${id}`, data);
export const deleteInstitution = (id) => API.delete(`/institutions/${id}`);

// CAMPUSES
export const getCampuses = (params) => API.get('/campuses', { params });
export const createCampus = (data) => API.post('/campuses', data);
export const updateCampus = (id, data) => API.put(`/campuses/${id}`, data);
export const deleteCampus = (id) => API.delete(`/campuses/${id}`);

// DEPARTMENTS
export const getDepartments = (params) => API.get('/departments', { params });
export const createDepartment = (data) => API.post('/departments', data);
export const updateDepartment = (id, data) => API.put(`/departments/${id}`, data);
export const deleteDepartment = (id) => API.delete(`/departments/${id}`);

// PROGRAMS
export const getPrograms = (params) => API.get('/programs', { params });
export const getProgram = (id) => API.get(`/programs/${id}`);
export const createProgram = (data) => API.post('/programs', data);
export const updateProgram = (id, data) => API.put(`/programs/${id}`, data);
export const deleteProgram = (id) => API.delete(`/programs/${id}`);

// ACADEMIC YEARS
export const getAcademicYears = () => API.get('/academic-years');
export const getCurrentYear = () => API.get('/academic-years/current');
export const createAcademicYear = (data) => API.post('/academic-years', data);
export const updateAcademicYear = (id, data) => API.put(`/academic-years/${id}`, data);

// SEAT MATRIX
export const getSeatMatrices = (params) => API.get('/seat-matrix', { params });
export const getSeatMatrix = (id) => API.get(`/seat-matrix/${id}`);
export const createSeatMatrix = (data) => API.post('/seat-matrix', data);
export const updateSeatMatrix = (id, data) => API.put(`/seat-matrix/${id}`, data);
export const checkSeatAvailability = (id, quota) => API.get(`/seat-matrix/${id}/availability/${quota}`);

// APPLICANTS
export const getApplicants = (params) => API.get('/applicants', { params });
export const getApplicant = (id) => API.get(`/applicants/${id}`);
export const createApplicant = (data) => API.post('/applicants', data);
export const updateApplicant = (id, data) => API.put(`/applicants/${id}`, data);
export const updateDocument = (id, docId, data) => API.patch(`/applicants/${id}/documents/${docId}`, data);
export const allocateSeat = (id, data) => API.post(`/applicants/${id}/allocate`, data);
export const markFeePaid = (id, data) => API.patch(`/applicants/${id}/fee`, data);

// ADMISSIONS
export const confirmAdmission = (id, data) => API.post(`/admissions/${id}/confirm`, data);
export const updateAdmissionStatus = (id, data) => API.patch(`/admissions/${id}/status`, data);
export const getAdmitted = (params) => API.get('/admissions/admitted', { params });

// DASHBOARD
export const getDashboard = (params) => API.get('/dashboard', { params });

export default API;
