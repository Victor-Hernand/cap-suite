@props(['child'])

<a class="cap-shell-sidebar__child" href="{{ $child['href'] }}" @if (! empty($child['active'])) aria-current="page" @endif>@if (! empty($child['swatch']))<span class="cap-shell-sidebar__child-swatch" style="background: var(--cap-{{ $child['swatch'] }})"></span>@endif{{ $child['label'] }}</a>
