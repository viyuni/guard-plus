<script lang="ts">
import type {
  Cell,
  ColumnDef,
  ColumnFiltersState,
  Header,
  PaginationState,
  Row,
  SortingState,
  Table as TanStackTable,
  VisibilityState,
} from '@tanstack/vue-table';
import type { HTMLAttributes } from 'vue';

import Spinner from '../spinner/Spinner.vue';

type DataTableCellSlotProps<TData, TValue = unknown> = {
  cell: Cell<TData, unknown>;
  header?: Header<TData, unknown>;
  row: Row<TData>;
  table: TanStackTable<TData>;
  value: TValue;
  rowData: TData;
};

type DataTableDisplayCellSlotProps<TData> = {
  cell: Cell<TData, unknown>;
  header?: Header<TData, unknown>;
  row: Row<TData>;
  table: TanStackTable<TData>;
  rowData: TData;
};

type DataTableHeaderSlotProps<TData> = {
  header: Header<TData, unknown>;
  table: TanStackTable<TData>;
};

type DataTableControlSlotProps<TData> = {
  table: TanStackTable<TData>;
};

type DataTableProps<
  TData,
  TColumns extends readonly ColumnDef<TData>[] = readonly ColumnDef<TData>[],
> = {
  columns?: TColumns;
  data?: TData[];
  table?: TanStackTable<TData>;
  total?: number;
  pageSize?: number;
  class?: HTMLAttributes['class'];
  scrollAreaClass?: HTMLAttributes['class'];
  scrollY?: boolean;
  hideFooter?: boolean;
  loading?: boolean;
};

type DataTableBuiltinSlots<TData> = {
  actions?: (props: DataTableCellSlotProps<TData>) => unknown;
  'actions-header'?: (props: DataTableHeaderSlotProps<TData>) => unknown;
  default?: (props: DataTableControlSlotProps<TData>) => unknown;
  empty?: () => unknown;
  toolbar?: (props: DataTableControlSlotProps<TData>) => unknown;
  expanded?: (props: { row: Row<TData>; rowData: TData }) => unknown;
  select?: (props: DataTableCellSlotProps<TData>) => unknown;
  'footer-start'?: (props: DataTableControlSlotProps<TData>) => unknown;
  'select-header'?: (props: DataTableHeaderSlotProps<TData>) => unknown;
};

type KnownStringKey<TKey> = TKey extends string ? (string extends TKey ? never : TKey) : never;

type DataTableColumnSlotKey<TColumns extends readonly ColumnDef<any>[]> = Extract<
  TColumns[number] extends infer TColumn
    ? TColumn extends { accessorKey: infer TAccessorKey }
      ? TAccessorKey
      : TColumn extends { id: infer TId }
        ? TId
        : never
    : never,
  string
>;

type DataTableAccessorColumnSlotValue<
  TData,
  TColumns extends readonly ColumnDef<any>[],
  TSlotKey extends string,
> = TColumns[number] extends infer TColumn
  ? TColumn extends { accessorKey: infer TAccessorKey }
    ? TSlotKey extends TAccessorKey
      ? TAccessorKey extends keyof TData
        ? TData[TAccessorKey]
        : unknown
      : never
    : never
  : never;

type DataTableAccessorColumnSlotKeys<TColumns extends readonly ColumnDef<any>[]> = Extract<
  TColumns[number] extends infer TColumn
    ? TColumn extends { accessorKey: infer TAccessorKey }
      ? TAccessorKey
      : never
    : never,
  string
>;

type DataTableDisplayColumnSlotKeys<TColumns extends readonly ColumnDef<any>[]> = Extract<
  TColumns[number] extends infer TColumn
    ? TColumn extends { accessorKey: any }
      ? never
      : TColumn extends { id: infer TId }
        ? TId
        : never
    : never,
  string
>;

type DataTableAccessorColumnFieldSlots<TData, TColumns extends readonly ColumnDef<any>[]> = {
  [Key in KnownStringKey<
    DataTableAccessorColumnSlotKeys<TColumns>
  > as Key extends `${string}-header` ? never : Key]?: (
    props: DataTableCellSlotProps<TData, DataTableAccessorColumnSlotValue<TData, TColumns, Key>>,
  ) => unknown;
};

type DataTableDisplayColumnFieldSlots<TData, TColumns extends readonly ColumnDef<any>[]> = {
  [Key in KnownStringKey<DataTableDisplayColumnSlotKeys<TColumns>> as Key extends `${string}-header`
    ? never
    : Key]?: (props: DataTableDisplayCellSlotProps<TData>) => unknown;
};

