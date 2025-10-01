"use client";

import { useState } from "react";
import { CourseComment, courseCommentApi } from "@/lib/api";
import Modal from "../ui/Modal";

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentComment: CourseComment;
  courseId: string;
  onReplyPosted: () => void;
}

export default function ReplyModal({ 
  isOpen, 
  onClose, 
  parentComment, 
  courseId, 
  onReplyPosted 
}: ReplyModalProps) {
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!replyContent.trim()) return;

    try {
      setIsSubmitting(true);
      await courseCommentApi.addComment(courseId, replyContent.trim(), parentComment.id);
      
      // Clear form and close modal
      setReplyContent("");
      onReplyPosted(); // Refresh comments
      onClose();
      
    } catch (error: any) {
      console.error("Failed to post reply:", error);
      alert(error.message || "Failed to post reply");
    } finally {
      setIsSubmitting(false);
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reply to Comment">
      <div className="p-6 space-y-4">
        {/* Original Comment Preview */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
              {parentComment.user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-gray-900 text-sm">
                  {parentComment.user?.name}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  ({parentComment.user?.role})
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(parentComment.created_at || "")}
                </span>
              </div>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">
                {parentComment.content}
              </p>
            </div>
          </div>
        </div>

        {/* Reply Form */}
        <div className="space-y-3">
          <label htmlFor="reply" className="block text-sm font-medium text-gray-700">
            Your Reply
          </label>
          <textarea
            id="reply"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write your reply..."
            className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !replyContent.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Posting..." : "Post Reply"}
          </button>
        </div>
      </div>
    </Modal>
  );
}