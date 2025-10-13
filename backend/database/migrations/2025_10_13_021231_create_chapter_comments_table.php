<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('chapter_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chapter_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('parent_id')->nullable()->constrained('chapter_comments')->onDelete('cascade');
            $table->text('content');
            $table->timestamps();
        });

        Schema::create('chapter_comment_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chapter_comment_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['chapter_comment_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chapter_comment_likes');
        Schema::dropIfExists('chapter_comments');
    }
};
