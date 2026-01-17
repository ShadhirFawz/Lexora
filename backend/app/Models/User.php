<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'role',
        'date_of_birth',
        'gender',
        'phone',
        'bio',
        'profile_picture',
        'cover_picture',
        'learning_interests',
        'preferred_language',
        'email_notifications',
        'course_updates_notifications',
        'comment_notifications',
        'website',
        'linkedin',
        'twitter',
        'github',
        'qualifications',
        'teaching_experience',
        'professional_title',
        'educational_background',
        'current_institution',
        'graduation_year',
        'total_courses_enrolled',
        'total_courses_completed',
        'total_learning_hours',
        'total_points',
        'current_learning_streak',
        'account_status',
        'last_login_at',
        'last_login_ip',
        'timezone',
        'locale',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'date_of_birth' => 'date',
        'learning_interests' => 'array',
        'email_notifications' => 'boolean',
        'course_updates_notifications' => 'boolean',
        'comment_notifications' => 'boolean',
        'total_courses_enrolled' => 'integer',
        'total_courses_completed' => 'integer',
        'total_learning_hours' => 'integer',
        'total_points' => 'integer',
        'graduation_year' => 'integer',
        'last_login_at' => 'datetime',
        'qualifications' => 'array',
    ];

    /**
     * Automatically hash password when setting
     */
    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = bcrypt($value);
    }

    /**
     * Get the user's display name (username if available, otherwise name)
     */
    public function getDisplayNameAttribute()
    {
        return $this->username ?? $this->name;
    }

    /**
     * Get the user's profile picture URL
     */
    public function getProfilePictureUrlAttribute()
    {
        if ($this->profile_picture) {
            return asset('storage/' . $this->profile_picture);
        }

        // Return default avatar based on gender or generic
        $default = match ($this->gender) {
            'female' => 'default-female-avatar.png',
            'male' => 'default-male-avatar.png',
            default => 'default-avatar.png'
        };

        return asset('images/' . $default);
    }

    /**
     * Check if user is an instructor
     */
    public function isInstructor()
    {
        return $this->role === 'instructor';
    }

    /**
     * Check if user is an admin
     */
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is a student
     */
    public function isStudent()
    {
        return $this->role === 'student';
    }

    /**
     * Courses this user teaches (for instructors).
     */
    public function coursesTaught(): HasMany
    {
        return $this->hasMany(Course::class, 'instructor_id');
    }

    public function chapterProgress()
    {
        return $this->hasMany(ChapterProgress::class, 'student_id');
    }

    /**
     * Courses this user is enrolled in (for students).
     */
    public function coursesEnrolled()
    {
        return $this->belongsToMany(Course::class, 'course_student', 'student_id', 'course_id')
            ->withPivot('progress_percent')
            ->withTimestamps();
    }

    /**
     * Get user's active enrollments
     */
    public function activeEnrollments()
    {
        return $this->coursesEnrolled()->wherePivot('is_active', true);
    }

    /**
     * User's created comments (both course and chapter comments)
     */
    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * User's notes on chapters
     */
    public function notes()
    {
        return $this->hasMany(StudentNote::class);
    }

    /**
     * User's reactions/likes
     */
    public function reactions()
    {
        return $this->hasMany(CourseReaction::class);
    }

    /**
     * Update last login information
     */
    public function updateLastLogin($ip = null)
    {
        $this->update([
            'last_login_at' => now(),
            'last_login_ip' => $ip ?? request()->ip(),
        ]);
    }

    /**
     * Increment learning streak
     */
    public function incrementLearningStreak()
    {
        $this->increment('current_learning_streak');
    }

    /**
     * Reset learning streak
     */
    public function resetLearningStreak()
    {
        $this->update(['current_learning_streak' => 0]);
    }

    /**
     * Add points to user (gamification)
     */
    public function addPoints($points)
    {
        $this->increment('total_points', $points);
    }
}
