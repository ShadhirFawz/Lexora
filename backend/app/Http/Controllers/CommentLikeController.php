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
            // eager load chapter and course to avoid N+1
            $comment = Comment::with('chapter.course')->findOrFail($commentId);

            // ensure the Comment model has a chapter relationship
            $chapter = $comment->chapter ?? null;
            if (! $chapter) {
                return response()->json(['error' => 'Comment not associated with a chapter'], 422);
            }

            // get course id from chapter
            $courseId = $chapter->course_id;

            // permission check
            $allowed = false;

            if ($user->role === 'student') {
                // student must be enrolled in the course to like
                if (method_exists($user, 'coursesEnrolled')) {
                    $allowed = $user->coursesEnrolled()->where('course_id', $courseId)->exists();
                } else {
                    $allowed = false;
                }
            } elseif ($user->role === 'instructor') {
                // instructor allowed only if they own the course
                $allowed = $chapter->course->instructor_id === $user->id;
            } elseif ($user->role === 'admin') {
                $allowed = true;
            }

            if (! $allowed) {
                return response()->json(['error' => 'Unauthorized to like comments in this chapter'], 403);
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
            Log::error('Error toggling comment like: ' . $e->getMessage(), [
                'comment_id' => $commentId,
                'user_id' => optional($user)->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Server error'], 500);
        }
    }
}
