<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    private function ensureAdmin()
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['error' => 'Forbidden: Admins only'], 403);
        }
        return null;
    }

    // List all users
    public function listUsers()
    {
        if ($resp = $this->ensureAdmin()) return $resp;

        return User::all();
    }

    // Update user role
    public function updateUserRole(Request $request, $id)
    {
        if ($resp = $this->ensureAdmin()) return $resp;

        $request->validate(['role' => 'required|in:student,instructor,admin']);

        $user = User::findOrFail($id);
        $user->role = $request->role;
        $user->save();

        return response()->json(['message' => 'User role updated', 'user' => $user]);
    }

    // Delete a user
    public function deleteUser($id)
    {
        if ($resp = $this->ensureAdmin()) return $resp;

        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }

    // List all courses
    public function listCourses()
    {
        if ($resp = $this->ensureAdmin()) return $resp;

        return Course::with('instructor')->get();
    }

    // Approve a course
    public function approveCourse($id)
    {
        if ($resp = $this->ensureAdmin()) return $resp;

        $course = Course::findOrFail($id);
        $course->status = 'approved';
        $course->save();

        return response()->json(['message' => 'Course approved', 'course' => $course]);
    }

    // Reject a course
    public function rejectCourse($id)
    {
        if ($resp = $this->ensureAdmin()) return $resp;

        $course = Course::findOrFail($id);
        $course->status = 'rejected';
        $course->save();

        return response()->json(['message' => 'Course rejected', 'course' => $course]);
    }

    // Delete a course
    public function deleteCourse($id)
    {
        if ($resp = $this->ensureAdmin()) return $resp;

        $course = Course::findOrFail($id);
        $course->delete();

        return response()->json(['message' => 'Course deleted']);
    }
}
