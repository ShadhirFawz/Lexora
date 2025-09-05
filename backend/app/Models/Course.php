<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'image',
        'instructor_id',
    ];

    /**
     * Course instructor (the teacher).
     */
    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    /**
     * Students enrolled in this course.
     */
    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'course_student', 'course_id', 'student_id')
            ->withPivot('progress_percent')
            ->withTimestamps();
    }

    /**
     * Chapters that belong to this course.
     */
    public function chapters(): HasMany
    {
        return $this->hasMany(Chapter::class)->orderBy('order');
    }

    /**
     * Feedback comments from students (and instructor replies).
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function progress()
    {
        return $this->hasMany(ChapterProgress::class, 'course_id');
    }
}
