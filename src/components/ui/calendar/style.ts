import styled from '@emotion/styled'
import { colors, radius } from '@/styles/theme'
import { fadeIn } from '@/styles/animations'
import { mq } from '@/styles/media'

export const CalendarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  height: 100%;
  flex: 1;
  user-select: none;
  position: relative;

  ${mq.mobile} {
    gap: 8px;
  }
`

export const YearTitle = styled.h2`
  font-family: 'Paperlogy', sans-serif;
  font-weight: 400;
  font-size: 18px;
  color: ${colors.n04};
  text-align: center;
  margin: 0;

  ${mq.mobile} {
    font-size: 20px;
  }
`

export const HeaderRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 10px;
  width: 100%;
  position: relative;

  ${mq.mobile} {
    flex-direction: column;
    gap: 8px;
  }
`

export const MonthNavigation = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
  justify-content: center;

  ${mq.mobile} {
    gap: 16px;
    width: 100%;
    justify-content: center;
  }
`

export const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;

  ${mq.mobile} {
    padding: 4px;
  }

  &:hover {
    opacity: 0.7;
  }
`

export const ArrowIcon = styled.img`
  width: 24px;
  height: 24px;

  ${mq.mobile} {
    width: 20px;
    height: 20px;
  }
`

export const MonthText = styled.span<{ isActive: boolean }>`
  font-family: 'Paperlogy', sans-serif;
  font-weight: ${({ isActive }) => (isActive ? 600 : 500)};
  font-size: ${({ isActive }) => (isActive ? '28px' : '20px')};
  color: ${({ isActive }) => (isActive ? colors.primary : '#6C757D')};
  letter-spacing: ${({ isActive }) => (isActive ? '1.4px' : '1px')};
  white-space: nowrap;
  cursor: ${({ isActive }) => (isActive ? 'default' : 'pointer')};
  animation: ${fadeIn} 0.2s ease-out;

  &:hover {
    opacity: ${({ isActive }) => (isActive ? 1 : 0.7)};
  }

  ${mq.mobile} {
    font-size: ${({ isActive }) => (isActive ? '22px' : '16px')};
    letter-spacing: ${({ isActive }) => (isActive ? '1px' : '0.5px')};
  }
`

export const LegendContainer = styled.div`
  position: absolute;
  right: 0;
  display: flex;
  gap: 13px;
  align-items: center;

  ${mq.mobile} {
    position: static;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
`

export const LegendTag = styled.span<{ bgColor: string; textColor: string }>`
  padding: 4px 8px;
  border-radius: ${radius.sm};
  font-family: 'Paperlogy', sans-serif;
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
  background: ${({ bgColor }) => bgColor};
  color: ${({ textColor }) => textColor};

  ${mq.mobile} {
    font-size: 12px;
    padding: 3px 6px;
  }
`

export const CalendarGrid = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.12);

  ${mq.mobile} {
    box-shadow: none;
  }
