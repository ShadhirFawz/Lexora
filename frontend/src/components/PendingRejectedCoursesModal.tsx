"use client";

import { useEffect, useState } from "react";
import { instructorCourseApi, Course, courseApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { FaBookOpen } from "react-icons/fa";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface InstructorCourse extends Course {
  total_students?: number;
  total_chapters?: number;
  total_comments?: number;
  status: 'approved' | 'pending' | 'rejected' | 'draft';
  students?: any[];
  chapters?: any[];
}

interface PendingRejectedCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PendingRejectedCoursesModal({ isOpen, onClose }: PendingRejectedCoursesModalProps) {
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
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
    if (isOpen) {
      loadPendingRejectedCourses();
    }
  }, [isOpen]);

  const loadPendingRejectedCourses = async () => {
    try {
      setLoading(true);
      const response = await instructorCourseApi.getInstructorCourses();
      const coursesData = response.data || response || [];
      
      // Filter for pending and rejected courses only
      const pendingRejectedCourses = coursesData.filter(
        (course: InstructorCourse) => course.status === 'pending' || course.status === 'rejected'
      );
      
      setCourses(pendingRejectedCourses);
    } catch (err: any) {
      console.error('Error loading pending/rejected courses:', err);
      setError(err.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = (courseId: number) => {
    showConfirmation(
      "Delete Course",
      "Are you sure you want to delete this course? This action cannot be undone.",
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

  const getStatusColor = (status: string) => {
    const statusConfig = {
      approved: { color: "bg-green-100 text-green-800", text: "Approved" },
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Pending Review" },
      rejected: { color: "bg-red-100 text-red-800", text: "Rejected" },
      draft: { color: "bg-gray-100 text-gray-800", text: "Draft" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': 
        return <ClockIcon className="w-5 h-5 text-yellow-600" />;
      case 'rejected': 
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      default: 
        return <ClockIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return "Your course is under review by our team. You'll be notified once it's approved.";
      case 'rejected':
        return "Your course needs some modifications. Please review the requirements and resubmit.";
      default:
        return "";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Pending & Rejected Courses
                </h2>
                <p className="text-gray-600 mt-1">
                  Manage your courses that are awaiting approval or need modifications
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="animate-pulse bg-gray-100 rounded-xl p-6 space-y-3">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-8 bg-gray-200 rounded w-32"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-red-800 mb-2">Error Loading Courses</h3>
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={loadPendingRejectedCourses}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaBookOpen className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No Pending or Rejected Courses
                  </h3>
                  <p className="text-gray-600 mb-6">
                    All your courses are approved and published!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {courses.map((course) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 rounded-xl p-6 border border-gray-200"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        {/* Course Image */}
                        <div className="flex-shrink-0 w-32 h-24 bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 rounded-lg overflow-hidden">
                          {course.image_url ? (
                            <img
                              src={course.image_url}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FaBookOpen className="w-8 h-8 text-white opacity-80" />
                            </div>
                          )}
                        </div>

                        {/* Course Info */}
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                            <div className="mr-5">
                              <h3 className="font-bold text-gray-900 text-lg mb-1">
                                {course.title}
                              </h3>
                              <p className="text-gray-600 text-sm line-clamp-2">
                                {course.description || "No description provided"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(course.status)}
                              {getStatusColor(course.status)}
                            </div>
                          </div>

                          <p className="text-sm text-gray-500 mb-4">
                            {getStatusDescription(course.status)}
                          </p>

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-4 text-center mb-4 p-3 bg-white rounded-lg border border-gray-200">
                            <div>
                              <div className="text-sm font-bold text-gray-900">
                                {course.total_students || 0}
                              </div>
                              <div className="text-xs text-gray-500">Students</div>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">
                                {course.total_chapters || 0}
                              </div>
                              <div className="text-xs text-gray-500">Chapters</div>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">
                                {course.total_comments || 0}
                              </div>
                              <div className="text-xs text-gray-500">Reviews</div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => window.open(`/dashboard/instructor/courses/${course.id}`, '_blank')}
                              className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-2 px-3 rounded-lg cursor-pointer text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                              <EyeIcon className="w-4 h-4" />
                              View
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => window.open(`/dashboard/instructor/courses/${course.id}/edit`, '_blank')}
                              className="flex items-center justify-center gap-1 bg-gray-600 text-white py-2 px-3 rounded-lg cursor-pointer text-sm font-medium hover:bg-gray-700 transition-colors"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                              Edit
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
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
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
    </AnimatePresence>
  );
}