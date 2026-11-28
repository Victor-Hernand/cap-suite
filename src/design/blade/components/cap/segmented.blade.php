@props(['items', 'value' => null, 'label' => 'Filtrar'])

<div {{ $attributes->merge(['class' => 'cap-segmented']) }} role="group" aria-label="{{ $label }}" data-cap-pill-nav>
    <span class="cap-segmented__pill" aria-hidden="true" data-cap-pill></span>
    @foreach ($items as $item)
        @php
            $isActive = array_key_exists('value', $item) && $item['value'] === $value;
            $hasCount = isset($item['count']);
        @endphp
        @if (! empty($item['href']))
            <a class="cap-segmented__item" href="{{ $item['href'] }}"@if ($isActive) aria-current="page"@endif>{{ $item['label'] }}@if ($hasCount)<span class="cap-segmented__count">{{ $item['count'] }}</span>@endif</a>
        @else
            <button class="cap-segmented__item" type="button" value="{{ $item['value'] ?? '' }}" aria-pressed="{{ $isActive ? 'true' : 'false' }}">{{ $item['label'] }}@if ($hasCount)<span class="cap-segmented__count">{{ $item['count'] }}</span>@endif</button>
        @endif
    @endforeach
</div>
