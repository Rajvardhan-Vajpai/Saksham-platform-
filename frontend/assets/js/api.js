/* =========================================================
   API layer for sih-imd-backend (see API_DOCUMENTATION.md in your repo).
   Default assumes the backend is running locally per its README
   (`npm run dev` → http://localhost:5000). Change API_BASE_URL if you
   deploy it elsewhere.
   ========================================================= */
const API_BASE_URL = window.API_BASE_URL || "http://localhost:5000/api";

async function apiRequest(path, { method = "GET", body, formData } = {}) {
  const headers = {};
  const token = await AuthGuard.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (formData) {
    payload = formData; // browser sets multipart boundary itself — no Content-Type header
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { method, headers, body: payload });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(json.message || json.error || `Request failed (${res.status})`);

  // Most routes wrap responses as {success, data, message}; a few legacy
  // /courses routes return raw JSON — handle both without guessing per-route.
  if (json && typeof json === "object" && "success" in json) {
    if (!json.success) throw new Error(json.message || "Request failed");
    return json.data;
  }
  return json;
}

const Api = {
  // ---- Users (Clerk handles the actual login — this just syncs/reads the app profile) ----
  syncUser: (payload) => apiRequest("/users/sync", { method: "POST", body: payload }),
  getProfile: () => apiRequest("/users/me"),
  saveProfile: (data) => apiRequest("/users/me", { method: "PUT", body: data }),
  getUserById: (id) => apiRequest(`/users/${id}`),

  // ---- Admin ----
  getDashboardStats: () => apiRequest("/admin/dashboard"),
  getAllUsers: (params = "") => apiRequest(`/admin/users${params}`),
  approveUser: (userId) => apiRequest(`/admin/users/${userId}/approve`, { method: "PUT" }),
  rejectUser: (userId) => apiRequest(`/admin/users/${userId}/reject`, { method: "PUT" }),

  // ---- Courses ----
  getCourses: () => apiRequest("/courses"),
  getCourseDetail: (courseId) => apiRequest(`/courses/${courseId}`),
  createCourse: (data) => apiRequest("/courses", { method: "POST", body: data }),
  updateCourse: (courseId, data) => apiRequest(`/courses/${courseId}`, { method: "PUT", body: data }),
  deleteCourse: (courseId) => apiRequest(`/courses/${courseId}`, { method: "DELETE" }),

  // ---- Modules (a course's video/pdf/ppt/text content — this is what
  //      backs the Trainer Library upload flow) ----
  getModules: (courseId) => apiRequest(`/courses/${courseId}/modules`),
  createModule: (courseId, data) => apiRequest(`/courses/${courseId}/modules`, { method: "POST", body: data }),
  updateModule: (moduleId, data) => apiRequest(`/modules/${moduleId}`, { method: "PUT", body: data }),
  deleteModule: (moduleId) => apiRequest(`/modules/${moduleId}`, { method: "DELETE" }),
  uploadModuleFile: (moduleId, file) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiRequest(`/modules/${moduleId}/upload`, { method: "POST", formData: fd });
  },

  // ---- Enrollment & progress ----
  enrollCourse: (courseId) => apiRequest(`/courses/${courseId}/enroll`, { method: "POST" }),
  getMyEnrollments: () => apiRequest("/users/me/courses"),
  getEnrollment: (enrollmentId) => apiRequest(`/enrollments/${enrollmentId}`),
  getCourseProgress: (courseId) => apiRequest(`/courses/${courseId}/progress`),
  markModuleComplete: (courseId, moduleId) => apiRequest(`/courses/${courseId}/progress`, { method: "PUT", body: { moduleId } }),

  // ---- Assessments ----
  createAssessment: (data) => apiRequest("/assessments", { method: "POST", body: data }),
  getAssessment: (assessmentId) => apiRequest(`/assessments/${assessmentId}`),
  updateAssessment: (assessmentId, data) => apiRequest(`/assessments/${assessmentId}`, { method: "PUT", body: data }),
  deleteAssessment: (assessmentId) => apiRequest(`/assessments/${assessmentId}`, { method: "DELETE" }),
  submitAssessment: (assessmentId, answers) => apiRequest(`/assessments/${assessmentId}/submit`, { method: "POST", body: { answers } }),
  getAssessmentResults: (assessmentId) => apiRequest(`/assessments/${assessmentId}/results`),

  // ---- Competencies ----
  getCompetencies: () => apiRequest("/competencies"),
  createCompetency: (data) => apiRequest("/competencies", { method: "POST", body: data }),
  getMyCompetencies: () => apiRequest("/users/me/competencies"),
  getMySkillGaps: () => apiRequest("/users/me/skill-gaps"),
  getUserCompetencies: (userId) => apiRequest(`/users/${userId}/competencies`),

  // ---- Trainers ----
  getTrainers: () => apiRequest("/trainers"),
  getTrainer: (trainerId) => apiRequest(`/trainers/${trainerId}`),
  getTrainerExpertise: (trainerId) => apiRequest(`/trainers/${trainerId}/expertise`),
  setMyExpertise: (data) => apiRequest("/trainers/me/expertise", { method: "POST", body: data }),

  // ---- Not yet built on the backend (see API_DOCUMENTATION.md "Not yet built") ----
  // These throw a clear error so pages fall back to sample data instead of
  // silently failing. Replace the body with a real apiRequest(...) call the
  // day each route ships.
  getCertificates: () => Promise.reject(new Error("Certificates endpoint not built yet")),
  submitFeedback: () => Promise.reject(new Error("Feedback endpoint not built yet")),
  getAnnouncements: () => Promise.reject(new Error("Homepage announcements endpoint not built yet")),
  getStats: () => Promise.reject(new Error("Homepage stats endpoint not built yet")),
  publishHomepageItem: () => Promise.reject(new Error("Homepage content endpoint not built yet")),
  getRecommendedTrainers: () => Promise.reject(new Error("AI trainer-matching endpoint not built yet")),
  getTraineePerformance: () => Promise.reject(new Error("Aggregated trainee-performance endpoint not built yet — use getAssessmentResults(assessmentId) per-assessment instead"))
};

/* Try the real API, silently fall back to mock data so every screen still
   renders — useful before the backend is running, or while endpoints above
   marked "not yet built" don't exist yet. */
async function loadWithFallback(apiCall, mockValue) {
  try {
    return await apiCall();
  } catch (e) {
    return mockValue;
  }
}
