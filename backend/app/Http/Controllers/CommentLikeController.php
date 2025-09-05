<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Support\Facades\Auth;

class CommentLikeController extends Controller
{
    public function toggle($commentId)
    {
        $user = Auth::user();
        $comment = Comment::findOrFail($commentId);

        if ($comment->likes()->where('user_id', $user->id)->exists()) {
            $comment->likes()->detach($user->id);
            return response()->json(['message' => 'Like removed']);
        } else {
            $comment->likes()->attach($user->id);
            return response()->json(['message' => 'Like added']);
        }
    }
}
