@props(['variant' => 'primary', 'type' => 'button', 'href' => null, 'icon' => null, 'loading' => false])

@if ($href)
    <a href="{{ $href }}" {{ $attributes->class(['cap-button', "cap-button--{$variant}"]) }}>
        @if ($icon)<i class="mdi mdi-{{ $icon }}" aria-hidden="true"></i>@endif
        {{ $slot }}
    </a>
@else
    <button type="{{ $type }}" @disabled($loading) @if ($loading) aria-busy="true" @endif {{ $attributes->class(['cap-button', "cap-button--{$variant}"]) }}>
        @if ($icon && ! $loading)<i class="mdi mdi-{{ $icon }}" aria-hidden="true"></i>@endif
        {{ $slot }}
    </button>
@endif
