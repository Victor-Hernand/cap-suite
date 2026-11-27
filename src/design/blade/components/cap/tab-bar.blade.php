@props(['tabs' => []])

<nav class="cap-shell-tabbar cap-glass" aria-label="Destinos principales">
    @foreach (array_slice($tabs, 0, 4) as $tab)
        <a class="cap-shell-tabbar__tab" href="{{ $tab['href'] }}" @if (! empty($tab['active'])) aria-current="page" @endif><i class="mdi mdi-{{ $tab['icon'] }}" aria-hidden="true"></i>{{ $tab['label'] }}</a>
    @endforeach
    <button class="cap-shell-tabbar__tab cap-shell-tabbar__tab--more" type="button" aria-expanded="false" aria-controls="cap-more-sheet" data-cap-sheet-trigger><i class="mdi mdi-dots-horizontal" aria-hidden="true"></i>Más</button>
</nav>
