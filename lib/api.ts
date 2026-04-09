// API utility for backend communication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Get the backend server URL (without /api)
const BACKEND_URL = API_BASE_URL.replace('/api', '');

/**
 * Get the full URL for an uploaded file (avatar, document, etc.)
 * Handles relative paths from the database and returns full URLs
 */
export function getUploadUrl(path: string | null | undefined): string {
  if (!path) return '/placeholder.svg';
  // If it's already a full URL or data URL, return as-is
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  // If it's a relative path starting with /uploads, prefix with backend URL
  if (path.startsWith('/uploads')) return `${BACKEND_URL}${path}`;
  // For other paths, return as-is (might be a local placeholder)
  return path;
}

/**
 * Token Management
 * 
 * We use sessionStorage instead of localStorage for authentication tokens to support
 * multiple tabs with different user roles simultaneously. sessionStorage is tab-specific,
 * so each tab can maintain its own authentication state independently.
 * 
 * This allows users to:
 * - Open one tab as a student and another tab as a supervisor/admin
 * - Switch between roles without affecting other open tabs
 * - Avoid token conflicts when using multiple accounts
 */

// Migrate token from localStorage to sessionStorage (one-time migration for existing users)
if (typeof window !== 'undefined') {
  const oldToken = localStorage.getItem('token');
  if (oldToken && !sessionStorage.getItem('token')) {
    sessionStorage.setItem('token', oldToken);
    // Optionally remove from localStorage after migration
    // localStorage.removeItem('token');
  }
}

// Get auth token from sessionStorage (tab-specific to allow multiple tabs with different roles)
function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('token');
  }
  return null;
}

// Set auth token
export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('token', token);
  }
}

