"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { studentCourseApi, courseApi, Course, Chapter, CourseComment, courseCommentApi } from "@/lib/api";
import { 
  FaBookOpen, 
  FaCheckCircle, 
  FaUser, 
  FaChalkboardTeacher, 
  FaUsers, 
  FaCalendar, 
  FaStar,
  FaHeart,
  FaChevronDown, 
  FaChevronUp, 
  FaPlay, 
  FaLock 
} from "react-icons/fa";

interface CourseDetail extends Course {
  chapters?: Chapter[];
  students?: any[];
  total_chapters?: number;
  total_students?: number;
}

interface EnrollmentStatus {
  is_enrolled: boolean;
  enrollment_data: any;
  progress_data: any;
}

interface CourseWithEnrollmentResponse {
  course: CourseDetail;
  enrollment_status: {
    is_enrolled: boolean;
    enrollment_data: {
      student_id: number;
      course_id: number;
      progress_percent: string;
      created_at: string;
      updated_at: string;
    } | null;
    progress_data: any[];
  };
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userProgress, setUserProgress] = useState<number>(0);
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  const [comments, setComments] = useState<CourseComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likingCommentId, setLikingCommentId] = useState<number | null>(null);
  const [expandedComments, setExpandedComments] = useState<{ [key: number]: boolean }>({});


  // Utility function to safely parse a date string or provide a fallback
  const getSafeDate = (dateString: string | undefined | null, fallback: string = new Date().toISOString()): Date => {
    if (!dateString) return new Date(fallback);
    return new Date(dateString);
  };

  useEffect(() => {
    if (!courseId) {
      router.push("/dashboard/student/courses");
      return;
    }

    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // Use the new endpoint that returns course with enrollment status
        const response: CourseWithEnrollmentResponse = await studentCourseApi.getCourseWithEnrollment(courseId);
        setCourse(response.course);
        setIsEnrolled(response.enrollment_status.is_enrolled);
        setEnrollmentData(response.enrollment_status.enrollment_data);

        // Calculate progress if enrolled
        if (response.enrollment_status.is_enrolled && response.course.chapters) {
          const progressData = response.enrollment_status.progress_data;
          
          if (progressData && progressData.length > 0) {
            const completedChapters = progressData.filter((p: any) => p.is_completed).length;
            const totalChapters = response.course.chapters.length;
            setUserProgress(totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0);
          } else if (response.enrollment_status.enrollment_data) {
            // Use progress from enrollment data if available
            const progressPercent = parseFloat(response.enrollment_status.enrollment_data.progress_percent || '0');
            setUserProgress(progressPercent);
          } else {
            setUserProgress(0);
          }
        }

        // Fetch comments after course data is loaded
        const commentsData = await courseCommentApi.getComments(courseId);
        setComments(commentsData);

        console.log('Course data loaded:', {
          isEnrolled: response.enrollment_status.is_enrolled,
          enrollmentData: response.enrollment_status.enrollment_data,
          progressData: response.enrollment_status.progress_data
        });

      } catch (error) {
        console.error("Failed to load course data:", error);
        // Fallback to regular course API if the new endpoint fails
        try {
          const fallbackCourse = await courseApi.getCourse(courseId);
          setCourse(fallbackCourse);
          setIsEnrolled(false);
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, router]);

  const refreshComments = async () => {
    try {
      const commentsData = await courseCommentApi.getComments(courseId);
      setComments(commentsData);
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setSubmittingComment(true);
      await courseCommentApi.addComment(courseId, newComment.trim());
      
      // Refresh comments
      await refreshComments();
      setNewComment('');
      
    } catch (error: any) {
      console.error("Failed to add comment:", error);
      alert(error.message || "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };
  
  const toggleReplies = (commentId: number) => {
    setExpandedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleToggleLike = async (commentId: number) => {
    // take a snapshot so we can revert if the request fails
    const snapshot = comments;

    // find whether this item is currently liked (search top-level comments and replies)
    let currentlyLiked = false;
    for (const c of snapshot) {
      if (c.id === commentId) {
        currentlyLiked = !!c.is_liked;
        break;
      }
      if (c.replies && c.replies.some(r => r.id === commentId)) {
        const reply = c.replies.find(r => r.id === commentId)!;
        currentlyLiked = !!reply.is_liked;
        break;
      }
    }

    // build optimistic state (use ?? 0 to guard likes_count)
    const optimistic = snapshot.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          is_liked: !currentlyLiked,
          likes_count: (c.likes_count ?? 0) + (currentlyLiked ? -1 : 1),
        };
      }

      if (c.replies && c.replies.some(r => r.id === commentId)) {
        return {
          ...c,
          replies: c.replies!.map(r =>
            r.id === commentId
              ? { ...r, is_liked: !currentlyLiked, likes_count: (r.likes_count ?? 0) + (currentlyLiked ? -1 : 1) }
              : r
          ),
        };
      }

      return c;
    });

    // apply optimistic UI
    setComments(optimistic);
    setLikingCommentId(commentId);

    try {
      await courseCommentApi.toggleLike(commentId);
      // success -> we leave optimistic state as-is
    } catch (error: any) {
      console.error("Failed to toggle like:", error);
      alert(error?.message || "Failed to update like");
      // revert to snapshot
      setComments(snapshot);
    } finally {
      setLikingCommentId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEnroll = async () => {
    if (!confirm("Are you sure you want to enroll in this course?")) return;
    
    try {
      setEnrolling(true);
      await courseApi.enroll(courseId);
      
      // Refresh course data using the new endpoint
      const response: CourseWithEnrollmentResponse = await studentCourseApi.getCourseWithEnrollment(courseId);
      setCourse(response.course);
      setIsEnrolled(response.enrollment_status.is_enrolled);
      setEnrollmentData(response.enrollment_status.enrollment_data);
      
      // Initialize progress for newly enrolled course
      setUserProgress(0);
      
      alert("Successfully enrolled in the course!");
    } catch (error: any) {
      console.error("Enrollment error:", error);
      alert(error.message || "Failed to enroll in the course. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    if (!confirm("Are you sure you want to unenroll from this course? Your progress will be lost.")) return;
    
    try {
      setEnrolling(true);
      await courseApi.unenroll(courseId);
      
      // Refresh course data using the new endpoint
      const response: CourseWithEnrollmentResponse = await studentCourseApi.getCourseWithEnrollment(courseId);
      setCourse(response.course);
      setIsEnrolled(response.enrollment_status.is_enrolled);
      setEnrollmentData(response.enrollment_status.enrollment_data);
      setUserProgress(0);
      
      alert("Successfully unenrolled from the course.");
    } catch (error: any) {
      console.error("Unenrollment error:", error);
      alert(error.message || "Failed to unenroll from the course. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  const handleChapterClick = (chapter: Chapter) => {
    if (!isEnrolled) {
      alert("Please enroll in the course to access chapter content.");
      return;
    }
    // Navigate to chapter detail page
    router.push(`/dashboard/student/courses/${courseId}/chapters/${chapter.id}`);
  };

  const getCompletedChapters = () => {
    if (!course?.chapters) return 0;
    return Math.round((userProgress / 100) * course.chapters.length);
  };

  const getEnrollmentDate = () => {
    if (enrollmentData?.created_at) {
      return getSafeDate(enrollmentData.created_at).toLocaleDateString();
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            {/* Header Skeleton */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="h-64 bg-gray-200 rounded-xl"></div>
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map(n => (
                <div key={n} className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-2">
                    {[1, 2, 3].map(m => (
                      <div key={m} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3].map(n => (
                  <div key={n} className="flex space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Course not found</h1>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => router.push("/dashboard/student/courses")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
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
                  <span>{getSafeDate(course.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Instructor Info */}
              {course.instructor && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {course.instructor.name?.charAt(0) || "I"}
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900"
                          style={{fontFamily: "'PT Sans', 'Tahoma', sans-serif" }}
                      >{course.instructor.name}</p>
                      <p className="text-sm text-gray-600">{course.instructor.email}</p>
                      <p className="text-xs text-blue-600 capitalize">{course.instructor.role}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Enrollment Status Info */}
              {isEnrolled && enrollmentData && (
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-green-900">You are enrolled in this course</p>
                      <p className="text-sm text-green-700">
                        Progress: {userProgress}% • 
                        Enrolled on: {getEnrollmentDate()}
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {userProgress}%
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
                      className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 cursor-pointer rounded-lg font-semibold transition-colors disabled:opacity-50"
                      style={{fontFamily: "'Segoe UI Variable', 'system-ui', sans-serif" }}
                    >
                      {enrolling ? "Unenrolling..." : "Unenroll from Course"}
                    </button>
                    <button
                      onClick={() => course.chapters?.[0] && handleChapterClick(course.chapters[0])}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 cursor-pointer rounded-lg font-semibold transition-colors flex items-center"
                      style={{fontFamily: "'Segoe UI Variable', 'system-ui', sans-serif" }}
                    >
                      <FaPlay className="mr-2" />
                      {userProgress === 100 ? 'Review Course' : 'Continue Learning'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 cursor-pointer rounded-lg font-semibold text-lg transition-colors disabled:opacity-50"
                  >
                    {enrolling ? "Enrolling..." : "Enroll in Course"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section - Only for enrolled students */}
        {isEnrolled && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Learning Progress</h2>
              <span className="text-2xl font-bold text-green-600">{userProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  userProgress === 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${userProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              {getCompletedChapters()} of {course.chapters?.length || 0} chapters completed
              {userProgress === 100 && " 🎉 Course Completed!"}
            </p>
            {enrollmentData && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                <div className="flex items-center">
                  <FaCalendar className="mr-1" />
                  Enrolled: {getEnrollmentDate()}
                </div>
                <div className="flex items-center">
                  <FaCheckCircle className="mr-1" />
                  Last activity: {enrollmentData.updated_at ? getSafeDate(enrollmentData.updated_at).toLocaleDateString() : 'Recently'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Course Content Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Course Content</h2>
            {!isEnrolled && (
              <div className="flex items-center text-orange-600 text-sm">
                <FaLock className="mr-1" />
                <span>Enroll to access content</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {course.chapters?.map((chapter, index) => {
              const isAccessible = isEnrolled;
              
              return (
                <div
                  key={chapter.id}
                  onClick={() => isAccessible && handleChapterClick(chapter)}
                  className={`flex items-center p-4 border rounded-lg transition-all ${
                    isAccessible 
                      ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200' 
                      : 'opacity-75 cursor-not-allowed bg-gray-50'
                  } ${isAccessible ? 'border-gray-200' : 'border-gray-300'}`}
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold mr-4">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                    {chapter.description && (
                      <p className="text-sm text-gray-600 mt-1">{chapter.description}</p>
                    )}
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      {chapter.video_url ? (
                        <>
                          <FaPlay className="mr-1" />
                          <span>Video Lesson</span>
                        </>
                      ) : (
                        <span>Reading Material</span>
                      )}
                    </div>
                  </div>
                  {!isAccessible && (
                    <FaLock className="text-gray-400 text-lg" />
                  )}
                  {isAccessible && (
                    <FaBookOpen className="text-blue-500 text-lg" />
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

        {/* Additional Course Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Course Requirements */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">What You'll Learn</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <FaCheckCircle className="text-green-500 mr-2" />
                Complete understanding of course topics
              </li>
              <li className="flex items-center">
                <FaCheckCircle className="text-green-500 mr-2" />
                Practical skills and knowledge
              </li>
              <li className="flex items-center">
                <FaCheckCircle className="text-green-500 mr-2" />
                Certificate upon completion
              </li>
            </ul>
          </div>

          {/* Course Statistics */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="font-semibold text-black mb-4">Course Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Duration</span>
                <span className="font-medium text-cyan-800">{course.chapters?.length || 0} chapters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Enrolled Students</span>
                <span className="font-medium text-cyan-800">{course.students?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Course Level</span>
                <span className="font-medium text-cyan-800">Beginner to Intermediate</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium text-cyan-800">{getSafeDate(course.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Course Comments Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Course Discussions</h2>
            <span className="text-sm text-gray-500">{comments.length} comments</span>
          </div>

          {/* Add Comment Form */}
          {isEnrolled ? (
            <div className="mb-8">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this course..."
                className="w-full px-4 py-3 text-gray-700 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleAddComment}
                  disabled={submittingComment || !newComment.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 cursor-pointer rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingComment ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
              <p className="text-yellow-700">Please enroll in the course to participate in discussions.</p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaBookOpen className="text-4xl mx-auto mb-3 text-gray-300" />
                <p>No comments yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments.map((comment) => {
                const showReplies = !!expandedComments[comment.id];
                const isCommentLiked = !!comment.is_liked;
                const commentLikes = comment.likes_count ?? 0;

                return (
                  <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {comment.user?.name?.charAt(0) || "U"}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-semibold text-gray-900">{comment.user?.name}</span>
                            <span className="ml-2 text-sm text-gray-500 capitalize">({comment.user?.role})</span>
                          </div>
                          <span className="text-sm text-gray-400">{formatDate(comment.created_at || "")}</span>
                        </div>

                        <p className="text-gray-700 mb-3 whitespace-pre-wrap">{comment.content}</p>

                        <div className="flex items-center space-x-4 text-sm">
                          {/* Parent comment like button: now shows spinner, disables while loading, and has hover effect even when liked */}
                          <button
                            onClick={() => handleToggleLike(comment.id)}
                            disabled={likingCommentId === comment.id}
                            aria-pressed={isCommentLiked}
                            className="flex items-center space-x-1 transition-transform duration-150 cursor-pointer focus:outline-none"
                          >
                            {likingCommentId === comment.id ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full cursor-pointer animate-spin" />
                            ) : (
                              <FaHeart
                                className={`w-4 h-4 ${
                                  isCommentLiked
                                    ? "text-red-500 hover:text-amber-50"
                                    : "text-gray-500 hover:text-red-500"
                                }`}
                                color={isCommentLiked ? "#ef4444" : undefined}
                              />
                            )}
                            <span style={{color: "GrayText"}}>{commentLikes}</span>
                          </button>

                          {comment.replies && comment.replies.length > 0 && (
                            <button
                              onClick={() => toggleReplies(comment.id)}
                              className="flex items-center space-x-1 cursor-pointer text-gray-500 hover:text-blue-600"
                            >
                              {showReplies ? <FaChevronUp className="w-4 h-4" /> : <FaChevronDown className="w-4 h-4" />}
                              <span>{comment.replies.length} replies</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Replies - render only when expanded */}
                    {showReplies && comment.replies && comment.replies.length > 0 && (
                      <div className="ml-14 mt-4 space-y-4 border-l-2 border-gray-100 pl-4">
                        {comment.replies.map((reply) => {
                          const isReplyLiked = !!reply.is_liked;
                          const replyLikes = reply.likes_count ?? 0;

                          return (
                            <div key={reply.id} className="flex space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                  {reply.user?.name?.charAt(0) || "U"}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <div>
                                    <span className="font-medium text-gray-900 text-sm">{reply.user?.name}</span>
                                    <span className="ml-2 text-xs text-gray-500 capitalize">({reply.user?.role})</span>
                                  </div>
                                  <span className="text-xs text-gray-400">{formatDate(reply.created_at || "")}</span>
                                </div>

                                <p className="text-gray-600 text-sm whitespace-pre-wrap">{reply.content}</p>

                                {/* Reply like button (already working) - kept consistent style */}
                                <button
                                  onClick={() => handleToggleLike(reply.id)}
                                  disabled={likingCommentId === reply.id}
                                  className="flex items-center cursor-pointer space-x-1 text-xs mt-2 transition-transform duration-150 focus:outline-none"
                                  aria-pressed={isReplyLiked}
                                >
                                  {likingCommentId === reply.id ? (
                                    <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <FaHeart
                                      className={`w-3 h-3 cursor-pointer ${
                                        isReplyLiked ? "text-red-500 hover:text-red-600" : "text-gray-500 hover:text-red-500"
                                      }`}
                                      color={isReplyLiked ? "#ef4444" : undefined}
                                    />
                                  )}
                                  <span style={{color: "GrayText"}}>{replyLikes}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}