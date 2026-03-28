import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as S from './style';
import type { AllAfterSchool, AfterSchoolSearchParams } from '@/types/after-school';
import { DAYS, ITEMS_PER_PAGE, DAY_TO_ENGLISH } from '@/constants/after-school';
import { afterSchoolQuery } from '@/services/after-school/afterSchool.query';
import AfterSchoolDetailModal from '@/containers/after-school/detail-modal';
import { API_WEEKDAY_TO_UI } from '@/utils/afterSchool';
import Dropdown from '@/components/ui/input/dropdown';

type Quarter = 1 | 2 | 3 | 4;

const QUARTER_OPTIONS: Quarter[] = [1, 2, 3, 4];

const getInitialDay = () => {
  const today = new Date().getDay();
  if (today === 0 || today === 5 || today === 6) return 0;
  return today - 1;
};

export default function AllClassSection() {
  const navigate = useNavigate();

  const [selectedGrade, setSelectedGrade] = useState<1 | 2 | 3>(() => {
    const saved = localStorage.getItem('afterSchoolGrade');
    return saved !== null ? Number(saved) as 1 | 2 | 3 : 1;
  });
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>(() => {
    const saved = sessionStorage.getItem('afterSchoolQuarter');
    return saved !== null ? Number(saved) as Quarter : 1;
  });
  const [selectedDay, setSelectedDay] = useState(() => {
    const saved = localStorage.getItem('afterSchoolDay');
    return saved !== null ? Number(saved) : getInitialDay()
  });
  useEffect(() => { localStorage.setItem('afterSchoolGrade', selectedGrade.toString()) }, [selectedGrade]);
  useEffect(() => { sessionStorage.setItem('afterSchoolQuarter', selectedQuarter.toString()) }, [selectedQuarter]);
  useEffect(() => { localStorage.setItem('afterSchoolDay', selectedDay.toString()) }, [selectedDay]);

  const [timeSlotPages, setTimeSlotPages] = useState<Record<string, number>>({});
  const [selectedClass, setSelectedClass] = useState<AllAfterSchool | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: branchInfo } = useQuery(afterSchoolQuery.branch());

  const currentBranch = branchInfo?.[0]?.number;

  const isInitialized = useRef(false);

