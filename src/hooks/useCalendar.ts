import { useState, useMemo, useCallback } from 'react'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, format } from 'date-fns'
import type { CalendarDay, CalendarEvent, CalendarRangeEvent, RangeEventRow } from '@/types/calendar'
import { getCalendarRange } from '@/utils/calendar'

const getDateKey = (d: Date) => format(d, 'yyyy-MM-dd')

interface UseCalendarProps {
  controlledYear?: number
  controlledMonth?: number
  onMonthChange?: (year: number, month: number) => void
  events: CalendarEvent[]
  rangeEvents: CalendarRangeEvent[]
}

export function useCalendar({ controlledYear, controlledMonth, onMonthChange, events, rangeEvents }: UseCalendarProps) {
  const [internalYear, setInternalYear] = useState(new Date().getFullYear())
  const [internalMonth, setInternalMonth] = useState(new Date().getMonth() + 1)
  const year = controlledYear ?? internalYear
  const month = controlledMonth ?? internalMonth

  const navigate = useCallback((y: number, m: number) => {
    onMonthChange ? onMonthChange(y, m) : (setInternalYear(y), setInternalMonth(m))
  }, [onMonthChange])

  const handlePrevMonth = useCallback(() => navigate(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1), [month, year, navigate])
  const handleNextMonth = useCallback(() => navigate(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1), [month, year, navigate])

  const calendarDays = useMemo<CalendarDay[]>(() => {
    const monthStart = startOfMonth(new Date(year, month - 1))
    const monthEnd = endOfMonth(monthStart)
    const { start, end } = getCalendarRange(year, month)
    const days = eachDayOfInterval({ start, end })
    return days.map(date => ({ date, isCurrentMonth: date >= monthStart && date <= monthEnd }))
  }, [year, month])

  const eventsMap = useMemo(() => {
    const getPriority = (event: CalendarEvent) => {
      if (event.supervisionType === 'self_study') return 0
      if (event.supervisionType === 'leave_seat') return 1
      return 2
    }
    const map = new Map<string, CalendarEvent[]>()
    events.forEach(e => map.set(getDateKey(e.date), [...(map.get(getDateKey(e.date)) || []), e]))
    map.forEach((dayEvents, key) => {
      map.set(key, [...dayEvents].sort((a, b) => getPriority(a) - getPriority(b)))
    })
    return map
  }, [events])

  const rangeEventsMap = useMemo(() => {
    const map = new Map<string, CalendarRangeEvent[]>()
    calendarDays.forEach(({ date }) => {
      const matched = rangeEvents.filter(e => isWithinInterval(date, { start: startOfDay(e.startDate), end: endOfDay(e.endDate) }))
      if (matched.length) map.set(getDateKey(date), matched)
    })
    return map
  }, [rangeEvents, calendarDays])

  const rangeEventRows = useMemo<RangeEventRow[]>(() => {
    const rows: RangeEventRow[] = []
    rangeEvents.forEach(event => {
      let si = calendarDays.findIndex(d => isSameDay(d.date, event.startDate))
      let ei = calendarDays.findIndex(d => isSameDay(d.date, event.endDate))
      if (si === -1 && ei === -1) return
      si = si === -1 ? 0 : si
      ei = ei === -1 ? calendarDays.length - 1 : ei
      for (let r = Math.floor(si / 7); r <= Math.floor(ei / 7); r++) {
        const rs = Math.max(si, r * 7), re = Math.min(ei, (r + 1) * 7 - 1)
        rows.push({ event, startIndex: rs % 7, span: re - rs + 1, row: r, showLabel: r === Math.floor(si / 7) })
      }
    })
    return rows
  }, [rangeEvents, calendarDays])

  return {
    year, month, calendarDays, rangeEventRows, handlePrevMonth, handleNextMonth,
    getEventsForDate: useCallback((d: Date) => eventsMap.get(getDateKey(d)) || [], [eventsMap]),
    getRangeEventsForDate: useCallback((d: Date) => rangeEventsMap.get(getDateKey(d)) || [], [rangeEventsMap]),
  }
}

interface UseDragSelectProps {
  enabled: boolean
  onRangeSelect?: (startDate: Date, endDate: Date) => void
}

export function useDragSelect({ enabled, onRangeSelect }: UseDragSelectProps) {
  const [dragStart, setDragStart] = useState<Date | null>(null)
  const [dragEnd, setDragEnd] = useState<Date | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const isDateInDragRange = useCallback((date: Date) => {
    if (!dragStart || !dragEnd) return false
    const [s, e] = dragStart < dragEnd ? [dragStart, dragEnd] : [dragEnd, dragStart]
    return isWithinInterval(date, { start: startOfDay(s), end: endOfDay(e) })
  }, [dragStart, dragEnd])

  const handleMouseDown = useCallback((date: Date) => {
    if (!enabled) return
    setDragStart(date)
    setDragEnd(date)
    setIsDragging(true)
  }, [enabled])

  const handleMouseEnter = useCallback((date: Date) => {
    if (enabled && isDragging) setDragEnd(date)
  }, [enabled, isDragging])

  const handleMouseUp = useCallback(() => {
    if (!enabled || !isDragging) return
    setIsDragging(false)
    if (dragStart && dragEnd && onRangeSelect) {
      const [s, e] = dragStart < dragEnd ? [dragStart, dragEnd] : [dragEnd, dragStart]
      onRangeSelect(s, e)
    }
  }, [enabled, isDragging, dragStart, dragEnd, onRangeSelect])

  return { isDateInDragRange, handleMouseDown, handleMouseEnter, handleMouseUp }
}
