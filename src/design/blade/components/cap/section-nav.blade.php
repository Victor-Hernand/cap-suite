@props(['sections', 'mobile' => false])

<nav class="cap-shell-header__nav{{ $mobile ? ' cap-shell-header__nav--mobile cap-glass' : '' }}" aria-label="Secciones" data-cap-pill-nav>
    <span class="cap-shell-header__nav-pill" aria-hidden="true" data-cap-pill></span>
    @foreach ($sections as $section)
        <a class="cap-shell-header__nav-item" href="{{ $section['href'] }}"@if (! empty($section['active'])) aria-current="page"@endif>{{ $section['label'] }}</a>
    @endforeach
</nav>
