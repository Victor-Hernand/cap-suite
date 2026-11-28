@props(['module'])

@php $isLocked = array_key_exists('granted', $module) && ! $module['granted']; @endphp

@if ($isLocked)
    <div class="cap-module-card cap-module-card--locked" role="group" aria-label="{{ $module['name'] }}, sin acceso">
        <div class="cap-module-card__top">
            <span class="cap-module-tile"><i class="mdi mdi-lock-outline" aria-hidden="true"></i></span>
        </div>
        <div>
            <h4 class="cap-module-card__name">{{ $module['name'] }}</h4>
            <p class="cap-module-card__desc" title="{{ $module['description'] }}">{{ $module['description'] }}</p>
        </div>
        <div class="cap-module-card__foot">
            <span>Sin acceso</span>
            @if (! empty($module['requestHref']))
                <a class="cap-module-card__request" href="{{ $module['requestHref'] }}">Solicitar acceso</a>
            @else
                <button class="cap-module-card__request" type="button" data-cap-module-request="{{ $module['id'] }}">Solicitar acceso</button>
            @endif
        </div>
    </div>
@else
    @php
        $isPinned = ! empty($module['pinned']);
        $nameId = "cap-module-{$module['id']}-name";
    @endphp
    <a @class(['cap-module-card', 'cap-module-card--featured' => ! empty($module['featured'])]) href="{{ $module['href'] }}" aria-labelledby="{{ $nameId }}">
        <div class="cap-module-card__top">
            <span class="cap-module-tile"><i class="mdi mdi-{{ $module['icon'] }}" aria-hidden="true"></i></span>
            <button class="cap-module-card__pin" type="button" aria-label="Fijar {{ $module['name'] }}" aria-pressed="{{ $isPinned ? 'true' : 'false' }}" data-cap-module-pin="{{ $module['id'] }}">
                <i class="mdi {{ $isPinned ? 'mdi-star' : 'mdi-star-outline' }}" aria-hidden="true"></i>
            </button>
        </div>
        <div>
            <h4 class="cap-module-card__name" id="{{ $nameId }}">{{ $module['name'] }}</h4>
            <p class="cap-module-card__desc" title="{{ $module['description'] }}">{{ $module['description'] }}</p>
        </div>
        <div class="cap-module-card__foot">
            @if (! empty($module['pending']))
                @php $countStatus = $module['pending']['status'] ?? null; @endphp
                <span class="cap-module-card__count"@if ($countStatus && $countStatus !== 'brand') data-status="{{ $countStatus }}"@endif>{{ $module['pending']['label'] }}</span>
            @endif
            @if (! empty($module['lastUsed']))<span>{{ $module['lastUsed'] }}</span>@endif
            <i class="cap-module-card__arrow mdi mdi-arrow-right" aria-hidden="true"></i>
        </div>
    </a>
@endif
