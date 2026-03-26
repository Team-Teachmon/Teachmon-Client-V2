import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/button';
import { toast } from 'react-toastify';
import AdminAfterSchoolHeaderContainer from '@/containers/admin/after-school/after-school-header';
import TableLayout from '@/components/layout/table';
import ConfirmModal from '@/components/layout/modal/confirm';
import type { AfterSchoolRequestParams } from '@/types/after-school';
import * as S from './style';
import { WEEKDAYS, REVERSE_DAY_MAP, QUARTER_ITEMS } from '@/constants/admin';
import type { AdminAfterSchoolClass } from '@/types/after-school';
import { useNavigate } from 'react-router-dom';
import AfterSchoolDetailModal from '@/containers/admin/after-school/detail-modal';
import { afterSchoolQuery } from '@/services/after-school/afterSchool.query';
import { deleteAfterSchoolClass, getAfterSchoolClasses } from '@/services/after-school/afterSchool.api';
import { API_WEEKDAY_TO_UI } from '@/utils/afterSchool';
import { useAfterSchoolColumns } from '@/hooks/useAfterSchoolColumns';
import type { TableColumn } from '@/components/layout/table';
import {
  openAdminAfterSchoolLoadingWindow,
  createAdminAfterSchoolPrintHtml,
  renderAdminAfterSchoolPrintWindow,
  type PdfWeekDay,
  type PdfSlot,
  type PdfScheduleCell,
} from '@/utils/adminAfterSchoolPdf';
import { getApiErrorMessage } from '@/utils/error';

const PDF_WEEK_DAYS: PdfWeekDay[] = ['MON', 'TUE', 'WED', 'THU'];
const PDF_SLOTS: PdfSlot[] = [
  { startPeriod: 8, endPeriod: 9 },
  { startPeriod: 10, endPeriod: 11 },
];

