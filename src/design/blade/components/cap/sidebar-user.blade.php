@props(['user', 'logoutAction' => null])

@php
    $logoutUrl = $logoutAction ?? (\Illuminate\Support\Facades\Route::has('logout') ? route('logout') : '/logout');
@endphp

<div class="cap-shell-sidebar__user">
    <x-cap.avatar :user="$user" />
    <div class="cap-shell-sidebar__user-text">
        <strong class="cap-shell-sidebar__user-name">{{ $user['name'] }}</strong>
        <small class="cap-shell-sidebar__user-mail">{{ $user['email'] }}</small>
    </div>
    <form method="POST" action="{{ $logoutUrl }}">
        @csrf
        <button class="cap-shell-sidebar__user-menu" type="submit" aria-label="Cerrar sesión"><i class="mdi mdi-logout" aria-hidden="true"></i></button>
    </form>
</div>
