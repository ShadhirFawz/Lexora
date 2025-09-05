<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Course;
use App\Models\Chapter;
use Illuminate\Database\Eloquent\Factories\Factory;

class ChapterProgressFactory extends Factory
{
    public function definition(): array
    {
        return [
            'student_id' => User::factory()->state(['role' => 'student']),
            'course_id' => Course::factory(),
            'chapter_id' => Chapter::factory(),
            'is_completed' => $this->faker->boolean(),
            'last_position' => $this->faker->numberBetween(0, 600),
        ];
    }
}
