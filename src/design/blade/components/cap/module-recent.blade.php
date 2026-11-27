@props(['items', 'label' => 'Continuar'])

@if (count($items))
    <nav class="cap-module-recent" aria-label="Continuar donde quedaste">
        <span class="cap-module-recent__label">{{ $label }}</span>
        @foreach ($items as $item)
            <a class="cap-module-recent__link" href="{{ $item['href'] }}"><i class="mdi mdi-{{ $item['icon'] }}" aria-hidden="true"></i>{{ $item['module'] }} <small>› {{ $item['label'] }}</small></a>
        @endforeach
    </nav>
@endif
