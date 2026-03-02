import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Dropdown from '@/components/ui/input/dropdown';
import TextInput from '@/components/ui/input/text-input';
import Button from '@/components/ui/button';
import { WEEKDAYS, PERIOD_OPTIONS, WEEKDAY_LABEL_TO_API, PERIOD_LABEL_TO_API, WEEKDAY_LABEL, PERIOD_LABEL } from '@/constants/fixedMovement';
import { useCreateFixedMovementMutation, useUpdateFixedMovementMutation } from '@/services/fixed-movement/fixedMovement.mutation';
import { fixedMovementQuery } from '@/services/fixed-movement/fixedMovement.query';
import { searchQuery } from '@/services/search/search.query';
import { useDebounce } from '@/hooks/useDebounce';
import type { Student, PlaceSearchResponse, TeamSearchResponse } from '@/types/fixedMovement';
import * as S from './style';


export default function FixedMovementFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const createMutation = useCreateFixedMovementMutation();
  const updateMutation = useUpdateFixedMovementMutation();
  const queryClient = useQueryClient();

  const { data: detailData } = useQuery(fixedMovementQuery.detail(id));
  
  const [dayOfWeek, setDayOfWeek] = useState<string>('');
  const [period, setPeriod] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResponse | null>(null);
  const [reason, setReason] = useState<string>('');
  const [isTeamMode, setIsTeamMode] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [placeSearchInput, setPlaceSearchInput] = useState('');
  const [teamSearchInput, setTeamSearchInput] = useState('');

  const debouncedSearch = useDebounce(searchInput, 300);
  const debouncedPlaceSearch = useDebounce(placeSearchInput, 300);
  const debouncedTeamSearch = useDebounce(teamSearchInput, 300);

  const { data: studentResults = [] } = useQuery(searchQuery.students(debouncedSearch));
  const { data: placeResults = [] } = useQuery(searchQuery.places(debouncedPlaceSearch));
  const { data: teamResults = [] } = useQuery(searchQuery.teams(debouncedTeamSearch));

  const dayOptions = Object.values(WEEKDAYS);

  useEffect(() => {
    if (isEditMode && detailData) {
      flushSync(() => {
        const weekday = detailData.weekday ?? detailData.week_day;
        if (weekday) {
          setDayOfWeek(WEEKDAY_LABEL[weekday] ?? '');
        }
        setPeriod(PERIOD_LABEL[detailData.period] ?? '');

        const placeName = typeof detailData.place === 'string' ? detailData.place : detailData.place.name;
        const placeId = typeof detailData.place === 'object' ? detailData.place.id : null;
        setLocation(placeName);
        if (placeId) {
          setSelectedPlace({ id: placeId, name: placeName, floor: 0 });
        }

        setReason(detailData.cause ?? '');
        setSelectedStudents(
          detailData.students.map((s) => ({
            id: s.id,
            studentNumber: s.number,
            name: s.name,
          })),
        );
      });
    }
  }, [isEditMode, detailData]);

  const handleAddStudent = (student: Student) => {
    if (!selectedStudents.find(s => s.studentNumber === student.studentNumber)) {
      setSelectedStudents([...selectedStudents, student]);
    }
    setSearchInput('');
  };

  const handleSelectPlace = (place: PlaceSearchResponse) => {
    setSelectedPlace(place);
    setLocation(place.name);
    setPlaceSearchInput('');
  };

  const handleSelectTeam = (teamName: string, teamMembers: TeamSearchResponse['members']) => {
    // 이미 검색 입력이 비어있으면 중복 호출이므로 무시
    if (!teamSearchInput) return;
    
    setTeamSearchInput('');
    const newStudents = teamMembers.map(member => {
      const fullStudentNumber = Number(`${member.grade}${member.classNumber}${String(member.number).padStart(2, '0')}`);
      return {
        id: member.id,
        studentNumber: fullStudentNumber,
        name: member.name,
        grade: member.grade,
        classNumber: member.classNumber,
      };
    });
    
    const uniqueNewStudents = newStudents.filter(newStudent => 
      !selectedStudents.find(existing => 
        (existing.id && existing.id === newStudent.id) || 
        existing.studentNumber === newStudent.studentNumber
      )
    );

    if (uniqueNewStudents.length > 0) {
      setSelectedStudents([...selectedStudents, ...uniqueNewStudents]);
      toast.success(`${teamName} 팀의 학생 ${uniqueNewStudents.length}명이 추가되었습니다.`);
    } else {
      toast.info(`${teamName} 팀의 모든 학생이 이미 선택되어 있습니다.`);
    }
  };

  const handleRemoveStudent = (studentNumber: number) => {
    setSelectedStudents(selectedStudents.filter(s => s.studentNumber !== studentNumber));
  };

  /**
   * 학생 검색에서 엔터 키를 눌렀을 때 첫 번째 결과를 선택하는 함수
   */
  const handleStudentEnterKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchInput && studentResults.length > 0) {
      e.preventDefault();
      
      const filteredResults = studentResults.filter(student => 
        !selectedStudents.find(s => 
          (s.id && s.id === student.id) || 
          (!s.id && s.studentNumber === student.number)
        )
      );
      
      if (filteredResults.length > 0) {
        const student = filteredResults[0];
        handleAddStudent({ 
          id: student.id as number, 
          studentNumber: student.number, 
          name: student.name, 
          grade: student.grade, 
          classNumber: student.classNumber 
        });
      }
    }
  };

  /**
   * 팀 검색에서 엔터 키를 눌렀을 때 첫 번째 결과를 선택하는 함수
   */
  const handleTeamEnterKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && teamSearchInput && teamResults.length > 0) {
      e.preventDefault();
      const team = teamResults[0];
      handleSelectTeam(team.name, team.members);
    }
  };

  /**
   * 장소 검색에서 엔터 키를 눌렀을 때 첫 번째 결과를 선택하는 함수
   */
  const handlePlaceEnterKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && placeSearchInput && placeResults.length > 0) {
      e.preventDefault();
      handleSelectPlace(placeResults[0]);
    }
  };

  const handleCancel = () => {
    navigate('/admin/fixed-movement');
  };

  const handleSubmit = async () => {
    const weekDay = WEEKDAY_LABEL_TO_API[dayOfWeek];
    const periodEnum = PERIOD_LABEL_TO_API[period];

    if (!weekDay || !periodEnum || !selectedPlace || !reason) {
      toast.error('모든 항목을 입력해주세요.');
      return;
    }

    if (selectedStudents.length === 0) {
      toast.error('학생을 1명 이상 선택해주세요.');
      return;
    }

    try {
      if (isEditMode && id) {
        updateMutation.mutate({
          id,
          data: {
            week_day: weekDay,
            period: periodEnum,
            place: selectedPlace.id,
            cause: reason,
            students: selectedStudents.map((s) => String(s.id ?? s.studentNumber)),
          },
        });
        return;
      }

      if (period === '8~11교시') {
        await Promise.all([
          createMutation.mutateAsync({
            week_day: weekDay,
            period: 'EIGHT_AND_NINE_PERIOD',
            place_id: selectedPlace.id,
            cause: reason,
            students: selectedStudents.map((s) => String(s.id ?? s.studentNumber)),
          }),
          createMutation.mutateAsync({
            week_day: weekDay,
            period: 'TEN_AND_ELEVEN_PERIOD',
            place_id: selectedPlace.id,
            cause: reason,
            students: selectedStudents.map((s) => String(s.id ?? s.studentNumber)),
          }),
        ]);
      } else {
        await createMutation.mutateAsync({
          week_day: weekDay,
          period: periodEnum,
          place_id: selectedPlace.id,
          cause: reason,
          students: selectedStudents.map((s) => String(s.id ?? s.studentNumber)),
        });
      }

      toast.success('고정 이석이 성공적으로 생성되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['fixedMovement.list'] });
      navigate('/admin/fixed-movement');
    } catch (e) {
      toast.error('고정 이석 생성에 실패했습니다.');
    }
  };

  return (
    <S.Container>
      <S.Content>
        <S.Title>{isEditMode ? '고정 이석 수정' : '고정 이석 설정'}</S.Title>

        <S.Form>
          <S.FormSection>
            <S.SectionTitle>시간</S.SectionTitle>
            <S.InputRow>
              <Dropdown
                placeholder="요일"
                items={dayOptions}
                value={dayOfWeek}
                onChange={setDayOfWeek}
                customWidth="48%"
              />
              <Dropdown
                placeholder="시간"
                items={PERIOD_OPTIONS}
                value={period}
                onChange={setPeriod}
                customWidth="48%"
              />
            </S.InputRow>
          </S.FormSection>

          <S.FormSection>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <S.SectionTitle>장소</S.SectionTitle>
              <S.EnterHint>엔터를 치면 입력됩니다</S.EnterHint>
            </div>
            <S.DropdownWrapper>
              <TextInput
                placeholder="장소를 검색해주세요"
                value={placeSearchInput || location}
                onChange={(e) => {
                  setPlaceSearchInput(e.target.value);
                  if (!e.target.value) {
                    setSelectedPlace(null);
                    setLocation('');
                  }
                }}
                onKeyDown={handlePlaceEnterKeyPress}
                leftIcon={
                  <img
                    src="/icons/common/search.svg"
                    alt="search"
                    style={{ width: '20px', height: '20px' }}
                  />
                }
              />
              {placeSearchInput && placeResults.length > 0 && (
                <S.StudentDropdown>
                  {placeResults.slice(0, 5).map((place) => (
                    <S.StudentDropdownItem
                      key={place.id}
                      onClick={() => handleSelectPlace(place)}
                    >
                      {place.name} ({place.floor}층)
                    </S.StudentDropdownItem>
                  ))}
                </S.StudentDropdown>
              )}
            </S.DropdownWrapper>
          </S.FormSection>

          <S.FormSection>
            <S.SectionTitle>사유</S.SectionTitle>
            <TextInput
              placeholder="사유를 입력해주세요"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </S.FormSection>

          <S.FormSection>
            <S.ToggleRow>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <S.SectionTitle>학생</S.SectionTitle>
                <S.EnterHint>엔터를 치면 입력됩니다</S.EnterHint>
              </div>
              <S.ToggleContent>
                <S.SectionTitle>팀</S.SectionTitle>
                <S.Toggle
                  $active={isTeamMode}
                  onClick={() => setIsTeamMode(!isTeamMode)}
                >
                  <S.ToggleCircle $active={isTeamMode} />
                </S.Toggle>
              </S.ToggleContent>
            </S.ToggleRow>

            <S.DropdownWrapper>
              <TextInput
                placeholder={isTeamMode ? "팀을 검색해주세요" : "학생을 검색해주세요"}
                value={isTeamMode ? teamSearchInput : searchInput}
                onChange={(e) => {
                  if (isTeamMode) {
                    setTeamSearchInput(e.target.value);
                  } else {
                    setSearchInput(e.target.value);
                  }
                }}
                onKeyDown={isTeamMode ? handleTeamEnterKeyPress : handleStudentEnterKeyPress}
                leftIcon={
                  <img 
                    src="/icons/common/search.svg" 
                    alt="search"
                    style={{ width: '20px', height: '20px' }}
                  />
                }
              />

              {!isTeamMode && searchInput && studentResults.length > 0 && (
                <S.StudentDropdown>
                  {studentResults
                    .filter(student => 
                      !selectedStudents.find(s => 
                        (s.id && s.id === student.id) || 
                        (!s.id && s.studentNumber === student.number)
                      )
                    )
                    .slice(0, 5)
                    .map((student) => (
                      <S.StudentDropdownItem 
                        key={student.id}
                        onClick={() => handleAddStudent({ 
                          id: typeof student.id === 'string' ? Number(student.id) : student.id,
                          studentNumber: student.number, 
                          name: student.name, 
                          grade: student.grade, 
                          classNumber: student.classNumber 
                        })}
                      >
                        {student.grade}{student.classNumber}{student.number < 10 ? `0${student.number}` : student.number} {student.name}
                      </S.StudentDropdownItem>
                    ))
                  }
                </S.StudentDropdown>
              )}

              {isTeamMode && teamSearchInput && teamResults.length > 0 && (
                <S.StudentDropdown>
                  {teamResults.slice(0, 5).map((team) => (
                    <S.StudentDropdownItem
                      key={team.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleSelectTeam(team.name, team.members);
                      }}
                    >
                      {team.name}
                    </S.StudentDropdownItem>
                  ))}
                </S.StudentDropdown>
              )}
            </S.DropdownWrapper>
          </S.FormSection>

          {selectedStudents.length > 0 && (
            <S.StudentGrid>
              {selectedStudents.map((student) => (
                <S.StudentCard key={student.studentNumber}>
                  <S.StudentInfo>
                    <S.StudentNumber>{student.grade && student.classNumber ? `${student.grade}${student.classNumber}${student.studentNumber < 10 ? `0${student.studentNumber}` : student.studentNumber}` : student.studentNumber}</S.StudentNumber>
                    <S.StudentName>{student.name}</S.StudentName>
                  </S.StudentInfo>
                  <S.RemoveButton onClick={() => handleRemoveStudent(student.studentNumber)}>
                    <img src="/icons/common/x.svg" alt="삭제" width={20} height={20} />
                  </S.RemoveButton>
                </S.StudentCard>
              ))}
            </S.StudentGrid>
          )}
        </S.Form>
      </S.Content>

      <S.ButtonRow>
        <Button text="취소" variant="cancel" width='27rem' onClick={handleCancel} />
        <Button text="완료" variant="confirm" width='27rem' onClick={handleSubmit} />
      </S.ButtonRow>
    </S.Container>
  );
}
