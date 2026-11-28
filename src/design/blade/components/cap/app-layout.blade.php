@props([
    'systemName',
    'menu',
    'tabs' => [],
    'user',
    'title',
    'breadcrumbs' => [],
    'sections' => [],
    'notifications' => [],
    'fabLabel' => '',
    'fabHref' => '#',
    'notificationsHref' => '',
    'logoutAction' => null,
    'markReadAction' => '',
    'backHref' => '',
    'searchHref' => '#',
    'topbarSearch' => true,
    'modules' => [],
    'modulesHref' => '',
    'owner' => null,
    'mark' => null,
])

@php
    $resolveItem = function (array $item) use (&$resolveItem): array {
        $hasRoute = isset($item['route']) && function_exists('request');
        if (! array_key_exists('active', $item) && $hasRoute) {
            $item['active'] = request()->routeIs($item['route']);
        }

        $isOutlineIcon = ! empty($item['active']) && str_ends_with($item['icon'] ?? '', '-outline');
        if ($isOutlineIcon) {
            $item['icon'] = substr($item['icon'], 0, -strlen('-outline'));
        }

        if (! empty($item['count'])) {
            $noun = ! empty($item['urgent']) ? 'urgente' : 'pendiente';
            $item['ariaLabel'] = "{$item['label']}, {$item['count']} {$noun}".($item['count'] === 1 ? '' : 's');
        } else {
            $item['ariaLabel'] = $item['label'];
        }

        if (! empty($item['children'])) {
            $item['children'] = array_map($resolveItem, $item['children']);
        }

        return $item;
    };

    $resolvedMenu = array_map(
        fn (array $group) => [...$group, 'items' => array_map($resolveItem, $group['items'])],
        $menu,
    );
    $resolvedTabs = array_map($resolveItem, $tabs);
    $grantedModules = array_values(array_filter($modules, fn ($module) => ! (array_key_exists('granted', $module) && ! $module['granted'])));
@endphp

<div class="cap-shell">
    <x-cap.sidebar :system-name="$systemName" :menu="$resolvedMenu" :user="$user" :logout-action="$logoutAction" :owner="$owner" :mark="$mark" />

    <div class="cap-shell__main">
        <x-cap.header :title="$title" :system-name="$systemName" :breadcrumbs="$breadcrumbs" :sections="$sections" :user="$user" :notifications="$notifications" :notifications-href="$notificationsHref" :mark-read-action="$markReadAction" :back-href="$backHref" :search-href="$searchHref" :topbar-search="$topbarSearch" :modules="$grantedModules" :modules-href="$modulesHref" :mark="$mark">
            @isset($search)
                <x-slot:search>{{ $search }}</x-slot:search>
            @endisset
            @isset($headerActions)
                <x-slot:header-actions>{{ $headerActions }}</x-slot:header-actions>
            @endisset
            @isset($topbarActions)
                <x-slot:topbar-actions>{{ $topbarActions }}</x-slot:topbar-actions>
            @endisset
        </x-cap.header>

        <main class="cap-shell__content">{{ $slot }}</main>
    </div>

    <x-cap.tab-bar :tabs="$resolvedTabs" />

    @if ($fabLabel !== '')
        <a class="cap-shell-fab" href="{{ $fabHref }}" aria-label="{{ $fabLabel }}"><i class="mdi mdi-plus" aria-hidden="true"></i></a>
    @endif

    <x-cap.more-sheet :menu="$resolvedMenu" :user="$user" :logout-action="$logoutAction" :modules="$grantedModules" />

    <x-cap.toaster />
</div>
