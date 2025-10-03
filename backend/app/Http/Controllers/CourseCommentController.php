<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CourseCommentController extends Controller
{
    public function store(Request $request, $courseId)
    {
        $user = Auth::user();
        if ($user->role !== 'student') {
            return response()->json(['error' => 'Only students can comment on courses'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string',
            'parent_id' => 'nullable|exists:course_comments,id'
        ]);

        $comment = CourseComment::create([
            'course_id' => $courseId,
            'user_id' => $user->id,
            'content' => $validated['content'],
            'parent_id' => $validated['parent_id'] ?? null
        ]);

        return response()->json($comment->load('user:id,name'));
    }

    public function index($courseId)
    {
        try {
            $userId = Auth::id();

            // Get all comments for this course (both main and replies)
            $allComments = CourseComment::where('course_id', $courseId)
                ->with(['user:id,name,role'])
                ->get();

            // Get all comment IDs
            $commentIds = $allComments->pluck('id')->toArray();

            // Get likes count for all comments in one query
            $likesCounts = DB::table('course_comment_likes')
                ->whereIn('course_comment_id', $commentIds)
                ->select('course_comment_id', DB::raw('COUNT(*) as count'))
                ->groupBy('course_comment_id')
                ->pluck('count', 'course_comment_id');

            // Get which comments are liked by current user
            $likedCommentIds = DB::table('course_comment_likes')
                ->whereIn('course_comment_id', $commentIds)
                ->where('user_id', $userId)
                ->pluck('course_comment_id')
                ->toArray();

            // Process all comments
            $allComments->each(function ($comment) use ($likesCounts, $likedCommentIds) {
                $comment->likes_count = $likesCounts[$comment->id] ?? 0;
                $comment->is_liked = in_array($comment->id, $likedCommentIds);
            });

            // Separate main comments and replies
            $mainComments = $allComments->where('parent_id', null)->values();
            $allReplies = $allComments->where('parent_id', '!=', null);

            // Attach replies to main comments
            $mainComments->each(function ($comment) use ($allReplies) {
                $comment->replies = $allReplies->where('parent_id', $comment->id)->values();
            });

            return response()->json($mainComments);
        } catch (\Exception $e) {
            Log::error('Error fetching comments: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to load comments'], 500);
        }
    }

    public function destroy($commentId)
    {
        $user = Auth::user();
        $comment = CourseComment::findOrFail($commentId);

        // Check if user is the comment author or admin
        if ($comment->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized - You can only delete your own comments'], 403);
        }

        // Delete the comment (replies will be handled by database cascade if set up)
        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully']);
    }

    public function toggleLike($commentId)
    {
        $user = Auth::user();
        $comment = CourseComment::findOrFail($commentId);

        // Toggle like logic similar to chapter comments
        if ($comment->likes()->where('user_id', $user->id)->exists()) {
            $comment->likes()->detach($user->id);
            return response()->json(['message' => 'Like removed']);
        } else {
            $comment->likes()->attach($user->id);
            return response()->json(['message' => 'Like added']);
        }
    }
}
