<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class GitHubController extends Controller
{
    /**
     * Redirect the user to the GitHub authentication page.
     */
    public function redirectToProvider()
    {
        return Socialite::driver('github')->redirect();
    }

    /**
     * Obtain the user information from GitHub.
     */
    public function handleProviderCallback()
    {
        // Retrieve user info from GitHub
        $githubUser = Socialite::driver('github')->stateless()->user();

        // Find or create a user in your database using the GitHub email
        $user = User::firstOrCreate(
            ['email' => $githubUser->getEmail()],
            [
                'name' => $githubUser->getName() ?? $githubUser->getNickname(),
                // You can set additional fields if needed.
            ]
        );

        // Log the user in
        Auth::login($user, true);

        // Redirect to your home page (or wherever you like)
        return redirect('/');
    }
}
