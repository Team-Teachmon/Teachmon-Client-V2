import { addDays, endOfDay, getDay, isWithinInterval, startOfDay, startOfMonth, subDays } from 'date-fns'

export const getDayType = (dayOfWeek: number): 'sunday' | 'saturday' | 'weekday' => {
  if (dayOfWeek === 0) return 'sunday'
  if (dayOfWeek === 6) return 'saturday'
  return 'weekday'
}

export const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
export const LEFT_DOUBLE_ARROW = '/icons/LeftDoubleArrow.svg'
export const RIGHT_DOUBLE_ARROW = '/icons/RightDoubleArrow.svg'

/** 달력 그리드에 그려지는 셀 개수 (5주 고정) */
export const CALENDAR_DAY_COUNT = 35

export interface CalendarRange {
  start: Date
  end: Date
}

/** 화면에 실제로 표시되는 날짜 범위 (앞뒤 달 날짜 포함) */
export const getCalendarRange = (year: number, month: number): CalendarRange => {
  const monthStart = startOfMonth(new Date(year, month - 1))
  const start = subDays(monthStart, getDay(monthStart))
  return { start, end: addDays(start, CALENDAR_DAY_COUNT - 1) }
}

/** 화면에 표시되는 날짜가 걸쳐 있는 (연, 월) 목록 — 1~3개 */
export const getCalendarMonths = (year: number, month: number): Array<{ year: number; month: number }> => {
  const { start, end } = getCalendarRange(year, month)
  const months: Array<{ year: number; month: number }> = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)

  while (cursor <= end) {
    months.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return months
}

/** 화면에 표시되는 날짜 범위에 포함되는지 여부 */
export const isDateInCalendarRange = (date: Date, range: CalendarRange): boolean =>
  isWithinInterval(date, { start: startOfDay(range.start), end: endOfDay(range.end) })
