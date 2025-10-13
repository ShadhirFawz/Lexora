<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ChapterComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'chapter_id',
        'course_id',
        'user_id',
        'parent_id',
        'content'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function replies(): HasMany
    {
        return $this->hasMany(ChapterComment::class, 'parent_id');
    }

    public function likes(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'chapter_comment_likes', 'chapter_comment_id', 'user_id')
            ->withTimestamps();
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ChapterComment::class, 'parent_id');
    }
}
