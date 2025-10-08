export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function apiFetch(
  endpoint: string,
  method: string = "GET",
  body?: any,
  customToken?: string
) {
  const token = customToken || (typeof window !== "undefined"
    ? localStorage.getItem("token")
    : null);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Handle FormData (for file uploads)
  let finalBody: any = body;
  if (body && body instanceof FormData) {
    finalBody = body;
    delete headers["Content-Type"]; // Let browser set content-type with boundary for FormData
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: finalBody ? (finalBody instanceof FormData ? finalBody : JSON.stringify(finalBody)) : undefined,
  });

  // Handle errors gracefully
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message || data?.error || response.statusText || "API request failed";
    throw new Error(message);
  }

  return data;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Comment {
  id: number;
  content: string;
  user: User;
  parent_id?: number | null;
  chapter_id?: number | null;
  course_id?: number | null;
  created_at?: string;
  updated_at?: string;
  replies?: Comment[];
  author?: string; // Formatted as "Name (Role)"
}

export interface Course {
  id: number;
  title: string;
  description: string;
  image_url?: string | null;
  instructor_id: number;
  instructor?: User;
  status?: string;
  created_at?: string;
  updated_at?: string;
  pivot?: {
    student_id: number;
    course_id: number;
    progress_percent: string;
    created_at: string;
    updated_at: string;
  };
  chapters?: Chapter[];
  students?: User[];
  total_chapters?: number;
  total_students?: number;
  total_comments?: number;
  is_enrolled?: boolean;
}

export interface Chapter {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  order: number;
  video_url?: string | null;
  resource_url?: string | null;
  notes_pdf?: string | null;
  image?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Progress {
  id: number;
  student_id: number;
  course_id: number;
  chapter_id: number;
  is_completed: boolean;
  last_position?: number | null;
  chapter_percent: number;
  created_at?: string;
  updated_at?: string;
}

export interface CourseProgress {
  total_chapters: number;
  completed_chapters: number;
  course_percent: number;
  overall_progress: number;
  chapters_progress: Array<{
    chapter_id: number;
    chapter_title: string;
    chapter_percent: number;
    is_completed: boolean;
    last_position: number | null;
  }>;
}

export interface ProgressResponse {
  course: Course;
  progress: Progress[];
  course_progress: CourseProgress;
}

export interface Enrollment {
  student_id: number;
  course_id: number;
  progress_percent: string;
  created_at: string;
  updated_at: string;
}

export interface CourseReaction {
  id: number;
  course_id: number;
  student_id: number;
  emoji_type: string;
  student?: User;
  created_at?: string;
  updated_at?: string;
}

export interface CourseComment {
  id: number;
  course_id: number;
  user_id: number;
  content: string;
  parent_id?: number | null;
  user?: User;
  replies?: CourseComment[];
  created_at?: string;
  updated_at?: string;
  likes_count?: number;
  is_liked?: boolean; 
}

// Auth API calls
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch("/login", "POST", { email, password }),

  register: (name: string, email: string, password: string, role: string = 'student') =>
    apiFetch("/register", "POST", { name, email, password, role }),

  logout: (token?: string) =>
    apiFetch("/logout", "POST", null, token),

  getMe: (token?: string) =>
    apiFetch("/me", "GET", null, token),
};

// Course-related API calls
export const courseApi = {

  createCourse: (title: string, description?: string, image_url?: string, token?: string) => {
    const data = {
      title,
      description,
      image_url, // Send URL instead of file
    };
    return apiFetch("/courses", "POST", data, token);
  },

  // Get all courses
  getAllCourses: (params?: { per_page?: number; page?: number }, token?: string) => {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const queryString = queryParams.toString();
    return apiFetch(`/courses${queryString ? `?${queryString}` : ''}`, "GET", null, token);
  },

  // Get user's courses (role-specific)
  getMyCourses: (token?: string) =>
    apiFetch("/my-courses", "GET", null, token),

  // Get specific course details
  getCourse: (courseId: string | string[] | number | undefined, token?: string) => {
    const id = Array.isArray(courseId) ? courseId[0] : courseId;
    if (!id) throw new Error("Course ID is required");
    return apiFetch(`/courses/${id}`, "GET", null, token);
  },

  // Update course (instructor only)
  updateCourse: (courseId: number, data: { title?: string; description?: string }, token?: string) =>
    apiFetch(`/courses/${courseId}`, "PUT", data, token),

  // Delete course (instructor only)
  deleteCourse: (courseId: number, token?: string) =>
    apiFetch(`/courses/${courseId}`, "DELETE", null, token),

  // Upload course image (instructor only)
  uploadCourseImage: (courseId: number, image: File, token?: string) => {
    const formData = new FormData();
    formData.append('image', image);
    return apiFetch(`/courses/${courseId}/image`, "POST", formData, token);
  },

  // Enroll in course
  enroll: (courseId: string | string[] | number | undefined, token?: string) => {
    const id = Array.isArray(courseId) ? courseId[0] : courseId;
    if (!id) throw new Error("Course ID is required");
    return apiFetch(`/courses/${id}/enroll`, "POST", null, token);
  },

  // Unenroll from course
  unenroll: (courseId: string | string[] | number | undefined, token?: string) => {
    const id = Array.isArray(courseId) ? courseId[0] : courseId;
    if (!id) throw new Error("Course ID is required");
    return apiFetch(`/courses/${id}/unenroll`, "DELETE", null, token);
  },
};