useEffect(() => {
  if (!branchInfo || isInitialized.current) return;

  // localStorage 없을 때만 초기화하고 싶으면 이 조건 추가
  const saved = sessionStorage.getItem('afterSchoolQuarter');
  if (saved === null) {
    setSelectedQuarter(currentBranch as Quarter);
  }

  isInitialized.current = true;
}, [branchInfo, currentBranch]);

  const params: AfterSchoolSearchParams = {
    grade: selectedGrade,
    week_day: DAY_TO_ENGLISH[DAYS[selectedDay]],
    start_period: 8,
    end_period: 11,
    branch: selectedQuarter,
  };

  // React Query가 자동으로 캐싱해줌 - 이미 요청한 요일은 다시 요청하지 않음
  const { data: classes = [] } = useQuery({
    ...afterSchoolQuery.all(params),
    enabled: !!selectedQuarter && !!params.grade && !!params.week_day,
    staleTime: 5 * 60 * 1000, // 5분간 데이터를 fresh 상태로 유지
  });

  // selectedGrade나 selectedDay가 변경될 때 timeSlotPages 초기화
  useEffect(() => {
    const resetPages = () => {
      setTimeSlotPages({});
    };
    
    // 다음 렌더링 사이클에서 실행하여 동기 호출 문제 해결
    const timer = setTimeout(resetPages, 0);
    
    return () => clearTimeout(timer);
  }, [selectedGrade, selectedDay]);

  const groupedByTime = classes.reduce<Record<string, AllAfterSchool[]>>((acc, cls) => {
    if (!acc[cls.period]) {
      acc[cls.period] = [];
    }
    acc[cls.period].push(cls);
    return acc;
  }, {});

  const sortedTimeSlots = Object.keys(groupedByTime).sort((a, b) => {
    const getTimeOrder = (time: string) => {
      if (time.includes('8') && (time.includes('9') || time.includes('-9') || time.includes('~9'))) return 0;
      if (time.includes('10') && (time.includes('11') || time.includes('-11') || time.includes('~11'))) return 1;
      return 2;
    };
    return getTimeOrder(a) - getTimeOrder(b);
  });

  const handlePrevDay = () => {
    setSelectedDay(prev => (prev > 0 ? prev - 1 : DAYS.length - 1));
  };

  const handleNextDay = () => {
    setSelectedDay(prev => (prev < DAYS.length - 1 ? prev + 1 : 0));
  };

  const handlePrevPage = (time: string) => {
    setTimeSlotPages(prev => ({
      ...prev,
      [time]: Math.max(0, (prev[time] || 0) - 1)
    }));
  };

  const handleNextPage = (time: string, maxPage: number) => {
    setTimeSlotPages(prev => ({
      ...prev,
      [time]: Math.min(maxPage, (prev[time] || 0) + 1)
    }));
  };

  const handleEdit = (e: React.MouseEvent, cls: AllAfterSchool) => {
    e.stopPropagation();
    const classData = {
      id: cls.id.toString(),
      grade: selectedGrade,
      day: API_WEEKDAY_TO_UI[cls.week_day] ?? DAYS[selectedDay],
      period: cls.period,
      teacher: cls.teacher.name,
      teacherId: cls.teacher.id,
      location: cls.place.name,
      placeId: Number(cls.place.id),
      subject: cls.name,
      students: cls.students.map(s => `${s.number} ${s.name}`),
      studentIds: cls.students.map(s => s.id ?? 0),
    };
    localStorage.setItem('currentAfterSchoolId', classData.id);
    navigate(`/admin/after-school/edit/${classData.id}`, {
      state: { ...classData, selectedBranch: selectedQuarter, returnPath: '/after-school' },
    });
  };

  return (
    <S.Wrapper>
      <S.TitleSection>
        <S.Title>전체 방과후</S.Title>
        <S.SelectionContainer>
        <S.GradeTabs>
          <S.GradeTab $active={selectedGrade === 1} onClick={() => setSelectedGrade(1)}>1학년</S.GradeTab>
          <S.GradeTab $active={selectedGrade === 2} onClick={() => setSelectedGrade(2)}>2학년</S.GradeTab>
          <S.GradeTab $active={selectedGrade === 3} onClick={() => setSelectedGrade(3)}>3학년</S.GradeTab>
        </S.GradeTabs>
        <Dropdown<Quarter>
          placeholder="분기"
          items={QUARTER_OPTIONS}
          value={selectedQuarter}
          onChange={setSelectedQuarter}
          renderItem={(item) => `${item}분기`}
          customWidth="100px"
          customHeight="40px"
        />
        </S.SelectionContainer>
      </S.TitleSection>

      <S.Container>
        <S.DayNavigation>
          <S.DayNavButton onClick={handlePrevDay}>
            <img src="/icons/LeftDoubleArrow.svg" alt="이전 요일" />
          </S.DayNavButton>
          <S.DayText>{DAYS[selectedDay]}</S.DayText>
          <S.DayNavButton onClick={handleNextDay}>
            <img src="/icons/RightDoubleArrow.svg" alt="다음 요일" />
          </S.DayNavButton>
        </S.DayNavigation>

        <S.TimeSlotList>
          {sortedTimeSlots.length > 0 ? (
            sortedTimeSlots.map((time) => {
              const timeClasses = groupedByTime[time];
              const currentPage = timeSlotPages[time] || 0;
              const totalPages = Math.ceil(timeClasses.length / ITEMS_PER_PAGE);
              const startIndex = currentPage * ITEMS_PER_PAGE;
              const endIndex = startIndex + ITEMS_PER_PAGE;
              const displayClasses = timeClasses.slice(startIndex, endIndex);

              return (
                <S.TimeSlotSection key={time}>
                  <S.TimeHeader>
                    <S.TimeText>{time}</S.TimeText>
                    <S.ArrowButtons>
                      <S.ArrowButton 
                        onClick={() => handlePrevPage(time)}
                        disabled={currentPage === 0}
                      >
                        <img src="/icons/common/leftArrow.svg" alt="이전" />
                      </S.ArrowButton>
                      <S.ArrowButton 
                        onClick={() => handleNextPage(time, totalPages - 1)}
                        disabled={currentPage >= totalPages - 1}
                      >
                        <img src="/icons/common/rightArrow.svg" alt="다음" />
                      </S.ArrowButton>
                    </S.ArrowButtons>
                  </S.TimeHeader>
                  <S.ClassList>
                    {displayClasses.map(cls => (
                      <S.ClassCard key={cls.id} onClick={() => { setSelectedClass(cls); setIsModalOpen(true); }} style={{ cursor: 'pointer' }}>
                        <S.CardTopRow>
                          <S.ClassSubject>{cls.name}</S.ClassSubject>
                          <S.EditButton onClick={(e) => handleEdit(e, cls)}>수정</S.EditButton>
                        </S.CardTopRow>
                        <S.ClassInfo>{cls.place.name}</S.ClassInfo>
                        <S.TeacherName>{cls.teacher.name} 선생님</S.TeacherName>
                      </S.ClassCard>
                    ))}
                  </S.ClassList>
                </S.TimeSlotSection>
              );
            })
          ) : (
            <S.EmptyState>전체 방과후가 없습니다</S.EmptyState>
          )}
        </S.TimeSlotList>
      </S.Container>
      <AfterSchoolDetailModal
        classData={selectedClass}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedClass(null); }}
      />
    </S.Wrapper>
  );
}
