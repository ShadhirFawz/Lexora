"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { courseApi, Course } from "@/lib/api";

interface EnrolledCourse extends Course {
  user_progress?: number;
  is_enrolled?: boolean;
  pivot?: {
    student_id: number;
    course_id: number;
    progress_percent: string;
    created_at: string;
    updated_at: string;
  };
}

interface CourseResponse {
  data: Course[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export default function StudentDashboard() {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch enrolled courses (my-courses endpoint)
        const myCourses = await courseApi.getMyCourses();
        setEnrolledCourses(myCourses || []);
        
        // Fetch all available courses (courses endpoint with pagination)
        const allCourses: CourseResponse = await courseApi.getAllCourses();
        setAvailableCourses(allCourses.data || []);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const CourseCard = ({ course, isEnrolled }: { course: Course | EnrolledCourse; isEnrolled: boolean }) => {
    const progress = isEnrolled ? (course as EnrolledCourse).user_progress || (course as EnrolledCourse).pivot?.progress_percent : null;
    const progressValue = progress ? parseFloat(progress.toString()) : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col h-[400px]" // Fixed height
      >
        {/* Course Image - Fixed height */}
        <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 relative flex-shrink-0">
          {course.image_url ? (
            <img
              src={course.image_url}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-4xl">
              📚
            </div>
          )}
          <div className="absolute top-3 right-3">
            {getStatusBadge(course.status || 'approved')}
          </div>
        </div>

        {/* Course Content - Flexible space */}
        <div className="p-4 flex flex-col flex-1 min-h-0"> {/* flex-1 and min-h-0 for proper flex behavior */}
          
          {/* Title - Fixed height */}
          <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 leading-tight h-14 overflow-hidden">
            {course.title}
          </h3>

          {/* Description - Fixed height */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 h-10 overflow-hidden">
            {course.description || "No description available"}
          </p>

          {/* Instructor Info - Fixed position */}
          <div className="flex items-center mb-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-semibold mr-2">
              👤
            </div>
            <span className="text-xs text-gray-600">
              {course.instructor?.name || "Unknown Instructor"}
            </span>
          </div>

          {/* Course Stats - Fixed position */}
          <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
            <span>📊 {course.chapters?.length || 0} chapters</span>
            <span>👥 {course.students?.length || 0} students</span>
          </div>

          {/* Progress Section - Fixed height if exists */}
          {isEnrolled && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Your Progress</span>
                <span className="font-semibold">{progressValue.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(progressValue)}`}
                  style={{ width: `${progressValue}%` }}
                />
              </div>
            </div>
          )}

          {/* Spacer to push button to bottom */}
          <div className="flex-1"></div>

          {/* Action Button - Fixed at bottom */}
          <div className="pt-4 mt-auto"> {/* mt-auto pushes it to bottom */}
            <button className={`w-full py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              isEnrolled 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
              {isEnrolled ? 'Continue Learning' : 'View Course'}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Student Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Welcome back! Continue your learning journey or explore new courses.
          </p>
        </motion.div>

        {/* Enrolled Courses Section */}
        <section className="mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              My Enrolled Courses
            </h2>
            <p className="text-gray-600">
              {enrolledCourses.length === 0 
                ? "You haven't enrolled in any courses yet." 
                : `You're enrolled in ${enrolledCourses.length} course${enrolledCourses.length !== 1 ? 's' : ''}`}
            </p>
          </motion.div>

          {enrolledCourses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-lg p-8 text-center"
            >
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Start Your Learning Journey
              </h3>
              <p className="text-gray-600 mb-6">
                Enroll in courses from the available courses section below to get started.
              </p>
              <button 
                onClick={() => document.getElementById('available-courses')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Available Courses
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {enrolledCourses.map((course, index) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  isEnrolled={true}
                />
              ))}
            </div>
          )}
        </section>

        {/* Available Courses Section */}
        <section id="available-courses">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6"
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Available Courses
            </h2>
            <p className="text-gray-600">
              Explore all available courses to expand your knowledge.
            </p>
          </motion.div>

          {availableCourses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-lg p-8 text-center"
            >
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No Courses Available
              </h3>
              <p className="text-gray-600">
                There are no courses available at the moment. Please check back later.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {availableCourses.map((course, index) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  isEnrolled={false}
                />
              ))}
            </div>
          )}
        </section>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {enrolledCourses.length}
              </div>
              <div className="text-gray-600">Enrolled Courses</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {enrolledCourses.filter(c => parseFloat((c as EnrolledCourse).pivot?.progress_percent || '0') === 100).length}
              </div>
              <div className="text-gray-600">Completed Courses</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {availableCourses.length}
              </div>
              <div className="text-gray-600">Available Courses</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}