"use client"

import { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
  variant?: "default" | "gradient"
}

export function PageHeader({ title, description, children, variant = "default" }: PageHeaderProps) {
  const baseClasses = "w-full py-12 md:py-16"
  const variantClasses = {
    default: "bg-gradient-to-br from-slate-50 to-slate-100",
    gradient: "bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white"
  }

  return (
    <section className={`${baseClasses} ${variantClasses[variant]}`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-6">
          <h1 className={`text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl ${variant === "gradient" ? "text-white" : "text-gray-900"}`}>
            {title}
          </h1>
          {description && (
            <p className={`max-w-[700px] md:text-xl leading-relaxed ${variant === "gradient" ? "text-blue-100" : "text-gray-600"}`}>
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </section>
  )
}