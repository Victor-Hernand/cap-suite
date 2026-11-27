@props(['columns', 'cards', 'label' => 'Tablero', 'pickerLabel' => 'Etapa'])

@php
    $cardsByColumn = collect($cards)->groupBy('column');
    $pickerItems = collect($columns)->map(fn ($column) => ['label' => $column['title'], 'value' => $column['id']])->all();
    $initialsOf = fn (string $name) => collect(preg_split('/\s+/', trim($name), -1, PREG_SPLIT_NO_EMPTY))
        ->take(2)
        ->map(fn ($word) => mb_strtoupper(mb_substr($word, 0, 1)))
        ->implode('');
    $priorityLabel = fn (?string $priority) => match ($priority) {
        'high' => 'Prioridad alta',
        'medium' => 'Prioridad media',
        default => 'Prioridad normal',
    };
@endphp

<div {{ $attributes }}>
    <x-cap.segmented class="cap-kanban__picker" :items="$pickerItems" :value="$columns[0]['id'] ?? null" :label="$pickerLabel" data-cap-kanban-picker="" />
    <section class="cap-kanban" aria-label="{{ $label }}" data-cap-kanban>
        @foreach ($columns as $column)
            @php
                $columnCards = $cardsByColumn->get($column['id'], collect());
                $wipLimit = $column['wipLimit'] ?? null;
            @endphp
            <div
                class="cap-kanban__column"
                data-cap-kanban-column="{{ $column['id'] }}"
                @isset($column['tone']) data-tone="{{ $column['tone'] }}" @endisset
                @if ($wipLimit) data-wip-limit="{{ $wipLimit }}" @endif
                @if ($loop->first) data-active="true" @endif
            >
                <header class="cap-kanban__head">
                    <span class="cap-kanban__dot" aria-hidden="true"></span>
                    <h3 class="cap-kanban__title">{{ $column['title'] }}</h3>
                    <span class="cap-kanban__count" data-cap-kanban-count>{{ $columnCards->count() }}</span>
                    @if ($wipLimit)
                        <span class="cap-kanban__wip"@if ($columnCards->count() >= $wipLimit) data-full="true"@endif>{{ $columnCards->count() }} / {{ $wipLimit }}</span>
                    @endif
                    <button class="cap-kanban__action" type="button" aria-label="Agregar en {{ $column['title'] }}"><i class="mdi mdi-plus" aria-hidden="true"></i></button>
                    <button class="cap-kanban__action" type="button" aria-label="Opciones de la columna"><i class="mdi mdi-dots-horizontal" aria-hidden="true"></i></button>
                </header>

                <div class="cap-kanban__list" data-cap-kanban-list>
                    @if (! empty($column['emptyTitle']))
                        <div class="cap-kanban__empty">
                            <i class="mdi mdi-tray-arrow-down" aria-hidden="true"></i>
                            <p>{{ $column['emptyTitle'] }}</p>
                            @if (! empty($column['emptyHint']))
                                <p>{{ $column['emptyHint'] }}</p>
                            @endif
                        </div>
                    @endif
                    @foreach ($columnCards as $card)
                        <article
                            @class(['cap-kanban-card', 'cap-kanban-card--blocked' => ! empty($card['blocked'])])
                            data-cap-kanban-card="{{ $card['id'] }}"
                            tabindex="0"
                            draggable="true"
                        >
                            <div class="cap-kanban-card__top">
                                <span class="cap-kanban-card__priority" role="img" aria-label="{{ $priorityLabel($card['priority'] ?? null) }}"@if (! empty($card['priority'])) data-level="{{ $card['priority'] }}"@endif></span>
                                <span>{{ $card['code'] }}</span>
                                <button class="cap-kanban-card__menu" type="button" aria-label="Más acciones"><i class="mdi mdi-dots-vertical" aria-hidden="true"></i></button>
                            </div>
                            <p class="cap-kanban-card__title">{{ $card['title'] }}</p>
                            @if (! empty($card['amount']) || ! empty($card['badge']))
                                <div class="cap-kanban-card__row">
                                    @if (! empty($card['amount']))
                                        <span class="cap-kanban-card__amount">{{ $card['amount'] }}</span>
                                    @endif
                                    @if (! empty($card['badge']))
                                        <span class="cap-kanban-card__badge"@isset($card['badge']['status']) data-status="{{ $card['badge']['status'] }}"@endisset>
                                            @if (! empty($card['badge']['icon']))<i class="mdi mdi-{{ $card['badge']['icon'] }}" aria-hidden="true"></i>@endif
                                            {{ $card['badge']['text'] }}
                                        </span>
                                    @endif
                                </div>
                            @endif
                            @if (! empty($card['assignees']) || ! empty($card['tag']) || ! empty($card['meta']))
                                <div class="cap-kanban-card__foot">
                                    @if (! empty($card['assignees']))
                                        <span class="cap-kanban-card__avatars">
                                            @foreach ($card['assignees'] as $assignee)
                                                <span class="cap-kanban-card__avatar" title="{{ $assignee['name'] }}">{{ ($assignee['initials'] ?? '') ?: $initialsOf($assignee['name']) }}</span>
                                            @endforeach
                                        </span>
                                    @endif
                                    @if (! empty($card['tag']))
                                        <span class="cap-kanban-card__tag">{{ $card['tag'] }}</span>
                                    @endif
                                    @if (! empty($card['meta']))
                                        <span class="cap-kanban-card__meta">
                                            @if (! empty($card['meta']['icon']))<i class="mdi mdi-{{ $card['meta']['icon'] }}" aria-hidden="true"></i>@endif
                                            {{ $card['meta']['text'] }}
                                        </span>
                                    @endif
                                </div>
                            @endif
                        </article>
                    @endforeach
                </div>

                @if (! empty($column['addLabel']))
                    <button class="cap-kanban__add" type="button">{{ $column['addLabel'] }}</button>
                @endif
            </div>
        @endforeach
        <p class="cap-kanban__live" aria-live="polite"></p>
    </section>
</div>
