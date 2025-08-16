import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      // base bar
      "relative flex items-center justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
      // horizontal group (vertical bar)
      "w-[3px] bg-gradient-to-b from-border to-border/60 hover:from-primary/50 hover:to-primary/30",
      // vertical group (horizontal bar)
      "data-[panel-group-direction=vertical]:h-[3px] data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:bg-gradient-to-r",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-5 w-4 items-center justify-center rounded-md border border-border/60 bg-muted/80 shadow-sm">
        <GripVertical className="h-3 w-3 text-foreground/70" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
