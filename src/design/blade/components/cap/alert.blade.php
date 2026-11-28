@props(['status', 'title', 'detail' => null, 'icon' => null])

@php
    $defaultIcons = [
        'error' => 'alert-circle-outline',
        'ok' => 'check-circle-outline',
        'warning' => 'alert-outline',
        'info' => 'information-outline',
    ];
    $role = $status === 'error' ? 'alert' : 'status';
@endphp

<div {{ $attributes->class(['cap-alert', "cap-alert--{$status}"]) }} role="{{ $role }}">
    <i class="cap-alert__icon mdi mdi-{{ $icon ?? $defaultIcons[$status] }}" aria-hidden="true"></i>
    <div><strong class="cap-alert__title">{{ $title }}</strong>@if ($detail)<span class="cap-alert__detail">{{ $detail }}</span>@endif</div>
</div>
