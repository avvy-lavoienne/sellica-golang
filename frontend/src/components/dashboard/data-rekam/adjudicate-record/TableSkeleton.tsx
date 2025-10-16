"use client";

// Flowbite Pro component interfaces (simplified for this implementation)
// In a real Flowbite Pro setup, these would be imported from "flowbite-react"
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface TableProps {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
}

interface TableHeadProps {
  children: React.ReactNode;
}

interface TableHeadCellProps {
  children: React.ReactNode;
  className?: string;
  scope?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

// Simplified Flowbite Pro components (in production, import from "flowbite-react")
const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const Table: React.FC<TableProps> = ({ children, hoverable = false, className = "" }) => (
  <table className={`w-full text-sm text-left text-gray-500 dark:text-gray-400 ${hoverable ? 'hover' : ''} ${className}`}>
    {children}
  </table>
);

const TableHead: React.FC<TableHeadProps> = ({ children }) => (
  <thead className="text-xs uppercase text-gray-700 bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
    {children}
  </thead>
);

const TableHeadCell: React.FC<TableHeadCellProps> = ({ children, className = "", scope }) => (
  <th scope={scope} className={`px-6 py-3.5 ${className}`}>
    {children}
  </th>
);

const TableBody: React.FC<TableBodyProps> = ({ children }) => (
  <tbody>
    {children}
  </tbody>
);

const TableRow: React.FC<TableRowProps> = ({ children, className = "" }) => (
  <tr className={`border-b dark:border-gray-700 ${className}`}>
    {children}
  </tr>
);

const TableCell: React.FC<TableCellProps> = ({ children, className = "" }) => (
  <td className={`px-6 py-4 ${className}`}>
    {children}
  </td>
);

const TableSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Search and Refresh Skeleton - Flowbite input styling */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="h-11 bg-gray-200 dark:bg-gray-700 rounded-lg w-full max-w-md animate-pulse"></div>
        <div className="h-11 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-pulse"></div>
      </div>

      {/* Table Skeleton with Flowbite Table structure */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell scope="col" className="w-12">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </TableHeadCell>
                <TableHeadCell scope="col" className="w-36">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </TableHeadCell>
                <TableHeadCell scope="col">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </TableHeadCell>
                <TableHeadCell scope="col" className="w-24">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </TableHeadCell>
                <TableHeadCell scope="col" className="w-28">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </TableHeadCell>
                <TableHeadCell scope="col" className="text-right">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Skeleton rows with Flowbite table structure */}
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="h-4 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination Skeleton - Flowbite button styling */}
      <div className="flex justify-center mt-6">
        <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );
};

export default TableSkeleton;
