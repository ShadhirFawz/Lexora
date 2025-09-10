<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    public function store(Request $request, $courseId)
    {
        $validated = $request->validate([
            'content'   => 'required|string',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        $user = Auth::user();
        $course = Course::findOrFail($courseId);

        if (!$this->isAuthorized($user, $courseId)) {
            return response()->json(['error' => 'Unauthorized to comment on this course'], 403);
        }

        $comment = Comment::create([
            'course_id' => $courseId,
            'user_id'   => $user->id,
            'content'   => $validated['content'],
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        return response()->json($this->formatComment($comment), 201);
    }

    public function reply(Request $request, $commentId)
    {
        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $parent = Comment::findOrFail($commentId);
        $user = Auth::user();
        $course = $parent->course;

        if (!$this->isAuthorized($user, $course->id)) {
            return response()->json(['error' => 'Unauthorized to reply on this course'], 403);
        }

        $reply = Comment::create([
            'course_id' => $course->id,
            'user_id'   => $user->id,
            'content'   => $validated['content'],
            'parent_id' => $parent->id,
        ]);

        return response()->json($this->formatComment($reply), 201);
    }

    public function index($courseId)
    {
        $comments = Comment::where('course_id', $courseId)
            ->whereNull('parent_id')
            ->with('replies')
            ->get();

        return response()->json(
            $comments->map(fn($c) => $this->formatCommentWithReplies($c))
        );
    }

    public function destroy($id)
    {
        $comment = Comment::findOrFail($id);
        $user = Auth::user();

        if ($comment->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $comment->delete();
        return response()->json(['message' => 'Comment deleted']);
    }

    // 🔹 Utility: check if user is allowed to comment
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

        // Admins CANNOT reply, only manage/delete
        return false;
    }

    // 🔹 Utility: format a single comment
    private function formatComment(Comment $comment): array
    {
        return [
            'id'      => $comment->id,
            'content' => $comment->content,
            'author'  => $comment->user->name . ' (' . $comment->user->role . ')',
            'created' => $comment->created_at->toDateTimeString(),
        ];
    }

    // 🔹 Utility: recursive formatting with replies
    private function formatCommentWithReplies(Comment $comment): array
    {
        return [
            'id'      => $comment->id,
            'content' => $comment->content,
            'author'  => $comment->user->name . ' (' . $comment->user->role . ')',
            'created' => $comment->created_at->toDateTimeString(),
            'replies' => $comment->replies
                ->map(fn($reply) => $this->formatCommentWithReplies($reply))
                ->toArray(),
        ];
    }
}
