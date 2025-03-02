<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\ChatMessage;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    /**
     * Store user message, call Gemini, store AI response, return both.
     */
    public function storeMessage(Request $request)
    {
        $inputText = $request->input('text');
        $sessionId = $request->input('session_id') ?? Str::uuid()->toString();

        // 1. Save the user’s message
        $userMessage = ChatMessage::create([
            'user_id'    => auth()->id() ?? null,
            'session_id' => $sessionId,
            'role'       => 'user',
            'content'    => $inputText,
        ]);

        // 2. Call Gemini to get a response text (not a full Response object)
        $assistantResponseText = $this->callGeminiAPI($inputText);

        // 3. Save the assistant’s response
        $assistantMessage = ChatMessage::create([
            'user_id'    => auth()->id() ?? null,
            'session_id' => $sessionId,
            'role'       => 'assistant',
            'content'    => $assistantResponseText,
        ]);

        // 4. Return both messages as JSON
        return response()->json([
            'userMessage'      => $userMessage,
            'assistantMessage' => $assistantMessage,
        ]);
    }

    /**
     * Calls Gemini and returns the response text only.
     */
    private function callGeminiAPI(string $inputText): string
    {
        $apiKey = config('services.gemini.api_key'); // Make sure this is set
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" . $apiKey,
            [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $inputText]
                        ]
                    ]
                ]
            ]
        );

        // Convert the HTTP response to an array
        $json = $response->json();

        // Safely extract the text from the first candidate
        // If it doesn’t exist, return a default string
        return data_get($json, 'candidates.0.content.parts.0.text', 'No response from Gemini');
    }

    /**
     * Fetch all messages for a given session_id.
     */
    public function getConversation(Request $request)
    {
        $sessionId = $request->input('session_id');
        $messages = ChatMessage::where('session_id', $sessionId)
            ->orderBy('created_at')
            ->get();

        return response()->json($messages);
    }
}
