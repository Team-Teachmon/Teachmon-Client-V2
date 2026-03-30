import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import DateInput from '@/components/ui/input/date';
import TextInput from '@/components/ui/input/text-input';
import Dropdown from '@/components/ui/input/dropdown';
import Button from '@/components/ui/button';
import { PERIOD_OPTIONS, type Period, type MovementFormData } from '@/constants/movement';
import { studentQuery, teamQuery } from '@/services/search/search.query';
import { useDebounce } from '@/hooks/useDebounce';
import type { StudentSearchResponse, TeamSearchResponse } from '@/types/search';
import type { LeaveSeatDetail } from '@/types/movement';
import * as S from './style';
import { getTodayDate } from '@/utils/period';
import { formatStudent } from '@/utils/format';


interface MovementFormProps {
    onNext: (data: MovementFormData) => void;
    onCancel: () => void;
    initialData?: LeaveSeatDetail;
    savedFormData?: MovementFormData;
    prefilledStudent?: { id: string; display: string };
}

export default function MovementForm({ onNext, onCancel, initialData, savedFormData, prefilledStudent }: MovementFormProps) {
    const isProcessing = useRef(false);
    const [selectedDate, setSelectedDate] = useState<string>(savedFormData?.day || initialData?.day || getTodayDate());
    const [selectedPeriod, setSelectedPeriod] = useState<Period | ''>(savedFormData?.period || initialData?.period || '');
    const [reason, setReason] = useState<string>(savedFormData?.cause || initialData?.cause || '');
    const [studentSearch, setStudentSearch] = useState<string>('');
    const [isTeamMode, setIsTeamMode] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<Array<{ id: string; display: string }>>(
        savedFormData?.studentDetails ||
        initialData?.students.map(student => ({
            id: String(student.id),
            display: `${student.number} ${student.name}`,
        })) ||
        (prefilledStudent ? [prefilledStudent] : [])
    );

    // initialData가 바뀌면 폼 상태를 업데이트 (savedFormData가 없을 때만)
    useEffect(() => {
        if (initialData && !savedFormData) {
            // eslint-disable-next-line
            setSelectedDate(initialData.day || getTodayDate());
            setSelectedPeriod(initialData.period || '');
            setReason(initialData.cause || '');
            setSelectedStudents(
                initialData.students.map(student => ({
                    id: String(student.id),
                    display: `${student.number} ${student.name}`,
                }))
            );
        }
    }, [initialData]); // eslint-disable-line react-hooks/exhaustive-deps

    // 학생 검색 디바운스
    const debouncedSearch = useDebounce(studentSearch, 500);

    // 학생 검색 API (팀 모드가 아닐 때)
    const { data: studentResults = [] } = useQuery({
        ...studentQuery.search(debouncedSearch),
        enabled: !isTeamMode && debouncedSearch.length > 0,
    });

    // 팀 검색 API (팀 모드일 때)
    const { data: teamResults = [] } = useQuery({
        ...teamQuery.search(debouncedSearch),
        enabled: isTeamMode && debouncedSearch.length > 0,
    });

    // 검색 결과 (학생 또는 팀)
    const searchResults = isTeamMode ? teamResults : studentResults;

    const handleRemoveStudent = (studentId: string) => {
        setSelectedStudents((prev) => prev.filter((s) => s.id !== studentId));
    };

    /**
     * 엔터 키를 눌렀을 때 필터링된 첫 번째 결과를 선택하는 함수
     */
    const handleEnterKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // 한글 입력 중일 때는 무시
        if (e.nativeEvent.isComposing) return;

        if (e.key === 'Enter' && studentSearch && searchResults.length > 0) {
            e.preventDefault();
            e.stopPropagation();

            if (isProcessing.current) return;
            isProcessing.current = true;

            // 중복 제거된 결과에서 첫 번째 항목 선택
            const filteredResults = searchResults.filter((result: StudentSearchResponse | TeamSearchResponse) => {
                if (isTeamMode) {
                    return true;
                }
                return !selectedStudents.some(s => s.id === result.id);
            });

            if (filteredResults.length > 0) {
                handleSelectResult(filteredResults[0]);
            }

            setTimeout(() => {
                isProcessing.current = false;
            }, 100);
        }
    };

    const handleNext = () => {
        const today = getTodayDate();
        const todayDate = new Date(today);
        const selectedDateObj = new Date(selectedDate);

        // 날짜가 오늘보다 이전인지 확인
        if (selectedDate < today) {
            toast.warning('오늘 이전 날짜는 선택할 수 없습니다.');
            return;
        }

        // 다음 주 월요일부터 막기 (이번 주 일요일까지만 허용)
        const currentDayOfWeek = todayDate.getDay(); // 0(일) ~ 6(토)
        const daysUntilSunday = 7 - currentDayOfWeek; // 이번 주 일요일까지 남은 일수
        const thisWeekSunday = new Date(todayDate);
        thisWeekSunday.setDate(todayDate.getDate() + daysUntilSunday);
        thisWeekSunday.setHours(23, 59, 59, 999); // 일요일 끝까지

        if (selectedDateObj > thisWeekSunday) {
            toast.warning('이번주 이후의 이석 작성은 불가능합니다.');
            return;
        }

        // 모든 필드가 입력되었는지 확인하고 toast로 알림
        if (!selectedDate) {
            toast.warning('날짜를 선택해주세요.');
            return;
        }

        if (!selectedPeriod) {
            toast.warning('시간을 선택해주세요.');
            return;
        }

        if (!reason.trim()) {
            toast.warning('사유를 입력해주세요.');
            return;
        }

        if (selectedStudents.length === 0) {
            toast.warning('학생을 선택해주세요.');
            return;
        }

        onNext({
            day: selectedDate,
            period: selectedPeriod,
            cause: reason,
            students: selectedStudents.map(s => String(s.id)),
            studentDetails: selectedStudents,
        });
    };

    /**
     * 검색 결과(학생 또는 팀)를 선택했을 때 처리하는 함수
     * - 팀 모드: 팀의 모든 멤버를 학생 리스트에 추가 (중복 제거)
     * - 학생 모드: 선택한 학생을 리스트에 추가 (중복 체크)
     * - 검색어 초기화
     */
    const handleSelectResult = (result: StudentSearchResponse | TeamSearchResponse) => {
        if (isTeamMode) {
            const team = result as TeamSearchResponse;
            const newMembers = team.members
                .filter((m) => !selectedStudents.some(s => s.id === String(m.id)))
                .map((m) => ({
                    id: String(m.id),
                    display: formatStudent(m),
                }));
            setSelectedStudents([...selectedStudents, ...newMembers]);
        } else {
            // 학생 모드: 중복 체크
            const student = result as StudentSearchResponse;
            const studentId = String(student.id);
            if (!selectedStudents.some(s => s.id === studentId)) {
                setSelectedStudents([...selectedStudents, {
                    id: studentId,
                    display: formatStudent(student)
                }]);
            }
        }
        setStudentSearch('');
    };

    return (
        <S.Container>
            <S.ContentWrapper>
                <S.FormSection>
                    <S.FormTitle>이석작성</S.FormTitle>

                    <S.FormContent>
                        {/* 시간 */}
                        <S.FormGroup>
                            <S.Label>시간</S.Label>
                            <S.InputRow>
                                <DateInput
                                    label="날짜"
                                    value={selectedDate}
                                    onChange={setSelectedDate}
                                />
                                <S.DropdownWrapper>
                                    {(() => {
                                        // 이석 수정 상태(initialData 존재)일 때는 8~11교시 컬럼 제외
                                        const filteredPeriodOptions = initialData
                                            ? PERIOD_OPTIONS.filter(p => p.value === 'EIGHT_AND_NINE_PERIOD' || p.value === 'TEN_AND_ELEVEN_PERIOD')
                                            : PERIOD_OPTIONS;
                                        
                                        return (
                                            <Dropdown
                                                placeholder="시간"
                                                items={filteredPeriodOptions.map(p => p.label)}
                                                value={filteredPeriodOptions.find(p => p.value === selectedPeriod)?.label || ''}
                                                onChange={(label) => {
                                                    const period = filteredPeriodOptions.find(p => p.label === label);
                                                    if (period) setSelectedPeriod(period.value);
                                                }}
                                                customHeight="44px"
                                                customBorderRadius="8px"
                                            />
                                        );
                                    })()}
                                </S.DropdownWrapper>
                            </S.InputRow>
                        </S.FormGroup>

                        {/* 사유 */}
                        <S.FormGroup>
                            <S.TextAreaWrapper>
                                <S.Label>사유</S.Label>
                                <S.TextArea
                                    placeholder="사유를 입력해주세요"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </S.TextAreaWrapper>
                        </S.FormGroup>

                        {/* 학생/팀 */}
                        <S.FormGroup>
                            <S.StudentHeader>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <S.Label>{isTeamMode ? '팀' : '학생'}</S.Label>
                                    <S.EnterHint>엔터를 치면 입력됩니다</S.EnterHint>
                                </div>
                                <S.TeamToggle>
                                    <span>팀</span>
                                    <S.Switch $isOn={isTeamMode} onClick={() => {
                                        setIsTeamMode(!isTeamMode);
                                        setStudentSearch('');
                                    }}>
                                        <S.SwitchKnob $isOn={isTeamMode} />
                                    </S.Switch>
                                </S.TeamToggle>
                            </S.StudentHeader>
                            <TextInput
                                placeholder={isTeamMode ? '팀을 입력해주세요' : '학생을 입력해주세요'}
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                onKeyDown={handleEnterKeyPress}
                                leftIcon={
                                    <img
                                        src="/icons/common/search.svg"
                                        alt="search"
                                        style={{ width: '20px', height: '20px' }}
                                    />
                                }
                            />

                            {/* 검색 드롭다운 */}
                            {studentSearch && searchResults.length > 0 && (() => {
                                // 중복 제거를 먼저 하고 slice
                                const filteredResults = searchResults.filter((result: StudentSearchResponse | TeamSearchResponse) => {
                                    if (isTeamMode) {
                                        // 팀은 중복 체크 안 함
                                        return true;
                                    }
                                    return !selectedStudents.some(s => s.id === String(result.id));
                                }).slice(0, 3);

                                return filteredResults.length > 0 ? (
                                    <S.StudentDropdown>
                                        {filteredResults.map((result: StudentSearchResponse | TeamSearchResponse) => {
                                            const displayText = isTeamMode
                                                ? (result as TeamSearchResponse).name
                                                : formatStudent(result as StudentSearchResponse);
                                            return (
                                                <S.StudentDropdownItem
                                                    key={result.id}
                                                    onClick={() => {
                                                        if (isProcessing.current) return;
                                                        isProcessing.current = true;
                                                        handleSelectResult(result);
                                                        setTimeout(() => {
                                                            isProcessing.current = false;
                                                        }, 100);
                                                    }}
                                                >
                                                    {displayText}
                                                </S.StudentDropdownItem>
                                            );
                                        })}
                                    </S.StudentDropdown>
                                ) : null;
                            })()}
                        </S.FormGroup>
                    </S.FormContent>
                </S.FormSection>

                {/* 선택된 학생 목록 */}
                <S.SelectedStudentsSection>
                    <S.SelectedTitle>학생</S.SelectedTitle>
                    <S.SelectedStudentsGrid>
                        {selectedStudents.map((student) => (
                            <S.SelectedStudentCard
                                key={student.id}
                                onClick={() => handleRemoveStudent(student.id)}
                            >
                                <S.StudentName>{student.display}</S.StudentName>
                            </S.SelectedStudentCard>
                        ))}
                    </S.SelectedStudentsGrid>
                </S.SelectedStudentsSection>
            </S.ContentWrapper>

            {/* 하단 버튼 */}
            <S.ButtonWrapper>
                <Button text="취소" width="100%" onClick={onCancel} variant="cancel" />
                <Button
                    text="다음"
                    width="100%"
                    onClick={handleNext}
                    variant="confirm"
                />
            </S.ButtonWrapper>
        </S.Container>
    );
}