`

export const MobilePopover = styled.div<{ placement: 'top' | 'bottom' }>`
  display: none;

  ${mq.mobile} {
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: absolute;
    width: 200px;
    padding: 8px 10px 10px;
    background: ${colors.n01};
    border-radius: ${radius.lg};
    border: 1px solid #E8E8E8;
    box-shadow: 0 0.5rem 1.25rem rgba(0, 0, 0, 0.12);
    transform: ${({ placement }) => (placement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)')};
    z-index: 5;
  }
`

export const MobilePopoverPointer = styled.span<{ placement: 'top' | 'bottom' }>`
  display: none;

  ${mq.mobile} {
    display: block;
    position: absolute;
    left: 50%;
    ${({ placement }) => (placement === 'top' ? 'bottom: -0.45rem;' : 'top: -0.45rem;')}
    width: 0.9rem;
    height: 0.9rem;
    background: ${colors.n01};
    transform: translateX(-50%) rotate(45deg);
  }
`

export const MobilePopoverHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export const MobilePopoverTitle = styled.span`
  font-family: 'Paperlogy', sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: ${colors.n04};
`


export const MobilePopoverList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
`

export const MobilePopoverItem = styled.li`
  display: flex;
  align-items: center;
  gap: 6px;
`

export const MobilePopoverTag = styled.span<{ bgColor: string; textColor: string }>`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 4px 8px;
  border-radius: ${radius.sm};
  font-family: 'Paperlogy', sans-serif;
  font-weight: 500;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: ${({ bgColor }) => bgColor};
  color: ${({ textColor }) => textColor};
`

export const MobilePopoverEmpty = styled.span`
  font-family: 'Paperlogy', sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: ${colors.n03};
`

export const WeekHeader = styled.div`
  display: flex;
  background: #FAFAFA;
`

export const WeekDay = styled.div<{
  dayType: 'sunday' | 'saturday' | 'weekday'
}>`
  flex: 1;
  padding: 10px;
  background: ${colors.background};
  border: 1px solid #E8E8E8;
  font-weight: 500;
  font-size: 16px;

  color: ${({ dayType }) => {
    switch (dayType) {
      case 'sunday':
        return '#FF5656'
      case 'saturday':
        return '#5751FF'
      default:
        return '#969696'
    }
  }};

  ${mq.mobile} {
    padding: 6px 4px;
    font-size: 12px;
  }
`

export const DaysGridWrapper = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`

export const DaysGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  flex: 1;
  position: relative;
  --calendar-rows: 5;
  --calendar-row-height: calc(100% / var(--calendar-rows));

  ${mq.mobile} {
    --calendar-row-height: 6.8rem;
    height: calc(var(--calendar-rows) * var(--calendar-row-height));
    flex: 0 0 auto;
  }
`

export const DayCell = styled.div<{ isSelected?: boolean; isInteractive?: boolean }>`
  display: flex;
  flex-direction: column;
  width: calc(100% / 7);
  height: var(--calendar-row-height);
  padding: 10px;
  background: ${({ isSelected }) => (isSelected ? 'rgba(0, 133, 255, 0.1)' : colors.background)};
  border: 1px solid #E8E8E8;
  cursor: ${({ isInteractive }) => (isInteractive ? 'pointer' : 'default')};
  transition: background 0.15s;
  position: relative;
  z-index: 1;

  &:hover {
    background: ${({ isSelected, isInteractive }) => {
    if (!isInteractive) {
      return isSelected ? 'rgba(0, 133, 255, 0.1)' : colors.background
    }
    return isSelected ? 'rgba(0, 133, 255, 0.15)' : '#FAFAFA'
  }};
  }

  ${mq.mobile} {
    padding: 6px;
  }
`

export const DayNumber = styled.span<{
  dayType: 'sunday' | 'saturday' | 'weekday'
}>`
  font-family: 'Paperlogy', sans-serif;
  font-weight: 500;
  font-size: 18px;

  color: ${({ dayType }) => {
    switch (dayType) {
      case 'sunday':
        return '#FF5656'
      case 'saturday':
        return '#5751FF'
      default:
        return '#000000'
    }
  }};

  ${mq.mobile} {
    font-size: 12px;
  }
`

export const EventList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  max-height: 100%;

  ${mq.mobile} {
    overflow: hidden;
    gap: 1px;
  }
`

export const EventTag = styled.span<{ bgColor: string; textColor: string; clickable?: boolean; isSelected?: boolean; isDisabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 24px;
  padding: 4px 8px;
  border-radius: ${radius.sm};
  font-family: 'Paperlogy', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: ${({ bgColor }) => bgColor};
  color: ${({ textColor }) => textColor};
  cursor: ${({ clickable, isDisabled }) => (isDisabled ? 'not-allowed' : clickable ? 'pointer' : 'default')};
  transition: all 0.15s;
  border: ${({ isSelected, textColor }) => (isSelected ? `2px solid ${textColor}` : '2px solid transparent')};
  box-sizing: border-box;
  opacity: ${({ isDisabled }) => (isDisabled ? 0.4 : 1)};
  filter: ${({ isDisabled }) => (isDisabled ? 'grayscale(100%)' : 'none')};
  pointer-events: ${({ isDisabled }) => (isDisabled ? 'none' : 'auto')};

  &:hover {
    opacity: ${({ clickable, isDisabled }) => (isDisabled ? 0.4 : clickable ? 0.8 : 1)};
  }

  ${mq.mobile} {
    min-height: 0;
    padding: 2px 5px;
    font-size: 10px;
  }
`

export const EventSplitRow = styled.div`
  display: flex;
  gap: 4px;
  width: 100%;
`

export const EventHalfTag = styled(EventTag)`
  flex: 1;
  min-width: 0;
`

export const EventPlaceholder = styled.span`
  flex: 1;
  min-width: 0;
`

export const DesktopEventGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  ${mq.mobile} {
    display: none;
  }
`

export const MobileEventGroup = styled.div`
  display: none;

  ${mq.mobile} {
    display: block;
    width: 100%;
  }
`

export const MobileTripleRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 2px;
  width: 100%;
`

export const MobileThirdTag = styled(EventTag)`
  min-height: 0;
  width: 100%;
  padding: 2px 4px;
  font-size: 9px;
`

export const MobileThirdPlaceholder = styled.span`
  width: 100%;
  min-height: 16px;
`

export const RangeEventOverlay = styled.div<{
  bgColor: string
  textColor: string
  startCol: number
  span: number
  row: number
}>`
  position: absolute;
  left: calc(${({ startCol }) => startCol} * (100% / 7));
  top: calc(${({ row }) => row} * var(--calendar-row-height));
  width: calc(${({ span }) => span} * (100% / 7));
  height: var(--calendar-row-height);
  background: ${({ bgColor }) => bgColor};
  color: ${({ textColor }) => textColor};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 14px;
  pointer-events: none;
  z-index: 2;

  ${mq.mobile} {
    font-size: 11px;
  }
`
