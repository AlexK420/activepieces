'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import deepEqual from 'deep-equal';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SeekPage } from '@activepieces/shared';

import { Button } from './button';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableFacetedFilter } from './data-table-options-filter';
import { DataTableSkeleton } from './data-table-skeleton';
import { DataTableToolbar } from './data-table-toolbar';
import { INTERNAL_ERROR_TOAST, toast } from './use-toast';

export type RowDataWithActions<TData> = TData & {
  delete: () => void;
};

export type DataTableFilter = {
  type: 'select' | 'input' | 'date';
  title: string;
  accessorKey: string;
  icon: React.ComponentType<{ className?: string }>;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
};

type DataTableAction<TData> = (row: RowDataWithActions<TData>) => JSX.Element;

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<RowDataWithActions<TData>, TValue>[];
  fetchData: (queryParams: URLSearchParams) => Promise<SeekPage<TData>>;
  onRowClick?: (row: RowDataWithActions<TData>) => void;
  filters?: DataTableFilter[];
  refresh?: number;
  actions?: DataTableAction<TData>[];
}

export function DataTable<TData, TValue>({
  columns: columnsInitial,
  fetchData,
  onRowClick,
  filters,
  refresh,
  actions = [],
}: DataTableProps<TData, TValue>) {
  const columns = columnsInitial.concat([
    {
      accessorKey: 'actions',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-end justify-end gap-4">
            {actions.map((action, index) => {
              return action(row.original);
            })}
          </div>
        );
      },
    },
  ]);

  const [searchParams, setSearchParams] = useSearchParams();
  const startingCursor = searchParams.get('cursor') || undefined;
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(
    startingCursor,
  );
  const [nextPageCursor, setNextPageCursor] = useState<string | undefined>(
    undefined,
  );
  const [previousPageCursor, setPreviousPageCursor] = useState<
    string | undefined
  >(undefined);
  const [tableData, setTableData] = useState<RowDataWithActions<TData>[]>([]);
  const [deletedRows = [], setDeletedRows] = useState<TData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDataAndUpdateState = async (params: URLSearchParams) => {
    setLoading(true);
    setTableData([]);
    try {
      const response = await fetchData(params);
      const newData = response.data.map((row) => ({
        ...row,
        delete: () => {
          setDeletedRows([...deletedRows, row]);
        },
      }));
      setTableData(newData);
      setNextPageCursor(response.next ?? undefined);
      setPreviousPageCursor(response.previous ?? undefined);
    } catch (error) {
      toast(INTERNAL_ERROR_TOAST);
    } finally {
      setLoading(false);
    }
  };

  const table = useReactTable({
    data: tableData,
    columns,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    filters?.forEach((filter) => {
      const column = table.getColumn(filter.accessorKey);
      const values = searchParams.getAll(filter.accessorKey);
      if (column && values) {
        column.setFilterValue(values);
      }
    });
  }, []);

  useEffect(() => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (currentCursor) {
        newParams.set('cursor', currentCursor);
      }
      return newParams;
    });
  }, [currentCursor]);

  useEffect(() => {
    fetchDataAndUpdateState(searchParams);
  }, [searchParams, refresh]);

  useEffect(() => {
    setTableData(
      tableData.filter(
        (row) =>
          !deletedRows.some((deletedRow) =>
            deepEqual(deletedRow, row, { strict: true }),
          ),
      ),
    );
  }, [deletedRows]);

  return (
    <div>
      <DataTableToolbar>
        {filters &&
          filters.map((filter) => (
            <DataTableFacetedFilter
              key={filter.accessorKey}
              type={filter.type}
              column={table.getColumn(filter.accessorKey)}
              title={filter.title}
              options={filter.options}
            />
          ))}
      </DataTableToolbar>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <DataTableSkeleton />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  onClick={() => onRowClick?.(row.original)}
                  key={row.id}
                  className={onRowClick ? 'cursor-pointer' : ''}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentCursor(previousPageCursor)}
          disabled={!previousPageCursor}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentCursor(nextPageCursor)}
          disabled={!nextPageCursor}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
