@props(['modules', 'allHref' => ''])

<section id="cap-modules" class="cap-module-switcher cap-glass" aria-label="Cambiar de módulo" hidden>
    <div class="cap-module-switcher__head">
        <span>Módulos</span>
        @if ($allHref !== '')<a class="cap-module-switcher__all" href="{{ $allHref }}">Ver todos</a>@endif
    </div>
    <div class="cap-module-switcher__grid">
        @foreach ($modules as $module)
            <x-cap.module-switcher-item :module="$module" />
        @endforeach
    </div>
</section>
