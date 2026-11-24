import { useState, useEffect } from 'react';
import Modal from '@/components/layout/modal';
import Button from '@/components/ui/button';
import { useDevice } from '@/hooks/useDevice';
import type { ExchangeRequest } from '@/types/supervision';
import { formatDateFull, formatSupervisionType } from '@/utils/format';
import * as S from './style';

interface ExchangeDetailModalProps {
    isOpen: boolean;
    exchange: ExchangeRequest | null;
    currentTeacherId: number | string;
    onClose: () => void;
    onAccept: () => void;
    onReject: () => void;
    onCheck?: () => void;
    onSubmit?: (reason: string) => void;
    isProcessing?: boolean;
}

export default function ExchangeDetailModal({
    isOpen,
    exchange,
    currentTeacherId,
    onClose,
    onAccept,
    onReject,
    onCheck,
    onSubmit,
    isProcessing = false,
}: ExchangeDetailModalProps) {
    const [reason, setReason] = useState('');
    const { isMobile } = useDevice();

    useEffect(() => {
        if (isOpen && exchange) {
            setReason(exchange.reason || '');
        }
    }, [isOpen, exchange]);

    if (!exchange) return null;

    const isReceiver = String(exchange.responser.teacher.id) === String(currentTeacherId);
    const isPending = exchange.status === 'PENDING';
    const isDecided = exchange.status === 'ACCEPTED' || exchange.status === 'REJECTED';
    const isCreating = !!onSubmit;

    const getModalTitle = () => {
        if (isCreating) {
            return { text: '교체요청', statusText: '', statusColor: '' };
        }
        if (isReceiver && isPending) {
            return { text: '교체요청', statusText: '', statusColor: '' };
        }
        if (exchange.status === 'REJECTED') {
            return { text: '교체요청', statusText: '거절됨', statusColor: 'rejected' };
        }
        if (exchange.status === 'ACCEPTED') {
            return { text: '교체요청', statusText: '수락됨', statusColor: 'accepted' };
        }
        return { text: '교체요청', statusText: '', statusColor: '' };
    };

    const titleInfo = getModalTitle();

    const handleSubmit = () => {
        if (onSubmit) {
            onSubmit(reason);
        }
    };

    const modalPadding = isMobile ? '32px 24px' : '52px 24px';

    return (
        <Modal isOpen={isOpen} onClose={onClose} padding={modalPadding}>
            <S.Container>
                <S.Title>
                    {titleInfo.text}
                    {titleInfo.statusText && (
                        <>
                            (<S.StatusText status={titleInfo.statusColor as 'rejected' | 'accepted'}>{titleInfo.statusText}</S.StatusText>)
                        </>
                    )}
                </S.Title>

                <S.CardsContainer>
                    <S.Card>
                        <S.CardTitle>{exchange.requestor.teacher.name} 선생님</S.CardTitle>
                        <S.CardInfo>
                            <S.InfoRow>
                                <S.InfoIcon src="/icons/calendar.svg" alt="날짜" />
                                <S.InfoText>{formatDateFull(exchange.requestor.day)}</S.InfoText>
                            </S.InfoRow>
                            <S.InfoRow>
                                <S.InfoIcon src="/icons/manageType.svg" alt="감독" />
                                <S.InfoText>{formatSupervisionType(exchange.requestor.type)}</S.InfoText>
                            </S.InfoRow>
                        </S.CardInfo>
                    </S.Card>

                    <S.Card>
                        <S.CardTitle>{exchange.responser.teacher.name} 선생님</S.CardTitle>
                        <S.CardInfo>
                            <S.InfoRow>
                                <S.InfoIcon src="/icons/calendar.svg" alt="날짜" />
                                <S.InfoText>{formatDateFull(exchange.responser.day)}</S.InfoText>
                            </S.InfoRow>
                            <S.InfoRow>
                                <S.InfoIcon src="/icons/manageType.svg" alt="감독" />
                                <S.InfoText>{formatSupervisionType(exchange.responser.type)}</S.InfoText>
                            </S.InfoRow>
                        </S.CardInfo>
                    </S.Card>
                </S.CardsContainer>

                <S.ReasonSection>
                    <S.ReasonLabel>교체 사유</S.ReasonLabel>
                    <S.ReasonBox>
                        {isCreating ? (
                            <S.ReasonInput
                                placeholder="사유를 입력해주세요."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        ) : (
                            <S.ReasonText>{exchange.reason || '사유 없음'}</S.ReasonText>
                        )}
                    </S.ReasonBox>
                </S.ReasonSection>

                <S.ButtonContainer>
                    {isCreating ? (
                        <>
                            <Button variant="cancel" text="취소" onClick={onClose} width="50%" />
                            <Button variant="confirm" text="요청하기" onClick={handleSubmit} width="50%" />
                        </>
                    ) : isReceiver && isPending ? (
                        <>
                            <Button variant="delete" text="거절" onClick={onReject} width="50%" disabled={isProcessing} />
                            <Button variant="confirm" text="수락" onClick={onAccept} width="50%" disabled={isProcessing} />
                        </>
                    ) : (
                        <>
                            <Button variant="cancel" text="취소" onClick={onClose} width="50%" />
                            <Button
                                variant="confirm"
                                text="확인"
                                onClick={isDecided && onCheck ? onCheck : onClose}
                                width="50%"
                            />
                        </>
                    )}
                </S.ButtonContainer>
            </S.Container>
        </Modal>
    );
}
