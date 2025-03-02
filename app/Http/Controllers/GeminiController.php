<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GeminiController extends Controller
{
    public function generateContent(Request $request)
    {
        $inputText = $request->input('text');
        $apiKey = config('services.gemini.api_key'); // Ensure you have this in your config

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" . $apiKey, [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $inputText]
                    ]
                ]
            ]
        ]);

        // Return the Gemini API response
        return response()->json($response->json());
    }
}
