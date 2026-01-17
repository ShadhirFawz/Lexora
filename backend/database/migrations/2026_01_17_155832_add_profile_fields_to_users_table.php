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
        Schema::table('users', function (Blueprint $table) {
            // Personal Information
            $table->string('username')->unique()->nullable()->after('name');
            $table->date('date_of_birth')->nullable()->after('email');
            $table->enum('gender', ['male', 'female', 'other', 'prefer_not_to_say'])->nullable()->after('date_of_birth');
            $table->string('phone')->nullable()->after('gender');
            $table->text('bio')->nullable()->after('phone');

            // Profile Media
            $table->string('profile_picture')->nullable()->after('bio');
            $table->string('cover_picture')->nullable()->after('profile_picture');

            // Learning Preferences
            $table->json('learning_interests')->nullable()->after('cover_picture'); // Array of interests/topics
            $table->string('preferred_language')->default('en')->after('learning_interests');
            $table->boolean('email_notifications')->default(true)->after('preferred_language');
            $table->boolean('course_updates_notifications')->default(true)->after('email_notifications');
            $table->boolean('comment_notifications')->default(true)->after('course_updates_notifications');

            // Social Media & Professional Links
            $table->string('website')->nullable()->after('comment_notifications');
            $table->string('linkedin')->nullable()->after('website');
            $table->string('twitter')->nullable()->after('linkedin');
            $table->string('github')->nullable()->after('twitter');

            // Instructor/Admin Specific
            $table->text('qualifications')->nullable()->after('github'); // JSON or text for instructor qualifications
            $table->text('teaching_experience')->nullable()->after('qualifications');
            $table->string('professional_title')->nullable()->after('teaching_experience'); // e.g., "Senior Developer", "Professor"

            // Student Specific
            $table->string('educational_background')->nullable()->after('professional_title'); // e.g., "Computer Science Student"
            $table->string('current_institution')->nullable()->after('educational_background');
            $table->integer('graduation_year')->nullable()->after('current_institution');

            // Platform Stats (computed or tracked)
            $table->integer('total_courses_enrolled')->default(0)->after('graduation_year');
            $table->integer('total_courses_completed')->default(0)->after('total_courses_enrolled');
            $table->integer('total_learning_hours')->default(0)->after('total_courses_completed');
            $table->integer('total_points')->default(0)->after('total_learning_hours'); // Gamification points
            $table->string('current_learning_streak')->default('0')->after('total_points'); // Days in a row

            // Account Status & Preferences
            $table->enum('account_status', ['active', 'suspended', 'deactivated'])->default('active')->after('current_learning_streak');
            $table->timestamp('last_login_at')->nullable()->after('account_status');
            $table->ipAddress('last_login_ip')->nullable()->after('last_login_at');
            $table->timestamp('email_verified_at')->nullable()->change(); // Ensure it's nullable

            // Timezone & Locale
            $table->string('timezone')->default('UTC')->after('last_login_ip');
            $table->string('locale')->default('en')->after('timezone');

            // Soft Deletes for account recovery
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop all added columns
            $table->dropColumn([
                'username',
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
                'locale'
            ]);

            $table->dropSoftDeletes();
        });
    }
};
