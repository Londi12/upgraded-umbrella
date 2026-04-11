import { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
  badge?: string
}

export function PageHeader({ title, description, children, badge }: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="container mx-auto max-w-7xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {badge && (
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full shrink-0">
              {badge}
            </span>
          )}
          <h1 className="text-base font-semibold text-gray-800 truncate">{title}</h1>
          {description && (
            <p className="text-sm text-gray-500 hidden sm:block truncate">{description}</p>
          )}
        </div>
        {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
      </div>
    </div>
  )
}