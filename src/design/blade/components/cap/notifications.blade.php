@props(['notifications' => [], 'viewAllHref' => '', 'markReadAction' => ''])

@php
    $unreadCount = count(array_filter($notifications, fn ($notification) => ! empty($notification['unread'])));
    $notificationsByGroup = [];
    foreach ($notifications as $notification) {
        $notificationsByGroup[$notification['group']][] = $notification;
    }
@endphp

<section class="cap-notifications cap-glass" id="cap-notifications" aria-label="Notificaciones" data-cap-notifications hidden>
    <div class="cap-notifications__header">
        <h2 class="cap-notifications__title">Notificaciones</h2>
        @if ($markReadAction !== '')
            <form method="POST" action="{{ $markReadAction }}">
                @csrf
                <button class="cap-notifications__mark-read" type="submit">Marcar todo como leído</button>
            </form>
        @endif
    </div>
    <div class="cap-notifications__tabs">
        <button class="cap-notifications__tab" type="button" aria-pressed="true" data-cap-notification-filter="all">Todas</button>
        <button class="cap-notifications__tab" type="button" aria-pressed="false" data-cap-notification-filter="unread">
            No leídas
            @if ($unreadCount)<span class="cap-notifications__tab-count">{{ $unreadCount }}</span>@endif
        </button>
    </div>
    @forelse ($notificationsByGroup as $groupLabel => $groupNotifications)
        <p class="cap-notifications__group">{{ $groupLabel }}</p>
        @foreach ($groupNotifications as $notification)
            @php
                $itemTag = empty($notification['href']) ? 'div' : 'a';
            @endphp
            <{{ $itemTag }} class="cap-notifications__item" @if ($itemTag === 'a') href="{{ $notification['href'] }}" @endif @if (! empty($notification['unread'])) data-unread="true" @endif>
                <span @class(['cap-notifications__icon', 'cap-notifications__icon--alert' => ! empty($notification['alert'])])><i class="mdi mdi-{{ $notification['icon'] }}" aria-hidden="true"></i></span>
                <div class="cap-notifications__text"><strong class="cap-notifications__item-title">{{ $notification['title'] }}</strong>@if (! empty($notification['detail']))<small class="cap-notifications__detail">{{ $notification['detail'] }}</small>@endif</div>
                <span class="cap-notifications__time">{{ $notification['time'] }}</span>
            </{{ $itemTag }}>
        @endforeach
    @empty
        <p class="cap-notifications__group">No tienes notificaciones.</p>
    @endforelse
    <p class="cap-notifications__group" data-cap-notification-empty hidden>No tienes notificaciones sin leer.</p>
    @if ($viewAllHref !== '')
        <a class="cap-notifications__footer" href="{{ $viewAllHref }}">Ver todas</a>
    @endif
</section>
