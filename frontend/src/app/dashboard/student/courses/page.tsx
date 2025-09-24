"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch, Course } from "@/lib/api";

interface EnrolledCourse extends Course {
  pivot: {
    student_id: number;
    course_id: number;
    progress_percent: string;
    created_at: string;
    updated_at: string;
  };
  status: string;
  instructor: {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    role: string;
    created_at: string;
    updated_at: string;
  };
}

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<EnrolledCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/my-courses")
      .then(setCourses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "bg-green-500";
    if (progress >= 70) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 30) return "bg-orange-500";
    return "bg-red-500";
  };

  const getStatusBadge = (status: string) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Courses</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
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
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-sans">
            My Learning Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Track your progress and continue your learning journey. Click on any course to view detailed information.
          </p>
        </motion.div>

        {courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              No Courses Yet
            </h2>
            <p className="text-gray-600 mb-6">
              You haven't enrolled in any courses. Start your learning journey today!
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105">
              Browse Courses
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Course List */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-800 font-sans">
                  Enrolled Courses ({courses.length})
                </h2>
                <span className="text-sm text-gray-500">
                  Total Progress: {Math.round(courses.reduce((sum, course) => sum + parseFloat(course.pivot.progress_percent), 0) / courses.length)}%
                </span>
              </div>
              
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`bg-white rounded-xl shadow-lg p-6 cursor-pointer border-2 transition-all duration-300 ${
                    selectedCourse?.id === course.id
                      ? "border-blue-500 shadow-xl"
                      : "border-transparent hover:border-blue-300"
                  }`}
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="flex items-start space-x-4">
                    {course.image_url ? (
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl">
                        📖
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 truncate font-sans">
                          {course.title}
                        </h3>
                        {getStatusBadge(course.status)}
                      </div>
                      
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {course.description}
                      </p>
                      
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{parseFloat(course.pivot.progress_percent).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(parseFloat(course.pivot.progress_percent))}`}
                            style={{ width: `${course.pivot.progress_percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            👤 {course.instructor?.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            📊 {course.chapters?.length || 0} chapters
                          </span>
                        </div>
                        
                        <span className="text-xs text-gray-400">
                          Enrolled: {new Date(course.pivot.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Course Details */}
            <AnimatePresence mode="wait">
              {selectedCourse ? (
                <motion.div
                  key={selectedCourse.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-2xl shadow-xl p-8 sticky top-6 h-fit"
                >
                  {/* Course Header */}
                  <div className="mb-6">
                    {selectedCourse.image_url ? (
                      <img
                        src={selectedCourse.image_url}
                        alt={selectedCourse.title}
                        className="w-full h-48 object-cover rounded-xl mb-4"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-6xl mb-4">
                        📚
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-2xl font-bold text-gray-900 font-sans">
                        {selectedCourse.title}
                      </h2>
                      {getStatusBadge(selectedCourse.status)}
                    </div>
                    
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {selectedCourse.description}
                    </p>

                    {/* Progress Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-800">Your Progress</h3>
                        <span className="text-2xl font-bold text-blue-600">
                          {parseFloat(selectedCourse.pivot.progress_percent).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(parseFloat(selectedCourse.pivot.progress_percent))}`}
                          style={{ width: `${selectedCourse.pivot.progress_percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Started: {new Date(selectedCourse.pivot.created_at).toLocaleDateString()}</span>
                        <span>Last updated: {new Date(selectedCourse.pivot.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Instructor Info */}
                  <div className="bg-blue-50 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-gray-800 mb-3">Instructor Details</h3>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {selectedCourse.instructor?.name?.charAt(0) || "I"}
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="font-medium text-gray-900">
                          {selectedCourse.instructor?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedCourse.instructor?.email}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Joined: {new Date(selectedCourse.instructor.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Course Chapters */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-4">
                      Course Content ({selectedCourse.chapters?.length || 0} chapters)
                    </h3>
                    <div className="space-y-2">
                      {selectedCourse.chapters?.map((chapter, index) => (
                        <motion.div
                          key={chapter.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm mr-3">
                            {index + 1}
                          </div>
                          <span className="text-gray-700">{chapter.title}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Course Metadata */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Course Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-gray-600">Course ID</div>
                      <div className="text-gray-900 font-mono">#{selectedCourse.id}</div>
                      
                      <div className="text-gray-600">Created</div>
                      <div className="text-gray-900">
                        {new Date(selectedCourse.created_at).toLocaleDateString()}
                      </div>
                      
                      <div className="text-gray-600">Last Updated</div>
                      <div className="text-gray-900">
                        {new Date(selectedCourse.updated_at).toLocaleDateString()}
                      </div>
                      
                      <div className="text-gray-600">Enrollment Date</div>
                      <div className="text-gray-900">
                        {new Date(selectedCourse.pivot.created_at).toLocaleDateString()}
                      </div>
                      
                      <div className="text-gray-600">Student ID</div>
                      <div className="text-gray-900 font-mono">#{selectedCourse.pivot.student_id}</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 mt-6">
                    <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      {parseFloat(selectedCourse.pivot.progress_percent) === 100 ? 'Review Course' : 'Continue Learning'}
                    </button>
                    <button className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      ⋮
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl shadow-xl p-8 text-center flex items-center justify-center h-96"
                >
                  <div>
                    <div className="text-6xl mb-4">👆</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Select a Course
                    </h3>
                    <p className="text-gray-600">
                      Click on any course from the list to view detailed information
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}