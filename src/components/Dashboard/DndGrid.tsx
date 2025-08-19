import { useEffect, useMemo, useState } from 'react'
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Card } from '@/components/ui/card'

type GridProps = {
  modules: Array<{ id: string; title: string; render: () => JSX.Element }>
  storageKey?: string
}

export const DndGrid = ({ modules, storageKey = 'dashboard-layout' }: GridProps) => {
  const [order, setOrder] = useState<string[]>([])
  const ids = useMemo(() => modules.map(m => m.id), [modules])

  // Load and persist order
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as string[]
        if (Array.isArray(parsed) && parsed.every(id => ids.includes(id))) setOrder(parsed)
      }
    } catch {}
  }, [storageKey, ids])
  useEffect(() => {
    if (order.length > 0) localStorage.setItem(storageKey, JSON.stringify(order))
  }, [order, storageKey])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (evt: DragEndEvent) => {
    const { active, over } = evt
    if (!over || active.id === over.id) return
    const current = order.length ? order : ids
    const oldIndex = current.indexOf(String(active.id))
    const newIndex = current.indexOf(String(over.id))
    const next = arrayMove(current, oldIndex, newIndex)
    setOrder(next)
  }

  const currentOrder = order.length ? order : ids
  const byId = new Map(modules.map(m => [m.id, m]))

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={currentOrder} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {currentOrder.map(id => {
            const mod = byId.get(id)
            if (!mod) return null
            return (
              <Card key={id} className="p-4 bg-card border-border transition-smooth hover:shadow-glow cursor-grab active:cursor-grabbing">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground truncate">{mod.title}</h3>
                </div>
                <div>{mod.render()}</div>
              </Card>
            )
          })}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export default DndGrid
