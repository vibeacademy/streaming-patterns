/**
 * Tests for StreamingTable component
 *
 * Verifies that the component:
 * - Renders schema and rows correctly
 * - Shows skeleton loaders for pending rows
 * - Handles sorting interactions
 * - Displays streaming indicators
 * - Handles empty states
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { StreamingTable } from './StreamingTable';
import type { TableSchema, TableRow, SortConfig } from './types';

// Mock data
const mockSchema: TableSchema = {
  title: 'Test Table',
  columns: [
    {
      id: 'name',
      label: 'Name',
      type: 'string',
      sortable: true,
      width: '200px'
    },
    {
      id: 'age',
      label: 'Age',
      type: 'number',
      sortable: true,
      unit: ''
    },
    {
      id: 'isActive',
      label: 'Active',
      type: 'boolean',
      sortable: false
    }
  ],
  totalRows: 5
};

const mockRows: TableRow[] = [
  {
    rowId: 'row-1',
    values: { name: 'Alice', age: 30, isActive: true }
  },
  {
    rowId: 'row-2',
    values: { name: 'Bob', age: 25, isActive: false }
  }
];

describe('StreamingTable', () => {
  it('should show empty state when no schema', () => {
    render(
      <StreamingTable
        rows={[]}
        isStreaming={false}
        isComplete={false}
        sort={null}
      />
    );

    expect(screen.getByText(/waiting for table schema/i)).toBeInTheDocument();
  });

  it('should render column headers', () => {
    render(
      <StreamingTable
        schema={mockSchema}
        rows={[]}
        isStreaming={false}
        isComplete={false}
        sort={null}
      />
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render data rows', () => {
    render(
      <StreamingTable
        schema={mockSchema}
        rows={mockRows}
        isStreaming={false}
        isComplete={false}
        sort={null}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('should render boolean values as Yes/No', () => {
    render(
      <StreamingTable
        schema={mockSchema}
        rows={mockRows}
        isStreaming={false}
        isComplete={false}
        sort={null}
      />
    );

    const yesTexts = screen.getAllByText('Yes');
    const noTexts = screen.getAllByText('No');

    expect(yesTexts.length).toBeGreaterThan(0);
    expect(noTexts.length).toBeGreaterThan(0);
  });

  it('should render skeleton rows for anticipated data', () => {
    const { container } = render(
      <StreamingTable
        schema={mockSchema}
        rows={mockRows} // 2 rows
        isStreaming={true}
        isComplete={false}
        sort={null}
      />
    );

    // Should show 3 skeleton rows (5 total - 2 received = 3 pending)
    const table = container.querySelector('table');
    const allRows = table?.querySelectorAll('tbody tr') || [];
    const skeletonRows = Array.from(allRows).filter((row) =>
      row.className.includes('skeletonRow')
    );
    expect(skeletonRows.length).toBe(3);
  });

  it('should not render skeleton rows when complete', () => {
    render(
      <StreamingTable
        schema={mockSchema}
        rows={mockRows}
        isStreaming={false}
        isComplete={true}
        sort={null}
      />
    );

    const skeletonRows = screen.getByRole('table').querySelectorAll('.skeletonRow');
    expect(skeletonRows.length).toBe(0);
  });

  it('should show streaming indicator', () => {
    render(
      <StreamingTable
        schema={mockSchema}
        rows={mockRows}
        isStreaming={true}
        isComplete={false}
        sort={null}
      />
    );

    expect(screen.getByText(/streaming data/i)).toBeInTheDocument();
    expect(screen.getByText(/2 of 5 rows/i)).toBeInTheDocument();
  });

  it('should not show streaming indicator when complete', () => {
    render(
      <StreamingTable
        schema={mockSchema}
        rows={mockRows}
        isStreaming={false}
        isComplete={true}
        sort={null}
      />
    );

    expect(screen.queryByText(/streaming data/i)).not.toBeInTheDocument();
  });

  it('should call onSort when sortable header is clicked', async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();

    render(
      <StreamingTable
        schema={mockSchema}
        rows={mockRows}
        isStreaming={false}
        isComplete={false}
        sort={null}
        onSort={onSort}
      />
    );

    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);

    expect(onSort).toHaveBeenCalledWith('name');
  });

  it('should not call onSort for non-sortable columns', async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();

    render(
      <StreamingTable
        schema={mockSchema}
        rows={mockRows}
        isStreaming={false}
        isComplete={false}
        sort={null}
        onSort={onSort}
      />
    );

    const activeHeader = screen.getByText('Active');
    await user.click(activeHeader);

    expect(onSort).not.toHaveBeenCalled();
  });

  it('should show sort indicator for sorted column', () => {
    const sort: SortConfig = { columnId: 'name', direction: 'asc' };

    render(
      <StreamingTable
        schema={mockSchema}
        rows={mockRows}
        isStreaming={false}
        isComplete={false}
        sort={sort}
      />
    );

    const nameHeader = screen.getByText('Name').closest('th');
    expect(nameHeader?.className).toContain('sorted');
    expect(nameHeader?.textContent).toContain('↑');
  });

  it('should show descending sort indicator', () => {
    const sort: SortConfig = { columnId: 'age', direction: 'desc' };

    render(
      <StreamingTable
        schema={mockSchema}
        rows={mockRows}
        isStreaming={false}
        isComplete={false}
        sort={sort}
      />
    );

    const ageHeader = screen.getByText('Age').closest('th');
    expect(ageHeader?.textContent).toContain('↓');
  });

  it('should show empty cell message when no rows and complete', () => {
    render(
      <StreamingTable
        schema={mockSchema}
        rows={[]}
        isStreaming={false}
        isComplete={true}
        sort={null}
      />
    );

    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('should format null values as em dash', () => {
    const rowsWithNull: TableRow[] = [
      {
        rowId: 'row-1',
        values: { name: 'Alice', age: null, isActive: true }
      }
    ];

    render(
      <StreamingTable
        schema={mockSchema}
        rows={rowsWithNull}
        isStreaming={false}
        isComplete={false}
        sort={null}
      />
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <StreamingTable
        schema={mockSchema}
        rows={mockRows}
        isStreaming={false}
        isComplete={false}
        sort={null}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should format date values', () => {
    const schemaWithDate: TableSchema = {
      ...mockSchema,
      columns: [
        {
          id: 'date',
          label: 'Date',
          type: 'date',
          sortable: false
        }
      ]
    };

    const rowsWithDate: TableRow[] = [
      {
        rowId: 'row-1',
        values: { date: '2025-01-15' }
      }
    ];

    render(
      <StreamingTable
        schema={schemaWithDate}
        rows={rowsWithDate}
        isStreaming={false}
        isComplete={false}
        sort={null}
      />
    );

    // Date should be formatted (may vary based on locale)
    // Just check that it's not the raw ISO string
    expect(screen.queryByText('2025-01-15')).not.toBeInTheDocument();
    // Should contain at least the year
    expect(screen.getByText(/2025/)).toBeInTheDocument();
  });

  it('should format number with unit', () => {
    const schemaWithUnit: TableSchema = {
      ...mockSchema,
      columns: [
        {
          id: 'price',
          label: 'Price',
          type: 'number',
          sortable: false,
          unit: '$'
        }
      ]
    };

    const rowsWithPrice: TableRow[] = [
      {
        rowId: 'row-1',
        values: { price: 99 }
      }
    ];

    render(
      <StreamingTable
        schema={schemaWithUnit}
        rows={rowsWithPrice}
        isStreaming={false}
        isComplete={false}
        sort={null}
      />
    );

    expect(screen.getByText('$99')).toBeInTheDocument();
  });
});
