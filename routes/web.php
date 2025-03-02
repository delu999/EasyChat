<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ChatController;

Route::get('/', function () {
    return Inertia::render('chat');
})->name('chat');

// The chat routes:
Route::post('/chat/store-message', [ChatController::class, 'storeMessage']);
Route::post('/chat/get-conversation', [ChatController::class, 'getConversation']);




require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
