<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChapterController extends Controller
{
    public function store(Request $request, $courseId)
    {
        $user = Auth::user();
        $course = Course::findOrFail($courseId);

        if ($user->role !== 'instructor' || $course->instructor_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'order'       => 'nullable|integer|min:0',
            'image'       => 'nullable|string', // Changed to string for URL
            'video_url'   => 'nullable|url',
            'resource_url' => 'nullable|string', // Add resource_url
        ]);

        $nextOrder = (int) $course->chapters()->max('order');
        $order = array_key_exists('order', $validated)
            ? $validated['order']
            : $nextOrder + 1;

        $data = [
            'course_id'   => $courseId,
            'title'       => $validated['title'],
            'description' => $validated['description'] ?? null,
            'order'       => $order,
            'video_url'   => $validated['video_url'] ?? null,
            'image'       => $validated['image'] ?? null, // Store URL directly
            'notes_pdf'   => $validated['resource_url'] ?? null, // Store resource URL in notes_pdf
        ];

        $chapter = Chapter::create($data);

        return response()->json($chapter, 201);
    }

    public function update(Request $request, $chapterId)
    {
        $chapter = Chapter::findOrFail($chapterId);
        $user = Auth::user();

        if ($user->role !== 'instructor' || $chapter->course->instructor_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title'       => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'order'       => 'nullable|integer|min:0',
            'video_url'   => 'nullable|url',
            'image'       => 'nullable|string', // Changed to accept URL string
        ]);

        // Update the chapter with all validated data
        $chapter->update($validated);

        return response()->json($chapter);
    }

    public function destroy($chapterId)
    {
        $chapter = Chapter::findOrFail($chapterId);
        $user = Auth::user();

        if ($user->role !== 'instructor' || $chapter->course->instructor_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $chapter->delete();

        return response()->json(['message' => 'Chapter deleted']);
    }

    public function reorder(Request $request, $chapterId)
    {
        $chapter = Chapter::findOrFail($chapterId);
        $user = Auth::user();

        if ($user->role !== 'instructor' || $chapter->course->instructor_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'order' => 'required|integer|min:0',
        ]);

        $chapter->order = $request->order;
        $chapter->save();

        return response()->json(['message' => 'Chapter reordered', 'chapter' => $chapter]);
    }

    public function saveVideo(Request $request, $chapterId)
    {
        $chapter = Chapter::findOrFail($chapterId);
        $user = Auth::user();

        if ($user->role !== 'instructor' || $chapter->course->instructor_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'video_url' => 'required|url',
        ]);

        $chapter->video_url = $request->video_url;
        $chapter->save();

        return response()->json(['message' => 'Video URL saved', 'video_url' => $chapter->video_url]);
    }

    public function getVideo($chapterId)
    {
        $chapter = Chapter::findOrFail($chapterId);

        return response()->json(['video_url' => $chapter->video_url]);
    }
}
