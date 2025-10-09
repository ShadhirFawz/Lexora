"use client";

import { useEffect, useState } from "react";
import { instructorCourseApi, Course, courseApi, courseReactionApi, courseCommentApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import PendingRejectedCoursesModal from "@/components/PendingRejectedCoursesModal";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PlusIcon, 
  BookOpenIcon, 
  UsersIcon, 
  ChartBarIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  StarIcon
} from "@heroicons/react/24/outline";
import { FaBookOpen, FaUsers, FaListAlt, FaStar } from "react-icons/fa";

interface InstructorCourse extends Course {
  total_students?: number;
  total_chapters?: number;
  total_comments?: number;
  total_reactions?: number;
  status: 'approved' | 'pending' | 'rejected' | 'draft';
  students?: any[];
  chapters?: any[];
}

interface CoursesResponse {
  data: InstructorCourse[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export default function InstructorCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    variant: "danger"
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      console.log('Loading instructor courses...');
      
      // Use the correct endpoint for instructor courses
      const response: CoursesResponse = await instructorCourseApi.getInstructorCourses();
      console.log('Courses response:', response);
      
      // Extract data from the correct response structure
      const coursesData = response.data || response || [];
      console.log('Courses data:', coursesData);

      const coursesWithComments = await Promise.all(
        coursesData.map(async (course: InstructorCourse) => {
          try {
            const comments = await courseCommentApi.getComments(course.id);
            // Count only main comments (parent_id is null)
            const mainComments = Array.isArray(comments) 
              ? comments.filter(comment => !comment.parent_id).length 
              : 0;
            return {
              ...course,
              total_comments: mainComments
            };
          } catch (error) {
            console.error(`Failed to fetch comments for course ${course.id}:`, error);
            return { ...course, total_comments: 0 };
          }
        })
      );
      
      const approvedCourses = coursesWithComments.filter(course => course.status === 'approved');

      setCourses(approvedCourses);
    } catch (err: any) {
      console.error('Error loading courses:', err);
      setError(err.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = (courseId: number) => {
    showConfirmation(
      "Delete Course",
      "Are you sure you want to delete this course? This action cannot be undone. All course data including chapters, student progress, and comments will be permanently lost.",
      async () => {
        try {
          setDeletingId(courseId);
          await courseApi.deleteCourse(courseId);
          setCourses(courses.filter(course => course.id !== courseId));
        } catch (err: any) {
          console.error("Failed to delete course:", err);
          alert(err.message || "Failed to delete course");
        } finally {
          setDeletingId(null);
        }
      },
      "danger"
    );
  };

  const showConfirmation = (title: string, message: string, onConfirm: () => void, variant: "danger" | "warning" | "info" = "danger") => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      },
      variant
    });
  };

  const handleEditCourse = (courseId: number) => {
    router.push(`/dashboard/instructor/courses/${courseId}/edit`);
  };

  const handleViewCourse = (courseId: number) => {
    router.push(`/dashboard/instructor/courses/${courseId}`);
  };

  const handleViewAsStudent = (courseId: number) => {
    router.push(`/dashboard/student/courses/${courseId}`);
  };

  const getStatusColor = (status: string) => {
    const statusConfig = {
      approved: { color: "bg-green-100 text-green-800", text: "Approved" },
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Pending" },
      rejected: { color: "bg-red-100 text-red-800", text: "Rejected" },
      draft: { color: "bg-gray-100 text-gray-800", text: "Draft" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return '✅';
      case 'pending': return '⏳';
      case 'rejected': return '❌';
      case 'draft': return '📝';
      default: return '📝';
    }
  };

  // Helper function to get student count
  const getStudentCount = (course: InstructorCourse) => {
    return course.total_students !== undefined ? course.total_students : (course.students?.length || 0);
  };

  // Helper function to get chapter count
  const getChapterCount = (course: InstructorCourse) => {
    return course.total_chapters !== undefined ? course.total_chapters : (course.chapters?.length || 0);
  };

  // Helper function to get review count
  const getReviewCount = (course: InstructorCourse) => {
    return course.total_comments || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded w-64"></div>
                <div className="h-4 bg-gray-200 rounded w-96"></div>
              </div>
              <div className="h-12 bg-gray-200 rounded-xl w-48"></div>
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(n => (
                <div key={n} className="bg-white rounded-xl p-6 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>

            {/* Courses Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="bg-white rounded-2xl p-6 space-y-4">
                  <div className="h-40 bg-gray-200 rounded-xl"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Courses</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={loadCourses}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Courses
            </h1>
            <p className="text-gray-600">
              Manage and track your teaching materials and student progress
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowPendingModal(true)}
              className="flex items-center gap-2 bg-yellow-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-yellow-700 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <EyeIcon className="w-5 h-5" />
              View Pending/Rejected
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/dashboard/instructor/courses/create')}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <PlusIcon className="w-5 h-5" />
              Create New Course
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-indigo-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <BookOpenIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UsersIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.reduce((total, course) => total + getStudentCount(course), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.filter(course => course.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <StarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.reduce((total, course) => total + getReviewCount(course), 0)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Courses Grid */}
        <AnimatePresence>
          {courses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-12 text-center"
            >
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpenIcon className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No Courses Yet
                </h3>
                <p className="text-gray-500 mb-8">
                  Start creating your first course to share your knowledge with students.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/dashboard/instructor/courses/create')}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg"
                >
                  Create Your First Course
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200"
                >
                  {/* Course Image */}
                  <div className="h-40 bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 relative overflow-hidden">
                    {course.image_url ? (
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaBookOpen className="w-16 h-16 text-white opacity-80" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex flex-col items-end space-y-1">
                      {getStatusColor(course.status || 'pending')}
                    </div>
                  </div>

                  {/* Course Content */}
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 leading-tight">
                      {course.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                      {course.description || "No description provided"}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 text-center mb-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
                      <div className="flex flex-col items-center">
                        <FaUsers className="w-4 h-4 text-blue-600 mb-1" />
                        <div className="text-lg font-bold text-gray-900">
                          {getStudentCount(course)}
                        </div>
                        <div className="text-xs text-gray-500">Students</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <FaListAlt className="w-4 h-4 text-green-600 mb-1" />
                        <div className="text-lg font-bold text-gray-900">
                          {getChapterCount(course)}
                        </div>
                        <div className="text-xs text-gray-500">Chapters</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <FaStar className="w-4 h-4 text-yellow-600 mb-1" />
                        <div className="text-lg font-bold text-gray-900">
                          {getReviewCount(course)}
                        </div>
                        <div className="text-xs text-gray-500">Reviews</div>
                      </div>
                    </div>

                    {/* Instructor Info */}
                    <div className="flex items-center mb-4 p-2 bg-blue-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-2">
                        {course.instructor?.name?.charAt(0) || "I"}
                      </div>
                      <span className="text-sm text-gray-700 font-medium">
                        {course.instructor?.name || "Unknown Instructor"}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewCourse(course.id)}
                        className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-2 px-3 rounded-lg cursor-pointer text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" />
                        Manage
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditCourse(course.id)}
                        className="flex items-center justify-center gap-1 bg-gray-600 text-white py-2 px-3 rounded-lg cursor-pointer text-sm font-medium hover:bg-gray-700 transition-colors"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteCourse(course.id)}
                        disabled={deletingId === course.id}
                        className="flex items-center justify-center gap-1 bg-red-600 text-white py-2 px-3 rounded-lg cursor-pointer text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {deletingId === course.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <TrashIcon className="w-4 h-4" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        {confirmationModal.isOpen && confirmationModal.title && (
          <ConfirmationModal
            isOpen={confirmationModal.isOpen}
            onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
            onConfirm={confirmationModal.onConfirm}
            title={confirmationModal.title}
            message={confirmationModal.message}
            variant={confirmationModal.variant}
            isLoading={deletingId !== null}
          />
        )}
        <PendingRejectedCoursesModal
          isOpen={showPendingModal}
          onClose={() => setShowPendingModal(false)}
        />
      </div>
    </div>
  );
}