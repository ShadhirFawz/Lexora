<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CommentLikeController extends Controller
{
    public function toggle($commentId): JsonResponse
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        try {
            // eager load course to avoid N+1
            $comment = Comment::with('course')->findOrFail($commentId);

            // ensure the Comment model has a course relationship or course_id
            $course = $comment->course ?? null;
            if (! $course && empty($comment->course_id)) {
                return response()->json(['error' => 'Comment not associated with a course'], 422);
            }

            // resolve course id either via relation or field
            $courseId = $course ? $course->id : $comment->course_id;

            // permission check
            $allowed = false;

            if ($user->role === 'student') {
                // student must be enrolled in the course to like
                if (method_exists($user, 'coursesEnrolled')) {
                    $allowed = $user->coursesEnrolled()->where('course_id', $courseId)->exists();
                } else {
                    // fallback: allow if student role (you can tighten this)
                    $allowed = false;
                }
            } elseif ($user->role === 'instructor') {
                // instructor allowed only if they own the course
                $allowed = ($course && $course->instructor_id === $user->id)
                    || ($comment->course_id && $comment->course_id === $user->id); // unlikely, but safe
            } elseif ($user->role === 'admin') {
                $allowed = true;
            }

            if (! $allowed) {
                return response()->json(['error' => 'Unauthorized to like comments in this course'], 403);
            }

            // ensure likes relation exists on the model
            if (! method_exists($comment, 'likes')) {
                Log::error("Comment model missing likes() relation. commentId={$commentId}");
                return response()->json(['error' => 'Server configuration error: likes relation missing'], 500);
            }

            $exists = $comment->likes()->where('user_id', $user->id)->exists();

            if ($exists) {
                $comment->likes()->detach($user->id);
                return response()->json(['message' => 'Like removed']);
            } else {
                $comment->likes()->attach($user->id);
                return response()->json(['message' => 'Like added']);
            }
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Comment not found'], 404);
        } catch (\Exception $e) {
            // log exception for troubleshooting
            Log::error('Error toggling comment like: ' . $e->getMessage(), [
                'comment_id' => $commentId,
                'user_id' => optional($user)->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Server error'], 500);
        }
    }
}
