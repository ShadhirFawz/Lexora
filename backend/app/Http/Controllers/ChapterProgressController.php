<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\Course;
use App\Models\ChapterProgress;
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

        // Auto-complete if last_position reaches 1000 (or close to it)
        $isCompleted = $validated['is_completed'] ?? false;
        $lastPosition = $validated['last_position'] ?? null;

        // If position is 95% or more of 1000, mark as completed automatically
        if (!$isCompleted && $lastPosition !== null && $lastPosition >= 950) {
            $isCompleted = true;
            $lastPosition = 1000; // Set to max when completed
        }

        $progress = $user->chapterProgress()->updateOrCreate(
            [
                'course_id'  => $validated['course_id'],
                'chapter_id' => $validated['chapter_id'],
            ],
            [
                'is_completed'  => $isCompleted,
                'last_position' => $lastPosition,
            ]
        );

        $this->recalculateCourseProgress($user->id, $validated['course_id']);

        return response()->json([
            'message'  => 'Progress updated',
            'progress' => $this->formatProgressResponse($progress),
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

        // Format the progress data with additional calculations
        $formattedProgress = $progress->map(function ($progressItem) {
            return $this->formatProgressResponse($progressItem);
        });

        // Calculate overall course progress
        $courseProgress = $this->calculateCourseProgressDetails($user->id, $courseId);

        return response()->json([
            'course'   => $course,
            'progress' => $formattedProgress,
            'course_progress' => $courseProgress,
        ]);
    }

    /**
     * Format progress response with additional calculated fields
     */
    private function formatProgressResponse(ChapterProgress $progress)
    {
        // Calculate chapter completion percentage (0-100)
        $chapterPercent = 0;

        if ($progress->is_completed) {
            $chapterPercent = 100;
        } elseif ($progress->last_position !== null) {
            // Calculate percentage based on last_position out of 1000
            $chapterPercent = min(100, max(0, round(($progress->last_position / 1000) * 100, 2)));
        }

        return [
            'id' => $progress->id,
            'student_id' => $progress->student_id,
            'course_id' => $progress->course_id,
            'chapter_id' => $progress->chapter_id,
            'is_completed' => $progress->is_completed,
            'last_position' => $progress->last_position,
            'chapter_percent' => $chapterPercent,
            'created_at' => $progress->created_at,
            'updated_at' => $progress->updated_at,
        ];
    }

    /**
     * Calculate detailed course progress information
     */
    private function calculateCourseProgressDetails($studentId, $courseId)
    {
        $course = Course::with('chapters')->findOrFail($courseId);
        $totalChapters = $course->chapters->count();

        if ($totalChapters === 0) {
            return [
                'total_chapters' => 0,
                'completed_chapters' => 0,
                'course_percent' => 0,
                'overall_progress' => 0,
                'chapters_progress' => []
            ];
        }

        // Get all progress records for this course
        $progressRecords = ChapterProgress::where('student_id', $studentId)
            ->where('course_id', $courseId)
            ->get();

        $completedChapters = $progressRecords->where('is_completed', true)->count();

        // Calculate course percentage based on completed chapters
        $coursePercent = round(($completedChapters / $totalChapters) * 100, 2);

        // Calculate overall progress considering partial chapter progress
        $totalProgress = 0;
        $chaptersProgress = [];

        foreach ($course->chapters as $chapter) {
            $chapterProgress = $progressRecords->where('chapter_id', $chapter->id)->first();

            if ($chapterProgress) {
                $chapterPercent = $chapterProgress->is_completed ? 100 : ($chapterProgress->last_position !== null ?
                        min(100, round(($chapterProgress->last_position / 1000) * 100, 2)) : 0);
            } else {
                $chapterPercent = 0;
            }

            $chaptersProgress[] = [
                'chapter_id' => $chapter->id,
                'chapter_title' => $chapter->title,
                'chapter_percent' => $chapterPercent,
                'is_completed' => $chapterProgress ? $chapterProgress->is_completed : false,
                'last_position' => $chapterProgress ? $chapterProgress->last_position : null
            ];

            $totalProgress += $chapterPercent;
        }

        // Calculate overall progress average
        $overallProgress = $totalChapters > 0 ? round($totalProgress / $totalChapters, 2) : 0;

        return [
            'total_chapters' => $totalChapters,
            'completed_chapters' => $completedChapters,
            'course_percent' => $coursePercent,
            'overall_progress' => $overallProgress,
            'chapters_progress' => $chaptersProgress
        ];
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
