<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'username' => 'nullable|string|max:50|unique:users',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role'     => 'in:student,instructor,admin',
            'phone'    => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'gender'   => 'nullable|in:male,female,other,prefer_not_to_say',
            // Add validation for other fields as needed
        ]);

        $userData = [
            'name'     => $request->name,
            'username' => $request->username ?? strtolower(str_replace(' ', '.', $request->name)) . rand(100, 999),
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role ?? 'student',
            'phone'    => $request->phone,
            'date_of_birth' => $request->date_of_birth,
            'gender'   => $request->gender,
            'bio'      => $request->bio,
            'preferred_language' => $request->preferred_language ?? 'en',
            'timezone' => $request->timezone ?? 'UTC',
            'locale'   => $request->locale ?? 'en',
        ];

        $user = User::create($userData);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status'  => 'success',
            'message' => 'User registered successfully',
            'user'    => $user->only(['id', 'name', 'username', 'email', 'role', 'profile_picture_url']),
            'token'   => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status'  => 'success',
            'message' => 'Login successful',
            'user'    => $user->only(['id', 'name', 'email', 'role']),
            'token'   => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Logged out successfully'
        ]);
    }
}
