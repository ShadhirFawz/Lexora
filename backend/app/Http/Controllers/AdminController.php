<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Course;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function __construct()
    {
        // Ensure only admins can access
        $this->middleware(function ($request, $next) {
            if (auth()->user()->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            return $next($request);
        });
    }

    /* ---------------- USERS ---------------- */
    public function listUsers()
    {
        return response()->json(
            User::select('id', 'name', 'email', 'role')->get()
        );
    }

    public function updateUserRole(Request $request, $id)
    {
        $request->validate([
            'role' => 'required|in:student,instructor,admin'
        ]);

        $user = User::findOrFail($id);
        $user->role = $request->role;
        $user->save();

        return response()->json([
            'message' => 'Role updated',
            'user'    => $user
        ]);
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }

    /* ---------------- COURSES ---------------- */
    public function listCourses()
    {
        return response()->json(
            Course::with('instructor:id,name,email')->get()
        );
    }

    public function approveCourse($id)
    {
        $course = Course::findOrFail($id);
        $course->status = 'approved';
        $course->save();

        return response()->json([
            'message' => 'Course approved',
            'course'  => $course
        ]);
    }

    public function rejectCourse($id)
    {
        $course = Course::findOrFail($id);
        $course->status = 'rejected';
        $course->save();

        return response()->json([
            'message' => 'Course rejected',
            'course'  => $course
        ]);
    }

    public function deleteCourse($id)
    {
        $course = Course::findOrFail($id);
        $course->delete();

        return response()->json(['message' => 'Course deleted']);
    }
}
