<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Course;
use App\Models\Chapter;
use App\Models\StudentNote;
use App\Models\Comment;
use App\Models\CommentLike;
use App\Models\ChapterProgress;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'role' => 'admin',
            'password' => bcrypt('password'),
        ]);

        // Instructors with courses
        $instructors = User::factory(3)->create(['role' => 'instructor']);

        $instructors->each(function ($instructor) {
            $courses = Course::factory(2)->create([
                'instructor_id' => $instructor->id,
            ]);

            $courses->each(function ($course) {
                $chapters = Chapter::factory(5)->create([
                    'course_id' => $course->id,
                ]);

                // Enroll students
                $students = User::factory(5)->create(['role' => 'student']);
                $course->students()->attach($students->pluck('id'));

                // Notes, progress, comments
                foreach ($students as $student) {
                    foreach ($chapters as $chapter) {
                        StudentNote::factory()->create([
                            'student_id' => $student->id,
                            'course_id' => $course->id,
                            'chapter_id' => $chapter->id,
                        ]);

                        ChapterProgress::factory()->create([
                            'student_id' => $student->id,
                            'course_id' => $course->id,
                            'chapter_id' => $chapter->id,
                        ]);
                    }
                }

                $comments = Comment::factory(5)->create([
                    'course_id' => $course->id,
                ]);

                $comments->each(function ($comment) {
                    CommentLike::factory(3)->create([
                        'comment_id' => $comment->id,
                    ]);
                });
            });
        });
    }
}
