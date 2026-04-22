import styled from '@emotion/styled';
import { mq } from '@/styles/media';

export const Container = styled.div`
  width: 100%;
  height: 100%;
  padding: 12px 20px 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  ${mq.mobile} {
    padding: 12px;
    gap: 8px;
    overflow-y: auto;
    height: calc(100% - 5rem);
  }
`;

export const CalendarWrapper = styled.div`
  flex: 1;
  background-color: white;
  border-radius: 12px;
  padding: 14px 16px 16px;
  overflow: hidden;

  ${mq.mobile} {
    padding: 12px;
    border-radius: 10px;
    overflow: visible;
  }
`;
