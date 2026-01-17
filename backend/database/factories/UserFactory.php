<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    public function definition(): array
    {
        $roles = ['student', 'instructor', 'admin'];
        $role = $this->faker->randomElement($roles);

        $data = [
            'name' => $this->faker->name(),
            'username' => $this->faker->unique()->userName(),
            'email' => $this->faker->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'remember_token' => Str::random(10),
            'role' => $role,
            'date_of_birth' => $this->faker->dateTimeBetween('-50 years', '-18 years')->format('Y-m-d'),
            'gender' => $this->faker->randomElement(['male', 'female', 'other', 'prefer_not_to_say']),
            'phone' => $this->faker->phoneNumber(),
            'bio' => $this->faker->paragraph(),
            'profile_picture' => $this->faker->imageUrl(200, 200, 'people'),
            'cover_picture' => $this->faker->imageUrl(1200, 400, 'nature'),
            'learning_interests' => json_encode($this->faker->randomElements(['Web Development', 'Data Science', 'Machine Learning', 'Business', 'Design', 'Marketing'], 3)),
            'preferred_language' => 'en',
            'email_notifications' => true,
            'course_updates_notifications' => true,
            'comment_notifications' => true,
            'website' => $this->faker->url(),
            'linkedin' => 'https://linkedin.com/in/' . $this->faker->userName(),
            'twitter' => 'https://twitter.com/' . $this->faker->userName(),
            'github' => 'https://github.com/' . $this->faker->userName(),
            'timezone' => $this->faker->timezone(),
            'locale' => 'en',
            'last_login_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'last_login_ip' => $this->faker->ipv4(),
        ];

        // Role-specific fields
        if ($role === 'instructor') {
            $data['qualifications'] = json_encode([
                'degree' => $this->faker->randomElement(['PhD', 'Masters', 'Bachelors']),
                'field' => $this->faker->jobTitle(),
                'institution' => $this->faker->company()
            ]);
            $data['teaching_experience'] = $this->faker->paragraph();
            $data['professional_title'] = $this->faker->jobTitle();
        } elseif ($role === 'student') {
            $data['educational_background'] = $this->faker->randomElement(['High School', 'Undergraduate', 'Graduate', 'Professional']);
            $data['current_institution'] = $this->faker->company();
            $data['graduation_year'] = $this->faker->year('+5 years');
        }

        // Platform stats (random for seeded data)
        if ($role === 'student') {
            $data['total_courses_enrolled'] = $this->faker->numberBetween(0, 10);
            $data['total_courses_completed'] = $this->faker->numberBetween(0, $data['total_courses_enrolled']);
            $data['total_learning_hours'] = $this->faker->numberBetween(0, 200);
            $data['total_points'] = $this->faker->numberBetween(0, 1000);
            $data['current_learning_streak'] = $this->faker->numberBetween(0, 30);
        }

        return $data;
    }
}
