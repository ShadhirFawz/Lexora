<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\ChapterController;
use App\Http\Controllers\ChapterProgressController;
use App\Http\Controllers\StudentNoteController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\CommentLikeController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\StudentCourseController;
use App\Http\Controllers\AdminController;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| All routes are prefixed with /api by default (api.php file).
| Structured by feature groups, with TODOs for planned endpoints.
|--------------------------------------------------------------------------
*/

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app'    => config('app.name'),
        'time'   => now()->toIso8601String(),
    ]);
});

// Authentication (Public)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// Authenticated user
Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Admin
    |--------------------------------------------------------------------------
    | All admin endpoints are under /api/admin/*
    | Role check is enforced inside AdminController methods.
    */
    Route::prefix('admin')->group(function () {
        // User management
        Route::get('/users', [AdminController::class, 'listUsers']);
        Route::put('/users/{id}/role', [AdminController::class, 'updateUserRole']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);

        // Course management
        Route::get('/courses', [AdminController::class, 'listCourses']);
        Route::put('/courses/{id}/approve', [AdminController::class, 'approveCourse']);
        Route::put('/courses/{id}/reject', [AdminController::class, 'rejectCourse']);
        Route::delete('/courses/{id}', [AdminController::class, 'deleteCourse']);
    });

    /*
    |--------------------------------------------------------------------------
    | Profile & Auth
    |--------------------------------------------------------------------------
    */
    Route::get('/me', function (Request $request) {
        return response()->json([
            'id'    => $request->user()->id,
            'name'  => $request->user()->name,
            'email' => $request->user()->email,
            'role'  => $request->user()->role,
        ]);
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    /*
    |--------------------------------------------------------------------------
    | Courses
    |--------------------------------------------------------------------------
    */
    Route::get('/courses',          [CourseController::class, 'index']);      // All courses
    Route::get('/my-courses',       [CourseController::class, 'myCourses']); // Role-specific
    Route::post('/courses',         [CourseController::class, 'store']);
    Route::get('/courses/{id}',     [CourseController::class, 'show']);
    Route::put('/courses/{id}',     [CourseController::class, 'update']);
    Route::delete('/courses/{id}',  [CourseController::class, 'destroy']);
    Route::post('/courses/{id}/image', [CourseController::class, 'uploadImage']);

    /*
    |--------------------------------------------------------------------------
    | Chapters
    |--------------------------------------------------------------------------
    */
    Route::post('/courses/{courseId}/chapters', [ChapterController::class, 'store']);
    Route::put('/chapters/{id}',                [ChapterController::class, 'update']);
    Route::delete('/chapters/{id}',             [ChapterController::class, 'destroy']);
    Route::post('/chapters/{id}/reorder',       [ChapterController::class, 'reorder']);
    Route::post('/chapters/{id}/resource',      [ChapterController::class, 'uploadResource']);
    Route::post('/chapters/{id}/video',         [ChapterController::class, 'saveVideo']);
    Route::get('/chapters/{id}/video',          [ChapterController::class, 'getVideo']);

    /*
    |--------------------------------------------------------------------------
    | Progress
    |--------------------------------------------------------------------------
    */
    Route::post('/progress', [ChapterProgressController::class, 'update']);
    Route::get('/progress/{course_id}', [ChapterProgressController::class, 'show']);

    /*
    |--------------------------------------------------------------------------
    | Notes
    |--------------------------------------------------------------------------
    */
    Route::post('/notes/video', [StudentNoteController::class, 'store']);

    /*
    |--------------------------------------------------------------------------
    | Comments & Likes
    |--------------------------------------------------------------------------
    */
    Route::post('/chapters/{chapterId}/comments', [CommentController::class, 'store']);
    Route::delete('/comments/{id}',             [CommentController::class, 'destroy']);
    Route::post('/comments/{id}/like',          [CommentLikeController::class, 'toggle']);

    // Replies & listing (not yet implemented)
    Route::post('/comments/{id}/reply', [CommentController::class, 'reply']);
    Route::get('/chapters/{chapterId}/comments', [CommentController::class, 'index']);

    /*
    |--------------------------------------------------------------------------
    | Enrollments
    |--------------------------------------------------------------------------
    */
    Route::post('/courses/{courseId}/enroll', [EnrollmentController::class, 'store']);
    Route::delete('/courses/{courseId}/unenroll', [EnrollmentController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | Student Course Management
    |--------------------------------------------------------------------------
    */
    Route::get('/student/courses/check-enrollment/{courseId}', [StudentCourseController::class, 'checkEnrollment']);
    Route::get('/student/courses/{courseId}', [StudentCourseController::class, 'getCourseWithEnrollmentStatus']);
    Route::get('/student/courses', [StudentCourseController::class, 'getCoursesWithEnrollmentStatus']);

    /*
    |--------------------------------------------------------------------------
    | Admin / Stats
    |--------------------------------------------------------------------------
    */
    // TODO: Implement later
    // Route::get('/stats', [AdminController::class, 'stats']);
});
