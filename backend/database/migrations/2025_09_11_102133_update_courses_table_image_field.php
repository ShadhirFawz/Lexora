<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            // Rename the 'image' column to 'image_url' to be more descriptive
            $table->renameColumn('image', 'image_url');
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            // Reverse the rename if we rollback
            $table->renameColumn('image_url', 'image');
        });
    }
};
