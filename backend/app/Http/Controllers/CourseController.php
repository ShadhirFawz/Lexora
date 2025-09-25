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
    public function index(Request $request)
    {
        // Get pagination parameters with defaults
        $perPage = $request->get('per_page', 10);
        $page = $request->get('page', 1);

        $courses = Course::with([
            'instructor:id,name,email', // Only essential instructor fields
            'chapters:id,course_id,title,order,video_url', // Only essential chapter fields
            'students' => function ($query) {
                $query->select('users.id', 'users.name')
                    ->withPivot('progress_percent')
                    ->limit(5); // Limit number of students returned
            }
        ])
            ->withCount([
                'chapters as total_chapters',
                'students as total_students',
                'comments as total_comments'
            ])
            ->where('status', 'approved')
            ->select([ // Select only necessary course fields
                'id',
                'title',
                'description',
                'image_url',
                'instructor_id',
                'status',
                'created_at',
                'updated_at'
            ])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $courses->items(),
            'pagination' => [
                'current_page' => $courses->currentPage(),
                'per_page' => $courses->perPage(),
                'total' => $courses->total(),
                'last_page' => $courses->lastPage(),
                'from' => $courses->firstItem(),
                'to' => $courses->lastItem(),
            ]
        ]);
    }

    public function show($courseId)
    {
        $course = Course::with(['instructor', 'students', 'chapters'])->findOrFail($courseId);

        // If course is not approved, only allow access to instructor or admin
        if ($course->status !== 'approved') {
            $user = Auth::user();
            if (!$user || ($user->role !== 'instructor' && $user->role !== 'admin')) {
                return response()->json(['error' => 'Course not available'], 404);
            }

            // For instructors, only allow access to their own courses
            if ($user->role === 'instructor' && $course->instructor_id !== $user->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }

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
            'status'        => 'pending', // Set status to pending by default
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
