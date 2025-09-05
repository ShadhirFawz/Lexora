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

        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'order'       => 'integer',
            'image'       => 'nullable|image|max:2048',
            'video_url'   => 'nullable|url',
        ]);

        $data = [
            'course_id'   => $courseId,
            'title'       => $request->title,
            'description' => $request->description,
            'order'       => $request->order ?? 0,
            'video_url'   => $request->video_url,
        ];

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('chapters/images', 'public');
            $data['image'] = $path;
        }

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

        $chapter->update($request->only(['title', 'description', 'order', 'video_url']));

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('chapters/images', 'public');
            $chapter->image = $path;
            $chapter->save();
        }

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
            'order' => 'required|integer',
        ]);

        $chapter->order = $request->order;
        $chapter->save();

        return response()->json(['message' => 'Chapter reordered', 'chapter' => $chapter]);
    }

    public function uploadResource(Request $request, $chapterId)
    {
        $chapter = Chapter::findOrFail($chapterId);
        $user = Auth::user();

        if ($user->role !== 'instructor' || $chapter->course->instructor_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'resource' => 'required|file|mimes:pdf,txt|max:5120',
        ]);

        $file = $request->file('resource');
        $path = $file->store('chapters/resources', 'public');

        $chapter->notes_pdf = $path;
        $chapter->save();

        return response()->json([
            'message'      => 'Resource uploaded successfully',
            'resource_url' => asset('storage/' . $path),
        ]);
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
