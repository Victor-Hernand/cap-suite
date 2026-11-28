@props([
    'systemName',
    'tagline',
    'owner' => null,
    'mark' => null,
    'subtitle' => null,
    'photoUrl' => '',
    'providers' => [],
    'helpEmail',
    'mode' => 'login',
    'alert' => null,
    'logosPath' => '/cap/logos',
    'recoverUrl' => null,
])

@php
    $owner ??= config('design.company.loginOwner');
    $mark ??= config('design.company.mark', 'C');
    $subtitle ??= config('design.company.loginSubtitle');
    $providerLabels = ['microsoft' => 'Microsoft', 'google' => 'Google'];
    $loginUrl = \Illuminate\Support\Facades\Route::has('login') ? route('login') : '/login';
    $recoverAction = \Illuminate\Support\Facades\Route::has('password.email') ? route('password.email') : '/forgot-password';
    $recoverLink = $recoverUrl ?? (\Illuminate\Support\Facades\Route::has('password.request') ? route('password.request') : '/forgot-password');
    $passwordHasError = ($alert['status'] ?? null) === 'error';
@endphp

<main class="cap-login">
    <section class="cap-login__photo" @if ($photoUrl !== '') style="--cap-login-photo: url('{{ $photoUrl }}')" @endif>
        <div class="cap-login__brand-tag cap-glass"><span class="cap-shell-logo" aria-hidden="true">{{ $mark }}</span>{{ $systemName }}</div>
        <div class="cap-login__quote cap-glass">
            <p class="cap-login__quote-text">{{ $tagline }}</p>
            @if (filled($owner))<small class="cap-login__quote-owner">{{ $owner }}</small>@endif
        </div>
    </section>

    <section class="cap-login__card cap-glass--light">
        @if ($mode === 'login')
            <form class="cap-login__form" method="POST" action="{{ $loginUrl }}" data-cap-login-form="Ingresando…">
                @csrf
                <h1 class="cap-login__title">Ingresa a {{ $systemName }}</h1>
                <p class="cap-login__subtitle">{{ $subtitle }}</p>

                @if ($alert)
                    <x-cap.alert :status="$alert['status']" :title="$alert['title']" :detail="$alert['detail'] ?? null" :icon="$alert['icon'] ?? null" />
                @endif

                <div class="cap-field">
                    <label class="cap-field__label" for="login-email">Correo</label>
                    <div class="cap-field__control"><input class="cap-field__input" id="login-email" name="email" type="email" value="{{ old('email') }}" autocomplete="username" placeholder="nombre@empresa.com"></div>
                </div>
                <div @class(['cap-field', 'cap-field--error' => $passwordHasError]) id="login-password-field">
                    <label class="cap-field__label" for="login-password">Contraseña</label>
                    <div class="cap-field__control">
                        <input class="cap-field__input" id="login-password" name="password" type="password" autocomplete="current-password" placeholder="••••••••">
                        <button class="cap-field__reveal" type="button" data-cap-password-toggle aria-controls="login-password" aria-label="Mostrar contraseña"><i class="mdi mdi-eye-outline" aria-hidden="true"></i></button>
                    </div>
                </div>

                <div class="cap-login__options">
                    <label class="cap-check"><input class="cap-check__box" type="checkbox" name="remember" value="1">Mantener la sesión</label>
                    <a class="cap-login__link" href="{{ $recoverLink }}">¿Olvidaste tu contraseña?</a>
                </div>

                <button class="cap-button cap-button--primary cap-login__submit" type="submit">Ingresar</button>

                @if ($providers)
                    <p class="cap-login__divider">o continúa con</p>
                    <div @class(['cap-login__providers', 'cap-login__providers--single' => count($providers) === 1])>
                        @foreach ($providers as $provider)
                            <a class="cap-button cap-button--provider" href="{{ \Illuminate\Support\Facades\Route::has('auth.redirect') ? route('auth.redirect', $provider) : "/auth/{$provider}/redirect" }}"><img src="{{ $logosPath }}/{{ $provider }}.svg" alt="" width="18" height="18">{{ $providerLabels[$provider] }}</a>
                        @endforeach
                    </div>
                @endif

                <p class="cap-login__help">¿Problemas para entrar? Escribe a <a class="cap-login__link" href="mailto:{{ $helpEmail }}">{{ $helpEmail }}</a></p>
            </form>
        @else
            <form class="cap-login__form" method="POST" action="{{ $recoverAction }}" data-cap-login-form="Enviando…">
                @csrf
                <h1 class="cap-login__title">Recupera tu acceso</h1>
                <p class="cap-login__subtitle">Te enviaremos un enlace para crear una contraseña nueva.</p>

                @if ($alert)
                    <x-cap.alert :status="$alert['status']" :title="$alert['title']" :detail="$alert['detail'] ?? null" :icon="$alert['icon'] ?? null" />
                @endif

                <div class="cap-field">
                    <label class="cap-field__label" for="recover-email">Correo</label>
                    <div class="cap-field__control"><input class="cap-field__input" id="recover-email" name="email" type="email" value="{{ old('email') }}" autocomplete="username"></div>
                </div>
                <button class="cap-button cap-button--primary cap-login__submit" type="submit">{{ $alert ? 'Enviar de nuevo' : 'Enviar enlace' }}</button>
                <p class="cap-login__help"><a class="cap-login__link" href="{{ $loginUrl }}"><i class="mdi mdi-arrow-left" aria-hidden="true"></i> Volver a ingresar</a></p>
            </form>
        @endif
    </section>

    <button class="cap-login__theme" type="button" data-cap-theme-toggle aria-label="Alternar modo oscuro"><i class="mdi mdi-weather-night" aria-hidden="true"></i></button>
</main>
