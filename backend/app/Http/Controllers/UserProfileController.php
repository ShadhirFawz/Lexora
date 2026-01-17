<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Validator;

class UserProfileController extends Controller
{
    /**
     * Get current user profile
     */
    public function show(Request $request)
    {
        $user = $request->user()->load([
            'coursesEnrolled' => function ($query) {
                $query->latest()->limit(5);
            },
            'coursesTaught' => function ($query) {
                $query->latest()->limit(5);
            }
        ]);

        return response()->json([
            'status' => 'success',
            'user' => $this->formatUserProfile($user)
        ]);
    }

    /**
     * Update user profile
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'username' => [
                'sometimes',
                'string',
                'max:50',
                Rule::unique('users')->ignore($user->id)
            ],
            'email' => [
                'sometimes',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id)
            ],
            'phone' => 'sometimes|nullable|string|max:20',
            'date_of_birth' => 'sometimes|nullable|date|before:today',
            'gender' => 'sometimes|nullable|in:male,female,other,prefer_not_to_say',
            'bio' => 'sometimes|nullable|string|max:1000',
            'website' => 'sometimes|nullable|url|max:255',
            'linkedin' => 'sometimes|nullable|url|max:255',
            'twitter' => 'sometimes|nullable|url|max:255',
            'github' => 'sometimes|nullable|url|max:255',
            'preferred_language' => 'sometimes|string|in:en,es,fr,de,hi,ar',
            'timezone' => 'sometimes|string|timezone',
            'locale' => 'sometimes|string|in:en,es,fr,de,hi,ar',
            'learning_interests' => 'sometimes|nullable|array',
            'learning_interests.*' => 'string|max:100',

            // Instructor specific fields
            'qualifications' => 'sometimes|nullable|array',
            'teaching_experience' => 'sometimes|nullable|string|max:2000',
            'professional_title' => 'sometimes|nullable|string|max:100',

            // Student specific fields
            'educational_background' => 'sometimes|nullable|string|max:100',
            'current_institution' => 'sometimes|nullable|string|max:255',
            'graduation_year' => 'sometimes|nullable|integer|digits:4|min:1900|max:' . (date('Y') + 10),

            // Notification settings
            'email_notifications' => 'sometimes|boolean',
            'course_updates_notifications' => 'sometimes|boolean',
            'comment_notifications' => 'sometimes|boolean',

            // Profile pictures (URLs from Cloudinary)
            'profile_picture' => 'sometimes|nullable|url|max:500',
            'cover_picture' => 'sometimes|nullable|url|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();

        // Handle JSON fields
        if (isset($validated['learning_interests'])) {
            $validated['learning_interests'] = json_encode($validated['learning_interests']);
        }

        if (isset($validated['qualifications'])) {
            $validated['qualifications'] = json_encode($validated['qualifications']);
        }

        $user->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully',
            'user' => $this->formatUserProfile($user)
        ]);
    }

    /**
     * Update user password
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Current password is incorrect'
            ], 400);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Password updated successfully'
        ]);
    }

    /**
     * Update profile picture (save Cloudinary URL)
     */
    public function updateProfilePicture(Request $request)
    {
        $request->validate([
            'profile_picture_url' => 'required|url|max:500'
        ]);

        $user = $request->user();
        $user->update([
            'profile_picture' => $request->profile_picture_url
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Profile picture updated successfully',
            'profile_picture' => $user->profile_picture
        ]);
    }

    /**
     * Update cover picture (save Cloudinary URL)
     */
    public function updateCoverPicture(Request $request)
    {
        $request->validate([
            'cover_picture_url' => 'required|url|max:500'
        ]);

        $user = $request->user();
        $user->update([
            'cover_picture' => $request->cover_picture_url
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Cover picture updated successfully',
            'cover_picture' => $user->cover_picture
        ]);
    }

    /**
     * Get user stats
     */
    public function getStats(Request $request)
    {
        $user = $request->user();

        $stats = [
            'total_courses_enrolled' => $user->total_courses_enrolled,
            'total_courses_completed' => $user->total_courses_completed,
            'total_learning_hours' => $user->total_learning_hours,
            'total_points' => $user->total_points,
            'current_learning_streak' => $user->current_learning_streak,
            'account_created' => $user->created_at->format('Y-m-d'),
            'last_login' => $user->last_login_at ? $user->last_login_at->diffForHumans() : 'Never',
        ];

        if ($user->isStudent()) {
            $stats['active_courses'] = $user->coursesEnrolled()->wherePivot('progress_percent', '<', 100)->count();
            $stats['completed_courses'] = $user->coursesEnrolled()->wherePivot('progress_percent', 100)->count();
            $stats['average_progress'] = $user->coursesEnrolled()->avg('progress_percent') ?? 0;
        }

        if ($user->isInstructor()) {
            $stats['total_courses_created'] = $user->coursesTaught()->count();
            $stats['total_students'] = $user->coursesTaught()->withCount('students')->get()->sum('students_count');
            $stats['average_course_rating'] = $user->coursesTaught()->avg('average_rating') ?? 0;
        }

        return response()->json([
            'status' => 'success',
            'stats' => $stats
        ]);
    }

    /**
     * Get user activity/log
     */
    public function getActivity(Request $request)
    {
        // This would typically come from an Activity model
        // For now, return placeholder
        return response()->json([
            'status' => 'success',
            'activities' => [
                ['type' => 'login', 'description' => 'Logged in to platform', 'time' => now()->subHours(2)->diffForHumans()],
                ['type' => 'course_enrollment', 'description' => 'Enrolled in "Web Development 101"', 'time' => now()->subDays(1)->diffForHumans()],
                ['type' => 'progress', 'description' => 'Completed Chapter 3 of "React Fundamentals"', 'time' => now()->subDays(2)->diffForHumans()],
                ['type' => 'comment', 'description' => 'Commented on "Python for Beginners"', 'time' => now()->subDays(3)->diffForHumans()],
            ]
        ]);
    }

    /**
     * Format user profile for response
     */
    private function formatUserProfile($user)
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role,
            'date_of_birth' => $user->date_of_birth,
            'gender' => $user->gender,
            'phone' => $user->phone,
            'bio' => $user->bio,
            'profile_picture' => $user->profile_picture,
            'cover_picture' => $user->cover_picture,
            'learning_interests' => $user->learning_interests ? json_decode($user->learning_interests, true) : [],
            'preferred_language' => $user->preferred_language,
            'email_notifications' => $user->email_notifications,
            'course_updates_notifications' => $user->course_updates_notifications,
            'comment_notifications' => $user->comment_notifications,
            'website' => $user->website,
            'linkedin' => $user->linkedin,
            'twitter' => $user->twitter,
            'github' => $user->github,
            'qualifications' => $user->qualifications ? json_decode($user->qualifications, true) : null,
            'teaching_experience' => $user->teaching_experience,
            'professional_title' => $user->professional_title,
            'educational_background' => $user->educational_background,
            'current_institution' => $user->current_institution,
            'graduation_year' => $user->graduation_year,
            'timezone' => $user->timezone,
            'locale' => $user->locale,
            'account_status' => $user->account_status,
            'created_at' => $user->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $user->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
