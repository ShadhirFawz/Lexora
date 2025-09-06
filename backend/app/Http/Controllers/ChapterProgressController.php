<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChapterProgressController extends Controller
{
    public function update(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'student') {
            return response()->json(['error' => 'Only students can update progress'], 403);
        }

        $validated = $request->validate([
            'course_id'     => 'required|exists:courses,id',
            'chapter_id'    => 'required|exists:chapters,id',
            'is_completed'  => 'boolean',
            'last_position' => 'nullable|integer|min:0',
        ]);

        // Must be enrolled in the course
        if (!$user->coursesEnrolled()->where('course_id', $validated['course_id'])->exists()) {
            return response()->json(['error' => 'Enroll in the course before updating progress'], 403);
        }

        $chapter = Chapter::findOrFail($validated['chapter_id']);

        if ((int) $chapter->course_id !== (int) $validated['course_id']) {
            return response()->json(['error' => 'Chapter does not belong to this course'], 422);
        }

        $progress = $user->chapterProgress()->updateOrCreate(
            [
                'course_id'  => $validated['course_id'],
                'chapter_id' => $validated['chapter_id'],
            ],
            [
                'is_completed'  => $validated['is_completed'] ?? false,
                'last_position' => $validated['last_position'] ?? null,
            ]
        );

        $this->recalculateCourseProgress($user->id, $validated['course_id']);

        return response()->json([
            'message'  => 'Progress updated',
            'progress' => $progress,
        ]);
    }

    public function show($courseId)
    {
        $user = Auth::user();

        if ($user->role !== 'student') {
            return response()->json(['error' => 'Only students can view progress'], 403);
        }

        // Must be enrolled in the course
        if (!$user->coursesEnrolled()->where('course_id', $courseId)->exists()) {
            return response()->json(['error' => 'Not enrolled in this course'], 403);
        }

        $course = Course::with('chapters')->findOrFail($courseId);

        $progress = $user->chapterProgress()
            ->where('course_id', $courseId)
            ->get();

        return response()->json([
            'course'   => $course,
            'progress' => $progress,
        ]);
    }

    private function recalculateCourseProgress($studentId, $courseId)
    {
        $course = Course::with('chapters')->findOrFail($courseId);
        $totalChapters = $course->chapters->count();

        if ($totalChapters === 0) {
            $progressPercent = 0;
        } else {
            $completed = $course->progress()
                ->where('student_id', $studentId)
                ->where('is_completed', true)
                ->count();

            $progressPercent = round(($completed / $totalChapters) * 100, 2);
        }

        $course->students()->updateExistingPivot($studentId, [
            'progress_percent' => $progressPercent,
        ]);
    }
}
