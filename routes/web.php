<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\Auth\GitHubController;

Route::get('/', function () {
    return Inertia::render('chat');
})->name('chat');


Route::post('/chat/session', [ChatController::class, 'createSession']);
Route::get('/chat/sessions', [ChatController::class, 'getSessions']);

Route::post('/chat/store-message', [ChatController::class, 'storeMessage']);
Route::post('/chat/get-conversation', [ChatController::class, 'getConversation']);

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
