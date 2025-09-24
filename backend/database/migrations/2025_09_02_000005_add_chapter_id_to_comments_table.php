<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            // Add chapter_id as nullable first (for existing data)
            $table->unsignedBigInteger('chapter_id')->nullable()->after('course_id');

            // Add foreign key constraint
            $table->foreign('chapter_id')
                ->references('id')
                ->on('chapters')
                ->onDelete('cascade');

            // Optional: Add index for better performance
            $table->index(['chapter_id', 'course_id']);
        });
    }

    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['chapter_id']);
            // Then drop the column
            $table->dropColumn('chapter_id');
        });
    }
};
