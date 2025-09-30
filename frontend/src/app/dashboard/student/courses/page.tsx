"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { studentCourseApi, Course, User } from "@/lib/api";
import { useRouter } from "next/navigation";
import { 
  BookOpenIcon, 
  UserIcon, 
  ClockIcon,
  PlayCircleIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";

interface EnrolledCourse extends Course {
  enrollment_status?: {
    is_enrolled: boolean;
    enrollment_data: {
      student_id: number;
      course_id: number;
      progress_percent: string;
      created_at: string;
      updated_at: string;
    };
    progress_data: any[];
  };
  students?: Array<User & {
    pivot: {
      student_id: number;
      course_id: number;
      progress_percent: string;
      created_at: string;
      updated_at: string;
    };
  }>;
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
  const router = useRouter();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<EnrolledCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await studentCourseApi.getCoursesWithEnrollment();
      setCourses(response.data || response);
    } catch (err: any) {
      setError(err.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const getSafeDate = (dateString: string | undefined | null, fallback: string = new Date().toISOString()): Date => {
      if (!dateString) return new Date(fallback);
      return new Date(dateString);
    };

  const getStudentProgress = (course: EnrolledCourse): { progress: number; enrollmentDate: string } => {
    // For enrolled courses, get progress from students array pivot
    if (course.students && course.students.length > 0) {
      const studentData = course.students.find(student => 
        student.pivot && student.pivot.progress_percent !== undefined
      );
      if (studentData) {
        return {
          progress: parseFloat(studentData.pivot.progress_percent),
          enrollmentDate: studentData.pivot.created_at
        };
      }
    }
    
    // For detailed course view with enrollment_status
    if (course.enrollment_status?.enrollment_data) {
      return {
        progress: parseFloat(course.enrollment_status.enrollment_data.progress_percent),
        enrollmentDate: course.enrollment_status.enrollment_data.created_at
      };
    }
    
    // Default fallback
    return {
      progress: 0,
      enrollmentDate: course.created_at || new Date().toISOString()
    };
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "from-green-500 to-emerald-600";
    if (progress >= 70) return "from-blue-500 to-cyan-600";
    if (progress >= 50) return "from-yellow-500 to-amber-600";
    if (progress >= 30) return "from-orange-500 to-red-500";
    return "from-red-500 to-pink-600";
  };

  const getProgressIcon = (progress: number) => {
    if (progress === 0) return "🎯";
    if (progress < 50) return "🚀";
    if (progress < 90) return "📈";
    return "🏆";
  };

  const filteredCourses = courses.filter(course => {
    const progress = getStudentProgress(course).progress;
    switch (activeTab) {
      case 'in-progress':
        return progress > 0 && progress < 100;
      case 'completed':
        return progress === 100;
      default:
        return true;
    }
  });

  const handleContinueLearning = (course: EnrolledCourse) => {
    router.push(`/dashboard/student/courses/${course.id}`);
  };

  const handleViewCourse = (course: EnrolledCourse) => {
    router.push(`/dashboard/student/courses/${course.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            {/* Header Skeleton */}
            <div className="text-center space-y-4">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
            </div>

            {/* Tabs Skeleton */}
            <div className="flex justify-center gap-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-10 bg-gray-200 rounded-lg w-32"></div>
              ))}
            </div>

            {/* Courses Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                {[1, 2, 3].map(n => (
                  <div key={n} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-8 h-96"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Courses</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadCourses}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <AcademicCapIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 font-sans">
              My Learning Journey
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Continue your learning adventure. Track progress, access materials, and achieve your goals.
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpenIcon className="w-6 h-6 text-blue-600" />
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
                <ChartBarIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.filter(c => {
                    const progress = getStudentProgress(c).progress;
                    return progress > 0 && progress < 100;
                  }).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-emerald-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <PlayCircleIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.filter(c => getStudentProgress(c).progress === 100).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(courses.reduce((sum, course) => sum + getStudentProgress(course).progress, 0) / (courses.length || 1))}%
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-white rounded-2xl shadow-sm p-2 flex gap-2">
            {[
              { key: 'all', label: 'All Courses', count: courses.length },
              { key: 'in-progress', label: 'In Progress', count: courses.filter(c => {
                const progress = getStudentProgress(c).progress;
                return progress > 0 && progress < 100;
              }).length },
              { key: 'completed', label: 'Completed', count: courses.filter(c => getStudentProgress(c).progress === 100).length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </motion.div>

        {filteredCourses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-12 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpenIcon className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {activeTab === 'all' ? 'No Courses Enrolled' : `No ${activeTab.replace('-', ' ')} courses`}
              </h3>
              <p className="text-gray-600 mb-8">
                {activeTab === 'all' 
                  ? "Start your learning journey by enrolling in courses that interest you."
                  : `You don't have any ${activeTab.replace('-', ' ')} courses yet.`}
              </p>
              <button
                onClick={() => router.push('/dashboard/student/courses')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Browse Available Courses
              </button>
            </div>
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
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold text-gray-900 font-sans">
                  My Courses
                </h2>
                <span className="text-sm text-gray-500">
                  {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {filteredCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`bg-white rounded-2xl shadow-lg p-6 cursor-pointer border-2 transition-all duration-300 ${
                    selectedCourse?.id === course.id
                      ? "border-blue-500 shadow-xl"
                      : "border-transparent hover:border-blue-200"
                  }`}
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="flex items-start space-x-4">
                    {course.image_url ? (
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-sm">
                        {getProgressIcon(getStudentProgress(course).progress)}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 font-sans">
                          {course.title}
                        </h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                          {parseFloat(course.pivot?.progress_percent || '0').toFixed(0)}%
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {course.description || "No description available"}
                      </p>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(getStudentProgress(course).progress)} transition-all duration-1000`}
                            style={{ width: `${getStudentProgress(course).progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            {course.instructor?.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpenIcon className="w-3 h-3" />
                            {course.chapters?.length || 0} chapters
                          </span>
                        </div>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {new Date(getStudentProgress(course).enrollmentDate).toLocaleDateString()}
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
                        className="w-full h-48 object-cover rounded-2xl mb-4 shadow-sm"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-6xl mb-4 shadow-sm">
                        {getProgressIcon(parseFloat(selectedCourse.pivot?.progress_percent || '0'))}
                      </div>
                    )}
                    
                    <h2 className="text-2xl font-bold text-gray-900 font-sans mb-3">
                      {selectedCourse.title}
                    </h2>
                    
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {selectedCourse.description || "No description available for this course."}
                    </p>

                    {/* Progress Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 text-lg">Learning Progress</h3>
                        <span className="text-2xl font-bold text-blue-600">
                          {getStudentProgress(selectedCourse).progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-white rounded-full h-3 shadow-inner mb-2">
                        <div
                          className={`h-3 rounded-full bg-gradient-to-r ${getProgressColor(getStudentProgress(selectedCourse).progress)} transition-all duration-1000 shadow-sm`}
                          style={{ width: `${getStudentProgress(selectedCourse).progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Started: {new Date(getStudentProgress(selectedCourse).enrollmentDate).toLocaleDateString()}</span>
                        <span>Updated: {getSafeDate(selectedCourse.updated_at, selectedCourse.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={() => handleContinueLearning(selectedCourse)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                    >
                      <PlayCircleIcon className="w-5 h-5" />
                      {getStudentProgress(selectedCourse).progress === 100 ? 'Review Course' : 'Continue Learning'}
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleViewCourse(selectedCourse)}
                      className="px-6 py-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Details
                    </button>
                  </div>

                  {/* Instructor Info */}
                  <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                    <h3 className="font-semibold text-gray-800 mb-3">Instructor</h3>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {selectedCourse.instructor?.name?.charAt(0) || "I"}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="font-medium text-gray-900">
                          {selectedCourse.instructor?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedCourse.instructor?.email}
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
                          className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm mr-3 group-hover:bg-blue-200 transition-colors">
                            {index + 1}
                          </div>
                          <span className="text-gray-700 font-medium">{chapter.title}</span>
                        </motion.div>
                      ))}
                    </div>
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
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpenIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Select a Course
                    </h3>
                    <p className="text-gray-600">
                      Click on any course to view detailed information and continue learning
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