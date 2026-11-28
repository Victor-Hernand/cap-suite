@props(['variant' => 'line', 'rows' => 8, 'label' => 'Cargando'])

@if ($variant === 'table')
    <div {{ $attributes->class('cap-skeleton-table') }} role="status" aria-label="{{ $label }}">
        <span class="cap-skeleton-table__head" aria-hidden="true"></span>
        @for ($row = 0; $row < $rows; $row++)
            <div class="cap-skeleton-table__row" aria-hidden="true">
                @for ($column = 0; $column < 4; $column++)
                    <span class="cap-skeleton"></span>
                @endfor
            </div>
        @endfor
    </div>
@elseif ($variant === 'stats')
    <div {{ $attributes->class('cap-skeleton-stats') }} role="status" aria-label="{{ $label }}">
        @for ($card = 0; $card < 4; $card++)
            <div class="cap-skeleton-stats__card" aria-hidden="true">
                <span class="cap-skeleton cap-skeleton--label"></span>
                <span class="cap-skeleton cap-skeleton--value"></span>
            </div>
        @endfor
    </div>
@elseif ($variant === 'kanban')
    <div {{ $attributes->class('cap-skeleton-kanban') }} role="status" aria-label="{{ $label }}">
        @for ($column = 0; $column < 3; $column++)
            <div class="cap-skeleton-kanban__column" aria-hidden="true">
                <span class="cap-skeleton cap-skeleton--label"></span>
                @for ($card = 0; $card < 3; $card++)
                    <div class="cap-skeleton-kanban__card">
                        <span class="cap-skeleton cap-skeleton--label"></span>
                        <span class="cap-skeleton"></span>
                    </div>
                @endfor
            </div>
        @endfor
    </div>
@else
    <span {{ $attributes->class('cap-skeleton') }} aria-hidden="true"></span>
@endif
