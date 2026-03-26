import Modal from '@/components/layout/modal';
import { useQuery } from '@tanstack/react-query';
import { fixedMovementQuery } from '@/services/fixed-movement/fixedMovement.query';
import { PERIOD_LABEL, WEEKDAY_LABEL } from '@/constants/fixedMovement';
import type { TeamResponse } from '@/types/fixedMovement';
import * as S from './style';
import closeIcon from '/icons/common/x.svg';

interface DetailModalProps {
  movementId?: string | null;
  teamId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  teamData?: TeamResponse;
}

export default function DetailModal({
  movementId,
  teamId,
  isOpen,
  onClose,
  teamData
}: DetailModalProps) {
  const { data: movementData } = useQuery(
    fixedMovementQuery.detail(movementId || undefined)
  );

  if (movementId && movementData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} padding="0">
        <S.Container>
          <S.Header>
            <S.Title>고정 이석 상세 정보</S.Title>
            <S.CloseButton onClick={onClose}>
              <img src={closeIcon} alt="닫기" />
            </S.CloseButton>
          </S.Header>
          <S.Content>
            <S.InfoSection>
              <S.InfoLabel>요일</S.InfoLabel>
              <S.InfoValue>{WEEKDAY_LABEL[(movementData.weekday || movementData.week_day) as keyof typeof WEEKDAY_LABEL]}</S.InfoValue>
            </S.InfoSection>
            <S.InfoSection>
              <S.InfoLabel>시간</S.InfoLabel>
              <S.InfoValue>{PERIOD_LABEL[movementData.period as keyof typeof PERIOD_LABEL]}</S.InfoValue>
            </S.InfoSection>
            <S.InfoSection>
              <S.InfoLabel>장소</S.InfoLabel>
              <S.InfoValue>
                {typeof movementData.place === 'string' ? movementData.place : movementData.place?.name}
              </S.InfoValue>
            </S.InfoSection>
            <S.InfoSection>
              <S.InfoLabel>사유</S.InfoLabel>
              <S.InfoValue>{movementData.cause}</S.InfoValue>
            </S.InfoSection>
            <S.InfoSection>
              <S.InfoLabel>학생 {movementData.students?.length || 0}명</S.InfoLabel>
              <S.StudentGrid>
                {movementData.students?.map((student, idx: number) => (
                  <S.StudentCard key={idx}>
                    <S.StudentNumber>{student.number}</S.StudentNumber>
                    <S.StudentName>{student.name}</S.StudentName>
                  </S.StudentCard>
                ))}
              </S.StudentGrid>
            </S.InfoSection>
          </S.Content>
        </S.Container>
      </Modal>
    );
  }
  const displayTeamData = teamData;

  if (teamId && displayTeamData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} padding="0">
        <S.Container>
          <S.Header>
            <S.Title>팀 상세 정보</S.Title>
            <S.CloseButton onClick={onClose}>
              <img src={closeIcon} alt="닫기" />
            </S.CloseButton>
          </S.Header>
          <S.Content>
            <S.InfoSection>
              <S.InfoLabel>팀 이름</S.InfoLabel>
              <S.InfoValue>{displayTeamData.name}</S.InfoValue>
            </S.InfoSection>
            <S.InfoSection>
              <S.InfoLabel>학생 {displayTeamData.members?.length || 0}명</S.InfoLabel>
              <S.StudentGrid>
                {displayTeamData.members?.map((member, idx: number) => (
                  <S.StudentCard key={idx}>
                    <S.StudentNumber>{member.grade}{member.classNumber}{member.number < 10 ? `0${member.number}` : member.number}</S.StudentNumber>
                    <S.StudentName>{member.name}</S.StudentName>
                  </S.StudentCard>
                ))}
              </S.StudentGrid>
            </S.InfoSection>
          </S.Content>
        </S.Container>
      </Modal>
    );
  }

  return null;
}
