@props(['systemName', 'menu', 'user', 'logoutAction' => null, 'owner' => null, 'mark' => null])

@php
    $owner ??= config('design.company.name');
    $mark ??= config('design.company.mark', 'C');
@endphp

<aside class="cap-shell-sidebar cap-glass" data-cap-sidebar data-collapsed="false">
    {{-- Única excepción a «Blade sin <script>»: shell-auto.js llega tarde y el riel parpadearía. Misma clave y defectos que collapse.js. --}}
    <script>
        (() => {
            const sidebar = document.querySelector('[data-cap-sidebar]');
            let stored = null;
            try { stored = localStorage.getItem('cap-shell:sidebar-collapsed'); } catch { stored = null; }
            const collapsed = stored === null ? innerWidth >= 1024 : stored === 'true';
            sidebar.style.transition = 'none';
            sidebar.dataset.collapsed = String(collapsed);
            void sidebar.offsetWidth;
            sidebar.style.transition = '';
        })();
    </script>
    <button class="cap-shell-sidebar__collapse" type="button" data-cap-collapse aria-expanded="true" aria-label="Contraer menú"><i class="mdi mdi-chevron-left" aria-hidden="true"></i></button>

    <div class="cap-shell-sidebar__brand">
        <span class="cap-shell-logo" aria-hidden="true">{{ $mark }}</span>
        <div class="cap-shell-sidebar__brand-text">
            <strong class="cap-shell-sidebar__brand-name">{{ $systemName }}</strong>
            <small class="cap-shell-sidebar__brand-owner">{{ $owner }}</small>
        </div>
    </div>

    <nav class="cap-shell-sidebar__nav" aria-label="Menú principal">
        @foreach ($menu as $group)
            <p class="cap-shell-sidebar__group-label">{{ $group['label'] }}</p>
            @foreach ($group['items'] as $item)
                <x-cap.sidebar-item :item="$item" />
            @endforeach
        @endforeach
    </nav>

    <div class="cap-shell-sidebar__spacer"></div>

    <button class="cap-shell-sidebar__item cap-shell-sidebar__theme" type="button" data-cap-theme-toggle aria-label="Alternar modo oscuro">
        <i class="cap-shell-sidebar__icon mdi mdi-weather-night" aria-hidden="true"></i>
        <span class="cap-shell-sidebar__label">Modo oscuro</span>
        <span class="cap-shell-sidebar__switch" aria-hidden="true"></span>
        <span class="cap-shell-sidebar__tooltip" aria-hidden="true">Modo oscuro</span>
    </button>

    <x-cap.sidebar-user :user="$user" :logout-action="$logoutAction" />
</aside>
