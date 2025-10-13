"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  chapterLearningApi, 
  noteApi, 
  chapterCommentApi, 
  progressApi,
  StudentNote, 
  ChapterComment, 
  ChapterLearningData 
} from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { 
  FaPlay, 
  FaPause, 
  FaBook, 
  FaComment, 
  FaStickyNote, 
  FaArrowLeft, 
  FaArrowRight,
  FaHeart,
  FaChevronDown,
  FaChevronUp,
  FaTrash
} from "react-icons/fa";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

// Simple YouTube type declarations - put this at the top of the file
type YouTubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
};

type YouTubePlayerOptions = {
  height?: string;
  width?: string;
  videoId?: string;
  playerVars?: {
    playsinline?: number;
    enablejsapi?: number;
    modestbranding?: number;
    rel?: number;
    showinfo?: number;
    iv_load_policy?: number;
    controls?: number;
    autoplay?: number;
  };
  events?: {
    onReady?: (event: any) => void;
    onStateChange?: (event: any) => void;
    onError?: (event: any) => void;
  };
};

type YouTube = {
  Player: new (elementId: string, options: YouTubePlayerOptions) => YouTubePlayer;
};

declare global {
  interface Window {
    YT: YouTube;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function ChapterLearnPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  
  const courseId = params.courseId as string;
  const chapterId = params.chapterId as string;

  const [learningData, setLearningData] = useState<ChapterLearningData | null>(null);
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [comments, setComments] = useState<ChapterComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [expandedComments, setExpandedComments] = useState<{ [key: number]: boolean }>({});
  const [likingCommentId, setLikingCommentId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedPositionRef = useRef<number>(0);

  // Confirmation modal state
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

  // Load YouTube API
  useEffect(() => {
    if (!learningData?.chapter?.video_url) return;

    // Check if YouTube API is already loaded
    if (window.YT && window.YT.Player) {
      initializePlayer();
      return;
    }

    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Set up callback when API is ready
    window.onYouTubeIframeAPIReady = initializePlayer;

    return () => {
      // Cleanup
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [learningData?.chapter?.video_url]);

  const initializePlayer = () => {
    if (!videoRef.current || !learningData?.chapter?.video_url) return;

    const videoId = extractVideoId(learningData.chapter.video_url);
    if (!videoId) return;

    // Create unique ID for the player
    const playerId = `youtube-player-${chapterId}-${Date.now()}`;
    videoRef.current.id = playerId;

    playerRef.current = new window.YT.Player(playerId, {
      height: '360',
      width: '640',
      videoId: videoId,
      playerVars: {
        playsinline: 1,
        enablejsapi: 1,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange
      }
    });
  };

  const onPlayerReady = (event: any) => {
    setVideoReady(true);
    setDuration(event.target.getDuration());
  };

  const onPlayerStateChange = (event: any) => {
    const playerState = event.data;
    
    // Use direct numbers for YouTube player states
    switch (playerState) {
      case 1: // PLAYING
        setIsPlaying(true);
        startProgressTracking();
        break;
      case 2: // PAUSED
        setIsPlaying(false);
        stopProgressTracking();
        break;
      case 0: // ENDED
        setIsPlaying(false);
        stopProgressTracking();
        handleVideoEnded();
        break;
      case 3: // BUFFERING
        setIsPlaying(false);
        break;
    }
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
    }

    // Update UI more frequently for smooth display (every 100ms)
    const uiUpdateInterval = setInterval(() => {
        if (playerRef.current) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        }
    }, 100);

    // Update progress for saving less frequently (every 10 seconds)
    progressIntervalRef.current = setInterval(() => {
        if (playerRef.current && isPlaying) {
        const time = playerRef.current.getCurrentTime();
        updateProgress(time);
        }
    }, 10000);

    // Store both intervals for cleanup
    progressIntervalRef.current = uiUpdateInterval as any;
    };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleVideoEnded = async () => {
    try {
      await progressApi.updateProgress(parseInt(courseId), parseInt(chapterId), true, 1000);
      addToast({
        type: 'success',
        title: 'Chapter Completed!',
        message: 'Progress updated successfully',
        duration: 3000,
      });
    } catch (error) {
      console.error("Failed to update progress on video end:", error);
    }
  };

  // Load chapter data
  useEffect(() => {
    const loadChapterData = async () => {
      try {
        setLoading(true);
        const [chapterData, notesData, commentsData] = await Promise.all([
          chapterLearningApi.getChapterForLearning(chapterId),
          noteApi.getNotes(chapterId),
          chapterCommentApi.getComments(chapterId)
        ]);

        setLearningData(chapterData);
        setNotes(notesData);
        setComments(commentsData);
        
        if (commentsData.length > 0) {
          setCurrentUserId(commentsData[0].user_id);
        } else if (notesData.length > 0) {
          setCurrentUserId(notesData[0].student_id);
        }

      } catch (error: any) {
        console.error("Failed to load chapter data:", error);
        addToast({
          type: 'error',
          title: 'Load Failed',
          message: error.message || "Failed to load chapter data",
          duration: 5000,
        });
        router.push(`/dashboard/student/courses/${courseId}`);
      } finally {
        setLoading(false);
      }
    };

    if (chapterId) {
      loadChapterData();
    }
  }, [chapterId, courseId, router, addToast]);

  // Progress tracking and auto-save
  const updateProgress = useCallback(async (position: number) => {
    try {
      const progressIndex = duration > 0 ? Math.min(1000, Math.round((position / duration) * 1000)) : 0;
      
      if (Math.abs(progressIndex - lastSavedPositionRef.current) > 10) {
        await progressApi.autoSaveProgress(
          parseInt(courseId),
          parseInt(chapterId),
          progressIndex
        );
        lastSavedPositionRef.current = progressIndex;
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  }, [courseId, chapterId, duration]);

  // Save progress when leaving page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentTime > 0) {
        updateProgress(currentTime);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (currentTime > 0) {
        updateProgress(currentTime);
      }
      stopProgressTracking();
    };
  }, [currentTime, updateProgress]);

  // YouTube helper functions
  const extractVideoId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  // Video control functions
  const playVideo = () => {
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
  };

  const pauseVideo = () => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
  };

  const seekTo = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds, true);
    }
  };

  // Note functions
  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      setSubmittingNote(true);
      await noteApi.saveNote(
        parseInt(courseId),
        parseInt(chapterId),
        newNote.trim(),
        Math.round(currentTime)
      );

      const updatedNotes = await noteApi.getNotes(chapterId);
      setNotes(updatedNotes);
      setNewNote("");
      setShowNoteForm(false);

      addToast({
        type: 'success',
        title: 'Note Added',
        message: 'Your note has been saved successfully',
        duration: 3000,
      });
    } catch (error: any) {
      console.error("Failed to add note:", error);
      addToast({
        type: 'error',
        title: 'Note Failed',
        message: error.message || "Failed to save note",
        duration: 5000,
      });
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDeleteNote = (noteId: number) => {
    showConfirmation(
      "Delete Note",
      "Are you sure you want to delete this note? This action cannot be undone.",
      async () => {
        try {
          await noteApi.deleteNote(noteId);
          const updatedNotes = await noteApi.getNotes(chapterId);
          setNotes(updatedNotes);
          addToast({
            type: 'success',
            title: 'Note Deleted',
            message: 'Your note has been deleted successfully',
            duration: 3000,
          });
        } catch (error: any) {
          console.error("Failed to delete note:", error);
          addToast({
            type: 'error',
            title: 'Delete Failed',
            message: error.message || "Failed to delete note",
            duration: 5000,
          });
        }
      },
      "danger"
    );
  };

  // Comment functions
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      await chapterCommentApi.addComment(chapterId, newComment.trim());
      
      const updatedComments = await chapterCommentApi.getComments(chapterId);
      setComments(updatedComments);
      setNewComment("");

      addToast({
        type: 'success',
        title: 'Comment Added',
        message: 'Your comment has been posted successfully',
        duration: 3000,
      });
    } catch (error: any) {
      console.error("Failed to add comment:", error);
      addToast({
        type: 'error',
        title: 'Comment Failed',
        message: error.message || "Failed to post comment",
        duration: 5000,
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleToggleLike = async (commentId: number) => {
    const snapshot = comments;

    const optimistic = comments.map(comment => 
      updateCommentLikes(comment, commentId)
    );
    setComments(optimistic);
    setLikingCommentId(commentId);

    try {
      await chapterCommentApi.toggleLike(commentId);
    } catch (error: any) {
      console.error("Failed to toggle like:", error);
      addToast({
        type: 'error',
        title: 'Like Failed',
        message: error.message || "Failed to update like",
        duration: 4000,
      });
      setComments(snapshot);
    } finally {
      setLikingCommentId(null);
    }
  };

  const updateCommentLikes = (comment: ChapterComment, targetId: number): ChapterComment => {
    if (comment.id === targetId) {
      return {
        ...comment,
        is_liked: !comment.is_liked,
        likes_count: comment.likes_count + (comment.is_liked ? -1 : 1),
      };
    }

    if (comment.replies) {
      return {
        ...comment,
        replies: comment.replies.map(reply => updateCommentLikes(reply, targetId)),
      };
    }

    return comment;
  };

  const toggleReplies = (commentId: number) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleDeleteComment = (commentId: number) => {
    showConfirmation(
      "Delete Comment",
      "Are you sure you want to delete this comment? This action cannot be undone.",
      async () => {
        try {
          await chapterCommentApi.deleteComment(commentId);
          const updatedComments = await chapterCommentApi.getComments(chapterId);
          setComments(updatedComments);
          addToast({
            type: 'success',
            title: 'Comment Deleted',
            message: 'Your comment has been deleted successfully',
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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const navigateToChapter = (targetChapterId: number) => {
    router.push(`/dashboard/student/courses/${courseId}/chapters/${targetChapterId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {[1, 2].map(n => (
                  <div key={n} className="bg-white rounded-lg shadow p-6">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-2">
                      {[1, 2, 3].map(m => (
                        <div key={m} className="h-4 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-6">
                {[1, 2].map(n => (
                  <div key={n} className="bg-white rounded-lg shadow p-6">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-3">
                      {[1, 2].map(m => (
                        <div key={m} className="h-4 bg-gray-200 rounded"></div>
                      ))}
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

  if (!learningData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Chapter not found</h1>
          <p className="text-gray-600 mb-6">The chapter you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => router.push(`/dashboard/student/courses/${courseId}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  const { chapter, navigation, course } = learningData;
  const videoId = chapter.video_url ? extractVideoId(chapter.video_url) : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{chapter.title}</h1>
              <p className="text-gray-600 mt-1">
                Chapter {navigation.current.order} of {navigation.current.total_chapters} • {course.title}
              </p>
            </div>
            
            {/* Navigation */}
            <div className="flex space-x-3">
              {navigation.previous && (
                <button
                  onClick={() => navigateToChapter(navigation.previous!.id)}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FaArrowLeft className="mr-2" />
                  Previous
                </button>
              )}
              
              {navigation.next && (
                <button
                  onClick={() => navigateToChapter(navigation.next!.id)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Next
                  <FaArrowRight className="ml-2" />
                </button>
              )}
            </div>
          </div>

          {chapter.description && (
            <p className="text-gray-700 border-t pt-4">{chapter.description}</p>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Video and Notes */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Video Player */}
            <div className="bg-white rounded-lg shadow">
              {videoId ? (
                <div>
                  <div className="relative">
                    <div ref={videoRef} className="w-full h-96 rounded-t-lg"></div>
                    
                    {/* Video Controls Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={isPlaying ? pauseVideo : playVideo}
                            className="p-2 bg-white/20 rounded-full hover:bg-white/30 cursor-pointer transition-colors"
                          >
                            {isPlaying ? <FaPause className="w-4 h-4" /> : <FaPlay className="w-4 h-4" />}
                          </button>
                          <span className="text-sm">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="flex-1 mx-4">
                          <div className="w-full bg-white/30 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full transition-all"
                              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Note Button */}
                  <div className="p-4 border-t">
                    <button
                      onClick={() => setShowNoteForm(!showNoteForm)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                    >
                      <FaStickyNote className="mr-2" />
                      Add Note at {formatTime(currentTime)}
                    </button>
                    
                    {/* Note Form */}
                    {showNoteForm && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="mb-3 text-sm text-blue-700 font-medium">
                            Adding note at: {formatTime(currentTime)}
                        </div>
                        <textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Add your note at this timestamp..."
                          className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                        />
                        <div className="flex justify-end space-x-3 mt-3">
                          <button
                            onClick={() => setShowNoteForm(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddNote}
                            disabled={submittingNote || !newNote.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors disabled:opacity-50"
                          >
                            {submittingNote ? "Adding..." : "Add Note"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center bg-gray-200 rounded-t-lg">
                  <div className="text-center text-gray-500">
                    <FaBook className="text-4xl mx-auto mb-2" />
                    <p>No video available for this chapter</p>
                  </div>
                </div>
              )}
            </div>

            {/* Student Notes Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FaStickyNote className="mr-2 text-blue-500" />
                My Notes ({notes.length})
              </h2>
              
              {notes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FaStickyNote className="text-4xl mx-auto mb-3 text-gray-300" />
                  <p>No notes yet. Add your first note while watching the video!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div 
                      key={note.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                      onClick={() => seekTo(note.timestamp)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {note.formatted_timestamp}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                          className="text-red-500 hover:text-red-700 cursor-pointer transition-colors"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{note.note}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        Added on {new Date(note.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chapter Resources */}
            {chapter.notes_pdf && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FaBook className="mr-2 text-green-500" />
                  Chapter Resources
                </h2>
                <a
                  href={chapter.notes_pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <FaBook className="mr-3" />
                  Download Chapter Notes (PDF)
                </a>
              </div>
            )}
          </div>

          {/* Right Column - Comments */}
          <div className="space-y-6">
            {/* Comments Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FaComment className="mr-2 text-purple-500" />
                Discussion ({comments.length})
              </h2>

              {/* Add Comment Form */}
              <div className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts or ask questions..."
                  className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleAddComment}
                    disabled={submittingComment || !newComment.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {submittingComment ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-6">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FaComment className="text-4xl mx-auto mb-3 text-gray-300" />
                    <p>No comments yet. Start the discussion!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      currentUserId={currentUserId}
                      expanded={!!expandedComments[comment.id]}
                      onToggleReplies={() => toggleReplies(comment.id)}
                      onToggleLike={handleToggleLike}
                      onDeleteComment={handleDeleteComment}
                      likingCommentId={likingCommentId}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
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

// CommentItem Component
interface CommentItemProps {
  comment: ChapterComment;
  currentUserId: number | null;
  expanded: boolean;
  onToggleReplies: () => void;
  onToggleLike: (commentId: number) => void;
  onDeleteComment: (commentId: number) => void;
  likingCommentId: number | null;
}

function CommentItem({ 
  comment, 
  currentUserId, 
  expanded, 
  onToggleReplies, 
  onToggleLike, 
  onDeleteComment,
  likingCommentId 
}: CommentItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="border-b border-gray-200 pb-6 last:border-b-0">
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {comment.user.name.charAt(0)}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-semibold text-gray-900">{comment.user.name}</span>
              <span className="ml-2 text-sm text-gray-500 capitalize">({comment.user.role})</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">{formatDate(comment.created_at)}</span>
              {comment.user_id === currentUserId && (
                <button
                  onClick={() => onDeleteComment(comment.id)}
                  className="text-red-500 hover:text-red-700 text-sm cursor-pointer transition-colors"
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
              onClick={() => onToggleLike(comment.id)}
              disabled={likingCommentId === comment.id}
              className="flex items-center space-x-1 transition-colors disabled:opacity-50"
            >
              {likingCommentId === comment.id ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FaHeart
                  className={`w-4 h-4 ${
                    comment.is_liked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                  }`}
                />
              )}
              <span className={comment.is_liked ? "text-red-500" : "text-gray-500"}>
                {comment.likes_count}
              </span>
            </button>

            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={onToggleReplies}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
              >
                {expanded ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                <span>{comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
              </button>
            )}
          </div>

          {/* Replies */}
          {expanded && comment.replies && comment.replies.length > 0 && (
            <div className="ml-8 mt-4 space-y-4 border-l-2 border-gray-100 pl-4">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                      {reply.user.name.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="font-medium text-gray-900 text-sm">{reply.user.name}</span>
                        <span className="ml-2 text-xs text-gray-500 capitalize">({reply.user.role})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">{formatDate(reply.created_at)}</span>
                        {reply.user_id === currentUserId && (
                          <button
                            onClick={() => onDeleteComment(reply.id)}
                            className="text-red-500 hover:text-red-700 text-xs cursor-pointer transition-colors"
                            title="Delete reply"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{reply.content}</p>
                    
                    <button
                      onClick={() => onToggleLike(reply.id)}
                      disabled={likingCommentId === reply.id}
                      className="flex items-center space-x-1 text-xs mt-2 transition-colors disabled:opacity-50"
                    >
                      {likingCommentId === reply.id ? (
                        <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FaHeart
                          className={`w-3 h-3 ${
                            reply.is_liked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                          }`}
                        />
                      )}
                      <span className={reply.is_liked ? "text-red-500" : "text-gray-500"}>
                        {reply.likes_count}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}