<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Course;
use App\Models\Chapter;
use Illuminate\Database\Eloquent\Factories\Factory;

class StudentNoteFactory extends Factory
{
    public function definition(): array
    {
        return [
            'student_id' => User::factory()->state(['role' => 'student']),
            'course_id' => Course::factory(),
            'chapter_id' => Chapter::factory(),
            'timestamp' => $this->faker->numberBetween(10, 300),
            'note' => $this->faker->sentence(10),
        ];
    }
}
