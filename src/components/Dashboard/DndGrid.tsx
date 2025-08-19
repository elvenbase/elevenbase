import { useEffect, useMemo, useState } from 'react'
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GripVertical, RotateCcw } from 'lucide-react'

type GridModule = { id: string; title: string; render: () => JSX.Element; gridClassName?: string }

type GridProps = {
  modules: Array<GridModule>
  storageKey?: string
  userId?: string | null
  preferenceKey?: string
}

import { supabase } from '@/integrations/supabase/client'

export const DndGrid = ({ modules, storageKey = 'dashboard-layout', userId, preferenceKey = 'dashboard_layout' }: GridProps) => {
  const [order, setOrder] = useState<string[]>([])
  const [locked, setLocked] = useState<boolean>(false)
  const ids = useMemo(() => modules.map(m => m.id), [modules])

  // Load and persist order (localStorage + user preference if available)
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
    const loadFromDb = async () => {
      if (!userId) return
      const { data, error } = await supabase
        .from('user_preferences')
        .select('value')
        .eq('user_id', userId)
        .eq('key', preferenceKey)
        .maybeSingle()
      if (!error && data && data.value && Array.isArray(data.value.order)) {
        const arr = data.value.order as string[]
        if (arr.every(id => ids.includes(id))) setOrder(arr)
        if (typeof data.value.locked === 'boolean') setLocked(!!data.value.locked)
      }
    }
    loadFromDb()
  }, [userId, preferenceKey, ids])
  useEffect(() => {
    if (order.length > 0) localStorage.setItem(storageKey, JSON.stringify(order))
  }, [order, storageKey])

  const persistToDb = async (nextOrder: string[]) => {
    try {
      if (!userId) return
      const payload = { user_id: userId, key: preferenceKey, value: { order: nextOrder, locked } }
      const { error } = await supabase.from('user_preferences').upsert(payload, { onConflict: 'user_id,key' as any })
      if (error) console.error('Failed to persist layout', error)
    } catch (e) {
      console.error('Persist layout error', e)
    }
  }

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
    persistToDb(next)
  }

  const currentOrder = order.length ? order : ids
  const byId = new Map(modules.map(m => [m.id, m]))

  const SortableModule = ({ id }: { id: string }) => {
    const mod = byId.get(id)
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 50 : undefined,
    } as React.CSSProperties
    if (!mod) return null
    return (
      <div ref={setNodeRef} style={style} className={`min-w-0 ${mod.gridClassName || ''}`}>
        <Card className={`p-4 bg-card border-border transition-smooth ${isDragging ? 'shadow-lg ring-1 ring-primary/30' : 'hover:shadow-glow'}`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground truncate">{mod.title}</h3>
            <button
              className="inline-flex items-center gap-2 rounded-md px-2 py-1 bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-grab active:cursor-grabbing transition-bounce"
              aria-label="Trascina per spostare"
              title="Sposta modulo"
              {...(locked ? {} as any : { ...attributes, ...listeners })}
              disabled={locked}
            >
              <GripVertical className="h-4 w-4" />
              <span className="text-xs hidden sm:inline">Muovi</span>
            </button>
          </div>
          <div>{mod.render()}</div>
        </Card>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={currentOrder} strategy={rectSortingStrategy}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground select-none">
            <input type="checkbox" checked={locked} onChange={(e)=>{ setLocked(e.target.checked); persistToDb(order.length?order:ids) }} />
            Blocca disposizione
          </label>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-3 py-1.5 hover:shadow-sm transition-bounce"
            onClick={()=>{ setOrder(ids); persistToDb(ids); localStorage.setItem(storageKey, JSON.stringify(ids)) }}
            title="Ripristina ordine predefinito"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-xs">Reset layout</span>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {currentOrder.map(id => (
            <SortableModule key={id} id={id} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export default DndGrid