export const instructorCourseApi = {
  // Get instructor's courses with detailed information
  getInstructorCourses: (params?: { per_page?: number; page?: number }, token?: string) => {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const queryString = queryParams.toString();
    return apiFetch(`/instructor/courses${queryString ? `?${queryString}` : ''}`, "GET", null, token);
  },

  // Get detailed course statistics
  getCourseStatistics: (courseId: number, token?: string) =>
    apiFetch(`/instructor/courses/${courseId}/statistics`, "GET", null, token),

  // Get other courses (for inspiration)
  getOtherCourses: (params?: { per_page?: number; page?: number }, token?: string) => {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const queryString = queryParams.toString();
    return apiFetch(`/instructor/other-courses${queryString ? `?${queryString}` : ''}`, "GET", null, token);
  },
};

// Course Reactions API calls
export const courseReactionApi = {
  // Toggle reaction on course
  toggleReaction: (courseId: number, emojiType: string, token?: string) =>
    apiFetch(`/courses/${courseId}/react`, "POST", { emoji_type: emojiType }, token),

  // Get reactions for course
  getReactions: (courseId: number, token?: string) =>
    apiFetch(`/courses/${courseId}/reactions`, "GET", null, token),
};

// Course Comments API calls
export const courseCommentApi = {
  // Get comments for course
  getComments: (courseId: string | string[] | number | undefined, token?: string) => {
    const id = Array.isArray(courseId) ? courseId[0] : courseId;
    if (!id) throw new Error("Course ID is required");
    return apiFetch(`/courses/${id}/comments`, "GET", null, token);
  },

  // Add comment to course
  addComment: (courseId: string | string[] | number | undefined, content: string, parentId?: number, token?: string) => {
    const id = Array.isArray(courseId) ? courseId[0] : courseId;
    if (!id) throw new Error("Course ID is required");
    return apiFetch(`/courses/${id}/comments`, "POST", { content, parent_id: parentId }, token);
  },

  // Like/unlike course comment
  toggleLike: (commentId: number, token?: string) =>
    apiFetch(`/course-comments/${commentId}/like`, "POST", null, token),

  deleteComment: (commentId: number, token?: string) =>
    apiFetch(`/course-comments/${commentId}`, "DELETE", null, token),
};

// Chapter-related API calls
export const chapterApi = {
  // Create chapter (instructor only)
  createChapter: (courseId: number, data: {
    title: string;
    description?: string;
    order?: number;
    image?: string; // URL string
    video_url?: string;
    resource_url?: string; // Add resource_url
  }, token?: string) => {
    return apiFetch(`/courses/${courseId}/chapters`, "POST", data, token);
  },

  // Update chapter (instructor only)
  updateChapter: (chapterId: number, data: {
    title?: string;
    description?: string;
    order?: number;
    video_url?: string;
    image?: File;
  }, token?: string) => {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.order !== undefined) formData.append('order', data.order.toString());
    if (data.video_url) formData.append('video_url', data.video_url);
    if (data.image) formData.append('image', data.image);
    
    return apiFetch(`/chapters/${chapterId}`, "PUT", formData, token);
  },

  // Delete chapter (instructor only)
  deleteChapter: (chapterId: number, token?: string) =>
    apiFetch(`/chapters/${chapterId}`, "DELETE", null, token),

  // Reorder chapters (instructor only)
  reorderChapters: (chapterId: number, newOrder: number, token?: string) =>
    apiFetch(`/chapters/${chapterId}/reorder`, "POST", { order: newOrder }, token),

  // Upload chapter resource (instructor only)
  uploadResource: (chapterId: number, resource: File, token?: string) => {
    const formData = new FormData();
    formData.append('resource', resource);
    return apiFetch(`/chapters/${chapterId}/resource`, "POST", formData, token);
  },

  // Save video URL (instructor only)
  saveVideo: (chapterId: number, videoUrl: string, token?: string) =>
    apiFetch(`/chapters/${chapterId}/video`, "POST", { video_url: videoUrl }, token),

  // Get video URL
  getVideo: (chapterId: number, token?: string) =>
    apiFetch(`/chapters/${chapterId}/video`, "GET", null, token),
};

