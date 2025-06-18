import * as React from "react"
import { cn } from "@/lib/utils"
import { Button, ButtonProps } from "@/components/ui/button"
import { motion } from "framer-motion"

interface FloatingButtonProps extends ButtonProps {
  children: React.ReactNode
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "bottom-center" | "right-center" | "left-center"
  offset?: number
  showShadow?: boolean
}

export function FloatingButton({
  children,
  className,
  position = "bottom-right",
  offset = 24,
  showShadow = true,
  ...props
}: FloatingButtonProps) {
  const positionStyles = {
    "bottom-right": { bottom: offset, right: offset },
    "bottom-left": { bottom: offset, left: offset },
    "top-right": { top: offset, right: offset },
    "top-left": { top: offset, left: offset },
    "bottom-center": { bottom: offset, left: "50%", transform: "translateX(-50%)" },
    "right-center": { top: "50%", right: offset, transform: "translateY(-50%)" },
    "left-center": { top: "50%", left: offset, transform: "translateY(-50%)" },
  }

  return (
    <motion.div 
      className="absolute z-50"
      style={{...positionStyles[position]}}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Button
        className={cn(
          showShadow && "shadow-lg shadow-emerald-600/20",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  )
}
