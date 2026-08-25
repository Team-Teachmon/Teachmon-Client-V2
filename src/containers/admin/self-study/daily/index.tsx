import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Calendar from '@/components/ui/calendar';
import type { CalendarRangeEvent, CalendarEvent } from '@/components/ui/calendar';
import Button from '@/components/ui/button';
import Loading from '@/components/ui/loading';
import { colors } from '@/styles/theme';
import type { SelfStudySchedule, Grade } from '@/types/selfStudy';
import { selfStudyQuery } from '@/services/admin/selfStudy/adminSelfStudy.query';
import { createAdditionalSelfStudy, deleteAdditionalSelfStudy } from '@/services/admin/selfStudy/adminSelfStudy.api';
import { getDatesInRange, getGradeColor, formatGrade, formatPeriods, PERIOD_ENUM_TO_LABEL, PERIOD_LABEL_TO_ENUM } from '@/utils/selfStudy';
import { getCalendarRange } from '@/utils/calendar';
import SidePanel from './side-panel';
import DetailModal from './detail-modal';
import * as S from './style';

export default function DailySection() {
  type NumberGrade = Exclude<Grade, 'all'>;
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedGrades, setSelectedGrades] = useState<NumberGrade[]>([2]);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<SelfStudySchedule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 지정된 달이 아니라 달력에 표시되는 날짜 범위를 기준으로 조회 (연말/연초에는 두 해에 걸친다)
  const visibleYears = useMemo(() => {
    const { start, end } = getCalendarRange(selectedYear, selectedMonth);
    return Array.from(new Set([start.getFullYear(), end.getFullYear()]));
  }, [selectedYear, selectedMonth]);

  const firstYearQuery = useQuery(selfStudyQuery.additional(visibleYears[0]));
  const secondYearQuery = useQuery(selfStudyQuery.additional(visibleYears[1] ?? visibleYears[0]));

  const rawData = useMemo(
    () =>
      visibleYears.length > 1
        ? [...(firstYearQuery.data ?? []), ...(secondYearQuery.data ?? [])]
        : firstYearQuery.data,
    [firstYearQuery.data, secondYearQuery.data, visibleYears],
  );
  const isLoading = firstYearQuery.isLoading || (visibleYears.length > 1 && secondYearQuery.isLoading);
  const queryClient = useQueryClient();

  const schedules: SelfStudySchedule[] = useMemo(() => {
    if (!rawData) return [];
    const groupedByDate: Record<
      string,
      Record<
        number,
        {
          periods: string[];
          periodIds: Record<string, number>;
        }
      >
    > = {};

    rawData.forEach((item) => {
      const date = item.day;
      const grade = item.grade as number;

      if (!groupedByDate[date]) {
        groupedByDate[date] = {};
      }

      if (!groupedByDate[date][grade]) {
        groupedByDate[date][grade] = {
          periods: [],
          periodIds: {},
        };
      }

      item.periods.forEach((p) => {
        const periodLabel = PERIOD_ENUM_TO_LABEL[p.period] ?? p.period;
        if (!groupedByDate[date][grade].periods.includes(periodLabel)) {
          groupedByDate[date][grade].periods.push(periodLabel);
        }
        groupedByDate[date][grade].periodIds[periodLabel] = p.id;
      });
    });

    const result: SelfStudySchedule[] = [];

    Object.entries(groupedByDate).forEach(([date, gradeMap]) => {
      const dateObj = new Date(date);
      const gradeNumbers = Object.keys(gradeMap)
        .map((g) => Number(g))
        .sort();

      const hasAllGrades =
        gradeNumbers.length === 3 &&
        gradeNumbers.every((g) => [1, 2, 3].includes(g));
      if (hasAllGrades) {
        const allPeriodsSet = new Set<string>();
        const periodIds: Record<string, number> = {};

        gradeNumbers.forEach((g) => {
          gradeMap[g].periods.forEach((period) => {
            allPeriodsSet.add(period);
            periodIds[period] = gradeMap[g].periodIds[period];
          });
        });

        const sortedPeriods = Array.from(allPeriodsSet).sort(
          (a, b) => parseInt(a) - parseInt(b),
        );

        result.push({
          id: `additional-${date}-all`,
          date: dateObj,
          grade: 'all',
          periods: sortedPeriods,
          periodIds,
          startDate: dateObj,
          endDate: dateObj,
        });
      } else {
        gradeNumbers.forEach((g) => {
          const data = gradeMap[g];
          const sortedPeriods = [...data.periods].sort(
            (a, b) => parseInt(a) - parseInt(b),
          );

          result.push({
            id: `additional-${date}-${g}`,
            date: dateObj,
            grade: g as Grade,
            periods: sortedPeriods,
            periodIds: data.periodIds,
            startDate: dateObj,
            endDate: dateObj,
          });
        });
      }
    });

    return result;
  }, [rawData]);

  const handleMonthChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const handleDateClick = (date: Date, dayInfo?: { isCurrentMonth: boolean }) => {
    if (!dayInfo?.isCurrentMonth) return;
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return;
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else {
      if (date < startDate) {
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    const schedule = schedules.find(s => s.id === event.id);
    if (schedule) {
      setSelectedSchedule(schedule);
      setIsModalOpen(true);
    }
  };

  const handlePeriodToggle = (period: string) => {
    setSelectedPeriods(prev => 
      prev.includes(period) 
        ? prev.filter(p => p !== period)
        : [...prev, period]
    );
  };

  const handleComplete = () => {
    if (!startDate || !endDate || selectedPeriods.length === 0) {
      return;
    }

    const periodEnums = selectedPeriods
      .map((p) => PERIOD_LABEL_TO_ENUM[p])
      .filter(Boolean);

    if (periodEnums.length === 0) {
      toast.error('유효한 교시를 선택해주세요.');
      return;
    }

    const datesInRange = getDatesInRange(startDate, endDate);

    if (selectedGrades.length === 0) {
      toast.error('학년을 선택해주세요.');
      return;
    }

    const promises: Promise<unknown>[] = [];

    selectedGrades.forEach((grade) => {
      datesInRange.forEach((date) => {
        const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
          date.getDate(),
        ).padStart(2, '0')}`;

        promises.push(
          createAdditionalSelfStudy({
            day,
            grade,
            periods: periodEnums,
          }),
        );
      });
    });

    Promise.all(promises)
      .then(() => {
        toast.success('일별 자습을 추가 설정하였습니다.');
        visibleYears.forEach((year) =>
          queryClient.invalidateQueries({ queryKey: ['selfStudy.additional', year] }),
        );
        setStartDate(null);
        setEndDate(null);
        setSelectedPeriods([]);
      })
      .catch(() => {
        toast.error('일별 자습 추가 설정에 실패했습니다.');
      });
  };

  const handleCancelSelection = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedPeriods([]);
  };

  const handleDeleteSchedule = (id: string) => {
    const schedule = schedules.find((s) => s.id === id);
    if (!schedule) return;

    const idParts = schedule.id.split('-');
    const date = `${idParts[1]}-${idParts[2]}-${idParts[3]}`;
    const deleteIds: number[] = [];
    rawData?.forEach((item) => {
      if (item.day === date) {
        item.periods.forEach((p) => {
          deleteIds.push(p.id);
        });
      }
    });

    if (deleteIds.length === 0) return;

    Promise.all(deleteIds.map((pid) => deleteAdditionalSelfStudy(pid)))
      .then(() => {
        toast.success('일별 자습을 삭제하였습니다.');
        visibleYears.forEach((year) =>
          queryClient.invalidateQueries({ queryKey: ['selfStudy.additional', year] }),
        );
      })
      .catch(() => {
        toast.error('일별 자습 삭제에 실패했습니다.');
      });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSchedule(null);
  };

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return schedules.map(schedule => {
      const { bgColor, textColor } = getGradeColor(schedule.grade);
      const periodsText = formatPeriods(schedule.periods);
      
      return {
        id: schedule.id,
        date: schedule.date,
        label: `${formatGrade(schedule.grade)} ${periodsText}`,
        bgColor,
        textColor,
      };
    });
  }, [schedules]);

  const dateRangeEvents: CalendarRangeEvent[] = useMemo(() => {
    const events = [];

    if (startDate) {
      if (!endDate) {
        events.push({
          id: 'selected-start',
          startDate,
          endDate: startDate,
          label: '',
          bgColor: colors.primaryBackground,
          textColor: 'transparent',
        });
      } else {
        events.push({
          id: 'selected-range',
          startDate,
          endDate,
          label: '',
          bgColor: colors.primaryBackground,
          textColor: 'transparent',
        });
      }
    }

    return events;
  }, [startDate, endDate]);

  const showPanel = startDate && endDate;

  if (isLoading) return <Loading />;

  return (
    <S.Container>
      <S.CalendarWrapper>
        <S.HeaderRow>
          {/* Date selection guidance */}
          {!startDate && (
            <S.GuidanceMessage>
              자습을 추가할 시작날을 선택해주세요
            </S.GuidanceMessage>
          )}
          {startDate && !endDate && (
            <S.GuidanceMessage>
              자습을 추가할 마지막날을 선택해주세요
            </S.GuidanceMessage>
          )}
          
          {startDate && (
            <S.CancelButtonWrapper>
              <Button
                text="취소하기"
                variant="confirm"
                onClick={handleCancelSelection}
              />
            </S.CancelButtonWrapper>
          )}
          
          {/* Empty div to maintain space when guidance is not shown */}
          {startDate && endDate && <div />}
        </S.HeaderRow>
        
        <Calendar
          year={selectedYear}
          month={selectedMonth}
          onMonthChange={handleMonthChange}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
          events={calendarEvents}
          rangeEvents={dateRangeEvents}
          showYear={true}
          showLegend={false}
        />
      </S.CalendarWrapper>

      {showPanel && (
        <SidePanel
          selectedGrades={selectedGrades}
          onGradesChange={setSelectedGrades}
          selectedPeriods={selectedPeriods}
          onPeriodToggle={handlePeriodToggle}
          onComplete={handleComplete}
        />
      )}

      <DetailModal
        isOpen={isModalOpen}
        schedule={selectedSchedule}
        onClose={handleCloseModal}
        onDelete={handleDeleteSchedule}
      />
    </S.Container>
  );
}
