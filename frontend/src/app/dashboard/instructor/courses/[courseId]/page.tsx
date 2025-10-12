"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReplyModal from "@/components/courses/ReplyModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { instructorCourseApi, courseApi, Course, Chapter, CourseComment, courseCommentApi, courseReactionApi, chapterApi, authApi } from "@/lib/api";
import { 
  FaBookOpen, 
  FaUser, 
  FaChalkboardTeacher, 
  FaUsers, 
  FaCalendar, 
  FaStar,
  FaPlus,
  FaEdit,
  FaTrash,
  FaChevronDown, 
  FaChevronUp, 
  FaHeart
} from "react-icons/fa";
import { useToast } from "@/contexts/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import { DocumentTextIcon, PhotoIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { uploadToCloudinary, uploadResourceToCloudinary } from "@/utils/cloudinary";

interface CourseDetail extends Course {
  chapters?: Chapter[];
  students?: any[];
  total_chapters?: number;
  total_students?: number;
  total_comments?: number;
}

interface ChapterFormData {
  title: string;
  description: string;
  video_url: string;
  image: File | null;
  resource: File | null;
  image_url: string;
  resource_url: string;
  uploadingImage: boolean;
  uploadingResource: boolean;
}

export default function InstructorCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { addToast } = useToast();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CourseComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likingCommentId, setLikingCommentId] = useState<number | null>(null);
  const [expandedComments, setExpandedComments] = useState<{ [key: number]: boolean }>({});
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<CourseComment | null>(null);
  const [reactions, setReactions] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [addingChapter, setAddingChapter] = useState(false);
  const [isCourseOwner, setIsCourseOwner] = useState(false);
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

  const [newChapter, setNewChapter] = useState<ChapterFormData>({
    title: "",
    description: "",
    video_url: "",
    image: null,
    resource: null,
    image_url: "",
    resource_url: "",
    uploadingImage: false,
    uploadingResource: false,
  });

  // Utility function to safely parse a date string or provide a fallback
  const getSafeDate = (dateString: string | undefined | null, fallback: string = new Date().toISOString()): Date => {
    if (!dateString) return new Date(fallback);
    return new Date(dateString);
  };

  const getCurrentInstructorId = async (): Promise<number> => {
    try {
      const userData = await authApi.getMe();
      return userData.id;
    } catch (error) {
      console.error("Failed to get current user:", error);
      throw new Error("Unable to verify user identity");
    }
  };

  useEffect(() => {
    if (!courseId) {
      router.push("/dashboard/instructor/courses");
      return;
    }

    fetchCourseData();
  }, [courseId, router]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      
      // Get current user first
      const currentInstructorId = await getCurrentInstructorId();
      setCurrentUserId(currentInstructorId);

      // Try multiple approaches to get the course data
      let currentCourse: CourseDetail | null = null;

      // Approach 1: Try to get from instructor's courses first
      try {
        const instructorResponse = await instructorCourseApi.getInstructorCourses();
        const instructorCourses = instructorResponse.data || instructorResponse || [];
        currentCourse = instructorCourses.find((c: CourseDetail) => c.id.toString() === courseId) || null;
      } catch (error) {
        console.log("Could not fetch instructor courses, trying general courses...");
      }

      // Approach 2: If not found in instructor courses, try general courses API
      if (!currentCourse) {
        try {
          const generalResponse = await courseApi.getAllCourses();
          const allCourses = generalResponse.data || generalResponse || [];
          currentCourse = allCourses.find((c: CourseDetail) => c.id.toString() === courseId) || null;
        } catch (error) {
          console.log("Could not fetch general courses, trying direct course API...");
        }
      }

      // Approach 3: If still not found, try direct course API
      if (!currentCourse) {
        try {
          currentCourse = await courseApi.getCourse(courseId);
        } catch (error) {
          console.log("Could not fetch course directly");
        }
      }

      if (!currentCourse) {
        throw new Error("Course not found");
      }

      setCourse(currentCourse);

      // Check if current user is the course owner
      setIsCourseOwner(currentCourse.instructor_id === currentInstructorId);

      // Fetch comments
      const commentsData = await courseCommentApi.getComments(courseId);
      setComments(commentsData);

      // Fetch reactions
      const reactionsData = await courseReactionApi.getReactions(parseInt(courseId));
      setReactions(reactionsData);

    } catch (error: any) {
      console.error("Failed to load course data:", error);
      addToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to load course data',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

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
      
      await refreshComments();
      setNewComment('');

      addToast({
        type: 'success',
        title: 'Successfully added',
        message: "Comment added Successfully!",
        duration: 5000,
      });
      
    } catch (error: any) {
      console.error("Failed to add comment:", error);
      addToast({
        type: 'error',
        title: 'Comment Failed',
        message: error.message || "Failed to add comment",
        duration: 5000,
      });
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

  const handleOpenReply = (comment: CourseComment) => {
    setSelectedComment(comment);
    setReplyModalOpen(true);
  };

  const handleCloseReply = () => {
    setReplyModalOpen(false);
    setSelectedComment(null);
  };

  const handleReplyPosted = () => {
    refreshComments();
  };

  const handleToggleLike = async (commentId: number) => {
    const snapshot = comments;

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

    setComments(optimistic);
    setLikingCommentId(commentId);

    try {
      await courseCommentApi.toggleLike(commentId);
    } catch (error: any) {
      console.error("Failed to toggle like:", error);
      addToast({
        type: 'error',
        title: 'Like Failed',
        message: error?.message || "Failed to update like",
        duration: 4000,
      });
      setComments(snapshot);
    } finally {
      setLikingCommentId(null);
    }
  };

  const getReactionCount = (emojiType: string) => {
    return reactions.filter(reaction => reaction.emoji_type === emojiType).length;
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

  const handleDeleteComment = (commentId: number) => {
    showConfirmation(
      "Delete Comment",
      "Are you sure you want to delete this comment? This action cannot be undone.",
      async () => {
        try {
          await courseCommentApi.deleteComment(commentId);
          await refreshComments();

          addToast({
            type: 'success',
            title: 'Comment Deleted',
            message: 'Your comment has been successfully deleted.',
            duration: 3000,
          });
        } catch (error: any) {
          console.error("Failed to delete comment:", error);
          addToast({
            type: 'error',
            title: 'Delete Failed',
            message: error.message || "Failed to delete comment",
            duration: 5000,
          });
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

  // Chapter Management Functions
  const handleChapterImageUpload = async (file: File) => {
    setNewChapter(prev => ({ ...prev, uploadingImage: true }));

    try {
      const result = await uploadToCloudinary(file, 'chapters');
      
      if (result.success && result.url) {
        setNewChapter(prev => ({ 
          ...prev, 
          image_url: result.url!,
          uploadingImage: false 
        }));
        addToast({
          type: 'success',
          title: 'Image Uploaded',
          message: 'Chapter image uploaded successfully!',
          duration: 3000,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Failed to upload chapter image:', error);
      setNewChapter(prev => ({ ...prev, uploadingImage: false }));
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'Failed to upload chapter image',
        duration: 5000,
      });
    }
  };

  const handleChapterResourceUpload = async (file: File) => {
    setNewChapter(prev => ({ ...prev, uploadingResource: true }));

    try {
      const result = await uploadResourceToCloudinary(file, 'resources');
      
      if (result.success && result.url) {
        setNewChapter(prev => ({ 
          ...prev, 
          resource_url: result.url!,
          uploadingResource: false 
        }));
        addToast({
          type: 'success',
          title: 'Resource Uploaded',
          message: 'Chapter resource uploaded successfully!',
          duration: 3000,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Failed to upload resource:', error);
      setNewChapter(prev => ({ ...prev, uploadingResource: false }));
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'Failed to upload resource',
        duration: 5000,
      });
    }
  };

  const handleChapterInputChange = (field: keyof ChapterFormData, value: string | File | null) => {
    setNewChapter(prev => ({ ...prev, [field]: value }));
  };

  const handleChapterImageChange = async (file: File | null) => {
    if (file) {
      setNewChapter(prev => ({ ...prev, image: file }));
      await handleChapterImageUpload(file);
    }
  };

  const handleChapterResourceChange = async (file: File | null) => {
    if (file) {
      setNewChapter(prev => ({ ...prev, resource: file }));
      await handleChapterResourceUpload(file);
    }
  };

  const resetChapterForm = () => {
    setNewChapter({
      title: "",
      description: "",
      video_url: "",
      image: null,
      resource: null,
      image_url: "",
      resource_url: "",
      uploadingImage: false,
      uploadingResource: false,
    });
  };

  const handleAddChapter = async () => {
    if (!newChapter.title.trim()) {
        addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Chapter title is required',
        duration: 4000,
        });
        return;
    }

    try {
        setAddingChapter(true);

        const chapterData = {
        title: newChapter.title,
        description: newChapter.description,
        video_url: newChapter.video_url,
        image: newChapter.image_url, // Send Cloudinary URL
        resource_url: newChapter.resource_url, // Send Cloudinary URL
        order: course?.chapters?.length || 0,
        };

        // Use chapterApi instead of courseApi
        await chapterApi.createChapter(parseInt(courseId), chapterData);
        
        addToast({
        type: 'success',
        title: 'Chapter Added',
        message: 'Chapter added successfully!',
        duration: 5000,
        });

        // Refresh course data to show new chapter
        await fetchCourseData();
        
        // Reset form and hide add chapter section
        resetChapterForm();
        setShowAddChapter(false);

    } catch (error: any) {
        console.error('Failed to add chapter:', error);
        addToast({
        type: 'error',
        title: 'Creation Failed',
        message: error.message || 'Failed to add chapter. Please try again.',
        duration: 5000,
        });
    } finally {
        setAddingChapter(false);
    }
    };

  const getFileNameFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop() || 'resource';
      return decodeURIComponent(fileName);
    } catch {
      const parts = url.split('/');
      const lastPart = parts.pop() || 'resource';
      return decodeURIComponent(lastPart.split('?')[0]);
    }
  };

  const handleEditCourse = () => {
    router.push(`/dashboard/instructor/courses/${courseId}/edit`);
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
                </div>
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
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push("/dashboard/instructor/courses")}
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
                <h1 className="text-3xl font-bold text-gray-900">
                  {course.title}
                </h1>
                {/* Only show edit button if user is course owner */}
                {isCourseOwner && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditCourse}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors"
                    >
                      <FaEdit className="w-4 h-4" />
                      Edit Course
                    </button>
                  </div>
                )}
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
                  <span>{comments.length} Reviews</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaCalendar className="mr-2 text-purple-500" />
                  <span>{getSafeDate(course.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Reactions Section */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Student Reactions</h4>
                <div className="flex space-x-2">
                  {[
                    { type: 'love', icon: '❤️', label: 'Love' },
                    { type: 'thumbs_up', icon: '👍', label: 'Thumbs Up' },
                    { type: 'happy', icon: '😊', label: 'Happy' },
                    { type: 'thumbs_down', icon: '👎', label: 'Thumbs Down' },
                    { type: 'unsatisfied', icon: '😞', label: 'Unsatisfied' }
                  ].map((reaction) => (
                    <div
                      key={reaction.type}
                      className="flex flex-col items-center p-2 bg-gray-100 rounded-lg"
                    >
                      <span className="text-2xl mb-1">{reaction.icon}</span>
                      <span className="text-xs text-gray-600">{getReactionCount(reaction.type)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructor Info */}
              {course.instructor && (
                <div className="bg-blue-50 rounded-lg p-4 mt-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {course.instructor.name?.charAt(0) || "I"}
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900">{course.instructor.name}</p>
                      <p className="text-sm text-gray-600">{course.instructor.email}</p>
                      <p className="text-xs text-blue-600 capitalize">Instructor</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Course Content Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Course Chapters ({course.chapters?.length || 0})</h2>
            {isCourseOwner && (
              <button
                onClick={() => setShowAddChapter(!showAddChapter)}
                className="flex items-center gap-2 border-2 border-dashed hover:border-blue-600 hover:text-blue-600 bg-white text-black px-4 py-2 rounded-lg font-normal cursor-pointer transition-colors"
              >
                <FaPlus className="w-4 h-4" />
                Add Chapter
              </button>
            )}
            
          </div>

          {/* Add Chapter Form */}
          {isCourseOwner && (
            <AnimatePresence>
              {showAddChapter && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border border-gray-200 rounded-xl p-6 bg-gray-50 mb-6 overflow-hidden"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Chapter</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chapter Title *
                        </label>
                        <input
                          type="text"
                          value={newChapter.title}
                          onChange={(e) => handleChapterInputChange('title', e.target.value)}
                          placeholder="Enter chapter title"
                          className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Video URL
                        </label>
                        <input
                          type="url"
                          value={newChapter.video_url}
                          onChange={(e) => handleChapterInputChange('video_url', e.target.value)}
                          placeholder="https://example.com/video"
                          className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chapter Description
                        </label>
                        <textarea
                          value={newChapter.description}
                          onChange={(e) => handleChapterInputChange('description', e.target.value)}
                          placeholder="Describe this chapter's content"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Chapter Image */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chapter Image
                          </label>
                          
                          {/* Image Preview */}
                          {newChapter.image_url && !newChapter.uploadingImage && (
                            <div className="mb-2 border border-gray-200 rounded-lg overflow-hidden">
                              <img 
                                src={newChapter.image_url} 
                                alt="Chapter preview" 
                                className="w-full h-20 object-cover"
                              />
                            </div>
                          )}
                          
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                handleChapterInputChange('image', file);
                                if (file) handleChapterImageChange(file);
                              }}
                              className="hidden"
                              disabled={newChapter.uploadingImage}
                            />
                            <div className={`flex items-center justify-center px-3 py-2 border rounded-lg transition-colors ${
                              newChapter.uploadingImage
                                ? 'border-yellow-400 bg-yellow-50'
                                : 'border-gray-300 hover:border-blue-500'
                            }`}>
                              {newChapter.uploadingImage ? (
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                                  <span className="text-xs text-yellow-700">Uploading</span>
                                </div>
                              ) : (
                                <>
                                  <PhotoIcon className="w-4 h-4 text-gray-400 mr-1" />
                                  <span className="text-xs text-gray-600">
                                    {newChapter.image_url ? 'Change Image' : 'Image'}
                                  </span>
                                </>
                              )}
                            </div>
                          </label>
                        </div>

                        {/* Chapter Resource */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Resource (PDF/TXT)
                          </label>
                          
                          {/* Resource Preview */}
                          {newChapter.resource_url && !newChapter.uploadingResource && (
                            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                                <span className="text-xs text-blue-800 font-medium truncate">
                                  {getFileNameFromUrl(newChapter.resource_url)}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept=".pdf,.txt"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                handleChapterInputChange('resource', file);
                                if (file) handleChapterResourceChange(file);
                              }}
                              className="hidden"
                              disabled={newChapter.uploadingResource}
                            />
                            <div className={`flex items-center justify-center px-3 py-2 border rounded-lg transition-colors ${
                              newChapter.uploadingResource
                                ? 'border-yellow-400 bg-yellow-50'
                                : 'border-gray-300 hover:border-blue-500'
                            }`}>
                              {newChapter.uploadingResource ? (
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                                  <span className="text-xs text-yellow-700">Uploading</span>
                                </div>
                              ) : (
                                <>
                                  <DocumentTextIcon className="w-4 h-4 text-gray-400 mr-1" />
                                  <span className="text-xs text-gray-600">
                                    {newChapter.resource_url ? 'Change Resource' : 'Resource'}
                                  </span>
                                </>
                              )}
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => {
                        setShowAddChapter(false);
                        resetChapterForm();
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddChapter}
                      disabled={addingChapter || !newChapter.title.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {addingChapter ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Adding...
                        </div>
                      ) : (
                        'Add Chapter'
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          

          {/* Chapters List */}
          <div className="space-y-3">
            {course.chapters?.map((chapter, index) => (
              <div
                key={chapter.id}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold mr-4">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                  {chapter.description && (
                    <p className="text-sm text-gray-600 mt-1">{chapter.description}</p>
                  )}
                  <div className="flex items-center mt-2 text-xs text-gray-500 space-x-4">
                    {chapter.video_url && (
                      <div className="flex items-center">
                        <VideoCameraIcon className="w-3 h-3 mr-1" />
                        <span>Video Lesson</span>
                      </div>
                    )}
                    {chapter.image && (
                      <div className="flex items-center">
                        <PhotoIcon className="w-3 h-3 mr-1" />
                        <span>Image</span>
                      </div>
                    )}
                    {chapter.notes_pdf && (
                      <div className="flex items-center">
                        <DocumentTextIcon className="w-3 h-3 mr-1" />
                        <span>Resource</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Order: {chapter.order}
                </div>
              </div>
            ))}
            
            {!course.chapters?.length && !showAddChapter && (
              <div className="text-center py-8 text-gray-500">
                <FaBookOpen className="text-4xl mx-auto mb-3 text-gray-300" />
                <p>No chapters available yet. Add your first chapter!</p>
              </div>
            )}
          </div>
        </div>

        {/* Course Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student Statistics */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Student Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Students</span>
                <span className="font-medium text-blue-600">{course.students?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Students</span>
                <span className="font-medium text-green-600">{Math.floor((course.students?.length || 0) * 0.7)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-medium text-purple-600">65%</span>
              </div>
            </div>
          </div>

          {/* Course Information */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Course Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Course Status</span>
                <span className={`font-medium ${
                  course.status === 'approved' ? 'text-green-600' :
                  course.status === 'pending' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {course.status?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created Date</span>
                <span className="font-medium text-gray-600">{getSafeDate(course.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium text-gray-600">{getSafeDate(course.updated_at).toLocaleDateString()}</span>
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium cursor-pointer transition-colors disabled:opacity-50"
              >
                {submittingComment ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </div>

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
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400">{formatDate(comment.created_at || "")}</span>
                            {(comment.user_id === currentUserId || isCourseOwner) && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-500 cursor-pointer hover:text-red-700 text-sm"
                                title="Delete comment"
                              >
                                <FaTrash className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-700 mb-3 whitespace-pre-wrap">{comment.content}</p>

                        <div className="flex items-center space-x-4 text-sm">
                          <button
                            onClick={() => handleToggleLike(comment.id)}
                            disabled={likingCommentId === comment.id}
                            aria-pressed={isCommentLiked}
                            className="flex items-center space-x-1 transition-transform duration-150 focus:outline-none"
                          >
                            {likingCommentId === comment.id ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FaHeart
                                className={`w-4 h-4 cursor-pointer ${
                                  isCommentLiked
                                    ? "text-red-500 hover:text-amber-50"
                                    : "text-gray-500 hover:text-red-500"
                                }`}
                                color={isCommentLiked ? "#ef4444" : undefined}
                              />
                            )}
                            <span style={{color: "GrayText"}}>{commentLikes}</span>
                          </button>

                          <button
                            onClick={() => handleOpenReply(comment)}
                            className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 cursor-pointer transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            <span>Reply</span>
                          </button>

                          {comment.replies && comment.replies.length > 0 && (
                            <button
                              onClick={() => toggleReplies(comment.id)}
                              className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 cursor-pointer"
                            >
                              {showReplies ? <FaChevronUp className="w-4 h-4" /> : <FaChevronDown className="w-4 h-4" />}
                              <span>{comment.replies.length} replies</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Replies */}
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
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-400">{formatDate(reply.created_at || "")}</span>
                                    {(reply.user_id === currentUserId || isCourseOwner) && (
                                      <button
                                        onClick={() => handleDeleteComment(reply.id)}
                                        className="text-red-500 cursor-pointer hover:text-red-700 text-xs"
                                        title="Delete reply"
                                      >
                                        <FaTrash className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-gray-600 text-sm whitespace-pre-wrap">{reply.content}</p>

                                <button
                                  onClick={() => handleToggleLike(reply.id)}
                                  disabled={likingCommentId === reply.id}
                                  className="flex items-center space-x-1 text-xs mt-2 transition-transform duration-150 focus:outline-none"
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

      {/* Reply Modal */}
      {selectedComment && (
        <ReplyModal
          isOpen={replyModalOpen}
          onClose={handleCloseReply}
          parentComment={selectedComment}
          courseId={courseId}
          onReplyPosted={handleReplyPosted}
        />
      )}

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && confirmationModal.title && (
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmationModal.onConfirm}
          title={confirmationModal.title}
          message={confirmationModal.message}
          variant={confirmationModal.variant}
        />
      )}
    </div>
  );
}