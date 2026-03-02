import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type { ChangeEvent } from 'react';
import TextInput from '@/components/ui/input/text-input';
import Button from '@/components/ui/button';
import { searchQuery } from '@/services/search/search.query';
import { teamQuery } from '@/services/team/team.query';
import { useCreateTeamMutation, useUpdateTeamMutation } from '@/services/team/team.mutation';
import { useDebounce } from '@/hooks/useDebounce';
import type { Student } from '@/types/fixedMovement';
import * as S from '../../create/style';


export default function TeamFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const createMutation = useCreateTeamMutation();
  const updateMutation = useUpdateTeamMutation();
  const isProcessingStudent = useRef(false);

  const { data: teamsData } = useQuery(teamQuery.list());

  const [teamName, setTeamName] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [studentIdMap, setStudentIdMap] = useState<Record<number, number>>({});
  const [searchInput, setSearchInput] = useState('');

  const debouncedSearch = useDebounce(searchInput, 300);
  const { data: studentResults = [] } = useQuery(searchQuery.students(debouncedSearch));

  useEffect(() => {
    if (isEditMode && teamsData) {
      const team = teamsData.find((t) => String(t.id) === id);
      if (team) {
        flushSync(() => {
          setTeamName(team.name);
          setSelectedStudents(
            team.members.map((m) => ({
              studentNumber: m.grade * 1000 + m.classNumber * 100 + m.number,
              name: m.name,
            })),
          );
          const idMap: Record<number, number> = {};
          team.members.forEach((m) => {
            const studentNumber = m.grade * 1000 + m.classNumber * 100 + m.number;
            idMap[studentNumber] = m.id;
          });
          setStudentIdMap(idMap);
        });
      }
    }
  }, [isEditMode, teamsData, id]);

  const handleAddStudent = (student: Student) => {
    if (!selectedStudents.find(s => s.studentNumber === student.studentNumber)) {
      setSelectedStudents([...selectedStudents, student]);
    }
    setSearchInput('');
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
      e.stopPropagation();
      
      if (isProcessingStudent.current) return;
      isProcessingStudent.current = true;

      const filteredResults = studentResults.filter(student => {
        const currentStudentNumber = Number(`${student.grade}${student.classNumber}${String(student.number).padStart(2, '0')}`);
        return !selectedStudents.find(s =>
          (studentIdMap[s.studentNumber] && studentIdMap[s.studentNumber] === student.id) ||
          (!studentIdMap[s.studentNumber] && s.studentNumber === currentStudentNumber)
        );
      });

      if (filteredResults.length > 0) {
        const student = filteredResults[0];
        handleAddStudent({
          id: typeof student.id === 'number' ? student.id : Number(student.id),
          studentNumber: Number(`${student.grade}${student.classNumber}${String(student.number).padStart(2, '0')}`),
          name: student.name,
          grade: student.grade,
          classNumber: student.classNumber,
        });
      }
      
      setTimeout(() => {
        isProcessingStudent.current = false;
      }, 100);
    }
  };

  const handleCancel = () => {
    navigate('/admin/fixed-movement/team-settings');
  };

  const handleSubmit = () => {
    if (!teamName.trim()) {
      toast.error('팀 이름을 입력해주세요.');
      return;
    }

    if (selectedStudents.length === 0) {
      toast.error('학생을 1명 이상 선택해주세요.');
      return;
    }

    if (isEditMode && id) {
      updateMutation.mutate({
        id,
        name: teamName,
        students: selectedStudents.map((s) => ({
          id: String(studentIdMap[s.studentNumber] ?? s.id!),
          student_number: s.studentNumber,
          name: s.name,
        })),
      });
    } else {
      createMutation.mutate({
        name: teamName,
        students_id: selectedStudents.map((s) => String(s.id!)),
      });
    }
  };

  return (
    <S.Container>
      <S.Content>
        <S.Title>{isEditMode ? '팀 수정' : '팀 추가'}</S.Title>

        <S.Form>
          <S.FormSection>
            <S.SectionTitle>팀 이름</S.SectionTitle>
            <TextInput
              placeholder="팀 이름을 입력해주세요"
              value={teamName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTeamName(e.target.value)}
            />
          </S.FormSection>

          <S.FormSection>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <S.SectionTitle>학생</S.SectionTitle>
              <S.EnterHint>엔터를 치면 입력됩니다</S.EnterHint>
            </div>
            <S.DropdownWrapper>
              <TextInput
                placeholder="학생을 검색해주세요"
                value={searchInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
                onKeyDown={handleStudentEnterKeyPress}
                leftIcon={
                  <img
                    src="/icons/common/search.svg"
                    alt="search"
                    style={{ width: '20px', height: '20px' }}
                  />
                }
              />

              {searchInput && studentResults.length > 0 && (
                <S.StudentDropdown>
                  {studentResults
                    .filter(student =>
                      !selectedStudents.find(s => {
                        const currentStudentNumber = Number(`${student.grade}${student.classNumber}${String(student.number).padStart(2, '0')}`);
                        return (studentIdMap[s.studentNumber] && studentIdMap[s.studentNumber] === student.id) || 
                               (!studentIdMap[s.studentNumber] && s.studentNumber === currentStudentNumber);
                      })
                    )
                    .slice(0, 5)
                    .map((student) => (
                      <S.StudentDropdownItem
                        key={student.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isProcessingStudent.current) return;
                          isProcessingStudent.current = true;
                          handleAddStudent({ 
                            id: typeof student.id === 'number' ? student.id : Number(student.id),
                            studentNumber: Number(`${student.grade}${student.classNumber}${String(student.number).padStart(2, '0')}`), 
                            name: student.name, 
                            grade: student.grade, 
                            classNumber: student.classNumber 
                          });
                          setTimeout(() => {
                            isProcessingStudent.current = false;
                          }, 100);
                        }}
                      >
                        {student.grade}{student.classNumber}{student.number < 10 ? `0${student.number}` : student.number} {student.name}
                      </S.StudentDropdownItem>
                    ))
                  }
                </S.StudentDropdown>
              )}
            </S.DropdownWrapper>
          </S.FormSection>

          {selectedStudents.length > 0 && (
            <S.StudentGrid>
              {selectedStudents.map((student) => (
                <S.StudentCard key={student.studentNumber}>
                  <S.StudentInfo>
                    <S.StudentNumber>{student.grade && student.classNumber ? `${student.grade}${student.classNumber}${String(student.studentNumber).slice(-2).padStart(2, '0')}` : student.studentNumber}</S.StudentNumber>
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
        <Button text="취소" variant="cancel" width="27rem" onClick={handleCancel} />
        <Button text="완료" variant="confirm" width="27rem" onClick={handleSubmit} />
      </S.ButtonRow>
    </S.Container>
  );
}
