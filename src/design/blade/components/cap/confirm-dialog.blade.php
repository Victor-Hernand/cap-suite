@props(['id', 'title', 'message', 'confirmLabel', 'icon' => 'alert-outline', 'acknowledgeLabel' => '', 'action', 'method' => 'POST'])

<div class="cap-dialog" id="{{ $id }}" data-cap-confirm hidden>
    <div class="cap-dialog__backdrop"></div>
    <form class="cap-dialog__panel" method="POST" action="{{ $action }}" role="alertdialog" aria-modal="true" aria-labelledby="{{ $id }}-title" aria-describedby="{{ $id }}-text">
        @csrf
        @if (strtoupper($method) !== 'POST')
            @method($method)
        @endif
        <button class="cap-dialog__close" type="button" data-cap-confirm-close aria-label="Cerrar"><i class="mdi mdi-close" aria-hidden="true"></i></button>
        <span class="cap-dialog__icon"><i class="mdi mdi-{{ $icon }}" aria-hidden="true"></i></span>
        <h2 class="cap-dialog__title" id="{{ $id }}-title">{{ $title }}</h2>
        <p class="cap-dialog__text" id="{{ $id }}-text">{{ $message }}</p>
        @if ($acknowledgeLabel !== '')
            <label class="cap-check cap-dialog__ack"><input class="cap-check__box" type="checkbox" data-cap-confirm-ack>{{ $acknowledgeLabel }}</label>
        @endif
        <div class="cap-dialog__actions">
            <button class="cap-button cap-button--secondary" type="button" data-cap-confirm-cancel>Cancelar</button>
            <button class="cap-button cap-button--danger-solid" type="submit" data-cap-confirm-accept @disabled($acknowledgeLabel !== '')>{{ $confirmLabel }}</button>
        </div>
    </form>
</div>
