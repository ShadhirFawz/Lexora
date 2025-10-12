"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { courseApi, Course, instructorCourseApi, courseReactionApi, courseCommentApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { 
  FaBookOpen, 
  FaUsers, 
  FaStar, 
  FaPlus,
  FaEdit,
  FaChartLine,
  FaCalendar,
  FaClock
} from "react-icons/fa";

interface InstructorCourse extends Course {
  total_students?: number;
  total_chapters?: number;
  total_comments?: number;
  total_reactions?: number;
  status: 'approved' | 'pending' | 'rejected' | 'draft';
  students?: any[]; // Add students array for the count
  chapters?: any[]; // Add chapters array for the count
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

export default function InstructorDashboard() {
  const [myCourses, setMyCourses] = useState<InstructorCourse[]>([]);
  const [otherCourses, setOtherCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch instructor's courses
      const myCoursesResponse = await instructorCourseApi.getInstructorCourses();
      const myCoursesData = myCoursesResponse.data || myCoursesResponse || [];
      
      // Fetch reactions for each course and add to course data
      const myCoursesWithComments = await Promise.all(
        myCoursesData.map(async (course: InstructorCourse) => {
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
      
      setMyCourses(myCoursesWithComments);
      
      // Do the same for other courses if needed
      const otherCoursesResponse = await instructorCourseApi.getOtherCourses();
      const otherCoursesData = otherCoursesResponse.data || otherCoursesResponse || [];
      
      const otherCoursesWithComments = await Promise.all(
        otherCoursesData.map(async (course: Course) => {
          try {
            const comments = await courseCommentApi.getComments(course.id);
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
      
      setOtherCourses(otherCoursesWithComments);
      
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

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

  const getStatusIcon = (status: string) => {
    const statusIcons = {
      approved: "✅",
      pending: "⏳",
      rejected: "❌",
      draft: "📝",
    };
    return statusIcons[status as keyof typeof statusIcons] || "📝";
  };

  const getReactionCount = async (courseId: number): Promise<number> => {
    try {
      const reactions = await courseReactionApi.getReactions(courseId);
      return Array.isArray(reactions) ? reactions.length : 0;
    } catch (error) {
      console.error(`Failed to fetch reactions for course ${courseId}:`, error);
      return 0;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get student count - use total_students if available, otherwise count students array
  const getStudentCount = (course: InstructorCourse) => {
    return course.total_students !== undefined ? course.total_students : (course.students?.length || 0);
  };

  // Helper function to get chapter count - use total_chapters if available, otherwise count chapters array
  const getChapterCount = (course: InstructorCourse) => {
    return course.total_chapters !== undefined ? course.total_chapters : (course.chapters?.length || 0);
  };

  // Helper function to get comment count
  const getCommentCount = (course: InstructorCourse) => {
    return course.total_comments || 0;
  };

  const getReviewCount = (course: InstructorCourse) => {
    return course.total_comments || 0;
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

  const CourseCard = ({ course, isMyCourse }: { course: Course | InstructorCourse; isMyCourse: boolean }) => {
    const instructorCourse = course as InstructorCourse;

    const handleCourseClick = () => {
      router.push(`/dashboard/instructor/courses/${course.id}`);
    };

    const handleEditCourse = (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/dashboard/instructor/courses/${course.id}/edit`);
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col h-[380px]"
      >
        {/* Course Image */}
        <div className="h-32 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 relative flex-shrink-0">
          {course.image_url ? (
            <img
              src={course.image_url}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FaBookOpen className="w-12 h-12 text-blue-900 opacity-80" />
            </div>
          )}
          <div className="absolute top-3 right-3 flex flex-col items-end space-y-1">
            {getStatusBadge(course.status || 'pending')}
          </div>
        </div>

        {/* Course Content */}
        <div className="p-4 flex flex-col flex-1 min-h-0">
          {/* Title */}
          <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 leading-7 h-14 overflow-hidden">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 h-10 overflow-hidden">
            {course.description || "No description available"}
          </p>

          {/* Course Stats - Only for instructor's own courses */}
          {isMyCourse && (
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-xs text-gray-600">
                <span className="flex items-center">
                  <FaUsers className="mr-1" />
                  {getStudentCount(instructorCourse)} students
                </span>
                <span className="flex items-center">
                  <FaBookOpen className="mr-1" />
                  {getChapterCount(instructorCourse)} chapters
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span className="flex items-center">
                  <FaStar className="mr-1" />
                  {getReviewCount(instructorCourse)} reviews {/* Changed from comments to reactions */}
                </span>
                <span className="flex items-center">
                  <FaCalendar className="mr-1" />
                  {formatDate(course.created_at || '')}
                </span>
              </div>
            </div>
          )}

          {/* Instructor Info */}
          <div className="flex items-center mb-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-semibold mr-2">
              👤
            </div>
            <span className="text-xs text-gray-600">
              {course.instructor?.name || "Unknown Instructor"}
            </span>
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Action Buttons */}
          <div className="pt-4 mt-auto">
            {isMyCourse ? (
              <div className="flex space-x-2">
                <button 
                  onClick={handleCourseClick}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Manage
                </button>
                <button 
                  onClick={handleEditCourse}
                  className="px-3 bg-gray-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <FaEdit className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleCourseClick}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
              >
                View Course
              </button>
            )}
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
            Instructor Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Welcome back! Manage your courses and explore teaching opportunities.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {myCourses.length}
            </div>
            <div className="text-gray-600">My Courses</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {myCourses.filter(c => c.status === 'approved').length}
            </div>
            <div className="text-gray-600">Approved</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {myCourses.filter(c => c.status === 'pending').length}
            </div>
            <div className="text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {otherCourses.length}
            </div>
            <div className="text-gray-600">Other Courses</div>
          </div>
        </motion.div>

        {/* Create Course Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push('/dashboard/instructor/courses/create')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center cursor-pointer"
          >
            <FaPlus className="mr-2" />
            Create New Course
          </button>
        </motion.div>

        {/* My Courses Section */}
        <section className="mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              My Courses
            </h2>
            <p className="text-gray-600">
              {myCourses.length === 0 
                ? "You haven't created any courses yet." 
                : `You have created ${myCourses.length} course${myCourses.length !== 1 ? 's' : ''}`}
            </p>
          </motion.div>

          {myCourses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-lg p-8 text-center"
            >
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Start Creating Courses
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first course to start teaching and sharing your knowledge.
              </p>
              <button 
                onClick={() => router.push('/dashboard/instructor/courses/create')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Your First Course
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {myCourses.map((course, index) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  isMyCourse={true}
                />
              ))}
            </div>
          )}
        </section>

        {/* Other Courses Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6"
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Other Courses
            </h2>
            <p className="text-gray-600">
              Explore courses created by other instructors for inspiration.
            </p>
          </motion.div>

          {otherCourses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-lg p-8 text-center"
            >
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No Other Courses Available
              </h3>
              <p className="text-gray-600">
                There are no other courses available at the moment.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {otherCourses.map((course, index) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  isMyCourse={false}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}