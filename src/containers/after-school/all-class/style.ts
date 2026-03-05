import styled from '@emotion/styled';
import { colors, fontSizes, radius } from '@/styles/theme';
import { mq } from '@/styles/media';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
  height: 100%;

  ${mq.mobile} {
    height: 45vh;
    gap: 0.5rem;
  }
`;

export const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const Title = styled.h2`
  font-size: ${fontSizes.H3};
  font-weight: 600;
  color: ${colors.text};
  
  @media (max-width: 1400px) {
    font-size: ${fontSizes.H4};
  }

  ${mq.mobile} {
    font-size: ${fontSizes.Body};
  }
`;

export const GradeTabs = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const GradeTab = styled.button<{ $active: boolean }>`
  padding: 0.75rem 2rem;
  background: transparent;
  color: ${({ $active }) => ($active ? colors.primary : colors.n03)};
  border: none;
  font-size: ${fontSizes.H3};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  cursor: pointer;
  transition: all 0.2s;
  
  @media (max-width: 1024px) {
    padding: 0.5rem 1.5rem;
    font-size: ${fontSizes.Body};
  }

  ${mq.mobile} {
    padding: 0.25rem 0.75rem;
    font-size: ${fontSizes.Small};
  }
`;

export const Container = styled.div`
  background: ${colors.background};
  border: 1px solid ${colors.n02};
  border-radius: ${radius.lg};
  padding: 1.5rem;
  flex: 1;
  overflow-x: hidden;
  min-width: 0;
  display: flex;
  flex-direction: column;

  ${mq.mobile} {
    height: 40vh;
    max-height: 31vh;
    padding: 1rem;
  }
`;

export const DayNavigation = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-bottom:0.9rem;

  ${mq.mobile} {
    gap: 0.5rem;
    margin-bottom: 0rem;
  }
`;

export const DayNavButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 0.2s;

  img {
    width: 36px;
    height: 36px;
  }

  &:hover img {
    filter: brightness(0) saturate(100%) invert(44%) sepia(85%) saturate(1200%) hue-rotate(200deg) brightness(95%) contrast(95%);
  }

  ${mq.mobile} {
    img {
      width: 24px;
      height: 24px;
    }
  }
`;

export const DayText = styled.span`
  font-size: ${fontSizes.H3};
  font-weight: 700;
  color: ${colors.primary};
  min-width: 140px;
  text-align: center;
  
  ${mq.mobile} {
    min-width: 100px;
    font-size: ${fontSizes.Body};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const TimeSlotList = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${colors.n02};
    border-radius: 3px;
  }
`;

export const TimeSlotSection = styled.div`
  display: flex;
  flex-direction: column;
`;

export const TimeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
`;

export const TimeText = styled.span`
  font-size: ${fontSizes.H4};
  font-weight: 600;
  color: ${colors.text};
  white-space: nowrap;
  flex-shrink: 0;

  ${mq.mobile} {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
  }
`;

export const ArrowButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const ArrowButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 0.2s;

  img {
    width: 20px;
    height: 20px;
  }

  &:hover:not(:disabled) img {
    filter: brightness(0) saturate(100%) invert(44%) sepia(85%) saturate(1200%) hue-rotate(200deg) brightness(95%) contrast(95%);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

export const ClassList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: minmax(140px, auto);
  gap: 1rem;
  
  @media (max-width: 1400px) {
    grid-template-columns: 1fr;
  }

  ${mq.mobile} {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: minmax(120px, auto);  
    gap: 0.5rem;
  }
`;

export const ClassCard = styled.div`
  background: ${colors.background};
  border: 1px solid ${colors.n02};
  border-radius: ${radius.md};
  padding: 1.5rem 1.25rem;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: hidden;
  min-width: 0;
  position: relative;

  ${mq.mobile} {
    min-height: 70px;
    padding: 0.5rem;
    gap: 0.25rem;
  }
`;

export const CardTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
`;

export const EditButton = styled.button`
  flex-shrink: 0;
  padding: 0.25rem 0.6rem;
  font-size: ${fontSizes.Small};
  color: ${colors.primary};
  background: transparent;
  border: none;
  border-radius: ${radius.sm};
  cursor: pointer;
  white-space: nowrap;

  ${mq.mobile} {
    padding: 0.15rem 0.4rem;
    font-size: 12px;
  }
`;

export const ClassSubject = styled.h4`
  font-size: ${fontSizes.Body};
  font-weight: 600;
  color: ${colors.text};
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-wrap: break-word;

  ${mq.mobile} {
    font-size: 14px;
  }
`;

export const ClassInfo = styled.p`
  font-size: ${fontSizes.Small};
  color: ${colors.n03};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TeacherName = styled.p`
  font-size: ${fontSizes.Small};
  color: ${colors.n03};
  margin-top: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
export const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: ${colors.n03};
  font-size: ${fontSizes.Body};
  text-align: center;
  height: 100%;
`;