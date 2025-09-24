"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { courseApi, progressApi, commentApi, Course, Chapter, Comment } from "@/lib/api";
import { FaBookOpen, FaCheckCircle, FaUser, FaChalkboardTeacher, FaUsers, FaCalendar, FaStar } from "react-icons/fa";

interface CourseDetail extends Course {
  chapters?: Chapter[];
  students?: any[];
  comments?: Comment[];
  total_chapters?: number;
  total_students?: number;
  total_comments?: number;
}

interface ProgressData {
  course: Course;
  progress: any[];
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userProgress, setUserProgress] = useState<number>(0);

  useEffect(() => {
    if (!courseId) {
      router.push("/dashboard/student/courses");
      return;
    }

    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // Fetch course details with all relationships
        const courseData = await courseApi.getCourse(courseId);
        setCourse(courseData);
        
        // Check if user is enrolled by looking at students array or pivot data
        const enrolled = courseData.students?.some(student => 
          student.id === getCurrentUserId() || courseData.pivot !== undefined
        );
        setIsEnrolled(!!enrolled);
        
        // If enrolled, fetch progress data
        if (enrolled) {
          try {
            const progressResponse = await progressApi.getProgress(courseId);
            setProgressData(progressResponse);
            
            // Calculate overall progress
            if (progressResponse.progress && courseData.chapters) {
              const completedChapters = progressResponse.progress.filter((p: any) => p.is_completed).length;
              const totalChapters = courseData.chapters.length;
              setUserProgress(totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0);
            }
          } catch (error) {
            console.log("Progress data not available");
          }
        }

        // Fetch comments with safe error handling
        try {
          const commentsData = await commentApi.getComments(courseId);
          setComments(commentsData || []);
        } catch (error) {
          console.log("Comments not available");
          setComments([]);
        }

      } catch (error) {
        console.error("Failed to load course data:", error);
        // Handle error - could redirect or show error message
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, router]);

  const getCurrentUserId = (): number | null => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData).id : null;
    }
    return null;
  };

  // Safe user name extraction
  const getUserInitial = (user: any) => {
    if (!user || !user.name) return "U";
    return user.name.charAt(0).toUpperCase();
  };

  const getUserName = (user: any) => {
    if (!user || !user.name) return "Unknown User";
    return user.name;
  };

  const getUserRole = (user: any) => {
    if (!user || !user.role) return "user";
    return user.role;
  };

  const handleEnroll = async () => {
    if (!confirm("Are you sure you want to enroll in this course?")) return;
    
    try {
      setEnrolling(true);
      await courseApi.enroll(courseId);
      setIsEnrolled(true);
      
      // Refresh course data to get updated student count and enrollment status
      const updatedCourse = await courseApi.getCourse(courseId);
      setCourse(updatedCourse);
      
      alert("Successfully enrolled in the course!");
    } catch (error: any) {
      alert(error.message || "Failed to enroll in the course");
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    if (!confirm("Are you sure you want to unenroll from this course? Your progress will be lost.")) return;
    
    try {
      setEnrolling(true);
      await courseApi.unenroll(courseId);
      setIsEnrolled(false);
      setUserProgress(0);
      setProgressData(null);
      
      alert("Successfully unenrolled from the course.");
    } catch (error: any) {
      alert(error.message || "Failed to unenroll from the course");
    } finally {
      setEnrolling(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      alert("Please write a comment before posting.");
      return;
    }

    try {
      const comment = await commentApi.addComment(courseId, newComment);
      setComments(prev => [comment, ...prev]);
      setNewComment("");
      alert("Comment added successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to add comment");
    }
  };

  const handleChapterClick = (chapter: Chapter) => {
    if (!isEnrolled) {
      alert("Please enroll in the course to access chapter content.");
      return;
    }
    // Navigate to chapter detail page or show chapter content
    console.log("Opening chapter:", chapter);
  };

  const getCompletedChapters = () => {
    if (!progressData?.progress || !course?.chapters) return 0;
    return progressData.progress.filter((p: any) => p.is_completed).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Course not found</h1>
          <button
            onClick={() => router.push("/dashboard/student/courses")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Course Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Image */}
            <div className="lg:col-span-1">
              {course.image_url ? (
                <img
                  src={course.image_url}
                  alt={course.title}
                  className="w-full h-64 object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-6xl">
                  📚
                </div>
              )}
            </div>

            {/* Course Info */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  course.status === 'approved' ? 'bg-green-100 text-green-800' :
                  course.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {course.status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
              
              <p className="text-gray-600 text-lg mb-6">{course.description}</p>

              {/* Course Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <FaBookOpen className="mr-2 text-blue-500" />
                  <span>{course.chapters?.length || 0} Chapters</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaUsers className="mr-2 text-green-500" />
                  <span>{course.students?.length || 0} Students</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaStar className="mr-2 text-yellow-500" />
                  <span>{course.total_comments || 0} Reviews</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaCalendar className="mr-2 text-purple-500" />
                  <span>{new Date(course.created_at!).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Instructor Info */}
              {course.instructor && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {getUserInitial(course.instructor)}
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900">{getUserName(course.instructor)}</p>
                      <p className="text-sm text-gray-600">{course.instructor.email}</p>
                      <p className="text-xs text-blue-600 capitalize">{getUserRole(course.instructor)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Enrollment Actions */}
              <div className="flex space-x-4">
                {isEnrolled ? (
                  <>
                    <button
                      onClick={handleUnenroll}
                      disabled={enrolling}
                      className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      {enrolling ? "Unenrolling..." : "Unenroll"}
                    </button>
                    <button
                      onClick={() => console.log("Continue learning")}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Continue Learning
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50"
                  >
                    {enrolling ? "Enrolling..." : "Enroll in Course"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section - Only for enrolled students */}
        {isEnrolled && userProgress > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Progress</h2>
              <span className="text-2xl font-bold text-green-600">{userProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${userProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              {getCompletedChapters()} of {course.chapters?.length || 0} chapters completed
            </p>
          </div>
        )}

        {/* Chapters Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Chapters</h2>
          <div className="space-y-3">
            {course.chapters?.map((chapter, index) => {
              const chapterProgress = progressData?.progress?.find((p: any) => p.chapter_id === chapter.id);
              const isCompleted = chapterProgress?.is_completed;

              return (
                <div
                  key={chapter.id}
                  onClick={() => handleChapterClick(chapter)}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                    isEnrolled 
                      ? 'hover:bg-blue-50 hover:border-blue-200' 
                      : 'opacity-75 cursor-not-allowed'
                  } ${
                    isCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold mr-4">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                    {chapter.description && (
                      <p className="text-sm text-gray-600 mt-1">{chapter.description}</p>
                    )}
                  </div>
                  {isEnrolled && (
                    <div className="flex items-center space-x-2">
                      {isCompleted && <FaCheckCircle className="text-green-500 text-lg" />}
                      <span className="text-sm text-gray-500">
                        {chapter.video_url ? 'Video' : 'Reading'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            
            {!course.chapters?.length && (
              <div className="text-center py-8 text-gray-500">
                <FaBookOpen className="text-4xl mx-auto mb-3 text-gray-300" />
                <p>No chapters available yet. Check back later!</p>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Discussions</h2>
          
          {/* Add Comment Form */}
          <div className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts, ask questions, or discuss the course content..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Post Comment
              </button>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm mr-3">
                      {getUserInitial(comment.user)}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">{getUserName(comment.user)}</span>
                      <span className="ml-2 text-sm text-gray-500 capitalize">{getUserRole(comment.user)}</span>
                    </div>
                  </div>
                  {comment.created_at && (
                    <span className="text-sm text-gray-400">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            ))}
            
            {comments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FaUsers className="text-4xl mx-auto mb-3 text-gray-300" />
                <p>No discussions yet. Be the first to start a conversation!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}