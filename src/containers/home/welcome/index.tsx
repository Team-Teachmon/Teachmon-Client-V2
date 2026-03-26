import * as S from './style';
import type { SupervisionTodayType } from '@/types/supervision';

interface WelcomeSectionProps {
    todayType?: SupervisionTodayType;
    totalCount: number;
}


const supervisionMessageMap: Record<SupervisionTodayType, string> = {
    NONE: '오늘은 감독이 없습니다.',
    SELF_STUDY: '오늘은 자습 감독이 있는 날입니다.',
    LEAVE_SEAT: '오늘은 이석 감독이 있는 날입니다.',
    ALL: '오늘은 자습/이석 감독이 있는 날입니다.',
};

export default function WelcomeSection({ todayType, totalCount }: WelcomeSectionProps) {
    const message = todayType
        ? supervisionMessageMap[todayType]
        : '오늘의 감독 정보를 불러오는 중입니다.';

    return (
        <S.WelcomeCard bgImage="/assets/mainBg.png">
            <S.WelcomeContent>
                <S.WelcomeTitle>티치몬에 오신 것을 환영합니다.</S.WelcomeTitle>
                <S.WelcomeBottom>
                    <S.WelcomeMessage>{message}</S.WelcomeMessage>
                    <S.SupervisionCount>이번 달 감독 횟수: {totalCount}회</S.SupervisionCount>
                </S.WelcomeBottom>
            </S.WelcomeContent>
        </S.WelcomeCard>
    );
}
