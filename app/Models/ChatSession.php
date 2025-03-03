<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatSession extends Model
{
    protected $fillable = [
        'id',
        'user_id',
        'title',
    ];

    // Since we're using UUIDs, disable auto-incrementing and set key type
    public $incrementing = false;
    protected $keyType = 'string';
}
