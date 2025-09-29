<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Chapter;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChapterCommentController extends Controller
{
    public function store(Request $request, $chapterId)
    {
        $validated = $request->validate([
            'content'   => 'required|string',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        $user = Auth::user();
        $chapter = Chapter::findOrFail($chapterId);

        if (!$this->isAuthorized($user, $chapter->course_id)) {
            return response()->json(['error' => 'Unauthorized to comment on this chapter'], 403);
        }

        $comment = Comment::create([
            'chapter_id' => $chapterId,
            'course_id'  => $chapter->course_id, // Keep course_id for easier querying
            'user_id'    => $user->id,
            'content'    => $validated['content'],
            'parent_id'  => $validated['parent_id'] ?? null,
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

        if (!$this->isAuthorized($user, $parent->course_id)) {
            return response()->json(['error' => 'Unauthorized to reply on this chapter'], 403);
        }

        $reply = Comment::create([
            'chapter_id' => $parent->chapter_id,
            'course_id'  => $parent->course_id,
            'user_id'    => $user->id,
            'content'    => $validated['content'],
            'parent_id'  => $parent->id,
        ]);

        return response()->json($this->formatComment($reply), 201);
    }

    public function index($chapterId)
    {
        $chapter = Chapter::findOrFail($chapterId);

        $comments = Comment::where('chapter_id', $chapterId)
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
