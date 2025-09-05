<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChapterProgressController extends Controller
{
    /**
     * Update progress for a chapter.
     * Body: { course_id, chapter_id, is_completed, last_position? }
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'student') {
            return response()->json(['error' => 'Only students can update progress'], 403);
        }

        $request->validate([
            'course_id'     => 'required|exists:courses,id',
            'chapter_id'    => 'required|exists:chapters,id',
            'is_completed'  => 'boolean',
            'last_position' => 'integer|nullable',
        ]);

        $chapter = Chapter::findOrFail($request->chapter_id);

        // Ensure chapter belongs to the given course
        if ($chapter->course_id != $request->course_id) {
            return response()->json(['error' => 'Chapter does not belong to this course'], 422);
        }

        // Create or update progress record
        $progress = $user->chapterProgress()->updateOrCreate(
            [
                'course_id'  => $request->course_id,
                'chapter_id' => $request->chapter_id,
            ],
            [
                'is_completed'  => $request->is_completed ?? false,
                'last_position' => $request->last_position ?? null,
            ]
        );

        // Recalculate overall course progress %
        $this->recalculateCourseProgress($user->id, $request->course_id);

        return response()->json([
            'message'  => 'Progress updated',
            'progress' => $progress,
        ]);
    }

    /**
     * Show logged-in student's progress for a course.
     */
    public function show($courseId)
    {
        $user = Auth::user();

        if ($user->role !== 'student') {
            return response()->json(['error' => 'Only students can view progress'], 403);
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

    /**
     * Show all enrolled courses + progress (student dashboard).
     */
    public function myCourses()
    {
        $user = Auth::user();

        if ($user->role !== 'student') {
            return response()->json(['error' => 'Only students can view enrolled courses'], 403);
        }

        $courses = $user->coursesEnrolled()
            ->with(['chapters', 'instructor'])
            ->get();

        return response()->json($courses);
    }

    /**
     * Helper: recalculate progress percentage for a course.
     */
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

        // Update enrollment pivot with progress %
        $course->students()->updateExistingPivot($studentId, [
            'progress_percent' => $progressPercent,
        ]);
    }
}
