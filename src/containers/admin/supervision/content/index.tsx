import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { eachDayOfInterval } from 'date-fns';
import Calendar from '@/components/ui/calendar';
import Button from '@/components/ui/button';
import Dropdown from '@/components/ui/input/dropdown';
import SearchDropdown from '@/components/ui/input/dropdown/search';
import TextInput from '@/components/ui/input/text-input';
import type { CalendarEvent, DayInfo } from '@/types/calendar';
import type { SupervisionCount } from '@/types/admin';
import { SUPERVISION_LABEL_TO_TYPE, SUPERVISION_TYPE_LABELS, SUPERVISION_TYPE_STYLES, type AdminSupervisionType } from '@/constants/adminSupervision';
import { getApiErrorMessage } from '@/utils/error';
import { getCalendarRange } from '@/utils/calendar';
import { useDebounce } from '@/hooks/useDebounce';
import { useSupervisionCalendarEvents } from '@/hooks/useSupervisionCalendarEvents';
import { useAdminSupervisionQuery, useSupervisionRankQuery, useTeacherSearchQuery } from '@/services/admin/supervision/adminSupervision.query';
import {
  useCreateSupervisionScheduleMutation,
  useDeleteSupervisionScheduleMutation,
  useUpdateSupervisionScheduleMutation,
} from '@/services/admin/supervision/adminSupervision.mutation';
import {
  getAvailableTypeLabels,
  getAvailableTypesForDate,
  getEditorAnchor,
  getEventType,
  isSameDay,
} from './utils';
import * as S from './style';
import { LEGENDS } from '@/constants/supervision';

type ViewMode = 'default' | 'edit';
type SortOrder = 'asc' | 'desc';

interface AdminSupervisionContentProps {
  viewMode: ViewMode;
  isCountOpen: boolean;
  onCountOpenChange: (open: boolean) => void;
}

interface TeacherOption {
  id: number;
  label: string;
}

export interface AdminSupervisionContentHandle {
  saveChanges: () => Promise<void>;
}

const formatDay = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type Assignment = {
  selfStudyTeacherId: number | null;
  leaveSeatTeacherId: number | null;
  seventhPeriodTeacherId: number | null;
};

const EMPTY_ASSIGNMENT: Assignment = {
  selfStudyTeacherId: null,
  leaveSeatTeacherId: null,
  seventhPeriodTeacherId: null,
};

const groupEventsByDay = (events: CalendarEvent[]): Record<string, CalendarEvent[]> => {
  const grouped: Record<string, CalendarEvent[]> = {};
  events.forEach((event) => {
    const day = formatDay(event.date);
    grouped[day] = [...(grouped[day] ?? []), event];
  });
  return grouped;
};

const isSameTeacherAssignment = (a: Assignment, b: Assignment) =>
  a.selfStudyTeacherId === b.selfStudyTeacherId &&
  a.leaveSeatTeacherId === b.leaveSeatTeacherId &&
  a.seventhPeriodTeacherId === b.seventhPeriodTeacherId;

const hasAnyAssignment = (assignment: Assignment) =>
  assignment.selfStudyTeacherId !== null ||
  assignment.leaveSeatTeacherId !== null ||
  assignment.seventhPeriodTeacherId !== null;

const getAssignmentForDay = (events: CalendarEvent[]): Assignment => {
  const assignment: Assignment = { ...EMPTY_ASSIGNMENT };

  events.forEach((event) => {
    const type = getEventType(event);
    if (!type) return;
    const teacherId = event.teacherId ?? null;
    if (type === 'self_study') {
      assignment.selfStudyTeacherId = teacherId;
    } else if (type === 'leave_seat') {
      assignment.leaveSeatTeacherId = teacherId;
    } else {
      assignment.seventhPeriodTeacherId = teacherId;
    }
  });

  return assignment;
};

