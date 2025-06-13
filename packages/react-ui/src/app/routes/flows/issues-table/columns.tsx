import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';

import { Checkbox } from '@/components/ui/checkbox';
import { RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { getIssueStatusConfig } from '@/lib/issue-status-utils';
import { formatUtils } from '@/lib/utils';
import { PopulatedIssue } from '@activepieces/shared';

export const issuesTableColumns: ColumnDef<
  RowDataWithActions<PopulatedIssue>
>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
  {
    accessorKey: 'flowName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Flow Name')} />
    ),
    cell: ({ row }) => {
      return <div className="text-left"> {row.original.flowDisplayName} </div>;
    },
  },
  {
    accessorKey: 'step',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Step')} />
    ),
    cell: ({ row }) => {
      return <div className="text-left"> {row.original.step?.name} </div>;
    },
  },
  {
    accessorKey: 'count',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Count')} />
    ),
    cell: ({ row }) => {
      return <div className="text-left"> {row.original.count} </div>;
    },
  },
  {
    accessorKey: 'created',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('First Seen')} />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          {formatUtils.formatDate(new Date(row.original.created))}
        </div>
      );
    },
  },
  {
    accessorKey: 'lastOccurrence',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Last Seen')} />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          {formatUtils.formatDate(new Date(row.original.lastOccurrence))}
        </div>
      );
    },
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Status')} />
    ),
    cell: ({ row }) => {
      const issue = row.original;
      const statusConfig = getIssueStatusConfig(issue.status);

      return (
        <StatusIconWithText
          color={statusConfig.variant}
          text={statusConfig.text}
          icon={statusConfig.icon}
        />
      );
    },
    filterFn: (row, columnId, filterValue) => {
      return filterValue.includes(row.getValue(columnId));
    },
  },
];
