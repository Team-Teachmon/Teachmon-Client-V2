import { useState, useMemo, useEffect } from 'react';
import JSONbig from 'json-bigint';
import { useSearchParams } from 'react-router-dom';
import type { CalendarEvent } from '@/types/calendar';
import type { ExchangeRequest } from '@/types/home';
import { useUserStore } from '@/stores/useUserStore';
import { useSupervisionSearchQuery } from '@/services/supervision/supervision.query';
import { useRequestSupervisionExchangeMutation } from '@/services/supervision/supervision.mutation';
import { useSupervisionCalendarEvents } from './useSupervisionCalendarEvents';

const JSONbigNative = JSONbig({ useNativeBigInt: false, storeAsString: true });

export const useSupervision = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const monthParam = searchParams.get('month');
    const queryParam = searchParams.get('query') ?? '';

    const currentDate = new Date();
    const [year, setYear] = useState(currentDate.getFullYear());
    const [month, setMonth] = useState(monthParam ? parseInt(monthParam, 10) : currentDate.getMonth() + 1);

    const [exchangeMode, setExchangeMode] = useState(false);
    const [selectedMyEvent, setSelectedMyEvent] = useState<CalendarEvent | null>(null);
    const [showMyOnly, setShowMyOnly] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [exchangeRequest, setExchangeRequest] = useState<ExchangeRequest | null>(null);
    const [exchangeIds, setExchangeIds] = useState<{ requestorId: string; changeId: string } | null>(null);
    const user = useUserStore((state) => state.user);
    // BigInt 값이므로 string으로 유지
    const currentTeacherId = user?.id ? String(user.id) : null;

    const { mutate: requestExchange } = useRequestSupervisionExchangeMutation();

    // 지정된 달이 아니라 달력에 표시되는 날짜 범위를 기준으로 조회
    const baseEvents = useSupervisionCalendarEvents(useSupervisionSearchQuery, year, month, queryParam);

    const events = useMemo(() => {
        let filtered = baseEvents;

        if (showMyOnly && currentTeacherId) {
            filtered = filtered.filter((event) => String(event.teacherId) === currentTeacherId);
        }

        return filtered;
    }, [baseEvents, showMyOnly, currentTeacherId]);

    const parseSupervisionId = (eventId: string) => {
        const rawId = eventId.split('_')[1];
        if (!rawId) return null;

        try {
            const parsed = JSONbigNative.parse(`{"id":${rawId}}`) as { id?: string | number };
            if (!parsed.id) return null;
            return String(parsed.id);
        } catch {
            return null;
        }
    };

    useEffect(() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('month', String(month));
        setSearchParams(newParams, { replace: true });
    }, [month, setSearchParams]);

    const handleMonthChange = (newYear: number, newMonth: number) => {
        setYear(newYear);
        setMonth(newMonth);
    };

    const handleExchangeClick = () => {
        if (exchangeMode) {
            setExchangeMode(false);
            setSelectedMyEvent(null);
            setExchangeIds(null);
        } else {
            setExchangeMode(true);
        }
    };

    const handleMyEventSelect = (event: CalendarEvent) => {
        setSelectedMyEvent(event);
    };

    const handleTargetEventSelect = (event: CalendarEvent) => {
        if (selectedMyEvent && selectedMyEvent.teacherId && selectedMyEvent.supervisionType && event.teacherId && event.supervisionType) {
            const requestorId = parseSupervisionId(selectedMyEvent.id);
            const changeId = parseSupervisionId(event.id);
            if (!requestorId || !changeId) return;

            const newRequest: ExchangeRequest = {
                id: Date.now(),
                status: 'PENDING',
                requestor: {
                    teacher: { id: selectedMyEvent.teacherId, name: selectedMyEvent.label.replace(' 선생님', '') },
                    day: selectedMyEvent.date.toISOString(),
                    type: selectedMyEvent.supervisionType,
                },
                responser: {
                    teacher: { id: event.teacherId, name: event.label.replace(' 선생님', '') },
                    day: event.date.toISOString(),
                    type: event.supervisionType,
                },
                reason: '',
            };
            setExchangeRequest(newRequest);
            setExchangeIds({ requestorId, changeId });
            setIsModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setExchangeRequest(null);
        setExchangeIds(null);
    };

    const handleSubmit = (reason: string) => {
        if (!exchangeIds) return;
        requestExchange(
            {
                requestor_supervision_id: exchangeIds.requestorId,
                change_supervision_id: exchangeIds.changeId,
                reason,
            },
            {
                onSuccess: () => {
                    handleCloseModal();
                    setExchangeMode(false);
                    setSelectedMyEvent(null);
                },
            }
        );
    };

    return {
        year,
        month,
        events,
        currentTeacherId,
        exchangeMode,
        selectedMyEvent,
        showMyOnly,
        isModalOpen,
        exchangeRequest,
        handleMonthChange,
        handleExchangeClick,
        setShowMyOnly,
        handleMyEventSelect,
        handleTargetEventSelect,
        handleCloseModal,
        handleSubmit,
    };
};
