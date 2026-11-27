@php
    $flashedToast = session('cap_toast');
@endphp

<div class="cap-toaster" data-cap-toaster>
    @if ($flashedToast)
        <div data-cap-toast data-status="{{ $flashedToast['status'] }}" data-title="{{ $flashedToast['title'] }}" @isset($flashedToast['detail']) data-detail="{{ $flashedToast['detail'] }}" @endisset></div>
    @endif
</div>
