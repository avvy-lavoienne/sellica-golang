"use client"

import { Card } from "flowbite-react"

export default function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="h-10 w-[180px] animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            {/* Image skeleton */}
            <div className="h-48 w-full animate-pulse bg-gray-200 dark:bg-gray-700" />

            {/* Content skeleton */}
            <div className="space-y-3 p-4">
              <div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-6 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>

            {/* Footer skeleton */}
            <div className="flex justify-end border-t bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
