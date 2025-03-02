<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\GeminiController;

Route::get('/', function () {
    return Inertia::render('chat');
})->name('chat');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::post('/generate', [GeminiController::class, 'generateContent']);



require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
