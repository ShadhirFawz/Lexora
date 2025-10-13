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

        return response()->json($this->formatNote($note), 201);
    }

    public function index($chapterId)
    {
        $user = Auth::user();

        if ($user->role !== 'student') {
            return response()->json(['error' => 'Only students can view notes'], 403);
        }

        $chapter = Chapter::findOrFail($chapterId);

        // Must be enrolled in the course
        if (!$user->coursesEnrolled()->where('course_id', $chapter->course_id)->exists()) {
            return response()->json(['error' => 'Enroll in the course to view notes'], 403);
        }

        $notes = StudentNote::where('student_id', $user->id)
            ->where('chapter_id', $chapterId)
            ->orderBy('timestamp', 'asc')
            ->get();

        return response()->json($notes->map(function ($note) {
            return $this->formatNote($note);
        }));
    }

    public function destroy($noteId)
    {
        $user = Auth::user();
        $note = StudentNote::findOrFail($noteId);

        if ($user->role !== 'student' || $note->student_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized - You can only delete your own notes'], 403);
        }

        $note->delete();
        return response()->json(['message' => 'Note deleted successfully']);
    }

    private function formatNote(StudentNote $note): array
    {
        return [
            'id' => $note->id,
            'student_id' => $note->student_id,
            'course_id' => $note->course_id,
            'chapter_id' => $note->chapter_id,
            'timestamp' => $note->timestamp,
            'note' => $note->note,
            'created_at' => $note->created_at->toDateTimeString(),
            'updated_at' => $note->updated_at->toDateTimeString(),
            'formatted_timestamp' => $this->formatTimestamp($note->timestamp),
        ];
    }

    private function formatTimestamp(?int $timestamp): string
    {
        if (!$timestamp) return '00:00';

        $minutes = floor($timestamp / 60);
        $seconds = $timestamp % 60;

        return sprintf('%02d:%02d', $minutes, $seconds);
    }
}
