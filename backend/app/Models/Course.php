<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * App\Models\Course
 *
 * @property int $id
 * @property string $title
 * @property string|null $description
 *
 * @property \App\Models\User $instructor
 * @property \Illuminate\Database\Eloquent\Collection|\App\Models\User[] $students
 */

class Course extends Model
{
    protected $fillable = ['title', 'description', 'instructor_id'];

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'course_student', 'course_id', 'student_id')
            ->withTimestamps();
    }
}
