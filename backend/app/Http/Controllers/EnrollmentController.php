<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Support\Facades\Auth;

class EnrollmentController extends Controller
{
    public function store($courseId)
    {
        $user = Auth::user();

        if ($user->role !== 'student') {
            return response()->json(['error' => 'Only students can enroll'], 403);
        }

        $course = Course::findOrFail($courseId);

        if ($user->coursesEnrolled()->where('course_id', $courseId)->exists()) {
            return response()->json(['message' => 'Already enrolled'], 200);
        }

        $user->coursesEnrolled()->attach($courseId, ['progress_percent' => 0]);

        return response()->json([
            'message' => 'Enrolled successfully',
            'course'  => $course,
        ], 201);
    }

    public function destroy($courseId)
    {
        $user = Auth::user();

        if ($user->role !== 'student') {
            return response()->json(['error' => 'Only students can unenroll'], 403);
        }

        $course = Course::findOrFail($courseId);

        if (!$user->coursesEnrolled()->where('course_id', $courseId)->exists()) {
            return response()->json(['error' => 'Not enrolled in this course'], 404);
        }

        $user->coursesEnrolled()->detach($courseId);

        return response()->json([
            'message'   => 'Unenrolled successfully',
            'course_id' => $courseId,
        ]);
    }
}
