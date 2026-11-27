@props(['modules'])

@php $modulesByGroup = collect($modules)->groupBy(fn ($module) => $module['group'] ?? ''); @endphp

@foreach ($modulesByGroup as $groupLabel => $groupModules)
    @php
        $groupId = "cap-module-group-{$loop->index}";
        $moduleCount = $groupModules->count();
    @endphp
    <section class="cap-module-group" aria-labelledby="{{ $groupId }}">
        <div class="cap-module-group__head">
            <h3 id="{{ $groupId }}" class="cap-module-group__title">{{ $groupLabel }}</h3>
            <span class="cap-module-group__count">{{ $moduleCount === 1 ? '1 módulo' : "{$moduleCount} módulos" }}</span>
        </div>
        <div class="cap-module-grid">
            @foreach ($groupModules as $module)
                <x-cap.module-card :module="$module" />
            @endforeach
        </div>
    </section>
@endforeach
