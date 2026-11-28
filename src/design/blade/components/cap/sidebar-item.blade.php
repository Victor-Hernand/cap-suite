@props(['item'])

@if (! empty($item['children']))
    <details class="cap-shell-sidebar__branch" open>
        <summary class="cap-shell-sidebar__item" aria-label="{{ $item['ariaLabel'] }}">
            <i class="cap-shell-sidebar__icon mdi mdi-{{ $item['icon'] }}" aria-hidden="true"></i>
            <span class="cap-shell-sidebar__label">{{ $item['label'] }}</span>
            <i class="cap-shell-sidebar__chevron mdi mdi-chevron-down" aria-hidden="true"></i>
            <span class="cap-shell-sidebar__tooltip" aria-hidden="true">{{ $item['label'] }}</span>
        </summary>
        <div class="cap-shell-sidebar__children">
            @foreach ($item['children'] as $child)
                <x-cap.sidebar-child :child="$child" />
            @endforeach
        </div>
    </details>
@else
    <a class="cap-shell-sidebar__item" href="{{ $item['href'] }}" @if (! empty($item['active'])) aria-current="page" @endif aria-label="{{ $item['ariaLabel'] }}">
        <i class="cap-shell-sidebar__icon mdi mdi-{{ $item['icon'] }}" aria-hidden="true"></i>
        <span class="cap-shell-sidebar__label">{{ $item['label'] }}</span>
        @if (! empty($item['count']))
            <span @class(['cap-shell-sidebar__count', 'cap-shell-sidebar__count--urgent' => ! empty($item['urgent'])])>{{ $item['count'] }}</span>
            <span class="cap-shell-sidebar__dot" aria-hidden="true"></span>
        @endif
        <span class="cap-shell-sidebar__tooltip" aria-hidden="true">{{ $item['label'] }}</span>
    </a>
@endif
