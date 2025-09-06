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

        // Policy: Enrolled students OR the course instructor OR admin can comment
        $isEnrolled = $user->role === 'student'
            ? $user->coursesEnrolled()->where('course_id', $courseId)->exists()
            : false;

        $isInstructor = $user->role === 'instructor' && $course->instructor_id === $user->id;
        $isAdmin = $user->role === 'admin';

        if (!$isEnrolled && !$isInstructor && !$isAdmin) {
            return response()->json(['error' => 'Unauthorized to comment on this course'], 403);
        }

        $comment = Comment::create([
            'course_id' => $courseId,
            'user_id'   => $user->id,
            'content'   => $validated['content'],
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        return response()->json($comment, 201);
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
}
