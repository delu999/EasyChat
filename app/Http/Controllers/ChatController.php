<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\ChatMessage;
use App\Models\ChatSession;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    public function storeMessage(Request $request)
    {
        $inputText = $request->input('text');
        $sessionId = $request->input('session_id') ?? Str::uuid()->toString();

        // Save the user's message
        $userMessage = ChatMessage::create([
            'user_id'    => auth()->id() ?? null,
            'session_id' => $sessionId,
            'role'       => 'user',
            'content'    => $inputText,
        ]);

        // Get the assistant's response using conversation context
        $assistantResponseText = $this->callGeminiAPIWithContext($inputText, $sessionId);

        // Save the assistant's response
        $assistantMessage = ChatMessage::create([
            'user_id'    => auth()->id() ?? null,
            'session_id' => $sessionId,
            'role'       => 'assistant',
            'content'    => $assistantResponseText,
        ]);

        return response()->json([
            'userMessage'      => $userMessage,
            'assistantMessage' => $assistantMessage,
        ]);
    }

    /**
     * Build a conversation transcript from previous messages and call Gemini API.
     */
    private function callGeminiAPIWithContext(string $inputText, string $sessionId): string
    {
        // Fetch previous conversation messages (you might limit these by count or token length)
        $contextMessages = ChatMessage::where('session_id', $sessionId)
            ->orderBy('created_at')
            ->get();

        // Build the conversation transcript
        $conversation = "";
        foreach ($contextMessages as $message) {
            if ($message->role === 'user') {
                $conversation .= "User: " . $message->content . "\n";
            } else {
                $conversation .= "Assistant: " . $message->content . "\n";
            }
        }

        // Append the new user input
        $conversation .= "User: " . $inputText . "\nAssistant:";

        $apiKey = config('services.gemini.api_key'); // Ensure this is set in your config

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" . $apiKey,
            [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $conversation]
                        ]
                    ]
                ]
            ]
        );

        $json = $response->json();

        // Extract the assistant's reply from the API response
        return data_get($json, 'candidates.0.content.parts.0.text', 'No response from Gemini');
    }

    public function getConversation(Request $request)
    {
        $sessionId = $request->input('session_id');

        $messages = ChatMessage::where('session_id', $sessionId)
            ->orderBy('created_at')
            ->get();

        return response()->json($messages);
    }

    public function createSession(Request $request)
    {
        $sessionId = (string) Str::uuid();
        $chatSession = ChatSession::create([
            'id' => $sessionId,
            'user_id' => auth()->id() ?? null,
            'title' => $request->input('title', 'New Chat'),
        ]);

        return response()->json($chatSession);
    }

    public function getSessions(Request $request)
    {
        $userId = auth()->id();
        $sessions = ChatSession::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($sessions);
    }

    public function generateContentLocal(Request $request)
    {
        $prompt = $request->input('text');
        $apiKey = config('services.gemini.api_key'); // Ensure this is set in your .env and config/services.php

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" . $apiKey,
            [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ]
            ]
        );

        // Return the JSON response from Gemini directly
        return response()->json($response->json());
    }

}
