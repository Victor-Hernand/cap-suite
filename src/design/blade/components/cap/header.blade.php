@props([
    'title',
    'systemName' => '',
    'breadcrumbs' => [],
    'sections' => [],
    'user',
    'notifications' => [],
    'notificationsHref' => '',
    'markReadAction' => '',
    'backHref' => '',
    'searchHref' => '#',
    'topbarSearch' => true,
    'modules' => [],
    'modulesHref' => '',
    'mark' => null,
])

@php
    $mark ??= config('design.company.mark', 'C');
    $unreadCount = count(array_filter($notifications, fn ($notification) => ! empty($notification['unread'])));
    $showSections = count($sections) >= 2;
    $topbarShowsTitle = $backHref !== '' || $systemName === '';
    $bellLabel = $unreadCount ? "Notificaciones, {$unreadCount} sin leer" : 'Notificaciones';
@endphp

<header class="cap-shell-header cap-glass{{ $showSections ? ' cap-shell-header--with-nav' : '' }}">
    <div>
        @if ($breadcrumbs)
            <nav class="cap-shell-header__crumbs" aria-label="Migas de pan">
                @foreach ($breadcrumbs as $crumb)
                    @if (! $loop->first)<span aria-hidden="true"> › </span>@endif
                    @if (! empty($crumb['href']))<a href="{{ $crumb['href'] }}">{{ $crumb['label'] }}</a>@else{{ $crumb['label'] }}@endif
                @endforeach
            </nav>
        @endif
        <h1 class="cap-shell-header__title">{{ $title }}</h1>
    </div>
    @if ($showSections)
        <x-cap.section-nav :sections="$sections" />
    @endif
    @isset($search)
        <label class="cap-shell-header__search">
            <i class="mdi mdi-magnify" aria-hidden="true"></i>
            {{ $search }}
            <kbd class="cap-shell-header__kbd">⌘K</kbd>
        </label>
    @endisset
    <div class="cap-shell-header__actions">
        @isset($headerActions){{ $headerActions }}@endisset
        @if (count($modules))
            <button class="cap-shell-header__icon-button" type="button" aria-label="Cambiar de módulo" aria-expanded="false" aria-controls="cap-modules" data-cap-popover-trigger>
                <i class="mdi mdi-apps" aria-hidden="true"></i>
            </button>
        @endif
        <button class="cap-shell-header__icon-button" type="button" aria-label="{{ $bellLabel }}" aria-expanded="false" aria-controls="cap-notifications" data-cap-popover-trigger>
            <i class="mdi mdi-bell-outline" aria-hidden="true"></i>
            @if ($unreadCount)<span class="cap-shell-header__badge-dot" aria-hidden="true"></span>@endif
        </button>
        <x-cap.avatar :user="$user" />
    </div>
</header>

<header class="cap-shell-topbar cap-glass">
    @if ($backHref !== '')
        <a class="cap-shell-topbar__icon-button" href="{{ $backHref }}" aria-label="Volver"><i class="mdi mdi-arrow-left" aria-hidden="true"></i></a>
    @else
        <span class="cap-shell-logo" aria-hidden="true">{{ $mark }}</span>
    @endif
    @if ($topbarShowsTitle)
        <h1 class="cap-shell-topbar__title">{{ $title }}</h1>
    @else
        <span class="cap-shell-topbar__title">{{ $systemName }}</span>
        <h1 class="cap-shell-topbar__hidden-title">{{ $title }}</h1>
    @endif
    @if ($topbarSearch)
        <a class="cap-shell-topbar__icon-button" href="{{ $searchHref }}" aria-label="Buscar"><i class="mdi mdi-magnify" aria-hidden="true"></i></a>
    @endif
    @isset($topbarActions){{ $topbarActions }}@endisset
    <button class="cap-shell-topbar__icon-button" type="button" aria-label="{{ $bellLabel }}" aria-expanded="false" aria-controls="cap-notifications" data-cap-popover-trigger>
        <i class="mdi mdi-bell-outline" aria-hidden="true"></i>
        @if ($unreadCount)<span class="cap-shell-header__badge-dot" aria-hidden="true"></span>@endif
    </button>
</header>

@if ($showSections)
    <x-cap.section-nav :sections="$sections" :mobile="true" />
@endif

<x-cap.notifications :notifications="$notifications" :view-all-href="$notificationsHref" :mark-read-action="$markReadAction" />
@if (count($modules))
    <x-cap.module-switcher :modules="$modules" :all-href="$modulesHref" />
@endif