type DataTableColumnHeaderSlots<TData, TSlotKey extends string> = {
  [Key in KnownStringKey<TSlotKey> as `${Key}-header`]?: (
    props: DataTableHeaderSlotProps<TData>,
  ) => unknown;
};

// 让 DataTable 的插槽跟随列定义，accessorKey 提供字段值，id 展示列提供 rowData。
type DataTableSlots<
  TData,
  TColumns extends readonly ColumnDef<any>[],
  TSlotKey extends string,
> = DataTableBuiltinSlots<TData> &
  DataTableAccessorColumnFieldSlots<TData, TColumns> &
  DataTableDisplayColumnFieldSlots<TData, TColumns> &
  DataTableColumnHeaderSlots<TData, TSlotKey>;
</script>

<script
  setup
  lang="ts"
  generic="TData, TColumns extends readonly ColumnDef<TData>[] = readonly ColumnDef<TData>[]"
>
import {
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table';
import {
  Pagination,
  PaginationContent,
  PaginationPrevious,
  PaginationItem,
  PaginationEllipsis,
  PaginationNext,
  PaginationLast,
  PaginationFirst,
} from '@web/ui/components/ui/pagination';
import { cn } from '@web/ui/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsRight, ChevronsLeft } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';

import Table from './Table.vue';
import TableBody from './TableBody.vue';
import TableCell from './TableCell.vue';
import TableEmpty from './TableEmpty.vue';
import TableHead from './TableHead.vue';
import TableHeader from './TableHeader.vue';
import TableRow from './TableRow.vue';
import { valueUpdater } from './utils';

const props = withDefaults(defineProps<DataTableProps<TData, TColumns>>(), {
  columns: () => [] as unknown as TColumns,
  data: () => [],
  pageSize: 15,
});

const slots = defineSlots<DataTableSlots<TData, TColumns, DataTableColumnSlotKey<TColumns>>>();
const tablePage = defineModel<number>('page', { default: 1 });

const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({});
const rowSelection = ref({});
const expanded = ref({});
const serverTotal = ref<number>();

watch(
  () => props.total,
  total => {
    if (total !== undefined) {
      serverTotal.value = total;
    }
  },
  { immediate: true },
);

const resolvedTotal = computed(() => serverTotal.value ?? props.data.length);
const pageSize = computed(() => Math.max(1, props.pageSize));
const totalPages = computed(() => Math.max(1, Math.ceil(resolvedTotal.value / pageSize.value)));
const isServerPagination = computed(() => serverTotal.value !== undefined);

const pagination = computed<PaginationState>({
  get() {
    return {
      pageIndex: Math.max(0, tablePage.value - 1),
      pageSize: pageSize.value,
    };
  },
  set(value) {
    tablePage.value = value.pageIndex + 1;
  },
});

// 默认创建内部 TanStack table；复杂场景也可以通过 props.table 传入外部受控实例。
const internalTable = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return props.columns as unknown as ColumnDef<TData>[];
  },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  get manualPagination() {
    return isServerPagination.value;
  },
  get pageCount() {
    return totalPages.value;
  },
  onSortingChange: updaterOrValue => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: updaterOrValue => valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: updaterOrValue => valueUpdater(updaterOrValue, rowSelection),
  onExpandedChange: updaterOrValue => valueUpdater(updaterOrValue, expanded),
  onPaginationChange: updaterOrValue => valueUpdater(updaterOrValue, pagination),
  state: {
    get sorting() {
      return sorting.value;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
    get rowSelection() {
      return rowSelection.value;
    },
    get expanded() {
      return expanded.value;
    },
    get pagination() {
      return pagination.value;
    },
  },
});

const resolvedTable = computed(() => props.table ?? internalTable);

// 空状态和展开行需要稳定的 colspan，即使所有列都被隐藏也要能占满一行。
const visibleColumnCount = computed(() => resolvedTable.value.getVisibleLeafColumns().length || 1);

function hasColumnSlot(columnId: string) {
  return columnId in slots;
}

function hasHeaderSlot(columnId: string) {
  return `${columnId}-header` in slots;
}

function getColumnSlotName(columnId: string) {
  return columnId as keyof DataTableSlots<TData, TColumns, DataTableColumnSlotKey<TColumns>> &
    string;
}

function getHeaderSlotName(columnId: string) {
  return `${columnId}-header` as keyof DataTableColumnHeaderSlots<
    TData,
    DataTableColumnSlotKey<TColumns>
  > &
    string;
}