// Progress-related API calls
// Progress-related API calls
export const progressApi = {
  // Update progress
  updateProgress: (courseId: number, chapterId: number, isCompleted: boolean, lastPosition?: number, token?: string) =>
    apiFetch("/progress", "POST", {
      course_id: courseId,
      chapter_id: chapterId,
      is_completed: isCompleted,
      last_position: lastPosition,
    }, token),

  // Get progress for course
  getProgress: (courseId: string | string[] | number | undefined, token?: string) => {
    const id = Array.isArray(courseId) ? courseId[0] : courseId;
    if (!id) throw new Error("Course ID is required");
    return apiFetch(`/progress/${id}`, "GET", null, token);
  },

  // Auto-save progress (for automatic position tracking)
  autoSaveProgress: (courseId: number, chapterId: number, lastPosition: number, token?: string) =>
    apiFetch("/progress", "POST", {
      course_id: courseId,
      chapter_id: chapterId,
      is_completed: false, // Auto-save doesn't mark as completed
      last_position: lastPosition,
    }, token),
};

// Chapter Comment-related API calls
export const chapterCommentApi = {
  // Get comments for chapter
  getComments: (chapterId: string | string[] | number | undefined, token?: string) => {
    const id = Array.isArray(chapterId) ? chapterId[0] : chapterId;
    if (!id) throw new Error("Chapter ID is required");
    return apiFetch(`/chapters/${id}/comments`, "GET", null, token);
  },

  // Add comment to chapter
  addComment: (chapterId: string | string[] | number | undefined, content: string, parentId?: number, token?: string) => {
    const id = Array.isArray(chapterId) ? chapterId[0] : chapterId;
    if (!id) throw new Error("Chapter ID is required");
    return apiFetch(`/chapters/${id}/comments`, "POST", { content, parent_id: parentId }, token);
  },

  // Reply to comment
  replyToComment: (commentId: number, content: string, token?: string) =>
    apiFetch(`/comments/${commentId}/reply`, "POST", { content }, token),

  // Delete comment
  deleteComment: (commentId: number, token?: string) =>
    apiFetch(`/comments/${commentId}/delete`, "DELETE", null, token),

  // Like/unlike comment
  toggleLike: (commentId: number, token?: string) =>
    apiFetch(`/comments/${commentId}/like`, "POST", null, token),
};

// Note-related API calls
export const noteApi = {
  // Save video note
  saveNote: (courseId: number, chapterId: number, content: string, timestamp: number, token?: string) =>
    apiFetch("/notes/video", "POST", {
      course_id: courseId,
      chapter_id: chapterId,
      content,
      timestamp
    }, token),
};

// Student Course API calls
export const studentCourseApi = {
  // Check enrollment status for a specific course
  checkEnrollment: (courseId: string | string[] | number | undefined, token?: string) => {
    const id = Array.isArray(courseId) ? courseId[0] : courseId;
    if (!id) throw new Error("Course ID is required");
    return apiFetch(`/student/courses/check-enrollment/${id}`, "GET", null, token);
  },

  // Get course details with enrollment status
  getCourseWithEnrollment: (courseId: string | string[] | number | undefined, token?: string) => {
    const id = Array.isArray(courseId) ? courseId[0] : courseId;
    if (!id) throw new Error("Course ID is required");
    return apiFetch(`/student/courses/${id}`, "GET", null, token);
  },

  // Get all courses with enrollment status
  getCoursesWithEnrollment: (params?: { per_page?: number; page?: number }, token?: string) => {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const queryString = queryParams.toString();
    return apiFetch(`/student/courses${queryString ? `?${queryString}` : ''}`, "GET", null, token);
  },
};

// Admin API calls
export const adminApi = {
  // User management
  listUsers: (token?: string) =>
    apiFetch("/admin/users", "GET", null, token),

  updateUserRole: (userId: number, role: string, token?: string) =>
    apiFetch(`/admin/users/${userId}/role`, "PUT", { role }, token),

  deleteUser: (userId: number, token?: string) =>
    apiFetch(`/admin/users/${userId}`, "DELETE", null, token),

  // Course management
  listCourses: (token?: string) =>
    apiFetch("/admin/courses", "GET", null, token),

  approveCourse: (courseId: number, token?: string) =>
    apiFetch(`/admin/courses/${courseId}/approve`, "PUT", null, token),

  rejectCourse: (courseId: number, token?: string) =>
    apiFetch(`/admin/courses/${courseId}/reject`, "PUT", null, token),

  deleteCourse: (courseId: number, token?: string) =>
    apiFetch(`/admin/courses/${courseId}`, "DELETE", null, token),
};

export const uploadApi = {
  uploadCourseImage: (image: File, token?: string) => {
    const formData = new FormData();
    formData.append('image', image);
    return apiFetch('/upload/course-image', 'POST', formData, token);
  },

  uploadChapterImage: (image: File, token?: string) => {
    const formData = new FormData();
    formData.append('image', image);
    return apiFetch('/upload/chapter-image', 'POST', formData, token);
  },

  uploadResource: (resource: File, token?: string) => {
    const formData = new FormData();
    formData.append('resource', resource);
    return apiFetch('/upload/resource', 'POST', formData, token);
  },
};

// Utility function for health check
export const healthCheck = () =>
  apiFetch("/health", "GET");