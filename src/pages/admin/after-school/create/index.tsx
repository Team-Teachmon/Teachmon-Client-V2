import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Dropdown from '@/components/ui/input/dropdown';
import TextInput from '@/components/ui/input/text-input';
import SearchDropdown from '@/components/ui/input/dropdown/search';
import Button from '@/components/ui/button';
import { ADMIN_AFTER_SCHOOL_PERIODS } from '@/constants/admin';
import { searchQuery } from '@/services/search/search.query';
import { useDebounce } from '@/hooks/useDebounce';
import { createAfterSchoolClass, updateAfterSchoolClass, getAfterSchoolClasses } from '@/services/after-school/afterSchool.api';
import { toast } from 'react-toastify';
import type { StudentSearchResponse, PlaceSearchResponse, TeacherSearchResponse, TeamSearchResponse } from '@/types/search';
import type { CreateAfterSchoolRequest, AdminAfterSchoolClass, AfterSchoolResponse } from '@/types/after-school';
import { WEEKDAY_MAP } from '@/constants/admin';
import type { Student as CommonStudent } from '@/types/common';
import * as S from './style';



interface Student {
  id?: string;
  studentNumber: number;
  name: string;
  grade: number;
  classNumber: number;
}

interface Teacher {
  id: number;
  name: string;
}

const mapSinglePeriod = (period: string): 'EIGHT_AND_NINE_PERIOD' | 'TEN_AND_ELEVEN_PERIOD' => {
  return period === '10~11교시' ? 'TEN_AND_ELEVEN_PERIOD' : 'EIGHT_AND_NINE_PERIOD';
};

const PERIOD_MAP: Record<string, { start: number; end: number }> = {
  'EIGHT_AND_NINE_PERIOD': { start: 8, end: 9 },
  'TEN_AND_ELEVEN_PERIOD': { start: 10, end: 11 },
};

