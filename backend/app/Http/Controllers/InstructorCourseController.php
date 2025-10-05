<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InstructorCourseController extends Controller
{
    /**
     * Get detailed courses taught by the authenticated instructor
     */
    public function getInstructorCourses(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'instructor') {
            return response()->json(['error' => 'Only instructors can access this endpoint'], 403);
        }

        $perPage = $request->get('per_page', 10);
        $page = $request->get('page', 1);

        $courses = Course::with([
            'instructor:id,name,email',
            'chapters:id,course_id,title,order,video_url',
            'students' => function ($query) {
                $query->select('users.id', 'users.name', 'email')
                    ->withPivot('progress_percent', 'created_at', 'updated_at')
                    ->limit(10);
            }
        ])
            ->withCount([
                'chapters as total_chapters',
                'students as total_students',
                'comments as total_comments'
            ])
            ->where('instructor_id', $user->id)
            ->select([
                'id',
                'title',
                'description',
                'image_url',
                'instructor_id',
                'status',
                'created_at',
                'updated_at'
            ])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $courses->items(),
            'pagination' => [
                'current_page' => $courses->currentPage(),
                'per_page' => $courses->perPage(),
                'total' => $courses->total(),
                'last_page' => $courses->lastPage(),
                'from' => $courses->firstItem(),
                'to' => $courses->lastItem(),
            ]
        ]);
    }

    /**
     * Get detailed course statistics for instructor
     */
    public function getCourseStatistics($courseId)
    {
        $user = Auth::user();

        if ($user->role !== 'instructor') {
            return response()->json(['error' => 'Only instructors can access this endpoint'], 403);
        }

        $course = Course::withCount([
            'chapters as total_chapters',
            'students as total_students',
            'comments as total_comments'
        ])
            ->with(['chapters', 'students' => function ($query) {
                $query->select('users.id', 'users.name', 'users.email')
                    ->withPivot('progress_percent', 'created_at');
            }])
            ->where('id', $courseId)
            ->where('instructor_id', $user->id)
            ->firstOrFail();

        // Calculate average progress
        $averageProgress = $course->students->avg(function ($student) {
            return floatval($student->pivot->progress_percent);
        });

        // Count students by progress ranges
        $progressRanges = [
            'completed' => $course->students->where('pivot.progress_percent', 100)->count(),
            'in_progress' => $course->students->whereBetween('pivot.progress_percent', [1, 99])->count(),
            'not_started' => $course->students->where('pivot.progress_percent', 0)->count(),
        ];

        return response()->json([
            'course' => $course,
            'statistics' => [
                'average_progress' => round($averageProgress, 2),
                'progress_ranges' => $progressRanges,
                'total_enrollments' => $course->total_students,
                'total_chapters' => $course->total_chapters,
                'total_reviews' => $course->total_comments,
            ]
        ]);
    }

    /**
     * Get all available courses (for inspiration - excluding instructor's own courses)
     */
    public function getOtherCourses(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'instructor') {
            return response()->json(['error' => 'Only instructors can access this endpoint'], 403);
        }

        $perPage = $request->get('per_page', 10);
        $page = $request->get('page', 1);

        $courses = Course::with([
            'instructor:id,name,email',
            'chapters:id,course_id,title,order,video_url',
            'students' => function ($query) {
                $query->select('users.id', 'users.name')
                    ->withPivot('progress_percent')
                    ->limit(5);
            }
        ])
            ->withCount([
                'chapters as total_chapters',
                'students as total_students',
                'comments as total_comments'
            ])
            ->where('status', 'approved')
            ->where('instructor_id', '!=', $user->id)
            ->select([
                'id',
                'title',
                'description',
                'image_url',
                'instructor_id',
                'status',
                'created_at',
                'updated_at'
            ])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $courses->items(),
            'pagination' => [
                'current_page' => $courses->currentPage(),
                'per_page' => $courses->perPage(),
                'total' => $courses->total(),
                'last_page' => $courses->lastPage(),
                'from' => $courses->firstItem(),
                'to' => $courses->lastItem(),
            ]
        ]);
    }
}
