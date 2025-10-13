<?php

namespace App\Http\Controllers;

use App\Models\ChapterComment;
use App\Models\Chapter;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ChapterCommentController extends Controller
{
    public function store(Request $request, $chapterId)
    {
        $validated = $request->validate([
            'content'   => 'required|string',
            'parent_id' => 'nullable|exists:chapter_comments,id',
        ]);

        $user = Auth::user();
        $chapter = Chapter::findOrFail($chapterId);

        if (!$this->isAuthorized($user, $chapter->course_id)) {
            return response()->json(['error' => 'Unauthorized to comment on this chapter'], 403);
        }

        $comment = ChapterComment::create([
            'chapter_id' => $chapterId,
            'course_id'  => $chapter->course_id,
            'user_id'    => $user->id,
            'content'    => $validated['content'],
            'parent_id'  => $validated['parent_id'] ?? null,
        ]);

        return response()->json($this->formatCommentWithLikes($comment), 201);
    }

    public function reply(Request $request, $commentId)
    {
        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $parent = ChapterComment::findOrFail($commentId);
        $user = Auth::user();

        if (!$this->isAuthorized($user, $parent->course_id)) {
            return response()->json(['error' => 'Unauthorized to reply on this chapter'], 403);
        }

        $reply = ChapterComment::create([
            'chapter_id' => $parent->chapter_id,
            'course_id'  => $parent->course_id,
            'user_id'    => $user->id,
            'content'    => $validated['content'],
            'parent_id'  => $parent->id,
        ]);

        return response()->json($this->formatCommentWithLikes($reply), 201);
    }

    public function index($chapterId)
    {
        $user = Auth::user();
        $chapter = Chapter::findOrFail($chapterId);

        try {
            // Get all comments for this chapter (both main and replies)
            $allComments = ChapterComment::where('chapter_id', $chapterId)
                ->with(['user:id,name,role'])
                ->get();

            // Get all comment IDs
            $commentIds = $allComments->pluck('id')->toArray();

            // Get likes count for all comments in one query
            $likesCounts = DB::table('chapter_comment_likes')
                ->whereIn('chapter_comment_id', $commentIds)
                ->select('chapter_comment_id', DB::raw('COUNT(*) as count'))
                ->groupBy('chapter_comment_id')
                ->pluck('count', 'chapter_comment_id');

            // Get which comments are liked by current user
            $likedCommentIds = DB::table('chapter_comment_likes')
                ->whereIn('chapter_comment_id', $commentIds)
                ->where('user_id', $user->id)
                ->pluck('chapter_comment_id')
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

            // Format the response
            $formattedComments = $mainComments->map(function ($comment) {
                return $this->formatCommentWithReplies($comment);
            });

            return response()->json($formattedComments);
        } catch (\Exception $e) {
            Log::error('Error fetching chapter comments: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to load comments'], 500);
        }
    }

    public function destroy($id)
    {
        $comment = ChapterComment::findOrFail($id);
        $user = Auth::user();

        if ($comment->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized - You can only delete your own comments'], 403);
        }

        $comment->delete();
        return response()->json(['message' => 'Comment deleted']);
    }

    public function toggleLike($commentId)
    {
        $user = Auth::user();
        $comment = ChapterComment::findOrFail($commentId);

        // Check if user is authorized to like comments in this chapter
        if (!$this->isAuthorized($user, $comment->course_id)) {
            return response()->json(['error' => 'Unauthorized to like comments in this chapter'], 403);
        }

        // Toggle like
        if ($comment->likes()->where('user_id', $user->id)->exists()) {
            $comment->likes()->detach($user->id);
            return response()->json(['message' => 'Like removed', 'liked' => false]);
        } else {
            $comment->likes()->attach($user->id);
            return response()->json(['message' => 'Like added', 'liked' => true]);
        }
    }

    // 🔹 Utility: check if user is allowed to comment/like
    private function isAuthorized($user, $courseId): bool
    {
        if ($user->role === 'student') {
            // Student must be enrolled in this course
            return $user->coursesEnrolled()->where('course_id', $courseId)->exists();
        }

        if ($user->role === 'instructor') {
            // Instructor must own the course
            return Course::where('id', $courseId)
                ->where('instructor_id', $user->id)
                ->exists();
        }

        // Admins CANNOT comment/like, only manage/delete
        return false;
    }

    // 🔹 Utility: format a single comment with likes
    private function formatCommentWithLikes(ChapterComment $comment): array
    {
        return [
            'id' => $comment->id,
            'content' => $comment->content,
            'user_id' => $comment->user_id,
            'user' => [
                'id' => $comment->user->id,
                'name' => $comment->user->name,
                'role' => $comment->user->role,
            ],
            'parent_id' => $comment->parent_id,
            'chapter_id' => $comment->chapter_id,
            'course_id' => $comment->course_id,
            'likes_count' => $comment->likes_count ?? 0,
            'is_liked' => $comment->is_liked ?? false,
            'created' => $comment->created_at->toDateTimeString(),
            'created_at' => $comment->created_at->toDateTimeString(),
            'updated_at' => $comment->updated_at->toDateTimeString(),
        ];
    }

    // 🔹 Utility: recursive formatting with replies and likes
    private function formatCommentWithReplies(ChapterComment $comment): array
    {
        $formatted = [
            'id' => $comment->id,
            'content' => $comment->content,
            'user_id' => $comment->user_id,
            'user' => [
                'id' => $comment->user->id,
                'name' => $comment->user->name,
                'role' => $comment->user->role,
            ],
            'parent_id' => $comment->parent_id,
            'chapter_id' => $comment->chapter_id,
            'course_id' => $comment->course_id,
            'likes_count' => $comment->likes_count ?? 0,
            'is_liked' => $comment->is_liked ?? false,
            'created' => $comment->created_at->toDateTimeString(),
            'created_at' => $comment->created_at->toDateTimeString(),
            'updated_at' => $comment->updated_at->toDateTimeString(),
        ];

        if ($comment->replies && $comment->replies->count() > 0) {
            $formatted['replies'] = $comment->replies->map(function ($reply) {
                return $this->formatCommentWithReplies($reply);
            })->toArray();
        } else {
            $formatted['replies'] = [];
        }

        return $formatted;
    }
}
