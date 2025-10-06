<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\CloudinaryService;

class ChapterController extends Controller
{
    protected $cloudinaryService;

    public function __construct(CloudinaryService $cloudinaryService)
    {
        $this->cloudinaryService = $cloudinaryService;
    }

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
            'image_url'   => 'nullable|url',
            'video_url'   => 'nullable|url',
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
            'image_url'   => $validated['image_url'] ?? null,
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

        $validated = $request->validate([
            'title'       => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'order'       => 'nullable|integer|min:0',
            'video_url'   => 'nullable|url',
            'image'       => 'nullable|image|max:2048',
        ]);

        $chapter->update(collect($validated)->except('image')->toArray());

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
            'order' => 'required|integer|min:0',
        ]);

        $chapter->order = $request->order;
        $chapter->save();

        return response()->json(['message' => 'Chapter reordered', 'chapter' => $chapter]);
    }

    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:5120',
        ]);

        try {
            $imageUrl = $this->cloudinaryService->upload($request->file('image'), 'chapters');

            return response()->json([
                'success' => true,
                'image_url' => $imageUrl,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
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

        try {
            $resourceUrl = $this->cloudinaryService->upload($request->file('resource'), 'resources');

            $chapter->notes_pdf = $resourceUrl;
            $chapter->save();

            return response()->json([
                'message' => 'Resource uploaded successfully',
                'resource_url' => $resourceUrl,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
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
