import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as S from './style';
import type { ExchangeRequest } from '@/types/supervision';
import WelcomeSection from '@/containers/home/welcome';
import QuickLinkSection from '@/containers/home/quick-link';
import ExchangeRequestSection from '@/containers/home/exchange-request';
import WeeklyExitSection from '@/containers/home/weekly-exit';
import ExchangeDetailModal from '@/components/ui/exchange-detail-modal';
import {
    homeQueryKeys,
    useExchangeRequestsQuery,
    useMySupervisionDaysQuery,
    useTodaySupervisionQuery,
    useWeeklyExitStudentsQuery,
} from '@/services/home/home.query';
import {
    useAcceptExchangeRequestMutation,
    useCheckExchangeRequestMutation,
    useRejectExchangeRequestMutation,
} from '@/services/home/home.mutation';
import { useUserStore } from '@/stores/useUserStore';

export default function HomePage() {
    const [selectedExchange, setSelectedExchange] = useState<ExchangeRequest | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const queryClient = useQueryClient();
    const user = useUserStore((state) => state.user);
    const month = new Date().getMonth() + 1;
    const currentTeacherId = user?.id ?? '';

    const { data: todaySupervision } = useTodaySupervisionQuery();
    const { data: mySupervisionDays } = useMySupervisionDaysQuery(month);
    const { data: exchangeRequests, isLoading: isExchangeRequestsLoading } = useExchangeRequestsQuery();
    const { data: weeklyExitStudents, isLoading: isWeeklyExitStudentsLoading } = useWeeklyExitStudentsQuery();
    const { mutate: acceptExchange, isPending: isAccepting } = useAcceptExchangeRequestMutation();
    const { mutate: rejectExchange, isPending: isRejecting } = useRejectExchangeRequestMutation();
    const isProcessingExchange = isAccepting || isRejecting;
    const { mutate: checkExchange } = useCheckExchangeRequestMutation();

    const exchanges = [...(exchangeRequests ?? [])].sort((a, b) => {
        const aId = String(a.id);
        const bId = String(b.id);
        if (aId.length !== bId.length) return bId.length - aId.length;
        return bId.localeCompare(aId);
    });
    const exits = weeklyExitStudents ?? [];
    const totalSupervisionCount = mySupervisionDays?.length ?? 0;

    const handleOpenModal = (exchange: ExchangeRequest) => {
        setSelectedExchange(exchange);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedExchange(null);
    };

    const handleAccept = () => {
        if (!selectedExchange?.id || isProcessingExchange) return;
        acceptExchange(selectedExchange.id, {
            onSuccess: () => {
                toast.success('교체요청을 수락했어요.');
                queryClient.invalidateQueries({
                    queryKey: homeQueryKeys.exchangeRequests(),
                });
                handleCloseModal();
            },
            onError: () => {
                toast.error('교체요청 수락에 실패했어요.');
            },
        });
    };

    const handleReject = () => {
        if (!selectedExchange?.id || isProcessingExchange) return;
        rejectExchange(selectedExchange.id, {
            onSuccess: () => {
                toast.success('교체요청을 거절했어요.');
                queryClient.invalidateQueries({
                    queryKey: homeQueryKeys.exchangeRequests(),
                });
                handleCloseModal();
            },
            onError: () => {
                toast.error('교체요청 거절에 실패했어요.');
            },
        });
    };

    const handleCheck = () => {
        if (!selectedExchange?.id) return;
        checkExchange(selectedExchange.id, {
            onSuccess: () => {
                toast.success('교체요청을 확인했어요.');
                queryClient.invalidateQueries({
                    queryKey: homeQueryKeys.exchangeRequests(),
                });
                handleCloseModal();
            },
            onError: () => {
                toast.error('교체요청 확인 처리에 실패했어요.');
            },
        });
    };

    return (
        <S.Container>
            <S.TopSection>
                <WelcomeSection
                    todayType={todaySupervision?.type}
                    totalCount={totalSupervisionCount}
                />
                <QuickLinkSection />
            </S.TopSection>

            <S.BottomSection>
                <ExchangeRequestSection
                    exchanges={exchanges}
                    isLoading={isExchangeRequestsLoading}
                    currentTeacherId={currentTeacherId}
                    onOpenModal={handleOpenModal}
                />
                <WeeklyExitSection
                    exits={exits}
                    isLoading={isWeeklyExitStudentsLoading}
                />
            </S.BottomSection>

            <ExchangeDetailModal
                isOpen={isModalOpen}
                exchange={selectedExchange}
                currentTeacherId={currentTeacherId}
                onClose={handleCloseModal}
                onAccept={handleAccept}
                onReject={handleReject}
                onCheck={handleCheck}
                isProcessing={isProcessingExchange}
            />
        </S.Container>
    );
}
