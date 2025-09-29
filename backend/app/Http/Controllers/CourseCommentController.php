<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
        $comments = CourseComment::where('course_id', $courseId)
            ->whereNull('parent_id')
            ->with(['user:id,name', 'replies.user:id,name'])
            ->get();

        return response()->json($comments);
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
