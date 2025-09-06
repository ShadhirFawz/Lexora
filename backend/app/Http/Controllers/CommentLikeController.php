<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Support\Facades\Auth;

class CommentLikeController extends Controller
{
    public function toggle($commentId)
    {
        $user = Auth::user();
        $comment = Comment::findOrFail($commentId);

        // Optional access control: students must be enrolled; instructor must own the course; admin allowed
        $course = $comment->course; // assumes Comment::course() relation exists
        $allowed = false;

        if ($user->role === 'student') {
            $allowed = $user->coursesEnrolled()->where('course_id', $course->id)->exists();
        } elseif ($user->role === 'instructor') {
            $allowed = $course->instructor_id === $user->id;
        } elseif ($user->role === 'admin') {
            $allowed = true;
        }

        if (!$allowed) {
            return response()->json(['error' => 'Unauthorized to like comments in this course'], 403);
        }

        if ($comment->likes()->where('user_id', $user->id)->exists()) {
            $comment->likes()->detach($user->id);
            return response()->json(['message' => 'Like removed']);
        } else {
            $comment->likes()->attach($user->id);
            return response()->json(['message' => 'Like added']);
        }
    }
}
