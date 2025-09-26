<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudentCourseController extends Controller
{
    /**
     * Check if the authenticated student is enrolled in a specific course
     */
    public function checkEnrollment($courseId)
    {
        $user = Auth::user();

        if ($user->role !== 'student') {
            return response()->json(['error' => 'Only students can check enrollment status'], 403);
        }

        $course = Course::findOrFail($courseId);

        $isEnrolled = $user->coursesEnrolled()->where('course_id', $courseId)->exists();

        $enrollmentData = null;
        if ($isEnrolled) {
            $enrollmentData = $user->coursesEnrolled()
                ->where('course_id', $courseId)
                ->first()
                ->pivot;
        }

        return response()->json([
            'is_enrolled' => $isEnrolled,
            'enrollment_data' => $enrollmentData,
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'status' => $course->status
            ]
        ]);
    }

    /**
     * Get detailed course information with enrollment status for authenticated student
     */
    public function getCourseWithEnrollmentStatus($courseId)
    {
        $user = Auth::user();
        $course = Course::with(['instructor', 'chapters', 'students'])->findOrFail($courseId);

        // Check enrollment status
        $isEnrolled = false;
        $enrollmentData = null;
        $progressData = null;

        if ($user->role === 'student') {
            $isEnrolled = $user->coursesEnrolled()->where('course_id', $courseId)->exists();

            if ($isEnrolled) {
                $enrollmentData = $user->coursesEnrolled()
                    ->where('course_id', $courseId)
                    ->first()
                    ->pivot;

                // Get progress data
                $progressData = $user->chapterProgress()
                    ->where('course_id', $courseId)
                    ->get();
            }
        }

        // If course is not approved, restrict access
        if ($course->status !== 'approved') {
            if (!$user || ($user->role !== 'instructor' && $user->role !== 'admin')) {
                return response()->json(['error' => 'Course not available'], 404);
            }
            if ($user->role === 'instructor' && $course->instructor_id !== $user->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }

        return response()->json([
            'course' => $course,
            'enrollment_status' => [
                'is_enrolled' => $isEnrolled,
                'enrollment_data' => $enrollmentData,
                'progress_data' => $progressData
            ]
        ]);
    }

    /**
     * Get all courses with enrollment status for authenticated student
     */
    public function getCoursesWithEnrollmentStatus(Request $request)
    {
        $user = Auth::user();
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

        // Add enrollment status for each course if user is a student
        if ($user->role === 'student') {
            $enrolledCourseIds = $user->coursesEnrolled()->pluck('course_id')->toArray();

            $courses->getCollection()->transform(function ($course) use ($enrolledCourseIds) {
                $course->is_enrolled = in_array($course->id, $enrolledCourseIds);
                return $course;
            });
        }

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
