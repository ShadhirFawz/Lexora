# Lexora

**Transform your learning journey**

Lexora is a comprehensive e-learning platform built with a Laravel backend and Next.js frontend. It enables instructors to create and manage courses with chapters, videos, and interactive features, while students can enroll, track progress, take notes, and engage through comments and reactions. The platform supports role-based access (admin, instructor, student), secure authentication, and media handling via Cloudinary for image uploads.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Backend Setup (Laravel)](#backend-setup-laravel)
  - [Frontend Setup (Next.js)](#frontend-setup-nextjs)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)

## Features

- **User Authentication**: Secure registration, login, and logout with Sanctum-based API tokens.
- **Role-Based Access**: Admins manage users and courses (For future Implementation); instructors create and analyze courses; students enroll and learn.
- **Course Management**: Create, update, delete, and list courses. Instructors can view statistics and other courses.
- **Chapter Management**: Add, edit, reorder, and delete chapters with video uploads and playback.
- **Enrollment System**: Students can enroll/unenroll in courses and check enrollment status.
- **Progress Tracking**: Update and view chapter progress for enrolled courses.
- **Interactive Engagement**:
  - Course and chapter comments with replies, likes, and deletion.
  - Course reactions (e.g., likes/dislikes) with toggle functionality.
- **Student Notes**: Create and delete timestamped notes with respect to the video timestamp, tied to video chapters.
- **Admin Tools**: List users/courses, update roles, approve/reject/delete courses, and delete users. (Future Implementation)
- **Media Handling**: Frontend integrates Cloudinary for seamless image uploads.
- **Learning Interface**: Dedicated endpoints for learning chapters, including notes and comments.

## Tech Stack

- **Backend**: Laravel (PHP framework) with PostgreSQL as the primary database.
- **Frontend**: Next.js (React framework) with Tailwind CSS for styling.
- **Media Storage**: Cloudinary for image uploads (integrated in frontend).
- **API Authentication**: Laravel Sanctum.
- **Database**: PostgreSQL for relational data storage.
- **Other**: CORS support for frontend-backend communication, file-based sessions.

## Prerequisites

- PHP >= 8.1
- Composer (for Laravel dependencies)
- Node.js >= 22.14.0 and npm/yarn (for Next.js)
- PostgreSQL database server
- Cloudinary account (for image uploads; obtain cloud name and upload preset)

## Installation

### Backend Setup (Laravel)

1. Clone the repository:
   ```
   git clone https://github.com/ShadhirFawz/Lexora/
   cd backend
   ```

2. Install dependencies:
   ```
   composer install
   ```

3. Copy the example environment file and configure:
   ```
   cp .env.example .env
   ```
   Update `.env` with your details (based on provided config):
   ```
   APP_NAME="E-Learning API"
   APP_ENV=local
   APP_KEY=base64: # Generate a new key if needed: php artisan key:generate
   APP_DEBUG=true
   APP_URL=http://127.0.0.1:8000

   LOG_CHANNEL=stack
   LOG_LEVEL=debug

   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=lms_db  # Create this database in PostgreSQL
   DB_USERNAME=lms_user
   DB_PASSWORD=Darkstar1

   SESSION_DRIVER=file
   SESSION_LIFETIME=120
   ```
   Ensure your PostgreSQL database is created and credentials match.

4. Run migrations:
   ```
   php artisan migrate
   ```

### Frontend Setup (Next.js)

1. Navigate to the frontend directory:
   ```
   cd ../frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy the example environment file and configure:
   ```
   cp .env.example .env.local
   ```
   Update `.env.local` with your details:
   ```
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
   NEXT_PUBLIC_BASE_URL=http://localhost:3000

   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
   ```

## Running the Application

1. Start the backend server:
   ```
   cd backend
   php artisan serve
   ```
   The API will be available at `http://127.0.0.1:8000`.

2. Start the frontend development server:
   ```
   cd frontend
   npm run dev  # or yarn dev
   ```
   The app will be available at `http://localhost:3000`.

3. For production builds:
   - Backend: Use a web server like Apache/Nginx with Laravel configuration.
   - Frontend: Run `npm run build` and serve with `npm run start`.

## API Endpoints

All API routes are prefixed with `/api`. Below is a summary grouped by feature. Authentication is required for most endpoints (use Sanctum tokens after login).

### Health Check
- `GET /health`: Check server status.

### Authentication
- `POST /register`: Register a new user.
- `POST /login`: Login and get token.
- `POST /logout`: Logout (authenticated).
- `GET /me`: Get current user profile (authenticated).

### Admin (Prefix: `/admin`) (Future Implementation)
- `GET /users`: List all users.
- `PUT /users/{id}/role`: Update user role.
- `DELETE /users/{id}`: Delete user.
- `GET /courses`: List all courses.
- `PUT /courses/{id}/approve`: Approve course.
- `PUT /courses/{id}/reject`: Reject course.
- `DELETE /courses/{id}`: Delete course.

### Courses
- `GET /courses`: List all courses.
- `GET /my-courses`: List role-specific courses.
- `POST /courses`: Create a course.
- `GET /courses/{id}`: Show course details.
- `PUT /courses/{id}`: Update course.
- `DELETE /courses/{id}`: Delete course.
- `POST /courses/{courseId}/react`: Toggle reaction.
- `GET /courses/{courseId}/reactions`: Get reactions.
- `POST /courses/{courseId}/comments`: Post comment.
- `GET /courses/{courseId}/comments`: List comments.
- `DELETE /course-comments/{commentId}`: Delete comment.
- `POST /course-comments/{commentId}/like`: Toggle like.

### Chapters
- `POST /courses/{courseId}/chapters`: Create chapter.
- `PUT /chapters/{id}`: Update chapter.
- `DELETE /chapters/{id}`: Delete chapter.
- `POST /chapters/{id}/reorder`: Reorder chapters.
- `POST /chapters/{id}/video`: Save video.
- `GET /chapters/{id}/video`: Get video.
- `GET /chapters/{chapterId}/learn`: Get chapter for learning.
- `GET /chapters/{chapterId}/notes`: List notes.

### Progress
- `POST /progress`: Update chapter progress.
- `GET /progress/{course_id}`: Show progress.

### Notes
- `POST /notes/video`: Create video note.
- `DELETE /notes/{noteId}`: Delete note.

### Chapter Comments
- `POST /chapters/{chapterId}/comments`: Post comment.
- `GET /chapters/{chapterId}/comments`: List comments.
- `DELETE /chapter-comments/{id}`: Delete comment.
- `POST /chapter-comments/{commentId}/like`: Toggle like.
- `POST /chapter-comments/{commentId}/reply`: Reply to comment.

### Enrollments
- `POST /courses/{courseId}/enroll`: Enroll in course.
- `DELETE /courses/{courseId}/unenroll`: Unenroll.

### Student Courses
- `GET /student/courses/check-enrollment/{courseId}`: Check enrollment.
- `GET /student/courses/{courseId}`: Get course with status.
- `GET /student/courses`: List courses with status.

### Instructor Courses
- `GET /instructor/courses`: List instructor courses.
- `GET /instructor/courses/{courseId}/statistics`: Get statistics.
- `GET /instructor/other-courses`: List other courses.

For detailed implementation,
## Postman Collection

Explore and test the API endpoints using the public Postman collection:  
[Lexora API Collection](https://www.postman.com/supply-astronomer-76190703/workspace/lexora-e-learning-platform/collection/33331251-8c5bb08f-9fe3-4842-9f0b-ba3dea322848?action=share&creator=33331251)

## Contributing

Contributions are welcome! Please fork the repo, create a feature branch, and submit a pull request. Ensure code follows Laravel and Next.js best practices.
