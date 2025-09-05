<?php

namespace App\Http\Controllers;

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

        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'chapter_id' => 'required|exists:chapters,id',
            'timestamp' => 'nullable|integer',
            'note' => 'required|string',
        ]);

        $note = StudentNote::create([
            'student_id' => $user->id,
            'course_id' => $request->course_id,
            'chapter_id' => $request->chapter_id,
            'timestamp' => $request->timestamp,
            'note' => $request->note,
        ]);

        return response()->json($note, 201);
    }
}
