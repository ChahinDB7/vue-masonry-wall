import { computed } from 'vue';

// Imported from https://github.com/DerYeger/yeger/tree/main/packages/vue-lib-adapter/src/index.ts

export interface VueRef<T> {
  value: T
}

export type VueVersion = 2 | 3

export type Watch = (
  refs: (VueRef<unknown> | undefined)[],
  callback: () => void,
) => void

export type LifecycleHook = (callback: () => void) => void

// -------------------------------------------------------------------------------------------------------

// Imported from https://github.com/DerYeger/yeger/tree/main/packages/debounce/src/index.ts

/**
 * Debounce a callback with an optional delay.
 * @param cb - The callback that will be invoked.
 * @param delay - A delay after which the callback will be invoked.
 * @returns The debounced callback.
 */
export function debounce<Args extends any[]>(
  cb: (...args: Args) => void,
  delay?: number
) {
  let timeout: any;
  return (...args: Args) => {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => cb(...args), delay);
  };
}

// -------------------------------------------------------------------------------------------------------

// Imported from https://github.com/DerYeger/yeger/blob/main/packages/vue-masonry-wall-core/src/index.ts

export type NonEmptyArray<T> = [T, ...T[]]

export type Column = number[]

export interface Vue2ComponentEmits {
  (event: 'redraw'): void
  (event: 'redraw-skip'): void
}

export interface Vue3ComponentEmits {
  (event: 'redraw'): void
  (event: 'redrawSkip'): void
}

export interface HookProps<T> {
  columns: VueRef<Column[]>
  columnWidth: VueRef<number | NonEmptyArray<number>>
  emit: Vue2ComponentEmits | Vue3ComponentEmits
  gap: VueRef<number>
  items: VueRef<T[]>
  maxColumns: VueRef<number | undefined>
  minColumns: VueRef<number | undefined>
  nextTick: () => Promise<void>
  onBeforeUnmount: LifecycleHook
  onMounted: LifecycleHook
  rtl: VueRef<boolean>
  only1Row: VueRef<boolean>
  scrollContainer: VueRef<HTMLElement | null>
  ssrColumns: VueRef<number>
  vue: VueVersion
  wall: VueRef<HTMLDivElement>
  watch: Watch
}

export function useMasonryWall<T>({
  columns,
  columnWidth,
  emit,
  gap,
  items,
  maxColumns,
  minColumns,
  nextTick,
  onBeforeUnmount,
  onMounted,
  rtl,
  only1Row,
  scrollContainer,
  ssrColumns,
  vue,
  wall,
  watch
}: HookProps<T>) {
  function countIteratively(
    containerWidth: number,
    gap: number,
    count: number,
    consumed: number
  ): number {
    const nextWidth = getColumnWidthTarget(count);
    if (consumed + gap + nextWidth <= containerWidth) {
      return countIteratively(
        containerWidth,
        gap,
        count + 1,
        consumed + gap + nextWidth
      );
    }
    return count;
  }

  function getColumnWidthTarget(columnIndex: number): number {
    const widths = Array.isArray(columnWidth.value)
      ? columnWidth.value
      : [columnWidth.value];
    return widths[columnIndex % widths.length] as number;
  }

  function columnCount(): number {
    const count = countIteratively(
      wall.value.getBoundingClientRect().width,
      gap.value,
      0,
      // Needs to be offset my negative gap to prevent gap counts being off by one
      -gap.value
    );
    const boundedCount = aboveMin(belowMax(count));
    return boundedCount > 0 ? boundedCount : 1;
  }

  function belowMax(count: number): number {
    const max = maxColumns?.value;
    if (!max) {
      return count;
    }
    return count > max ? max : count;
  }

  function aboveMin(count: number): number {
    const min = minColumns?.value;
    if (!min) {
      return count;
    }
    return count < min ? min : count;
  }

  if (ssrColumns.value > 0) {
    const newColumns = createColumns(ssrColumns.value);
    items.value.forEach((_: T, i: number) =>
      newColumns[i % ssrColumns.value]!.push(i)
    );
    columns.value = newColumns;
  }

  let currentRedrawId = 0;

  async function fillColumns(itemIndex: number, assignedRedrawId: number) {
    if (itemIndex >= items.value.length) {
      return;
    }
    await nextTick();
    if (currentRedrawId !== assignedRedrawId) {
      // Skip if a new redraw has been requested in parallel,
      // e.g., in an onMounted hook during initial render
      return;
    }
    const columnDivs = [...wall.value.children] as HTMLDivElement[];
    if (rtl.value) {
      columnDivs.reverse();
    }
    const target = columnDivs.reduce((prev, curr) =>
      curr.getBoundingClientRect().height < prev.getBoundingClientRect().height
        ? curr
        : prev
    );
    columns.value[+target.dataset.index!]!.push(itemIndex);
    await fillColumns(itemIndex + 1, assignedRedrawId);
  }

  async function redraw(force = false) {
    const newColumnCount = columnCount();
    if (columns.value.length === newColumnCount && !force) {
      if (vue === 2) {
        ;(emit as Vue2ComponentEmits)('redraw-skip');
      } else {
        ;(emit as Vue3ComponentEmits)('redrawSkip');
      }
      return;
    }
    columns.value = createColumns(newColumnCount);
    const scrollTarget = scrollContainer?.value;
    const scrollY = scrollTarget ? scrollTarget.scrollTop : window.scrollY;

    await fillColumns(0, ++currentRedrawId);
    if (scrollTarget && scrollTarget instanceof HTMLElement) {
      scrollTarget?.scrollBy({ top: scrollY - scrollTarget.scrollTop });
    }
    emit('redraw');
  }

  const resizeObserver =
    typeof ResizeObserver === 'undefined'
      ? undefined
      : new ResizeObserver(debounce(() => redraw()));

  onMounted(() => {
    redraw();
    resizeObserver?.observe(wall.value);
  });

  onBeforeUnmount(() => resizeObserver?.unobserve(wall.value));

  watch([items, rtl], () => redraw(true));
  watch([columnWidth, gap, minColumns, maxColumns], () => redraw());

  const hadMultipleRows = computed(() =>
    columns.value.some((column) => column.length > 1)
  );

  const filteredColumns = computed(() =>
    only1Row.value
      ? columns.value.map((column) => (column.length > 0 ? [column[0]] : []))
      : columns.value
  );

  const remainingItems = computed(() => {
    if (!only1Row.value) {
      return 0;
    }

    return items.value.length - filteredColumns.value?.length
  })

  function isLastColumn(columnIndex: number) {
    return columnIndex === (only1Row.value ? filteredColumns.value : columns.value).length - 1;
  }

  return { hadMultipleRows, filteredColumns, remainingItems, isLastColumn, getColumnWidthTarget };
}

function createColumns(count: number): Column[] {
  return Array.from({ length: count }).map(() => []);
}