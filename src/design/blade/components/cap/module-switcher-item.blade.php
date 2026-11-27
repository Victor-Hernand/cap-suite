@props(['module'])

<a class="cap-module-switcher__item" href="{{ $module['href'] }}"@if (! empty($module['current'])) aria-current="true"@endif><span class="cap-module-tile"><i class="mdi mdi-{{ $module['icon'] }}" aria-hidden="true"></i></span>{{ $module['name'] }}</a>
