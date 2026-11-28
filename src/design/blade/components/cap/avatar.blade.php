@props(['user'])

@php
    $words = array_slice(preg_split('/\s+/', trim($user['name'])), 0, 2);
    $initials = implode('', array_map(fn ($word) => mb_strtoupper(mb_substr($word, 0, 1)), $words));
@endphp

<span class="cap-shell-avatar" aria-hidden="true">@if (! empty($user['avatarUrl']))<img src="{{ $user['avatarUrl'] }}" alt="">@else{{ $initials }}@endif</span>
