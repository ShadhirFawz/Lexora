<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CourseController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if ($user->role === 'student') {
            $courses = $user->coursesEnrolled()->with('instructor')->get();
        } elseif ($user->role === 'instructor') {
            $courses = $user->coursesTaught()->with('students')->get();
        } else {
            $courses = Course::with(['instructor', 'students'])->get(); // admin sees all
        }

        return response()->json($courses);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'instructor') {
            return response()->json(['error' => 'Only instructors can create courses'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string'
        ]);

        $course = Course::create([
            'title' => $request->title,
            'description' => $request->description,
            'instructor_id' => $user->id
        ]);

        return response()->json($course, 201);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $course = Course::findOrFail($id);

        if ($user->role !== 'instructor' || $course->instructor_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $course->update($request->only('title', 'description'));

        return response()->json($course);
    }

    public function destroy($id)
    {
        $user = Auth::user();
        $course = Course::findOrFail($id);

        if ($user->role !== 'instructor' || $course->instructor_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $course->delete();

        return response()->json(['message' => 'Course deleted']);
    }
}