function getHeaderSlotProps(header: Header<TData, unknown>) {
  return {
    header,
    table: resolvedTable.value,
    cell: undefined as never,
    row: undefined as never,
    value: undefined as never,
    rowData: undefined as never,
  };
}

// TanStack 的单元格值是 unknown，这里转换回对应字段类型给插槽使用。
function getColumnSlotValue(cell: Cell<TData, unknown>) {
  return cell.getValue() as TData[keyof TData & string];
}

function getColumnSlotProps(cell: Cell<TData, unknown>, row: Row<TData>) {
  return {
    cell,
    row,
    table: resolvedTable.value,
    value: getColumnSlotValue(cell) as never,
    rowData: row.original,
  };
}

watch(totalPages, maxPage => {
  if (resolvedTotal.value > 0 && tablePage.value > maxPage) {
    tablePage.value = maxPage;
  }
});
</script>

<template>
  <div class="relative grid min-h-0 gap-4">
    <!-- 表格渲染前先暴露 table，方便调用方在上方放筛选、操作区。 -->
    <slot :table="resolvedTable" />

    <slot name="toolbar" :table="resolvedTable" />

    <div
      :class="
        cn(
          'relative overflow-hidden rounded-md border',
          props.scrollY && 'overflow-y-auto',
          props.scrollAreaClass,
          props.class,
        )
      "
      :aria-busy="loading"
    >
      <div
        v-if="loading"
        class="bg-background/70 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[1px]"
      >
        <Spinner class="text-primary size-8" />
      </div>

      <Table>
        <TableHeader class="bg-muted/80">
          <TableRow v-for="headerGroup in resolvedTable.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id" class="px-4">
              <!-- 指定列的 header 插槽优先于 TanStack 的 header 渲染器。 -->
              <slot
                v-if="!header.isPlaceholder && hasHeaderSlot(header.column.id)"
                :name="getHeaderSlotName(header.column.id)"
                v-bind="getHeaderSlotProps(header)"
              />
              <FlexRender
                v-else-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="resolvedTable.getRowModel().rows?.length">
            <template v-for="row in resolvedTable.getRowModel().rows" :key="row.id">
              <TableRow :data-state="row.getIsSelected() && 'selected'">
                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" class="px-4">
                  <!-- 指定列的 body 插槽优先于 TanStack 的 cell 渲染器。 -->
                  <slot
                    v-if="hasColumnSlot(cell.column.id)"
                    :name="getColumnSlotName(cell.column.id)"
                    v-bind="getColumnSlotProps(cell, row)"
                  />
                  <FlexRender
                    v-else
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </TableCell>
              </TableRow>

              <!-- 展开内容渲染为父行下方的一整行。 -->
              <TableRow v-if="$slots.expanded && row.getIsExpanded()">
                <TableCell :colspan="row.getVisibleCells().length || visibleColumnCount">
                  <slot name="expanded" :row="row" :row-data="row.original" />
                </TableCell>
              </TableRow>
            </template>
          </template>

          <TableEmpty v-else :colspan="visibleColumnCount" class="h-24 text-center">
            <slot name="empty">没有数据咕嘎🤣</slot>
          </TableEmpty>
        </TableBody>
      </Table>
    </div>

    <Pagination
      v-if="!hideFooter"
      v-slot="{ page: currentPage }"
      v-model:page="tablePage"
      :items-per-page="pageSize"
      :total="resolvedTotal"
      :sibling-count="1"
      :show-edges="true"
      class="flex-col gap-4 px-2 sm:flex-row sm:items-start sm:justify-between"
    >
      <div class="order-2 w-full sm:order-1 sm:w-auto">
        <slot name="footer-start" :table="resolvedTable">
          <div class="text-muted-foreground text-center text-sm sm:text-left">
            共 {{ total }} 条数据
          </div>
        </slot>
      </div>

      <PaginationContent
        v-slot="{ items }"
        class="order-1 w-full justify-center sm:order-2 sm:w-auto"
      >
        <PaginationFirst>
          <ChevronsLeft />
        </PaginationFirst>

        <PaginationPrevious>
          <ChevronLeft />
        </PaginationPrevious>

        <template v-for="(item, index) in items" :key="index">
          <PaginationItem
            v-if="item.type === 'page'"
            :value="item.value"
            :is-active="item.value === currentPage"
          >
            {{ item.value }}
          </PaginationItem>
        </template>

        <PaginationEllipsis :index="4" />

        <PaginationNext>
          <ChevronRight />
        </PaginationNext>

        <PaginationLast>
          <ChevronsRight />
        </PaginationLast>
      </PaginationContent>
    </Pagination>
  </div>
</template>
