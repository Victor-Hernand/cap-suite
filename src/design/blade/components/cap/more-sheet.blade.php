@props(['menu' => [], 'user', 'logoutAction' => null, 'modules' => []])

<div class="cap-shell-sheet" id="cap-more-sheet" role="dialog" aria-modal="true" aria-label="Menú completo" data-open="false">
    <div class="cap-shell-sheet__backdrop" data-cap-sheet-backdrop></div>
    <div class="cap-shell-sheet__panel cap-glass">
        <div class="cap-shell-sheet__handle" data-cap-sheet-handle></div>
        @if (count($modules))
            <p class="cap-shell-sidebar__group-label">Módulos</p>
            <nav class="cap-module-switcher__grid" aria-label="Módulos">
                @foreach ($modules as $module)
                    <x-cap.module-switcher-item :module="$module" />
                @endforeach
            </nav>
        @endif
        @foreach ($menu as $group)
            <p class="cap-shell-sidebar__group-label">{{ $group['label'] }}</p>
            @foreach ($group['items'] as $item)
                <a class="cap-shell-sidebar__item" href="{{ $item['href'] ?? '#' }}" @if (! empty($item['active'])) aria-current="page" @endif aria-label="{{ $item['ariaLabel'] }}"><i class="cap-shell-sidebar__icon mdi mdi-{{ $item['icon'] }}" aria-hidden="true"></i>{{ $item['label'] }}@if (! empty($item['count']))<span @class(['cap-shell-sidebar__count', 'cap-shell-sidebar__count--urgent' => ! empty($item['urgent'])])>{{ $item['count'] }}</span>@endif</a>
                @if (! empty($item['children']))
                    <div class="cap-shell-sidebar__children">
                        @foreach ($item['children'] as $child)
                            <x-cap.sidebar-child :child="$child" />
                        @endforeach
                    </div>
                @endif
            @endforeach
        @endforeach
        <button class="cap-shell-sidebar__item" type="button" data-cap-theme-toggle aria-label="Alternar modo oscuro"><i class="cap-shell-sidebar__icon mdi mdi-weather-night" aria-hidden="true"></i>Modo oscuro<span class="cap-shell-sidebar__switch" aria-hidden="true"></span></button>
        <x-cap.sidebar-user :user="$user" :logout-action="$logoutAction" />
    </div>
</div>
