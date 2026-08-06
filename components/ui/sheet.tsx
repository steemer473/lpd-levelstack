"use client"

import { X } from "lucide-react"
import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

type SheetSide = "left" | "right"

type SheetContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
  titleId: string
  descriptionId: string
}

const SheetContext = React.createContext<SheetContextValue | null>(null)

function useSheetContext() {
  const context = React.useContext(SheetContext)
  if (!context) {
    throw new Error("Sheet components must be used within Sheet")
  }
  return context
}

function Sheet({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const isControlled = open !== undefined
  const sheetOpen = isControlled ? open : uncontrolledOpen
  const titleId = React.useId()
  const descriptionId = React.useId()

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange],
  )

  return (
    <SheetContext.Provider
      value={{ open: sheetOpen, onOpenChange: setOpen, titleId, descriptionId }}
    >
      {children}
    </SheetContext.Provider>
  )
}

function SheetTrigger({
  children,
  ...props
}: React.ComponentProps<"button">) {
  const { onOpenChange } = useSheetContext()
  return (
    <button
      type="button"
      data-slot="sheet-trigger"
      {...props}
      onClick={(event) => {
        props.onClick?.(event)
        if (!event.defaultPrevented) {
          onOpenChange(true)
        }
      }}
    >
      {children}
    </button>
  )
}

function useIsMounted() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

function SheetPortal({ children }: { children: React.ReactNode }) {
  const mounted = useIsMounted()
  if (!mounted) return null
  return createPortal(children, document.body)
}

function SheetClose({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  const { onOpenChange } = useSheetContext()
  return (
    <button
      type="button"
      data-slot="sheet-close"
      className={className}
      {...props}
      onClick={(event) => {
        props.onClick?.(event)
        if (!event.defaultPrevented) {
          onOpenChange(false)
        }
      }}
    >
      {children}
    </button>
  )
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { onOpenChange } = useSheetContext()
  return (
    <div
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/55 animate-in fade-in-0",
        className,
      )}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  )
}

const sideClasses: Record<SheetSide, string> = {
  left: "inset-y-0 left-0 h-full w-full max-w-sm border-r animate-in slide-in-from-left",
  right:
    "inset-y-0 right-0 h-full w-full max-w-sm border-l animate-in slide-in-from-right",
}

function SheetContent({
  className,
  children,
  side = "right",
  showClose = true,
  ...props
}: React.ComponentProps<"div"> & {
  side?: SheetSide
  showClose?: boolean
}) {
  const { open, onOpenChange, titleId, descriptionId } = useSheetContext()
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onOpenChange])

  React.useEffect(() => {
    if (!open) return
    contentRef.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <SheetPortal>
      <SheetOverlay />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        data-slot="sheet-content"
        data-side={side}
        data-state="open"
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-background p-6 shadow-lg ring-1 ring-foreground/10 duration-200",
          sideClasses[side],
          className,
        )}
        {...props}
      >
        {children}
        {showClose ? (
          <SheetClose className="absolute top-4 right-4 rounded-sm p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </SheetClose>
        ) : null}
      </div>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 pr-8 text-left", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: React.ComponentProps<"h2">) {
  const { titleId } = useSheetContext()
  return (
    <h2
      id={titleId}
      data-slot="sheet-title"
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { descriptionId } = useSheetContext()
  return (
    <p
      id={descriptionId}
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetPortal,
  SheetClose,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