// Remove auth token
export function removeToken(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('token');
  }
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Validate API_BASE_URL
  if (!API_BASE_URL) {
    throw new Error('API_BASE_URL is not configured. Please set NEXT_PUBLIC_API_URL environment variable.');
  }

  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      // Disable caching to always get fresh data
      cache: 'no-store',
      // Add signal timeout to prevent hanging requests
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
  } catch (error: any) {
    // Handle network errors gracefully
    if (error.name === 'AbortError' || error.message === 'Failed to fetch' || error.name === 'TypeError') {
      // Create a custom error that can be caught and handled by calling code
      const connectionError: any = new Error(`Backend server not available at ${API_BASE_URL}`);
      connectionError.name = 'ConnectionError';
      connectionError.isConnectionError = true; // Flag for easy identification
      throw connectionError;
    }
    throw error;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    
    // Use the specific error message from the backend
    const errorMessage = error.error || error.message || 'Request failed';
    
    // Handle specific error cases
    if (response.status === 401) {
      // Check if token has expired
      if (errorMessage.toLowerCase().includes('token expired') || errorMessage.toLowerCase().includes('expired')) {
        // Clear the expired token
        removeToken();
        
        // Only redirect if we're in the browser and not already on the login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && window.location.pathname !== '/') {
          // Redirect to login page
          window.location.href = '/';
        }
        
        // Create a custom error that can be handled gracefully by calling code
        const expiredError: any = new Error('Token expired. Please log in again.');
        expiredError.name = 'TokenExpiredError';
        expiredError.isTokenExpired = true;
        throw expiredError;
      }
      
      // Check if it's a "No token provided" error - this is expected for unauthenticated requests
      // Don't throw error for missing token on public endpoints
      if (errorMessage.toLowerCase().includes('no token')) {
        // For endpoints that require auth, still throw the error
        // But we'll handle this more gracefully in the calling code
        throw new Error(errorMessage);
      } else {
        // Use the specific error message from backend (Email not found, Password incorrect, Role incorrect)
        throw new Error(errorMessage);
      }
    } else if (response.status === 403) {
      throw new Error(errorMessage || 'Your account is not active. Please contact an administrator.');
    } else if (response.status === 404) {
      // Create a custom error that can be handled gracefully
      const notFoundError: any = new Error(errorMessage || 'User not found. Please register first.');
      notFoundError.name = 'NotFoundError';
      notFoundError.status = 404;
      throw notFoundError;
    } else if (response.status === 500) {
      throw new Error(errorMessage || 'Server error. Please try again later.');
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string, role: string) => {
    const data = await apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  register: async (userData: {
    email: string;
    password: string;
    name: string;
    role: string;
    phone?: string;
    program?: string;
    department?: string;
  }) => {
    const data = await apiRequest<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  getMe: () => apiRequest<any>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  forgotPassword: (email: string) =>
    apiRequest<{ message: string; code?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyResetCode: (email: string, code: string) =>
    apiRequest<{ message: string; verified: boolean }>('/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    }),

  verifyEmail: (token: string) =>
    apiRequest<{ message: string; verified: boolean }>(`/auth/verify-email?token=${token}`, {
      method: 'GET',
    }),

  resendVerification: (email: string) =>
    apiRequest<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

// Meetings API
export const meetingsAPI = {
  getAll: (params?: { student_id?: number; supervisor_id?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.student_id) query.append('student_id', params.student_id.toString());
    if (params?.supervisor_id) query.append('supervisor_id', params.supervisor_id.toString());
    if (params?.status) query.append('status', params.status);
    return apiRequest<{ meetings: any[] }>(`/meetings?${query.toString()}`);
  },

  getById: (id: number) => apiRequest<{ meeting: any }>(`/meetings/${id}`),

  create: (meetingData: {
    student_id?: number;
    supervisor_id?: number;
    title: string;
    date: string;
    time: string;
    duration: number;
    type: string;
    location?: string;
    meeting_link?: string;
    agenda?: string;
  }) =>
    apiRequest<{ message: string; meeting: { id: number } }>('/meetings', {
      method: 'POST',
      body: JSON.stringify(meetingData),
    }),

  update: (id: number, meetingData: any) =>
    apiRequest(`/meetings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(meetingData),
    }),

  delete: (id: number) =>
    apiRequest(`/meetings/${id}`, {
      method: 'DELETE',
    }),
};

// Documents API
export const documentsAPI = {
  getAll: (params?: { student_id?: number; supervisor_id?: number; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.student_id) query.append('student_id', params.student_id.toString());
    if (params?.supervisor_id) query.append('supervisor_id', params.supervisor_id.toString());
    if (params?.type) query.append('type', params.type);
    return apiRequest<{ documents: any[] }>(`/documents?${query.toString()}`);
  },

  getById: (id: number) => apiRequest<{ document: any }>(`/documents/${id}`),

  upload: async (formData: FormData) => {
    const token = getToken();
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Upload timeout. The file may be too large or the server is not responding. Please try again.');
      }
      throw error;
    }
  },

  download: async (id: number, fileName?: string) => {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `document-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  update: (id: number, data: any) =>
    apiRequest(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/documents/${id}`, {
      method: 'DELETE',
    }),

  addFeedback: (id: number, feedback: string) => {
    console.log('API: addFeedback called with:', { id, feedbackLength: feedback.length });
    return apiRequest(`/documents/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });
  },

  getFeedback: (id: number) =>
    apiRequest<{ reviews: any[] }>(`/documents/${id}/feedback`),

  approve: (id: number) =>
    apiRequest(`/documents/${id}/approve`, {
      method: 'POST',
    }),
};

// Progress API
export const progressAPI = {
  getMilestones: (studentId: number) =>
    apiRequest<{ milestones: any[] }>(`/progress/milestones/${studentId}`),

  createMilestone: (data: {
    student_id: number;
    name: string;
    description?: string;
    deliverables?: string;
    due_date?: string;
    progress?: number;
  }) =>
    apiRequest('/progress/milestones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMilestone: (id: number, data: any) =>
    apiRequest(`/progress/milestones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteMilestone: (id: number) =>
    apiRequest(`/progress/milestones/${id}`, {
      method: 'DELETE',
    }),

  getProgressLogs: (studentId: number) =>
    apiRequest<{ logs: any[] }>(`/progress/logs/${studentId}`),

  createProgressLog: (data: {
    student_id: number;
    title: string;
    category?: string;
    description?: string;
  }) =>
    apiRequest('/progress/logs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getWeeklySubmissions: (studentId: number) =>
    apiRequest<{ submissions: any[] }>(`/progress/weekly/${studentId}`),

  createWeeklySubmission: (data: {
    student_id: number;
    week_number: number;
    title?: string;
    description?: string;
    student_comments?: string;
    file_path?: string | null;
    file_name?: string | null;
  }) =>
    apiRequest('/progress/weekly', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteWeeklySubmission: (studentId: number, weekNumber: number) =>
    apiRequest(`/progress/weekly/${studentId}/${weekNumber}`, {
      method: 'DELETE',
    }),

  getWeeklyTasks: (studentId: number) =>
    apiRequest<{ tasks: any[] }>(`/progress/tasks/${studentId}`),

  createWeeklyTask: (data: {
    student_id: number;
    week_number: number;
    title: string;
    description?: string;
    due_date?: string;
    upload_date?: string;
  }) =>
    apiRequest<{ message: string; task: any }>('/progress/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteWeeklyTask: (studentId: number, weekNumber: number) =>
    apiRequest(`/progress/tasks/${studentId}/${weekNumber}`, {
      method: 'DELETE',
    }),
};

// Logbook API
export const logbookAPI = {
  get: (studentId: number) =>
    apiRequest<{ logbook: any }>(`/logbook/${studentId}`),

  upload: async (studentId: number, formData: FormData) => {
    const token = getToken();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    try {
      const response = await fetch(`${API_BASE_URL}/logbook/${studentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Upload timeout. The file may be too large or the server is not responding. Please try again.');
      }
      throw error;
    }
  },

  download: async (studentId: number, fileName?: string) => {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/logbook/${studentId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download logbook');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `logbook-${studentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  getHistory: (studentId: number) =>
    apiRequest<{ history: any[] }>(`/logbook/${studentId}/history`),
};

// Students API
export const studentsAPI = {
  getAll: (params?: { supervisor_id?: number; search?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.supervisor_id) query.append('supervisor_id', params.supervisor_id.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    return apiRequest<{ students: any[] }>(`/students?${query.toString()}`);
  },

  getById: (id: number) => apiRequest<{ student: any }>(`/students/${id}`),

  update: (id: number, data: any) =>
    apiRequest(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  assignSupervisor: (id: number, supervisor_id: number) =>
    apiRequest<{ message: string }>(`/students/${id}/assign-supervisor`, {
      method: 'POST',
      body: JSON.stringify({ supervisor_id }),
    }),

  removeSupervisor: (id: number) =>
    apiRequest<{ message: string }>(`/students/${id}/remove-supervisor`, {
      method: 'POST',
    }),

  changeSupervisor: (id: number, supervisor_id: number) =>
    apiRequest<{ message: string }>(`/students/${id}/change-supervisor`, {
      method: 'POST',
      body: JSON.stringify({ supervisor_id }),
    }),
};

// Notifications API
export const notificationsAPI = {
  getAll: (unreadOnly?: boolean) => {
    const query = unreadOnly ? '?unread_only=true' : '';
    return apiRequest<{ notifications: any[]; unreadCount: number }>(`/notifications${query}`);
  },

  create: (data: {
    user_id: number;
    title: string;
    message: string;
    type?: string;
    icon?: string;
    link?: string;
  }) =>
    apiRequest('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markAsRead: (id: number) =>
    apiRequest(`/notifications/${id}/read`, {
      method: 'PUT',
    }),

  markAllAsRead: () =>
    apiRequest('/notifications/read-all', {
      method: 'PUT',
    }),

  delete: (id: number) =>
    apiRequest(`/notifications/${id}`, {
      method: 'DELETE',
    }),

  deleteAll: () =>
    apiRequest('/notifications', {
      method: 'DELETE',
    }),
};

// Messages API
export const messagesAPI = {
  getAll: (conversationWith?: number) => {
    const query = conversationWith ? `?conversation_with=${conversationWith}` : '';
    return apiRequest<{ messages: any[] }>(`/messages${query}`);
  },

  getConversation: (userId: number) =>
    apiRequest<{ messages: any[] }>(`/messages/conversation/${userId}`),

  send: (data: { receiver_id: number; subject?: string; content: string }) =>
    apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markAsRead: (id: number) =>
    apiRequest(`/messages/${id}/read`, {
      method: 'PUT',
    }),

  getUnreadCount: () => apiRequest<{ unreadCount: number }>('/messages/unread/count'),

  delete: (id: number) =>
    apiRequest(`/messages/${id}`, {
      method: 'DELETE',
    }),
};

// Users API
export const usersAPI = {
  getAll: (params?: { role?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.role) query.append('role', params.role);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    return apiRequest<{ users: any[] }>(`/users?${query.toString()}`);
  },

  getById: (id: number) => apiRequest<{ user: any }>(`/users/${id}`),

  update: (id: number, data: { name?: string; phone?: string; avatar?: string; email?: string }) =>
    apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: number, status: string) =>
    apiRequest(`/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  removeFromRole: (id: number, role: string) =>
    apiRequest(`/users/${id}/role`, {
      method: 'DELETE',
      body: JSON.stringify({ role }),
    }),

  addStudent: (data: { email?: string; phone?: string }) =>
    apiRequest<{ message: string; student: any }>('/users/admin/add-student', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  addSupervisor: (data: { email?: string; phone?: string }) =>
    apiRequest<{ message: string; supervisor: any }>('/users/admin/add-supervisor', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createUser: (data: {
    email: string;
    password: string;
    name: string;
    role: string;
    phone?: string;
    program?: string;
    department?: string;
    supervisor_id?: number;
  }) =>
    apiRequest<{ message: string; user: any }>('/users/admin/create-user', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadAvatar: async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_BASE_URL}/users/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload avatar');
    }

    return response.json() as Promise<{ message: string; avatar: string }>;
  },
};

// Supervisors API
export const supervisorsAPI = {
  getAll: (params?: { department?: string; search?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.department) query.append('department', params.department);
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    return apiRequest<{ supervisors: any[] }>(`/supervisors?${query.toString()}`);
  },

  getById: (id: number) => apiRequest<{ supervisor: any }>(`/supervisors/${id}`),

  update: (id: number, data: {
    department?: string;
    office?: string;
    office_hours?: string;
    research_interests?: string;
    capacity?: number;
  }) =>
    apiRequest(`/supervisors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  addStudent: (data: { email?: string; phone?: string }) =>
    apiRequest<{ message: string; student: any }>('/supervisors/add-student', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeStudent: (studentId: number) =>
    apiRequest<{ message: string }>(`/supervisors/remove-student/${studentId}`, {
      method: 'DELETE',
    }),

  createStudent: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    program?: string;
  }) =>
    apiRequest<{ message: string; student: any }>('/supervisors/create-student', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Notification Preferences API
export const notificationPreferencesAPI = {
  get: () => apiRequest<{ preferences: {
    emailNotifications: boolean;
    meetingReminders: boolean;
    progressUpdates: boolean;
    documentReviews: boolean;
    deadlineReminders: boolean;
  } }>('/notification-preferences'),

  update: (preferences: {
    emailNotifications: boolean;
    meetingReminders: boolean;
    progressUpdates: boolean;
    documentReviews: boolean;
    deadlineReminders: boolean;
  }) =>
    apiRequest<{ message: string }>('/notification-preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),
};

// Chatbot API
export const chatbotAPI = {
  sendMessage: (message: string, role: string, conversationHistory: Array<{ type: string; text: string }> = []) =>
    apiRequest<{ response: string; usage?: any }>('/chatbot', {
      method: 'POST',
      body: JSON.stringify({
        message,
        role,
        conversationHistory
      }),
    }),
};

// Announcements API
export const announcementsAPI = {
  // Get all fields/programs available for supervisor
  getFields: () =>
    apiRequest<{ fields: Array<{ field: string; studentCount: number }> }>('/announcements/fields'),

  // Create announcement for a specific field
  create: (data: {
    title: string;
    message: string;
    field: string;
  }) =>
    apiRequest<{ 
      message: string; 
      announcement: {
        id: number;
        title: string;
        message: string;
        field: string;
        recipientsCount: number;
      }
    }>('/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get announcements for student
  getStudentAnnouncements: () =>
    apiRequest<{ 
      announcements: Array<{
        id: number;
        title: string;
        message: string;
        createdAt: string;
        read: boolean;
        readAt: string | null;
        supervisorName: string;
        supervisorEmail: string;
      }>
    }>('/announcements/student'),

  // Mark announcement as read
  markAsRead: (id: number) =>
    apiRequest<{ message: string }>(`/announcements/${id}/read`, {
      method: 'PATCH',
    }),
};

