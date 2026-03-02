<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ContactMessage;
use App\Mail\RecruitmentApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function contact(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        Mail::to(config('mail.from.address'))
            ->queue(new ContactMessage($validated));

        return response()->json(['message' => 'Message envoyé avec succès.']);
    }

    public function recruit(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'position' => 'required|string|max:255',
            'experience' => 'required|string|max:255',
            'message' => 'nullable|string|max:5000',
        ]);

        Mail::to(config('mail.from.address'))
            ->queue(new RecruitmentApplication($validated));

        return response()->json(['message' => 'Candidature envoyée avec succès.']);
    }
}
