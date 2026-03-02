import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useQuery } from '@tanstack/react-query';
import { useCreateLeaveSeatMutation, useUpdateLeaveSeatMutation } from '@/services/movement/movement.mutation';
import { searchPlaces } from '@/services/search/search.api';
import { placeQuery } from '@/services/search/search.query';
import { useDebounce } from '@/hooks/useDebounce';
import { useLeaveSeatList } from '@/hooks/useLeaveSeatList';
import type { MovementFormData } from '@/constants/movement';
import TextInput from '@/components/ui/input/text-input';
import { FLOOR_ELEMENTS_MAP, type FloorElement } from '@/constants/floorMaps';
import { colors } from '@/styles/theme';
import { toast } from 'react-toastify';
import ConfirmModal from '@/components/layout/modal/confirm';

import * as S from './style';

interface MovementMapProps {
    onBack: () => void;
    formData: MovementFormData;
}

export default function MovementMap({ onBack, formData }: MovementMapProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isEditMode = searchParams.get('edit') === 'true';
    const editId = searchParams.get('id');
    
    const [selectedFloor, setSelectedFloor] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedPlace, setHighlightedPlace] = useState('');
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        placeName: string;
        students: string[];
    }>({
        isOpen: false,
        placeName: '',
        students: [],
    });

    const { mutateAsync: createLeaveSeat } = useCreateLeaveSeatMutation();
    const { mutateAsync: updateLeaveSeat } = useUpdateLeaveSeatMutation();
    
    const isFullPeriod = formData.period === 'EIGHT_TO_ELEVEN_PERIOD';
    
    // 현재 선택된 교시와 날짜의 이석 목록 불러오기
    const { data: leaveSeatList } = useLeaveSeatList({
        day: formData.day,
        period: formData.period,
    });
    
    // 장소 검색 (디바운스 적용)
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { data: searchResults = [] } = useQuery({
        ...placeQuery.search(debouncedSearchQuery),
        enabled: debouncedSearchQuery.length > 0,
    });
    
    // 이석이 있는 장소 목록
    const occupiedPlaces = new Set(leaveSeatList.map(seat => seat.place));

    const handleSelectPlace = (place: { name: string; floor: number }) => {
        setSelectedFloor(place.floor);
        setHighlightedPlace(place.name);
        setSearchQuery('');
        
        // 4초 후 하이라이트 해제
        setTimeout(() => {
            setHighlightedPlace('');
        }, 4000);
    };

    const handleLocationClick = async (placeName: string) => {
        // 이미 이석이 있는 장소인 경우 확인 모달 표시
        if (occupiedPlaces.has(placeName)) {
            const occupiedSeats = leaveSeatList.filter(seat => seat.place === placeName);
            const studentNames = occupiedSeats.flatMap(seat => seat.students);
            
            setConfirmModal({
                isOpen: true,
                placeName,
                students: studentNames,
            });
            return;
        }
        
        if (placeName && placeName !== '' && placeName !== 'X') {
            try {
                // 장소 검색 API로 실제 place_id 획득
                const places = await searchPlaces(placeName, true);
                const place = places.find(p => p.name === placeName);
                
                if (!place) {
                    toast.error('장소를 찾을 수 없습니다.');
                    return;
                }
                
                if (isEditMode && editId) {
                    // 수정 모드: 모든 필드 전송
                    await updateLeaveSeat({
                        leaveseatId: editId,
                        data: {
                            day: formData.day,
                            period: formData.period,
                            place: place.id,
                            cause: formData.cause,
                            students: formData.students,
                        }
                    });
                    toast.success('이석이 수정되었습니다.');
                } else {
                    // 생성 모드
                    if (isFullPeriod) {
                        // 8~11교시: 8~9교시, 10~11교시 두 번 생성
                        await createLeaveSeat({
                            ...formData,
                            period: 'EIGHT_AND_NINE_PERIOD',
                            place_id: place.id,
                        });
                        await createLeaveSeat({
                            ...formData,
                            period: 'TEN_AND_ELEVEN_PERIOD',
                            place_id: place.id,
                        });
                    } else {
                        await createLeaveSeat({
                            ...formData,
                            place_id: place.id,
                        });
                    }
                    toast.success('이석이 작성되었습니다.');
                }
                navigate('/manage/record');
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleConfirmOccupiedPlace = async () => {
        const placeName = confirmModal.placeName;
        setConfirmModal({ isOpen: false, placeName: '', students: [] });
        
        try {
            // 장소 검색 API로 실제 place_id 획득
            const places = await searchPlaces(placeName, true);
            const place = places.find(p => p.name === placeName);
            
            if (!place) {
                toast.error('장소를 찾을 수 없습니다.');
                return;
            }
            
            if (isEditMode && editId) {
                // 수정 모드: 모든 필드 전송
                await updateLeaveSeat({
                    leaveseatId: editId,
                    data: {
                        day: formData.day,
                        period: formData.period,
                        place: place.id,
                        cause: formData.cause,
                        students: formData.students,
                    }
                });
                toast.success('이석이 수정되었습니다.');
            } else {
                // 생성 모드
                if (isFullPeriod) {
                    // 8~11교시: 8~9교시, 10~11교시 두 번 생성
                    await createLeaveSeat({
                        ...formData,
                        period: 'EIGHT_AND_NINE_PERIOD',
                        place_id: place.id,
                    });
                    await createLeaveSeat({
                        ...formData,
                        period: 'TEN_AND_ELEVEN_PERIOD',
                        place_id: place.id,
                    });
                } else {
                    await createLeaveSeat({
                        ...formData,
                        place_id: place.id,
                    });
                }
                toast.success('이석이 작성되었습니다.');
            }
            navigate('/manage/record');
        } catch (error) {
            console.error(error);
        }
    };

    const floors = Object.keys(FLOOR_ELEMENTS_MAP).map(Number);
    const elements = FLOOR_ELEMENTS_MAP[selectedFloor] || [];

    return (
        <S.Container>
            <S.BackButton onClick={onBack}>
                <img src="/icons/common/back.svg" alt="back" style={{ width: '24px', height: '24px' }} />
            </S.BackButton>

            {/* Floor Search Controls */}
            <S.FloorSearchContainer>
                <S.FloorSelector>
                    {floors.map((floor) => (
                        <S.FloorTab
                            key={floor}
                            $isSelected={selectedFloor === floor}
                            onClick={() => setSelectedFloor(floor)}
                        >
                            {floor}층
                        </S.FloorTab>
                    ))}
                </S.FloorSelector>

                <S.SearchWrapper>
                    <TextInput
                        placeholder="장소이름을 입력해주세요."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        customHeight="44px"
                        leftIcon={
                            <img 
                                src="/icons/common/search.svg" 
                                alt="search"
                                style={{ width: '24px', height: '24px' }}
                            />
                        }
                    />
                    
                    {/* 검색 결과 드롭다운 */}
                    {searchResults.length > 0 && (
                        <S.SearchResults>
                            {searchResults.map((place, index) => (
                                <S.SearchResultItem
                                    key={index}
                                    onClick={() => handleSelectPlace(place)}
                                >
                                    <S.PlaceName>{place.name}</S.PlaceName>
                                    <S.FloorBadge>{place.floor}층</S.FloorBadge>
                                </S.SearchResultItem>
                            ))}
                        </S.SearchResults>
                    )}
                </S.SearchWrapper>
            </S.FloorSearchContainer>

            <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={3}
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        {/* Zoom Controls */}
                        <S.ZoomControls>
                            <S.ZoomButton onClick={() => zoomIn()}>
                                <img src="/icons/student/zoom-in.svg" alt="zoom in" style={{ width: '30px', height: '30px' }} />
                            </S.ZoomButton>
                            <S.ZoomButton onClick={() => resetTransform()}>
                                <img src="/icons/student/mdi_reload.svg" alt="reset" style={{ width: '20px', height: '20px' }} />
                            </S.ZoomButton>
                            <S.ZoomButton onClick={() => zoomOut()}>
                                <img src="/icons/student/zoom-out.svg" alt="zoom out" style={{ width: '30px', height: '30px' }} />
                            </S.ZoomButton>
                        </S.ZoomControls>

                        <TransformComponent
                            wrapperStyle={{
                                width: '100%',
                                height: '100%',
                            }}
                            contentStyle={{
                                width: '100%',
                                height: '100%',
                            }}
                        >
                            {/* Map View */}
                            <S.MapContent>
                                <S.MapWrapper>
                                    {elements.map((el: FloorElement) => {
                                        const isHighlighted = !!highlightedPlace && highlightedPlace === el.name;
                                        const isStairsOrHallway = el.name.includes('계단') || el.name.includes('복도');
                                        const isClickable = el.name && el.name !== '' && el.name !== 'X' && !isStairsOrHallway;
                                        
                                        let backgroundColor = '#DDDDDD';
                                        if (isHighlighted) {
                                            backgroundColor = colors.primary200;
                                        } else if (isStairsOrHallway) {
                                            backgroundColor = '#DDDDDD'; // 회색 - 계단/복도
                                        } else if (el.name && el.name !== '' && el.name !== 'X') {
                                            backgroundColor = '#84FFC7'; // 초록색 - 선택 가능
                                        }
                                        
                                        return (
                                            <S.Element
                                                key={el.id}
                                                $left={el.x}
                                                $top={el.y}
                                                $width={el.width}
                                                $height={el.height}
                                                $background={backgroundColor}
                                                $cursor={!!isClickable}
                                                onClick={() => handleLocationClick(el.name)}
                                            >
                                                {el.name}
                                            </S.Element>
                                        );
                                    })}
                                </S.MapWrapper>
                            </S.MapContent>
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, placeName: '', students: [] })}
                onConfirm={handleConfirmOccupiedPlace}
                title="이미 이석이 등록된 장소입니다"
                message={
                    <div>
                        <div style={{ marginBottom: '12px' }}>
                            <strong>{confirmModal.placeName}</strong>에 다음 학생들이 이미 이석 중입니다:
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '20px', textAlign: 'left' }}>
                            {confirmModal.students.map((student, index) => (
                                <li key={index} style={{ marginBottom: '4px' }}>{student}</li>
                            ))}
                        </ul>
                        <div style={{ marginTop: '12px' }}>
                            그래도 이 장소에 이석을 등록하시겠습니까?
                        </div>
                    </div>
                }
                cancelText="취소"
                confirmText="등록"
            />
        </S.Container>
    );
}
