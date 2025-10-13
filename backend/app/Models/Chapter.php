<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chapter extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'title',
        'description',
        'order',
        'image',
        'video_url',
        'notes_pdf',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function studentNotes(): HasMany
    {
        return $this->hasMany(StudentNote::class);
    }

    public function progress()
    {
        return $this->hasMany(ChapterProgress::class, 'chapter_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(ChapterComment::class);
    }
}
