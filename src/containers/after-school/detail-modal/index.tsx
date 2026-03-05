import type { AllAfterSchool, MyAfterSchool, TodayAfterSchool } from '@/types/after-school';
import Modal from '@/components/layout/modal';
import * as S from './style';

type AfterSchoolClassData = AllAfterSchool | MyAfterSchool | TodayAfterSchool;

interface AfterSchoolDetailModalProps {
  classData: AfterSchoolClassData | null;
  isOpen: boolean;
  onClose: () => void;
}

function getDisplayDay(classData: AfterSchoolClassData): string {
  if ('day' in classData && classData.day) return classData.day;
  if ('week_day' in classData && classData.week_day) return classData.week_day;
  return '';
}

export default function AfterSchoolDetailModal({
  classData,
  isOpen,
  onClose,
}: AfterSchoolDetailModalProps) {
  if (!classData) return null;

  const day = getDisplayDay(classData);
  const students = classData.students ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} padding="0">
      <S.Container>
        <S.Header>
          <S.HeaderTop>
            <S.TimeLabel>{day} {classData.period}</S.TimeLabel>
            <S.CloseButton onClick={onClose}>
              <S.CloseIcon>✕</S.CloseIcon>
            </S.CloseButton>
          </S.HeaderTop>
          <S.Title>{classData.name}</S.Title>
        </S.Header>

        <S.Content>
          {classData.teacher && (
            <S.InfoRow>
              <S.InfoLabel>담당교사</S.InfoLabel>
              <S.InfoValue>{classData.teacher.name}</S.InfoValue>
            </S.InfoRow>
          )}

          {classData.place && (
            <S.InfoRow>
              <S.InfoLabel>장소</S.InfoLabel>
              <S.InfoValue>{classData.place.name}</S.InfoValue>
            </S.InfoRow>
          )}

          {students.length > 0 && (
            <S.StudentGrid>
              {students.map((student, idx) => (
                <S.StudentCard key={idx}>
                  <S.StudentInfo>{student.number} {student.name}</S.StudentInfo>
                </S.StudentCard>
              ))}
            </S.StudentGrid>
          )}
        </S.Content>
      </S.Container>
    </Modal>
  );
}
