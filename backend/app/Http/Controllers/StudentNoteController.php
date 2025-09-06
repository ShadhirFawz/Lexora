<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\StudentNote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudentNoteController extends Controller
{
    public function store(Request $request)
    {
        $user = Auth::user();
        if ($user->role !== 'student') {
            return response()->json(['error' => 'Only students can add notes'], 403);
        }

        $validated = $request->validate([
            'course_id'  => 'required|exists:courses,id',
            'chapter_id' => 'required|exists:chapters,id',
            'timestamp'  => 'nullable|integer|min:0',
            'note'       => 'required|string',
        ]);

        // Must be enrolled
        if (!$user->coursesEnrolled()->where('course_id', $validated['course_id'])->exists()) {
            return response()->json(['error' => 'Enroll in the course to add notes'], 403);
        }

        // Chapter must belong to course
        $chapter = Chapter::findOrFail($validated['chapter_id']);
        if ((int) $chapter->course_id !== (int) $validated['course_id']) {
            return response()->json(['error' => 'Chapter does not belong to this course'], 422);
        }

        $note = StudentNote::create([
            'student_id' => $user->id,
            'course_id'  => $validated['course_id'],
            'chapter_id' => $validated['chapter_id'],
            'timestamp'  => $validated['timestamp'] ?? null,
            'note'       => $validated['note'],
        ]);

        return response()->json($note, 201);
    }
}