const AdminSupervisionContent = forwardRef<AdminSupervisionContentHandle, AdminSupervisionContentProps>(function AdminSupervisionContent(
  { viewMode, isCountOpen, onCountOpenChange },
  ref,
) {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherOption | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editAnchor, setEditAnchor] = useState<{ top: number; left: number } | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const debouncedRankQuery = useDebounce(searchQuery, 300);
  const debouncedTeacherSearchQuery = useDebounce(teacherSearchQuery, 300);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [draftEventsByDay, setDraftEventsByDay] = useState<Record<string, CalendarEvent[]>>({});
  const [baseEventsByDay, setBaseEventsByDay] = useState<Record<string, CalendarEvent[]>>({});

  const calendarWrapperRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const isEditMode = viewMode === 'edit';

  const { data: supervisionRanks, refetch: refetchSupervisionRanks } = useSupervisionRankQuery(
    debouncedRankQuery,
    sortOrder,
    false,
  );
  const { data: searchedTeachers, isFetching: isSearchingTeachers } = useTeacherSearchQuery(
    debouncedTeacherSearchQuery,
    isEditMode,
  );
  const createScheduleMutation = useCreateSupervisionScheduleMutation();
  const updateScheduleMutation = useUpdateSupervisionScheduleMutation();
  const deleteScheduleMutation = useDeleteSupervisionScheduleMutation();

  // 지정된 달이 아니라 달력에 표시되는 날짜 범위를 기준으로 조회
  const baseEvents = useSupervisionCalendarEvents(useAdminSupervisionQuery, year, month, '');

  const visibleDays = useMemo(() => {
    const { start, end } = getCalendarRange(year, month);
    return eachDayOfInterval({ start, end }).map(formatDay);
  }, [year, month]);

  useEffect(() => {
    const grouped = groupEventsByDay(baseEvents);
    setBaseEventsByDay((prev) => {
      const next = { ...prev };
      visibleDays.forEach((day) => {
        next[day] = grouped[day] ?? [];
      });
      return next;
    });
  }, [baseEvents, visibleDays]);

  useEffect(() => {
    if (isEditMode) {
      const grouped = groupEventsByDay(baseEvents);
      setEvents(visibleDays.flatMap((day) => draftEventsByDay[day] ?? grouped[day] ?? []));
      return;
    }

    setEvents(baseEvents);
  }, [baseEvents, draftEventsByDay, isEditMode, visibleDays]);

  const selectedEvent = selectedEventId ? events.find((event) => event.id === selectedEventId) ?? null : null;
  const selectedEventType = selectedEvent ? getEventType(selectedEvent) : null;
  const availableTypeLabels = getAvailableTypeLabels(events, selectedDate, selectedEventId);

  const teacherOptions = useMemo(() => {
    const optionMap = new Map<number, TeacherOption>();
    baseEvents.forEach((event) => {
      if (!event.teacherId) return;
      optionMap.set(event.teacherId, { id: event.teacherId, label: event.label });
    });
    return Array.from(optionMap.values());
  }, [baseEvents]);

  const filteredTeacherOptions = useMemo(() => {
    const trimmedQuery = debouncedTeacherSearchQuery.trim();

    if (!trimmedQuery) return teacherOptions;

    const remoteOptions = (searchedTeachers ?? []).map((teacher) => ({
      id: teacher.id,
      label: teacher.name,
    }));

    return remoteOptions;
  }, [debouncedTeacherSearchQuery, searchedTeachers, teacherOptions]);

  const filteredCounts = useMemo<SupervisionCount[]>(() => {
    return (supervisionRanks ?? []).map((item) => ({
      rank: item.rank,
      name: item.name,
      selfStudy: item.self_study_supervision_count,
      leaveSeat: item.leave_seat_supervision_count,
      seventhPeriod: item.seventh_period_supervision_count,
      total: item.total_supervision_count,
    }));
  }, [supervisionRanks]);

  const handleClearSelection = () => {
    setSelectedEventId(null);
    setSelectedTeacher(null);
    setSelectedType('');
    setSelectedDate(null);
    setEditAnchor(null);
    setTeacherSearchQuery('');
  };

  const handleMonthChange = (newYear: number, newMonth: number) => {
    if (newYear === year && newMonth === month) return;
    handleClearSelection();
    setYear(newYear);
    setMonth(newMonth);
  };

  const handleCloseCountPanel = () => {
    setIsClosing(true);
    setTimeout(() => {
      onCountOpenChange(false);
      setIsClosing(false);
    }, 300);
  };

  const handleEventClick = (event: CalendarEvent, anchorRect?: DOMRect) => {
    if (!isEditMode) return;
    const eventType = getEventType(event);
    if (!eventType) return;
    setSelectedEventId(event.id);
    setSelectedTeacher(event.teacherId ? { id: event.teacherId, label: event.label } : null);
    setSelectedType(eventType ? SUPERVISION_TYPE_LABELS[eventType] : '');
    setSelectedDate(event.date);
    setTeacherSearchQuery('');
    if (anchorRect) {
      setEditAnchor(getEditorAnchor(anchorRect));
    }
  };

  const handleDateClick = (date: Date, _dayInfo: DayInfo, anchorRect?: DOMRect) => {
    if (!isEditMode) return;
    const availableTypes = getAvailableTypesForDate(events, date);
    if (availableTypes.length === 0) {
      handleClearSelection();
      return;
    }
    setSelectedEventId(null);
    setSelectedTeacher(null);
    setSelectedType('');
    setSelectedDate(date);
    setTeacherSearchQuery('');
    if (anchorRect) {
      setEditAnchor(getEditorAnchor(anchorRect));
    }
  };

  const handleTeacherSelect = (teacher: TeacherOption | undefined) => {
    setSelectedTeacher(teacher ?? null);
    setSelectedType('');
  };

  const syncDraft = (nextEvents: CalendarEvent[]) => {
    setEvents(nextEvents);
    const grouped = groupEventsByDay(nextEvents);
    setDraftEventsByDay((prev) => {
      const next = { ...prev };
      visibleDays.forEach((day) => {
        next[day] = grouped[day] ?? [];
      });
      return next;
    });
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    if (!selectedTeacher || !selectedDate || !selectedTeacher.id) return;

    const selectedTypeValue = SUPERVISION_LABEL_TO_TYPE[type];
    if (!selectedTypeValue) return;

    const style = SUPERVISION_TYPE_STYLES[selectedTypeValue];

    if (selectedEventId) {
      const otherEvent = events.find(
        (event) =>
          event.id !== selectedEventId &&
          isSameDay(event.date, selectedDate) &&
          getEventType(event) === selectedTypeValue
      );

      const nextEvents = events.map((event) => {
        if (event.id === selectedEventId) {
          return {
            ...event,
            label: selectedTeacher.label,
            teacherId: selectedTeacher.id,
            bgColor: style.bgColor,
            textColor: style.textColor,
            supervisionType: selectedTypeValue,
          };
        }

        if (otherEvent && event.id === otherEvent.id) {
          const fallbackType: AdminSupervisionType = selectedEventType ?? 'self_study';
          const fallbackStyle = SUPERVISION_TYPE_STYLES[fallbackType];
          return {
            ...event,
            bgColor: fallbackStyle.bgColor,
            textColor: fallbackStyle.textColor,
            supervisionType: fallbackType,
          };
        }

        return event;
      });

      syncDraft(nextEvents);
    } else {
      const availableTypes = getAvailableTypesForDate(events, selectedDate, null);
      if (!availableTypes.includes(selectedTypeValue)) return;

      const nextId = `${selectedDate.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
      const nextEvents = [
        ...events,
        {
          id: nextId,
          date: selectedDate,
          label: selectedTeacher.label,
          teacherId: selectedTeacher.id,
          bgColor: style.bgColor,
          textColor: style.textColor,
          supervisionType: selectedTypeValue,
        },
      ];

      syncDraft(nextEvents);
    }

    handleClearSelection();
  };

  const handleDeleteSelected = () => {
    if (!selectedEventId) return;

    const nextEvents = events.filter((event) => event.id !== selectedEventId);
    syncDraft(nextEvents);
    handleClearSelection();
  };

  const saveChanges = useCallback(async () => {
    const currentByDay = groupEventsByDay(events);
    const draftSnapshot: Record<string, CalendarEvent[]> = { ...draftEventsByDay };
    visibleDays.forEach((day) => {
      draftSnapshot[day] = currentByDay[day] ?? [];
    });

    for (const day of Object.keys(draftSnapshot)) {
      const before = getAssignmentForDay(baseEventsByDay[day] ?? []);
      const after = getAssignmentForDay(draftSnapshot[day] ?? []);

      if (isSameTeacherAssignment(before, after)) continue;

      if (!hasAnyAssignment(before) && hasAnyAssignment(after)) {
        try {
          await createScheduleMutation.mutateAsync({
            day,
            self_study_supervision_teacher_id: after.selfStudyTeacherId,
            leave_seat_supervision_teacher_id: after.leaveSeatTeacherId,
            seventh_period_supervision_teacher_id: after.seventhPeriodTeacherId,
          });
        } catch (error) {
          const errorMessage = getApiErrorMessage(error);
          if (errorMessage.includes('필수입니다')) {
            const missingFields: string[] = [];
            if (errorMessage.includes('이석')) missingFields.push('이석 감독 교사');
            if (errorMessage.includes('자습')) missingFields.push('자습 감독 교사');
            if (errorMessage.includes('7교시')) missingFields.push('7교시 감독 교사');
            throw new Error(`${day} 날짜의 ${missingFields.join(', ')}를 설정해주세요.`);
          }
          throw error;
        }
        continue;
      }

      if (hasAnyAssignment(before) && !hasAnyAssignment(after)) {
        await deleteScheduleMutation.mutateAsync({
          day,
          type: 'all',
        });
        continue;
      }

      try {
        await updateScheduleMutation.mutateAsync({
          day,
          self_study_supervision_teacher_id: after.selfStudyTeacherId,
          leave_seat_supervision_teacher_id: after.leaveSeatTeacherId,
          seventh_period_supervision_teacher_id: after.seventhPeriodTeacherId,
        });
      } catch (error) {
        const errorMessage = getApiErrorMessage(error);
        if (errorMessage.includes('필수입니다')) {
          const missingFields: string[] = [];
          if (errorMessage.includes('이석')) missingFields.push('이석 감독 교사');
          if (errorMessage.includes('자습')) missingFields.push('자습 감독 교사');
          if (errorMessage.includes('7교시')) missingFields.push('7교시 감독 교사');
          throw new Error(`${day} 날짜의 ${missingFields.join(', ')}를 설정해주세요.`);
        }
        throw error;
      }
    }

    setDraftEventsByDay({});
  }, [baseEventsByDay, createScheduleMutation, deleteScheduleMutation, draftEventsByDay, events, updateScheduleMutation, visibleDays]);

  useImperativeHandle(ref, () => ({
    saveChanges,
  }), [saveChanges]);

  useEffect(() => {
    if (!isEditMode) {
      handleClearSelection();
      setDraftEventsByDay({});
    }
    if (!isCountOpen) {
      setIsClosing(false);
    }
  }, [isCountOpen, isEditMode]);

  useEffect(() => {
    if (!isCountOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCountOpen]);

  useEffect(() => {
    if (!isCountOpen) return;
    void refetchSupervisionRanks();
  }, [debouncedRankQuery, isCountOpen, refetchSupervisionRanks, sortOrder]);

  useEffect(() => {
    if (!isEditMode) return;
    if (!editAnchor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClearSelection();
      }
    };

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (editorRef.current && editorRef.current.contains(target)) return;
      handleClearSelection();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isEditMode, editAnchor]);

  return (
    <S.ContentWrapper>
      {isCountOpen && (
        <S.SidePanel $isClosing={isClosing}>
          <S.SidePanelHeader>
            <S.CloseButton onClick={handleCloseCountPanel}>
              <img src="/icons/common/x.svg" alt="닫기" />
            </S.CloseButton>
          </S.SidePanelHeader>
          <S.SearchContainer>
            <S.SearchInputWrapper>
              <TextInput
                type="text"
                placeholder="선생님을 입력해주세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                customHeight="40px"
                customPadding="0 12px"
              />
            </S.SearchInputWrapper>
            <S.SortButtons>
              <S.SortButton $active={sortOrder === 'desc'} onClick={() => setSortOrder('desc')}>
                내림차순
              </S.SortButton>
              <S.SortButton $active={sortOrder === 'asc'} onClick={() => setSortOrder('asc')}>
                오름차순
              </S.SortButton>
            </S.SortButtons>
          </S.SearchContainer>
          <S.TableHeader>
            <S.TableCell $width="44px">순위</S.TableCell>
            <S.TableCell $width="68px">이름</S.TableCell>
            <S.TableCell $width="52px">자습</S.TableCell>
            <S.TableCell $width="52px">이석</S.TableCell>
            <S.TableCell $width="52px">7교시</S.TableCell>
            <S.TableCell $width="46px">합계</S.TableCell>
          </S.TableHeader>
          <S.TableBody>
            {filteredCounts.map((item, index) => (
              <S.TableRow key={index}>
                <S.TableCell $width="44px">{item.rank}위</S.TableCell>
                <S.TableCell $width="68px">{item.name}</S.TableCell>
                <S.TableCell $width="52px">{item.selfStudy}회</S.TableCell>
                <S.TableCell $width="52px">{item.leaveSeat}회</S.TableCell>
                <S.TableCell $width="52px">{item.seventhPeriod}회</S.TableCell>
                <S.TableCell $width="46px">{item.total}회</S.TableCell>
              </S.TableRow>
            ))}
          </S.TableBody>
        </S.SidePanel>
      )}

      <S.CalendarWrapper $hasSidePanel={isCountOpen} ref={calendarWrapperRef}>
        <Calendar
          year={year}
          month={month}
          onMonthChange={handleMonthChange}
          events={events}
          showYear={true}
          showLegend={true}
          legends={LEGENDS}
          showMobilePopover={viewMode !== 'edit'}
          onEventClick={viewMode === 'edit' ? handleEventClick : undefined}
          onDateClick={viewMode === 'edit' ? handleDateClick : undefined}
        />
        {isEditMode && editAnchor && (
          <S.FloatingEditor ref={editorRef} $top={editAnchor.top} $left={editAnchor.left}>
            <SearchDropdown
              placeholder="이름을 입력해주세요"
              searchPlaceholder="선생님 검색"
              items={filteredTeacherOptions}
              value={selectedTeacher ?? undefined}
              onChange={handleTeacherSelect}
              searchQuery={teacherSearchQuery}
              onSearchChange={setTeacherSearchQuery}
              renderItem={(item) => item.label}
              getItemKey={(item) => item.id}
              customWidth="100%"
              noResultText={isSearchingTeachers ? '검색 중입니다...' : '검색 결과가 없습니다'}
            />
            <S.EnterHint>엔터를 치면 입력됩니다</S.EnterHint>
            <S.EditTitle>자습/이석 선택</S.EditTitle>
            <Dropdown
              placeholder="감독 타입 선택"
              items={availableTypeLabels}
              value={selectedType}
              onChange={handleTypeSelect}
              customWidth="100%"
              disabled={!selectedTeacher?.id}
            />
            {selectedEventId && (
              <Button
                variant="delete"
                text="선택 삭제"
                width="100%"
                onClick={handleDeleteSelected}
              />
            )}
          </S.FloatingEditor>
        )}
      </S.CalendarWrapper>
    </S.ContentWrapper>
  );
});

export default AdminSupervisionContent;
