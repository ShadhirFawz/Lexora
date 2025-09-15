<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Storage;
use Illuminate\Support\Str;

class CourseController extends Controller
{
    public function index()
    {
        $courses = Course::with('instructor')->get();
        return response()->json($courses);
    }

    public function show($courseId)
    {
        $course = Course::with(['instructor', 'students', 'chapters'])->findOrFail($courseId);
        return response()->json($course);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'instructor') {
            return response()->json(['error' => 'Only instructors can create courses'], 403);
        }

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'image'       => 'nullable|image|max:2048',
        ]);

        $data = [
            'title'         => $validated['title'],
            'description'   => $validated['description'] ?? null,
            'instructor_id' => $user->id,
        ];

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('courses', 'public');
            $data['image'] = $path;
        }

        $course = Course::create($data);

        return response()->json($course, 201);
    }

    public function update(Request $request, $courseId)
    {
        $user = Auth::user();
        $course = Course::findOrFail($courseId);

        if ($user->role !== 'instructor' || $course->instructor_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title'       => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $course->update($validated);

        return response()->json($course);
    }

    public function destroy($courseId)
    {
        $user = Auth::user();
        $course = Course::findOrFail($courseId);

        if ($user->role !== 'instructor' || $course->instructor_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $course->delete();

        return response()->json(['message' => 'Course deleted']);
    }

    public function uploadImage(Request $request, $courseId)
    {
        $user = Auth::user();
        $course = Course::findOrFail($courseId);

        if ($user->role !== 'instructor' || $course->instructor_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'image' => 'required|image|max:2048',
        ]);

        $firebase = new FirebaseService();
        $url = $firebase->uploadFile($request->file('image'));

        $course->image_url = $url;
        $course->save();

        return response()->json([
            'message'   => 'Course image uploaded successfully',
            'image_url' => $url,
        ]);
    }


    public function myCourses()
    {
        $user = Auth::user();

        if ($user->role === 'student') {
            $courses = $user->coursesEnrolled()->with('instructor')->get();
        } elseif ($user->role === 'instructor') {
            $courses = $user->coursesTaught()->with('students')->get();
        } else {
            $courses = Course::with(['instructor', 'students'])->get();
        }

        return response()->json($courses);
    }
}
