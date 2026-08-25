import { useRef, useState } from 'react'
import type { CalendarEvent, CalendarRangeEvent, LegendItem, DayInfo, CalendarProps } from '@/types/calendar'
import { useCalendar, useDragSelect } from '@/hooks/useCalendar'
import { DAYS_OF_WEEK, LEFT_DOUBLE_ARROW, RIGHT_DOUBLE_ARROW, getDayType } from '@/utils/calendar'
import * as S from './style'

export type { CalendarEvent, CalendarRangeEvent, LegendItem, DayInfo, CalendarProps }

export default function Calendar({
  year: controlledYear,
  month: controlledMonth,
  onMonthChange,
  events = [],
  rangeEvents = [],
  legends = [],
  onDateClick,
  onEventClick,
  onRangeSelect,
  showYear = true,
  showLegend = true,
  showMobilePopover = true,
  selectable = false,
  exchangeMode = false,
  currentTeacherId,
  selectedMyEvent,
  onMyEventSelect,
  onTargetEventSelect,
}: CalendarProps) {
  const { year, month, calendarDays, rangeEventRows, handlePrevMonth, handleNextMonth, getEventsForDate, getRangeEventsForDate } = useCalendar({ controlledYear, controlledMonth, onMonthChange, events, rangeEvents })
  const { isDateInDragRange, handleMouseDown, handleMouseEnter, handleMouseUp } = useDragSelect({ enabled: selectable, onRangeSelect })
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null)
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number
    left: number
    placement: 'top' | 'bottom'
    pointerLeft: number
    width: number
  } | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const prevMonthNum = month === 1 ? 12 : month - 1
  const nextMonthNum = month === 12 ? 1 : month + 1
  const calendarRows = Math.ceil(calendarDays.length / 7)
  const isInteractive = selectable || exchangeMode || !!onDateClick || !!onEventClick

  const updatePopoverPosition = (rect: DOMRect) => {
    if (!containerRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height
    const leftBase = rect.left - containerRect.left + rect.width / 2
    const edgePadding = 4
    const availableWidth = Math.max(containerWidth - edgePadding * 2, 0)
    const popoverWidth = availableWidth > 0 ? Math.min(200, availableWidth) : Math.min(200, containerWidth)
    const halfWidth = popoverWidth / 2
    const canClamp = containerWidth > popoverWidth + edgePadding * 2
    const left = canClamp
      ? Math.min(
        Math.max(leftBase, halfWidth + edgePadding),
        containerWidth - halfWidth - edgePadding
      )
      : containerWidth / 2
    const topInContainer = rect.top - containerRect.top
    const bottomInContainer = rect.bottom - containerRect.top
    const estimatedHeight = 140
    const canPlaceTop = topInContainer - estimatedHeight - 16 > 0
    const canPlaceBottom = bottomInContainer + estimatedHeight + 16 < containerHeight
    const shouldPlaceBottom = !canPlaceTop && canPlaceBottom
    const placement = shouldPlaceBottom ? 'bottom' : 'top'
    let top = placement === 'bottom' ? bottomInContainer + 8 : topInContainer - 8

    if (placement === 'bottom') {
      top = Math.min(top, containerHeight - estimatedHeight - 8)
      top = Math.max(top, 8)
    } else {
      top = Math.max(top, estimatedHeight + 8)
      top = Math.min(top, containerHeight - 8)
    }

    const leftEdge = left - halfWidth
    const pointerPadding = 12
    const pointerLeft = Math.min(
      Math.max(leftBase - leftEdge, pointerPadding),
      popoverWidth - pointerPadding
    )

    setPopoverPosition({ top, left, placement, pointerLeft, width: popoverWidth })
  }

  const handleEventClick = (event: CalendarEvent, rect: DOMRect) => {
    if (showMobilePopover) {
      const dayEvents = sortDayEvents(getEventsForDate(event.date))
      const dayRangeEvents = getRangeEventsForDate(event.date)
      setSelectedDay({ date: event.date, isCurrentMonth: true, events: dayEvents, rangeEvents: dayRangeEvents })
      updatePopoverPosition(rect)
    }
    if (exchangeMode) {
      if (String(event.teacherId) === String(currentTeacherId)) {
        onMyEventSelect?.(event)
      } else {
        onTargetEventSelect?.(event)
      }
    } else {
      onEventClick?.(event)
    }
  }

  const formatShortDate = (date: Date) => `${date.getMonth() + 1}월 ${date.getDate()}일`
  const getEventPriority = (event: CalendarEvent) => {
    if (event.supervisionType === 'seventh_period') return 0
    if (event.supervisionType === 'self_study') return 1
    if (event.supervisionType === 'leave_seat') return 2
    return 3
  }
  const sortDayEvents = (dayEvents: CalendarEvent[]) =>
    [...dayEvents].sort((a, b) => getEventPriority(a) - getEventPriority(b))
  const getEventTitle = (event: CalendarEvent) => {
    if (event.supervisionType === 'self_study') return `자습 감독: ${event.label}`
    if (event.supervisionType === 'leave_seat') return `이석 감독: ${event.label}`
    if (event.supervisionType === 'seventh_period') return `7교시 감독: ${event.label}`
    return event.label
  }
  const getEventDisabled = (event: CalendarEvent) => {
    const isMyEvent = String(event.teacherId) === String(currentTeacherId)
    const isExchangeEvent = event.supervisionType === 'self_study' || event.supervisionType === 'leave_seat'
    let isDisabled = false

    if (exchangeMode) {
      if (!isExchangeEvent) {
        isDisabled = true
      } else if (!selectedMyEvent) {
        isDisabled = !isMyEvent
      } else {
        isDisabled = isMyEvent
      }
    }

    return isDisabled
  }

  return (
    <S.CalendarContainer
      ref={containerRef}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={(event) => {
        if (popoverRef.current && popoverRef.current.contains(event.target as Node)) return
        setSelectedDay(null)
        setPopoverPosition(null)
      }}
    >
      {showYear && <S.YearTitle>{year}년</S.YearTitle>}
      <S.HeaderRow>
        <S.MonthNavigation>
          <S.NavButton onClick={handlePrevMonth}>
            <S.ArrowIcon src={LEFT_DOUBLE_ARROW} alt="이전 월" />
          </S.NavButton>
          <S.MonthText key={`prev-${month}`} isActive={false} onClick={handlePrevMonth}>{prevMonthNum}월</S.MonthText>
          <S.MonthText key={`current-${month}`} isActive={true}>{month}월</S.MonthText>
          <S.MonthText key={`next-${month}`} isActive={false} onClick={handleNextMonth}>{nextMonthNum}월</S.MonthText>
          <S.NavButton onClick={handleNextMonth}>
            <S.ArrowIcon src={RIGHT_DOUBLE_ARROW} alt="다음 월" />
          </S.NavButton>
        </S.MonthNavigation>
        {showLegend && legends.length > 0 && (
          <S.LegendContainer>
            {legends.map((legend) => (
              <S.LegendTag key={legend.id} bgColor={legend.bgColor} textColor={legend.textColor}>{legend.label}</S.LegendTag>
            ))}
          </S.LegendContainer>
        )}
      </S.HeaderRow>
      <S.CalendarGrid>
        <S.WeekHeader>
          {DAYS_OF_WEEK.map((day, index) => (
            <S.WeekDay key={day} dayType={getDayType(index)}>{day}</S.WeekDay>
          ))}
        </S.WeekHeader>
        <S.DaysGridWrapper>
          <S.DaysGrid style={{ ['--calendar-rows' as string]: calendarRows }}>
            {calendarDays.map(({ date, isCurrentMonth }, index) => {
              const dayEvents = sortDayEvents(getEventsForDate(date))
              const dayRangeEvents = getRangeEventsForDate(date)
              const dayType = getDayType(date.getDay())
              const isInDragRange = isDateInDragRange(date)
              return (
                <S.DayCell
                  key={index}
                  isSelected={isInDragRange}
                  isInteractive={isInteractive}
                  onMouseDown={() => handleMouseDown(date)}
                  onMouseEnter={() => handleMouseEnter(date)}
                  onClick={(e) => {
                    e.stopPropagation()
                    const dayInfo = { date, isCurrentMonth, events: dayEvents, rangeEvents: dayRangeEvents }
                    if (!selectable) {
                      onDateClick?.(date, dayInfo, (e.currentTarget as HTMLElement).getBoundingClientRect())
                    }
                    if (showMobilePopover) {
                      setSelectedDay(dayInfo)
                      updatePopoverPosition((e.currentTarget as HTMLElement).getBoundingClientRect())
                    }
                  }}
                >
                  <S.DayNumber dayType={dayType}>{date.getDate()}</S.DayNumber>
                  <S.EventList>
                    {(() => {
                      const seventhEvent = dayEvents.find((event) => event.supervisionType === 'seventh_period')
                      const selfStudyEvent = dayEvents.find((event) => event.supervisionType === 'self_study')
                      const leaveSeatEvent = dayEvents.find((event) => event.supervisionType === 'leave_seat')
                      const otherEvents = dayEvents.filter(
                        (event) =>
                          event.id !== seventhEvent?.id &&
                          event.id !== selfStudyEvent?.id &&
                          event.id !== leaveSeatEvent?.id
                      )

                      return (
                        <>
                          <S.DesktopEventGroup>
                            {seventhEvent && (
                              <S.EventTag
                                key={seventhEvent.id}
                                title={getEventTitle(seventhEvent)}
                                bgColor={seventhEvent.bgColor}
                                textColor={seventhEvent.textColor}
                                clickable={!!onEventClick || (exchangeMode && !getEventDisabled(seventhEvent))}
                                isSelected={exchangeMode && selectedMyEvent?.id === seventhEvent.id}
                                isDisabled={getEventDisabled(seventhEvent)}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const isDisabled = getEventDisabled(seventhEvent)
                                  if (!isDisabled) {
                                    handleEventClick(seventhEvent, (e.currentTarget as HTMLElement).getBoundingClientRect())
                                  }
                                  if (onEventClick) {
                                    e.stopPropagation()
                                    onEventClick(seventhEvent, (e.currentTarget as HTMLElement).getBoundingClientRect())
                                  }
                                }}
                              >
                                {seventhEvent.label}
                              </S.EventTag>
                            )}

                            {(selfStudyEvent || leaveSeatEvent) && (
                              <S.EventSplitRow>
                                {selfStudyEvent ? (
                                  <S.EventHalfTag
                                    key={selfStudyEvent.id}
                                    title={getEventTitle(selfStudyEvent)}
                                    bgColor={selfStudyEvent.bgColor}
                                    textColor={selfStudyEvent.textColor}
                                    clickable={!!onEventClick || (exchangeMode && !getEventDisabled(selfStudyEvent))}
                                    isSelected={exchangeMode && selectedMyEvent?.id === selfStudyEvent.id}
                                    isDisabled={getEventDisabled(selfStudyEvent)}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const isDisabled = getEventDisabled(selfStudyEvent)
                                      if (!isDisabled) {
                                        handleEventClick(selfStudyEvent, (e.currentTarget as HTMLElement).getBoundingClientRect())
                                      }
                                      if (onEventClick) {
                                        e.stopPropagation()
                                        onEventClick(selfStudyEvent, (e.currentTarget as HTMLElement).getBoundingClientRect())
                                      }
                                    }}
                                  >
                                    {selfStudyEvent.label}
                                  </S.EventHalfTag>
                                ) : (
                                  <S.EventPlaceholder />
                                )}

                                {leaveSeatEvent ? (
                                  <S.EventHalfTag
                                    key={leaveSeatEvent.id}
                                    title={getEventTitle(leaveSeatEvent)}
                                    bgColor={leaveSeatEvent.bgColor}
                                    textColor={leaveSeatEvent.textColor}
                                    clickable={!!onEventClick || (exchangeMode && !getEventDisabled(leaveSeatEvent))}
                                    isSelected={exchangeMode && selectedMyEvent?.id === leaveSeatEvent.id}
                                    isDisabled={getEventDisabled(leaveSeatEvent)}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const isDisabled = getEventDisabled(leaveSeatEvent)
                                      if (!isDisabled) {
                                        handleEventClick(leaveSeatEvent, (e.currentTarget as HTMLElement).getBoundingClientRect())
                                      }
                                      if (onEventClick) {
                                        e.stopPropagation()
                                        onEventClick(leaveSeatEvent, (e.currentTarget as HTMLElement).getBoundingClientRect())
                                      }
                                    }}
                                  >
                                    {leaveSeatEvent.label}
                                  </S.EventHalfTag>
                                ) : (
                                  <S.EventPlaceholder />
                                )}
                              </S.EventSplitRow>
                            )}

                            {otherEvents.map((event) => {
                              const isDisabled = getEventDisabled(event)
                              return (
                                <S.EventTag
                                  key={event.id}
                                  title={getEventTitle(event)}
                                  bgColor={event.bgColor}
                                  textColor={event.textColor}
                                  clickable={!!onEventClick || (exchangeMode && !isDisabled)}
                                  isSelected={exchangeMode && selectedMyEvent?.id === event.id}
                                  isDisabled={isDisabled}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!isDisabled) {
                                      handleEventClick(event, (e.currentTarget as HTMLElement).getBoundingClientRect())
                                    }
                                    if (onEventClick) {
                                      e.stopPropagation()
                                      onEventClick(event, (e.currentTarget as HTMLElement).getBoundingClientRect())
                                    }
                                  }}
                                >
                                  {event.label}
                                </S.EventTag>
                              )
                            })}
                          </S.DesktopEventGroup>

                          <S.MobileEventGroup>
                            <S.MobileTripleRow>
                              {seventhEvent ? (
                                <S.MobileThirdTag
                                  key={seventhEvent.id}
                                  title={getEventTitle(seventhEvent)}
                                  bgColor={seventhEvent.bgColor}
                                  textColor={seventhEvent.textColor}
                                  clickable={!!onEventClick || (exchangeMode && !getEventDisabled(seventhEvent))}
                                  isSelected={exchangeMode && selectedMyEvent?.id === seventhEvent.id}
                                  isDisabled={getEventDisabled(seventhEvent)}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const isDisabled = getEventDisabled(seventhEvent)
                                    if (!isDisabled) {
                                      handleEventClick(seventhEvent, (e.currentTarget as HTMLElement).getBoundingClientRect())
                                    }
                                    if (onEventClick) {
                                      e.stopPropagation()
                                      onEventClick(seventhEvent, (e.currentTarget as HTMLElement).getBoundingClientRect())
                                    }
                                  }}
                                >
                                  {seventhEvent.label}
                                </S.MobileThirdTag>
                              ) : (
                                // <S.MobileThirdPlaceholder />
                                <></>
                              )}

                              {selfStudyEvent ? (
                                <S.MobileThirdTag
                                  key={selfStudyEvent.id}
                                  title={getEventTitle(selfStudyEvent)}
                                  bgColor={selfStudyEvent.bgColor}
                                  textColor={selfStudyEvent.textColor}
                                  clickable={!!onEventClick || (exchangeMode && !getEventDisabled(selfStudyEvent))}
                                  isSelected={exchangeMode && selectedMyEvent?.id === selfStudyEvent.id}
                                  isDisabled={getEventDisabled(selfStudyEvent)}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const isDisabled = getEventDisabled(selfStudyEvent)
                                    if (!isDisabled) {
                                      handleEventClick(selfStudyEvent, (e.currentTarget as HTMLElement).getBoundingClientRect())
                                    }
                                    if (onEventClick) {
                                      e.stopPropagation()
                                      onEventClick(selfStudyEvent, (e.currentTarget as HTMLElement).getBoundingClientRect())
                                    }
                                  }}
                                >
                                  {selfStudyEvent.label}
                                </S.MobileThirdTag>
                              ) : (
                                <S.MobileThirdPlaceholder />
                              )}

                              {leaveSeatEvent ? (
                                <S.MobileThirdTag
                                  key={leaveSeatEvent.id}
                                  title={getEventTitle(leaveSeatEvent)}
                                  bgColor={leaveSeatEvent.bgColor}
                                  textColor={leaveSeatEvent.textColor}
                                  clickable={!!onEventClick || (exchangeMode && !getEventDisabled(leaveSeatEvent))}
                                  isSelected={exchangeMode && selectedMyEvent?.id === leaveSeatEvent.id}
                                  isDisabled={getEventDisabled(leaveSeatEvent)}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const isDisabled = getEventDisabled(leaveSeatEvent)
                                    if (!isDisabled) {
                                      handleEventClick(leaveSeatEvent, (e.currentTarget as HTMLElement).getBoundingClientRect())
                                    }
                                    if (onEventClick) {
                                      e.stopPropagation()
                                      onEventClick(leaveSeatEvent, (e.currentTarget as HTMLElement).getBoundingClientRect())
                                    }
                                  }}
                                >
                                  {leaveSeatEvent.label}
                                </S.MobileThirdTag>
                              ) : (
                                <S.MobileThirdPlaceholder />
                              )}
                            </S.MobileTripleRow>
                          </S.MobileEventGroup>
                        </>
                      )
                    })()}
                  </S.EventList>
                </S.DayCell>
              )
            })}
            {rangeEventRows.map(({ event, startIndex, span, row, showLabel }, idx) => (
              <S.RangeEventOverlay key={`${event.id}-${row}-${idx}`} bgColor={event.bgColor} textColor={event.textColor} startCol={startIndex} span={span} row={row}>
                {showLabel && event.label}
              </S.RangeEventOverlay>
            ))}
          </S.DaysGrid>
        </S.DaysGridWrapper>
      </S.CalendarGrid>
      {showMobilePopover && selectedDay && popoverPosition && (
        <S.MobilePopover
          ref={popoverRef}
          style={{ top: popoverPosition.top, left: popoverPosition.left, width: popoverPosition.width }}
          placement={popoverPosition.placement}
        >
          <S.MobilePopoverPointer
            placement={popoverPosition.placement}
            style={{ left: popoverPosition.pointerLeft }}
          />
          <S.MobilePopoverHeader>
            <S.MobilePopoverTitle>{formatShortDate(selectedDay.date)}</S.MobilePopoverTitle>
          </S.MobilePopoverHeader>
          {selectedDay.events.length > 0 || selectedDay.rangeEvents.length > 0 ? (
            <S.MobilePopoverList>
              {selectedDay.events.map((event) => (
                <S.MobilePopoverItem key={`event-${event.id}`}>
                  <S.MobilePopoverTag bgColor={event.bgColor} textColor={event.textColor}>
                    {event.label}
                  </S.MobilePopoverTag>
                </S.MobilePopoverItem>
              ))}
              {selectedDay.rangeEvents.map((event) => (
                <S.MobilePopoverItem key={`range-${event.id}`}>
                  <S.MobilePopoverTag bgColor={event.bgColor} textColor={event.textColor}>
                    {event.label}
                  </S.MobilePopoverTag>
                </S.MobilePopoverItem>
              ))}
            </S.MobilePopoverList>
          ) : (
            <S.MobilePopoverEmpty>일정이 없습니다.</S.MobilePopoverEmpty>
          )}
        </S.MobilePopover>
      )}
    </S.CalendarContainer>
  )
}
