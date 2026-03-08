import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HeaderLeft, HeaderRight } from '@/containers/manage-student/header';
import ClassCard from '@/containers/manage-student/class-card';
import Map from '@/containers/manage-student/map';

import { manageQuery } from '@/services/manage/manage.query';
import type { StudentSchedule } from '@/types/manage';
import { useStudentStatus } from '@/hooks/useStudentStatus';
import { CLASSES } from '@/constants/manage';
import { PERIOD_MAP, getCurrentPeriod, PERIOD_TO_KOREAN, getTodayDate } from '@/utils/period';
import type { StatusType } from '@/components/ui/status';
import type { StudentState } from '@/types/manage';

import * as S from './style';

export default function Manage() {
    const currentPeriod = getCurrentPeriod();
    const initialPeriod = currentPeriod ? PERIOD_TO_KOREAN[currentPeriod] : '7교시';
    
    const [selectedGrade, setSelectedGrade] = useState<number>(1);
    const [selectedFloor, setSelectedFloor] = useState<number>(1);
    const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
    const [selectedPeriod, setSelectedPeriod] = useState<string>(initialPeriod);
    const [isMapEnabled, setIsMapEnabled] = useState<boolean>(false);
    const [highlightedPlace, setHighlightedPlace] = useState<string>('');
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const { changeStatus } = useStudentStatus();

    // 학생 상태 변경 핸들러
    const handleStatusChange = (scheduleId: string, status: StatusType, currentState?: StudentState | null) => {
        changeStatus(scheduleId, status, currentState);
        setSelectedStudentId(null);
    };

    // 학년별 학생 스케줄 조회
    const { data: studentSchedules = [], isLoading: isLoadingSchedules } = useQuery({
        ...manageQuery.studentSchedule({
            grade: selectedGrade,
            period: PERIOD_MAP[selectedPeriod] || 'SEVEN_PERIOD',
            day: selectedDate,
        }),
        retry: false,
    });

    // 층별 장소 상태 조회 (맵 모드일 때만)
    const { data: placesByFloor } = useQuery({
        ...manageQuery.placesByFloor({ 
            floor: selectedFloor,
            day: selectedDate,
            period: PERIOD_MAP[selectedPeriod] || 'SEVEN_PERIOD',
        }),
        enabled: isMapEnabled,
        retry: false,
    });

    const handleDatePeriodChange = (date: string, period: string) => {
        setSelectedDate(date);
        setSelectedPeriod(period);
    };

    const handleSelectPlace = (place: { name: string; floor: number }) => {
        setSelectedFloor(place.floor);
        setHighlightedPlace(place.name);
        
        // 4초 후 하이라이트 해제
        setTimeout(() => {
            setHighlightedPlace('');
        }, 4000);
    };

    // class별 학생 데이터를 객체로 변환
    const studentsByClass: Record<number, StudentSchedule[]> = {};
    studentSchedules.forEach((classData) => {
        studentsByClass[classData.class] = classData.students;
    });

    return (
        <S.Container>
            <S.Header isMapEnabled={isMapEnabled}>
                {/* 헤더 왼쪽: 지도 모드 → 층 선택 / 리스트 모드 → 날짜·교시·학년 선택 */}
                <HeaderLeft
                    isMapEnabled={isMapEnabled}
                    selectedFloor={selectedFloor}
                    onFloorChange={setSelectedFloor}
                    selectedDate={selectedDate}
                    selectedPeriod={selectedPeriod}
                    selectedGrade={selectedGrade}
                    onGradeChange={setSelectedGrade}
                    onDatePeriodChange={handleDatePeriodChange}
                />
                {/* 헤더 오른쪽: 액션 버튼(기록·이석작성) + 지도 토글 + 장소 검색 + 날짜/교시 모달 */}
                <HeaderRight
                    isMapEnabled={isMapEnabled}
                    onMapToggle={() => setIsMapEnabled(!isMapEnabled)}
                    selectedDate={selectedDate}
                    selectedPeriod={selectedPeriod}
                    onSelectPlace={handleSelectPlace}
                    onDatePeriodChange={handleDatePeriodChange}
                />
            </S.Header>

            {/* 메인 컨텐츠: 지도 or 학급 그리드 */}
            {isMapEnabled ? (
                <Map 
                    selectedFloor={selectedFloor} 
                    highlightedPlace={highlightedPlace}
                    placesData={placesByFloor}
                    selectedDate={selectedDate}
                    selectedPeriod={PERIOD_MAP[selectedPeriod] || 'SEVEN_PERIOD'}
                    onStatusChange={handleStatusChange}
                />
            ) : (
                <S.ClassGrid>
                    {CLASSES.map((classNum) => {
                        const classStudents = studentsByClass[classNum] || [];
                        return (
                            <ClassCard
                                key={classNum}
                                classNum={classNum}
                                students={classStudents.map((student) => ({
                                    id: student.student_id,
                                    number: student.number,
                                    name: student.name,
                                    state: student.state,
                                    scheduleId: student.schedule_id,
                                }))}
                                selectedStudentId={selectedStudentId}
                                onStudentSelect={setSelectedStudentId}
                                onStatusChange={handleStatusChange}
                                isLoading={isLoadingSchedules}
                            />
                        );
                    })}
                </S.ClassGrid>
            )}
        </S.Container>
    );
}