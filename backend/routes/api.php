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
    Route::get('/my-courses', [ChapterProgressController::class, 'myCourses']);

    /*
    |--------------------------------------------------------------------------
    | Notes
    |--------------------------------------------------------------------------
    */
    Route::post('/notes/video', [StudentNoteController::class, 'store']);

    // TODO: Notes management (not yet implemented)
    // Route::put('/notes/video/{id}', [StudentNoteController::class, 'update']);
    // Route::delete('/notes/video/{id}', [StudentNoteController::class, 'destroy']);
    // Route::get('/notes/video', [StudentNoteController::class, 'index']); // ?course & ?chapter

    /*
    |--------------------------------------------------------------------------
    | Comments & Likes
    |--------------------------------------------------------------------------
    */
    Route::post('/courses/{courseId}/comments', [CommentController::class, 'store']);
    Route::delete('/comments/{id}',             [CommentController::class, 'destroy']);
    Route::post('/comments/{id}/like',          [CommentLikeController::class, 'toggle']);

    // TODO: Replies & listing (not yet implemented)
    // Route::post('/comments/{id}/reply', [CommentController::class, 'reply']);
    // Route::get('/courses/{courseId}/comments', [CommentController::class, 'index']);

    /*
    |--------------------------------------------------------------------------
    | Enrollments
    |--------------------------------------------------------------------------
    */
    Route::post('/courses/{courseId}/enroll', [EnrollmentController::class, 'store']);
    Route::delete('/courses/{courseId}/unenroll', [EnrollmentController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | Admin / Stats
    |--------------------------------------------------------------------------
    */
    // TODO: Implement later
    // Route::get('/stats', [AdminController::class, 'stats']);
});
