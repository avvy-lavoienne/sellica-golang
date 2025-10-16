"use client";

export default function TableSkeleton() {
  return (
    <div className="w-full overflow-auto rounded-lg border border-gray-200 shadow-sm dark:border-gray-700">
      <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
        <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="w-[100px] px-6 py-3">
              <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
            </th>
            <th scope="col" className="px-6 py-3">
              <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
            </th>
            <th scope="col" className="px-6 py-3">
              <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
            </th>
            <th scope="col" className="px-6 py-3 text-right">
              <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b bg-white dark:border-gray-700 dark:bg-gray-800">
              <td className="px-6 py-4">
                <div className="h-4 w-[80px] animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </td>
              <td className="px-6 py-4">
                <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </td>
              <td className="px-6 py-4">
                <div className="h-4 w-[120px] animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end space-x-2">
                  <div className="h-8 w-8 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
                  <div className="h-8 w-8 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
