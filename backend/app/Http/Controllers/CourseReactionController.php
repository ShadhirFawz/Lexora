<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseReaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CourseReactionController extends Controller
{
    public function toggleReaction(Request $request, $courseId)
    {
        $user = Auth::user();
        if ($user->role !== 'student') {
            return response()->json(['error' => 'Only students can react to courses'], 403);
        }

        $validated = $request->validate([
            'emoji_type' => 'required|in:love,thumbs_up,thumbs_down,happy,unsatisfied'
        ]);

        // Delete any existing reaction and create new one
        CourseReaction::updateOrCreate(
            ['course_id' => $courseId, 'student_id' => $user->id],
            ['emoji_type' => $validated['emoji_type']]
        );

        return response()->json(['message' => 'Reaction updated']);
    }

    public function getReactions($courseId)
    {
        $reactions = CourseReaction::where('course_id', $courseId)
            ->with('student:id,name')
            ->get();

        return response()->json($reactions);
    }
}