export default function AfterSchoolFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const routerLocation = useLocation();
  const isEditMode = !!id;
  const editData = routerLocation.state as (AdminAfterSchoolClass & { selectedBranch?: number; returnPath?: string }) | null;
  const createData = routerLocation.state as { selectedDay?: string; selectedBranch?: number; selectedGrade?: number } | null;
  const selectedBranch = createData?.selectedBranch ?? editData?.selectedBranch ?? 1;
  const selectedGrade = createData?.selectedGrade ?? editData?.grade ?? 1;
  const returnPath = editData?.returnPath || '/admin/after-school';

  // localStorage에서 afterschool ID 가져오기
  const afterSchoolId = localStorage.getItem('currentAfterSchoolId') || id || '';

  const [teacher, setTeacher] = useState<Teacher | null>(
    isEditMode && editData ? { id: editData.teacherId, name: editData.teacher } : null
  );
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<PlaceSearchResponse | null>(
    isEditMode && editData ? { id: editData.placeId, name: editData.location, floor: 1 } : null
  );
  const [period, setPeriod] = useState<string>(editData?.period || '');
  const [subject, setSubject] = useState<string>(editData?.subject || '');
  const [isTeamMode, setIsTeamMode] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>(
    isEditMode && editData ? editData.students.map((s, idx) => {
      const parts = s.split(' ');
      const fullStudentNumber = parseInt(parts[0]) || 0;
      const name = parts.slice(1).join(' ');
      const studentStr = fullStudentNumber.toString();
      // 학번 형식: 4자리 = 학년(1) + 반(1) + 번호(2) e.g. 2413 = 2학년 4반 13번
      const gradeFromNumber = studentStr.length >= 1 ? parseInt(studentStr.substring(0, 1), 10) : 0;
      const classNum = studentStr.length >= 2 ? parseInt(studentStr.substring(1, 2), 10) : 0;
      return {
        id: (editData.studentIds?.[idx] ?? 0).toString(),
        studentNumber: fullStudentNumber,
        name,
        grade: editData.grade ?? gradeFromNumber,
        classNumber: classNum,
      };
    }) : []
  );
  // 삭제한 학생 ID를 기억하기 위한 state
  const [deletedStudentIds, setDeletedStudentIds] = useState<Set<string>>(new Set());
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const debouncedStudentSearch = useDebounce(studentSearchQuery, 300);
  const debouncedLocationSearch = useDebounce(locationSearchQuery, 300);
  const debouncedTeacherSearch = useDebounce(teacherSearchQuery, 300);
  const periodOptions = ADMIN_AFTER_SCHOOL_PERIODS;

  const { data: studentsData = [] } = useQuery({
    ...searchQuery.students(debouncedStudentSearch),
    enabled: debouncedStudentSearch.length > 0,
  }) as { data: StudentSearchResponse[] };

  const { data: placesData = [] } = useQuery({
    ...searchQuery.places(debouncedLocationSearch),
    enabled: debouncedLocationSearch.length > 0,
  }) as { data: PlaceSearchResponse[] };

  const { data: teachersData = [] } = useQuery({
    ...searchQuery.teachers(debouncedTeacherSearch),
    enabled: debouncedTeacherSearch.length > 0,
  }) as { data: TeacherSearchResponse[] };

  const { data: teamsData = [] } = useQuery({
    ...searchQuery.teams(debouncedStudentSearch),
    enabled: debouncedStudentSearch.length > 0 && isTeamMode,
  }) as { data: TeamSearchResponse[] };

  const handleAddStudent = (student: StudentSearchResponse | TeamSearchResponse) => {
    if ('members' in student) {
      const newStudents: Student[] = student.members
        .map(member => ({
          id: member.id.toString(),
          studentNumber: Number(`${member.grade}${member.classNumber}${String(member.number).padStart(2, '0')}`),
          name: member.name,
          grade: member.grade,
          classNumber: member.classNumber,
        }))
        .filter(
          (newSt) =>
            !selectedStudents.some(
              (s) => s.id === newSt.id || s.studentNumber === newSt.studentNumber
            )
        );
      if (newStudents.length > 0) {
        setSelectedStudents([...selectedStudents, ...newStudents]);
      }
    } else {
      const studentNumber = Number(`${student.grade}${student.classNumber}${String(student.number).padStart(2, '0')}`);
      const isDuplicate = selectedStudents.some(
        (s) => s.id === String(student.id) || s.studentNumber === studentNumber
      );
      if (!isDuplicate) {
        const newStudent: Student = {
          id: String(student.id),
          studentNumber,
          name: student.name,
          grade: student.grade,
          classNumber: student.classNumber,
        };
        setSelectedStudents([...selectedStudents, newStudent]);
      }
    }
    setStudentSearchQuery('');
  };

  const formatStudentDisplay = (student: Student | StudentSearchResponse) => {
    const name = student.name;
    const displayNumber =
      'number' in student && 'grade' in student && 'classNumber' in student && !('studentNumber' in student)
        ? `${(student as StudentSearchResponse).grade}${(student as StudentSearchResponse).classNumber}${String((student as StudentSearchResponse).number).padStart(2, '0')}`
        : String((student as Student).studentNumber);
    return `${displayNumber} ${name}`;
  };

  const handleRemoveStudent = (studentId: string) => {
    // 삭제한 학생 ID를 기억
    setDeletedStudentIds(prev => new Set(prev).add(studentId));
    setSelectedStudents(selectedStudents.filter(s => s.id !== studentId));
  };

  /**
   * 학생/팀 검색에서 엔터 키를 눌렀을 때 첫 번째 결과를 선택하는 함수
   */
  const handleStudentEnterKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 한글 입력 중일 때는 무시
    if (e.nativeEvent.isComposing) return;

    if (e.key === 'Enter' && studentSearchQuery) {
      e.preventDefault();
      e.stopPropagation();

      if (isTeamMode && teamsData.length > 0) {
        const filteredTeams = teamsData.filter((team: TeamSearchResponse) => {
          const teamMemberIds = new Set(team.members.map((member) => member.id.toString()));
          return !team.members.every((member) =>
            selectedStudents.some((selected) => selected.id === member.id.toString())
          ) && teamMemberIds.size > 0;
        });

        if (filteredTeams.length > 0) {
          handleAddStudent(filteredTeams[0]);
        }
      } else if (!isTeamMode && studentsData.length > 0) {
        const filteredStudents = studentsData.filter((student: StudentSearchResponse) =>
          !selectedStudents.find((s) => s.id === student.id.toString())
        );

        if (filteredStudents.length > 0) {
          handleAddStudent(filteredStudents[0]);
        }
      }

      setStudentSearchQuery('');
    }
  };

  const handleCancel = () => {
    navigate(returnPath);
  };

  const handleSubmit = async () => {
    if (!teacher || !selectedLocation || !period || !subject) {
      toast.error('담당 교사, 장소, 교시, 방과후 이름을 입력해주세요.');
      return;
    }

    try {
      const currentYear = new Date().getFullYear();
      if (isEditMode) {
        const weekDay = editData?.day ? WEEKDAY_MAP[editData.day as keyof typeof WEEKDAY_MAP] : 'MON';
        const splitIds = (afterSchoolId || id || '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);
        const targetAfterSchoolId = period === '10~11교시'
          ? (splitIds[1] ?? splitIds[0] ?? '')
          : (splitIds[0] ?? '');

        // 수정 모드일 때 최신 데이터 가져오기
        let finalStudentIds: string[] = selectedStudents.map((s) => String(s.id ?? ''));

        try {
          const periodInfo = PERIOD_MAP[editData?.period || ''] || { start: 8, end: 9 };
          const response = await getAfterSchoolClasses({
            grade: editData?.grade || selectedGrade,
            branch: selectedBranch,
            week_day: weekDay,
            start_period: periodInfo.start,
            end_period: periodInfo.end,
          });

          // 같은 after_school id를 가진 데이터 찾기
          const matchingClass = response.find((item: AfterSchoolResponse) => item.id.toString() === targetAfterSchoolId);

          if (matchingClass) {
            // 최신 학생 목록 가져오기
            const latestStudentIds = matchingClass.students
              .map((student: CommonStudent) => student.id?.toString() || '')
              .filter((id: string) => id !== '');

            // 현재 선택된 학생 ID들
            const currentStudentIds = selectedStudents.map((s) => String(s.id ?? ''));

            // 병합: 현재 학생 + 최신 학생 (중복 제거)
            const mergedIds = new Set([...currentStudentIds, ...latestStudentIds]);

            // 삭제한 학생들은 제외
            finalStudentIds = Array.from(mergedIds).filter(id => !deletedStudentIds.has(id));
          }
        } catch (error) {
          console.error('최신 데이터를 가져오는데 실패했습니다:', error);
          // 최신 데이터를 가져오지 못하면 현재 선택된 학생들로만 진행
        }

        const baseUpdateRequest = {
          grade: selectedStudents.length > 0 ? selectedStudents[0].grade : selectedGrade,
          week_day: weekDay,
          year: currentYear,
          branch: selectedBranch,
          teacher_id: teacher.id,
          place_id: selectedLocation.id,
          name: subject,
          students_id: finalStudentIds,
        };

        // 8~11교시인 경우 두 개의 요청으로 분리
        if (period === '8~11교시') {
          // ID가 콤마로 구분되어 있는 경우 분리 (예: "61853594277646336,61853594277646337")
          const ids = (afterSchoolId || id || '').split(',');
          const eightNineId = ids[0]?.trim() || '';
          const tenElevenId = ids[1]?.trim() || '';

          await Promise.all([
            updateAfterSchoolClass({
              ...baseUpdateRequest,
              after_school_id: eightNineId,
              period: 'EIGHT_AND_NINE_PERIOD',
            }),
            updateAfterSchoolClass({
              ...baseUpdateRequest,
              after_school_id: tenElevenId,
              period: 'TEN_AND_ELEVEN_PERIOD',
            }),
          ]);
        } else {
          const mappedPeriod = mapSinglePeriod(period);
          await updateAfterSchoolClass({
            ...baseUpdateRequest,
            after_school_id: targetAfterSchoolId || afterSchoolId || id as string,
            period: mappedPeriod,
          });
        }

        toast.success('방과후가 성공적으로 수정되었습니다.');
        // 수정 완료 후 localStorage 정리
        localStorage.removeItem('currentAfterSchoolId');
        await queryClient.invalidateQueries({ queryKey: ['afterSchool.classes'] });
      } else {
        const baseRequest: Omit<CreateAfterSchoolRequest, 'period'> = {
          grade: selectedStudents.length > 0 ? selectedStudents[0].grade : selectedGrade,
          week_day: createData?.selectedDay ? WEEKDAY_MAP[createData.selectedDay as keyof typeof WEEKDAY_MAP] : 'MON',
          year: currentYear,
          branch: selectedBranch,
          teacher_id: teacher.id,
          place_id: selectedLocation.id,
          name: subject,
          students_id: selectedStudents.map((s) => String(s.id ?? '')),
        };

        if (period === '8~11교시') {
          // 백엔드에 8~11 교시가 없다면 8~9, 10~11 두 번 생성
          await Promise.all([
            createAfterSchoolClass({
              ...baseRequest,
              period: 'EIGHT_AND_NINE_PERIOD',
            }),
            createAfterSchoolClass({
              ...baseRequest,
              period: 'TEN_AND_ELEVEN_PERIOD',
            }),
          ]);
        } else {
          const mappedPeriod = mapSinglePeriod(period);

          await createAfterSchoolClass({
            ...baseRequest,
            period: mappedPeriod,
          });
        }

        toast.success('방과후가 성공적으로 생성되었습니다.');
      }
      navigate(returnPath);
    } catch {
      toast.error(isEditMode ? '방과후 수정에 실패했습니다.' : '방과후 생성에 실패했습니다.');
    }
  };

  return (
    <S.Container>
      <S.Content>
        <S.Form>
          <S.FormSection>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <S.SectionTitle>담당 교사</S.SectionTitle>
              <S.EnterHint>엔터를 치면 입력됩니다</S.EnterHint>
            </div>
            <SearchDropdown
              placeholder="교사"
              items={teachersData.map((t: TeacherSearchResponse) => t.name)}
              value={teacher?.name || ''}
              onChange={(value) => {
                const teacher = teachersData.find((t: TeacherSearchResponse) => t.name === value);
                setTeacher(teacher || null);
              }}
              searchQuery={teacherSearchQuery}
              onSearchChange={setTeacherSearchQuery}
            />
          </S.FormSection>


          <S.FormSection>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <S.SectionTitle>장소</S.SectionTitle>
              <S.EnterHint>엔터를 치면 입력됩니다</S.EnterHint>
            </div>
            <SearchDropdown
              placeholder="장소"
              items={placesData.map((p: PlaceSearchResponse) => p.name)}
              value={selectedLocation?.name || ''}
              onChange={(value) => {
                const place = placesData.find((p: PlaceSearchResponse) => p.name === value);
                setSelectedLocation(place || null);
              }}
              searchQuery={locationSearchQuery}
              onSearchChange={setLocationSearchQuery}
            />
          </S.FormSection>

          <S.FormSection>
            <S.SectionTitle>교시</S.SectionTitle>
            <Dropdown
              placeholder="교시 선택"
              items={[...periodOptions]}
              value={period}
              onChange={setPeriod}
              customWidth="100%"
            />
          </S.FormSection>

          <S.FormSection>
            <S.SectionTitle>방과후 이름</S.SectionTitle>
            <TextInput
              placeholder="방과후 이름을 입력해주세요"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
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
                placeholder="학생을 입력해주세요"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                onKeyDown={handleStudentEnterKeyPress}
                leftIcon={
                  <img
                    src="/icons/common/search.svg"
                    alt="search"
                    style={{ width: '20px', height: '20px' }}
                  />
                }
              />

              {studentSearchQuery && (
                <S.StudentDropdown>
                  {isTeamMode ? (
                    teamsData
                      .filter((team: TeamSearchResponse) => {
                        const teamMemberIds = new Set(team.members.map((member) => member.id.toString()));
                        return !team.members.every((member) =>
                          selectedStudents.some((selected) => selected.id === member.id.toString())
                        ) && teamMemberIds.size > 0;
                      })
                      .map((team: TeamSearchResponse) => (
                        <S.StudentDropdownItem
                          key={team.id}
                          onClick={() => handleAddStudent(team)}
                        >
                          {team.name} ({team.members.length}명)
                        </S.StudentDropdownItem>
                      ))
                  ) : (
                    studentsData
                      .filter((student: StudentSearchResponse) =>
                        !selectedStudents.find((s) => s.id === student.id.toString())
                      )
                      .map((student: StudentSearchResponse) => (
                        <S.StudentDropdownItem
                          key={student.id}
                          onClick={() => handleAddStudent(student)}
                        >
                          {formatStudentDisplay(student)}
                        </S.StudentDropdownItem>
                      ))
                  )}
                </S.StudentDropdown>
              )}
            </S.DropdownWrapper>
          </S.FormSection>

          {selectedStudents.length > 0 && (
            <S.StudentGrid>
              {selectedStudents.map((student) => (
                <S.StudentCard key={`${student.id ?? student.studentNumber}-${student.name}-${student.grade}`}>
                  <S.StudentInfo>
                    <S.StudentNumber>
                      {student.grade != null && student.classNumber != null
                        ? `${student.grade}${student.classNumber}${String(student.studentNumber).slice(-2).padStart(2, '0')}`
                        : String(student.studentNumber)}
                    </S.StudentNumber>
                    <S.StudentName>{student.name}</S.StudentName>
                  </S.StudentInfo>
                  <S.RemoveButton onClick={() => handleRemoveStudent(String(student.id ?? student.studentNumber))}>
                    <img src="/icons/common/x.svg" alt="삭제" width={20} height={20} />
                  </S.RemoveButton>
                </S.StudentCard>
              ))}
            </S.StudentGrid>
          )}
        </S.Form>
      </S.Content>

      <S.ButtonRow>
        <Button text="취소" variant="cancel" width="27rem" onClick={handleCancel} />
        <Button text="완료" variant="confirm" width="27rem" onClick={handleSubmit} />
      </S.ButtonRow>
    </S.Container>
  );
}
