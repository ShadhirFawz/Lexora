<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * App\Models\User
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $role
 *
 * @property \Illuminate\Database\Eloquent\Collection|\App\Models\Course[] $coursesTaught
 * @property \Illuminate\Database\Eloquent\Collection|\App\Models\Course[] $coursesEnrolled
 */

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role', // ensure role is fillable
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

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
}
