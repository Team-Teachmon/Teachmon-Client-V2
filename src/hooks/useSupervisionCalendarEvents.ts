import { useMemo } from 'react'
import type { CalendarEvent } from '@/types/calendar'
import type { SupervisionDay } from '@/types/supervision'
import { convertToCalendarEvents } from '@/utils/supervision'
import { getCalendarMonths, getCalendarRange, isDateInCalendarRange } from '@/utils/calendar'

type MonthQueryHook = (month: number, query: string) => { data?: SupervisionDay[] }

/**
 * 달력에 실제로 표시되는 날짜 범위(앞뒤 달 날짜 포함)를 기준으로 감독 데이터를 조회한다.
 * 표시 범위는 최대 3개월에 걸치므로 훅 개수를 3개로 고정해두고,
 * 화면에 없는 달은 month=0으로 넘겨 요청을 비활성화한다.
 */
export const useSupervisionCalendarEvents = (
  useMonthQuery: MonthQueryHook,
  year: number,
  month: number,
  query = ''
) => {
  const range = useMemo(() => getCalendarRange(year, month), [year, month])
  const visibleMonths = useMemo(() => getCalendarMonths(year, month), [year, month])

  const firstQuery = useMonthQuery(visibleMonths[0]?.month ?? 0, query)
  const secondQuery = useMonthQuery(visibleMonths[1]?.month ?? 0, query)
  const thirdQuery = useMonthQuery(visibleMonths[2]?.month ?? 0, query)

  return useMemo<CalendarEvent[]>(() => {
    const days = [...(firstQuery.data ?? []), ...(secondQuery.data ?? []), ...(thirdQuery.data ?? [])]
    const eventsById = new Map<string, CalendarEvent>()

    convertToCalendarEvents(days)
      .filter((event) => isDateInCalendarRange(event.date, range))
      .forEach((event) => eventsById.set(event.id, event))

    return Array.from(eventsById.values())
  }, [firstQuery.data, secondQuery.data, thirdQuery.data, range])
}