export default function AdminAfterSchoolPage() {
  const navigate = useNavigate();
  const [selectedGrade, setSelectedGrade] = useState<1 | 2 | 3>(() => {
    const saved = localStorage.getItem('adminAfterSchoolGrade');
    return saved ? Number(saved) as 1 | 2 | 3 : 1;
  });
  const [selectedClass, setSelectedClass] = useState<AdminAfterSchoolClass | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState(() => {
    const saved = localStorage.getItem('adminAfterSchoolQuarter');
    return saved || '1분기';
  });
  const [selectedDay, setSelectedDay] = useState<(typeof WEEKDAYS)[number]>(() => {
    const saved = localStorage.getItem('adminAfterSchoolDay');
    return saved && WEEKDAYS.includes(saved as any) ? saved as (typeof WEEKDAYS)[number] : WEEKDAYS[0];
  });
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const { columns } = useAfterSchoolColumns() as unknown as { columns: TableColumn<AdminAfterSchoolClass>[] };
  const branch = useMemo(() => {
    const match = selectedQuarter.match(/\d+/);
    const value = match ? Number(match[0]) : 1;
    return Number.isFinite(value) ? value : 1;
  }, [selectedQuarter]);

  const apiParams: AfterSchoolRequestParams = useMemo(() => ({
    grade: selectedGrade,
    branch,
    week_day: REVERSE_DAY_MAP[selectedDay],
    start_period: 8,
    end_period: 11,
  }), [selectedGrade, selectedDay, branch]);

  const { data: apiData } = useQuery({
    ...afterSchoolQuery.classes(apiParams),
  });

  const queryClient = useQueryClient();

  const classes = useMemo(() => {
    if (!apiData) return [];

    return apiData.map((item): AdminAfterSchoolClass => ({
      id: item.id.toString(),
      grade: selectedGrade,
      day: API_WEEKDAY_TO_UI[item.week_day] ?? (selectedDay as (typeof WEEKDAYS)[number]),
      period: item.period,
      teacher: item.teacher.name,
      teacherId: item.teacher.id,
      location: item.place.name,
      placeId: Number(item.place.id),
      subject: item.name,
      students: item.students.map(student => `${student.number} ${student.name}`),
      studentIds: item.students.map(student => student.id ?? 0),
    }));
  }, [apiData, selectedGrade, selectedDay]);

  const filteredClasses = classes.filter(
    cls => cls.grade === selectedGrade && cls.day === selectedDay
  );

  useEffect(() => {
    localStorage.setItem('adminAfterSchoolGrade', selectedGrade.toString());
  }, [selectedGrade]);

  useEffect(() => {
    localStorage.setItem('adminAfterSchoolQuarter', selectedQuarter);
  }, [selectedQuarter]);

  useEffect(() => {
    localStorage.setItem('adminAfterSchoolDay', selectedDay);
  }, [selectedDay]);

  const handleEdit = (classData: AdminAfterSchoolClass, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    // localStorage에 afterschool ID 저장
    localStorage.setItem('currentAfterSchoolId', classData.id);
    navigate(`/admin/after-school/edit/${classData.id}`, { state: { ...classData, selectedBranch: branch } });
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      try {
        const ids = deleteTargetId.split(',').map(id => id.trim()).filter(Boolean);
        await Promise.all(ids.map(id => deleteAfterSchoolClass(id)));
        toast.success('방과후가 성공적으로 삭제되었습니다.');
        await queryClient.invalidateQueries({ queryKey: ['afterSchool.classes'] });
      } catch {
        toast.error('방과후 삭제에 실패했습니다.');
      }
    }
    setIsDeleteModalOpen(false);
    setDeleteTargetId(null);
  };

  const handleAdd = () => {
    navigate('/admin/after-school/create', {
      state: {
        selectedDay: selectedDay,
        selectedBranch: branch,
        selectedGrade: selectedGrade,
      }
    });
  };

  const handleRowClick = (classData: AdminAfterSchoolClass) => {
    setSelectedClass(classData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClass(null);
  };

  const handlePdfDownload = async () => {
    const printWindow = openAdminAfterSchoolLoadingWindow();
    if (!printWindow) {
      toast.error('팝업이 차단되어 PDF 창을 열 수 없습니다. 팝업 차단을 해제해주세요.');
      return;
    }

    setIsPdfLoading(true);

    try {
      const requests = PDF_WEEK_DAYS.flatMap((weekDay) =>
        PDF_SLOTS.map(async (slot): Promise<PdfScheduleCell> => {
          const items = await getAfterSchoolClasses({
            grade: selectedGrade,
            branch,
            week_day: weekDay,
            start_period: slot.startPeriod,
            end_period: slot.endPeriod,
          });
          return {
            weekDay,
            slot,
            items,
          };
        })
      );

      const schedule = await Promise.all(requests);
      const html = createAdminAfterSchoolPrintHtml({
        grade: selectedGrade,
        branch,
        schedule,
      });
      renderAdminAfterSchoolPrintWindow(printWindow, html);
    } catch (error) {
      printWindow.close();
      toast.error(getApiErrorMessage(error, 'PDF 생성에 실패했습니다.'));
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handlePrevDay = () => {
    const currentIndex = WEEKDAYS.indexOf(selectedDay);
    const prevIndex = currentIndex === 0 ? WEEKDAYS.length - 1 : currentIndex - 1;
    setSelectedDay(WEEKDAYS[prevIndex]);
  };

  const handleNextDay = () => {
    const currentIndex = WEEKDAYS.indexOf(selectedDay);
    const nextIndex = currentIndex === WEEKDAYS.length - 1 ? 0 : currentIndex + 1;
    setSelectedDay(WEEKDAYS[nextIndex]);
  };

  const currentDayIndex = WEEKDAYS.indexOf(selectedDay);
  const prevDayIndex = currentDayIndex === 0 ? WEEKDAYS.length - 1 : currentDayIndex - 1;
  const nextDayIndex = currentDayIndex === WEEKDAYS.length - 1 ? 0 : currentDayIndex + 1;
  const prevDay = WEEKDAYS[prevDayIndex];
  const nextDay = WEEKDAYS[nextDayIndex];

  const renderActions = (row: AdminAfterSchoolClass) => (
    <S.ActionButtons>
      <Button text="수정" variant="confirm" width="100px" onClick={(e) => handleEdit(row, e)} />
      <Button text="삭제" variant="delete" width="100px" onClick={(e) => handleDelete(row.id, e)} />
    </S.ActionButtons>
  );

  return (
    <>
      <AfterSchoolDetailModal
        classData={selectedClass}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="삭제"
        message="정말로 이 방과후를 삭제하시겠습니까?"
        cancelText="취소"
        confirmText="삭제"
      />

      <S.PageContainer style={{ overflow: isDeleteModalOpen ? 'hidden' : undefined }}>
        <AdminAfterSchoolHeaderContainer
          quarterItems={[...QUARTER_ITEMS]}
          selectedQuarter={selectedQuarter}
          setSelectedQuarter={setSelectedQuarter}
          selectedGrade={selectedGrade}
          setSelectedGrade={setSelectedGrade}
          handlePdfDownload={handlePdfDownload}
          isPdfLoading={isPdfLoading}
        />

        <S.DaySelector>
          <S.NavButton onClick={handlePrevDay}>
            «
          </S.NavButton>
          <S.DayText $active={false} onClick={handlePrevDay}>
            {prevDay}
          </S.DayText>
          <S.DayText $active={true}>
            {selectedDay}
          </S.DayText>
          <S.DayText $active={false} onClick={handleNextDay}>
            {nextDay}
          </S.DayText>
          <S.NavButton onClick={handleNextDay}>
            »
          </S.NavButton>
        </S.DaySelector>

        <S.ContentWrapper>
          <S.TableWrapper>
            <TableLayout
              columns={columns}
              data={filteredClasses}
              renderActions={renderActions}
              actionsHeader=""
              onRowClick={handleRowClick}
            />
          </S.TableWrapper>

          <S.AddButtonWrapper>
            <Button text="+ 추가" variant="confirm" width="200px" onClick={handleAdd} />
          </S.AddButtonWrapper>
        </S.ContentWrapper>
      </S.PageContainer>
    </>
  );
}
