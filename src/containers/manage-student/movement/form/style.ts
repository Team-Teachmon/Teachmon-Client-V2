import styled from '@emotion/styled';
import { colors, fontSizes, radius } from '@/styles/theme';
import { mq } from '@/styles/media';
import { dropdownSlideDown } from '@/styles/animations';

export const Container = styled.div`
    width: 100%;
    height: 100%;
    background-color: ${colors.primaryBackground};
    padding: 40px clamp(16px, 10vw, 160px);
    display: flex;
    flex-direction: column;

    ${mq.mobile} {
        padding: 20px 16px 100px 16px;
        overflow-y: auto;
    }
`;

export const ContentWrapper = styled.div`
    display: grid;
    width: 100%;
    grid-template-columns: 7fr 3fr;
    gap: 20px;
    flex: 1;
    margin-bottom: 20px;
    align-items: start;

    ${mq.mobile} {
        grid-template-columns: 1fr;
        gap: 16px;
        margin-bottom: 32px;
        flex: none;
    }
`;

export const FormSection = styled.div`
    width: 100%;
    background-color: ${colors.background};
    border: 1px solid ${colors.primary200};
    border-radius: ${radius.md};
    padding: 32px 44px;
    height: 100%;

    ${mq.mobile} {
        height: max-content;
        padding: 20px 16px;
    }
`;

export const FormTitle = styled.h1`
    font-family: 'Paperlogy', sans-serif;
    font-weight: 600;
    font-size: 28px;
    line-height: 28px;
    color: ${colors.text};
    margin: 0 0 24px 0;

    ${mq.mobile} {
        font-size: 22px;
        margin: 0 0 20px 0;
    }
`;

export const FormContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;

    ${mq.mobile} {
        gap: 16px;
    }
`;

export const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;

    ${mq.mobile} {
        gap: 10px;
    }
`;

export const Label = styled.label`
    font-family: 'Paperlogy', sans-serif;
    font-weight: 500;
    font-size: ${fontSizes.H4};
    line-height: 18px;
    letter-spacing: 0.6px;
    color: ${colors.text};

    ${mq.mobile} {
        font-size: ${fontSizes.Body};
    }
`;

export const InputRow = styled.div`
    display: flex;
    gap: 19px;

    ${mq.mobile} {
        flex-direction: column;
        gap: 12px;
    }
`;

export const DropdownWrapper = styled.div`
    flex: 1;
`;

export const TextAreaWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

export const TextArea = styled.textarea`
    width: 100%;
    height: 70px;
    background-color: ${colors.background};
    border: 1px solid ${colors.n02};
    border-radius: ${radius.md};
    padding: 12px 20px;
    font-weight: 400;
    font-size: ${fontSizes.Body};
    line-height: 18.84px;
    color: ${colors.text};
    resize: none;
    
    &::placeholder {
        color: ${colors.primaryGray};
    }
    
    &:focus {
        outline: none;
        border-color: ${colors.primary};
    }
`;

export const StudentHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
`;

export const EnterHint = styled.span`
    font-family: 'Paperlogy', sans-serif;
    font-weight: 400;
    font-size: 13px;
    color: ${colors.error};
    margin-left: 8px;
`;

export const TeamToggle = styled.div`
    display: flex;
    align-items: center;
    gap: 9px;
    
    span {
        font-family: 'Paperlogy', sans-serif;
        font-weight: 400;
        font-size: ${fontSizes.H4};
        line-height: 20px;
        color: ${colors.text};
    }
`;

export const Switch = styled.div<{ $isOn: boolean }>`
    width: 50px;
    height: 22.5px;
    background-color: ${({ $isOn }) => ($isOn ? colors.primary : colors.n02)};
    border-radius: 12.5px;
    position: relative;
    cursor: pointer;
    transition: background-color 0.2s;
`;

export const SwitchKnob = styled.div<{ $isOn: boolean }>`
    width: 17.5px;
    height: 17.5px;
    background: linear-gradient(180deg, ${colors.n01} 0%, #e8eaea 100%);
    border-radius: 50%;
    position: absolute;
    top: 2.5px;
    left: ${({ $isOn }) => ($isOn ? '30px' : '2.5px')};
    transition: left 0.2s;
`;

export const StudentDropdown = styled.div`
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    width: 100%;
    background-color: ${colors.background};
    border: 1px solid ${colors.primary200};
    border-radius: ${radius.sm};
    overflow: hidden;
    margin-top: 4px;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
    z-index: 10;
    
    animation: ${dropdownSlideDown} 0.2s ease-out;
`;

export const StudentDropdownItem = styled.div`
    width: 100%;
    height: 45px;
    padding: 0 25px;
    display: flex;
    align-items: center;
    background-color: ${colors.background};
    cursor: pointer;
    
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    font-size: ${fontSizes.Body};
    letter-spacing: 0.36px;
    color: ${colors.text};
    
    transition: all 0.15s ease;
    
    &:hover {
        background-color: ${colors.primary100};
        color: ${colors.primary};
        padding-left: 28px;
    }
    
    &:active {
        background-color: ${colors.primary200};
    }
`;

export const SelectedStudentsSection = styled.div`
    width: 100%;
    background-color: ${colors.background};
    border: 1px solid ${colors.primary200};
    border-radius: ${radius.md};
    padding: 32px 17px;
    display: flex;
    flex-direction: column;
    height: 100%;

    ${mq.mobile} {
        height: max-content;
        padding: 20px 16px;
    }
`;

export const SelectedTitle = styled.h2`
    font-family: 'Paperlogy', sans-serif;
    font-weight: 600;
    font-size: 28px;
    line-height: 28px;
    color: ${colors.text};
    margin: 0 0 16px 0;

    ${mq.mobile} {
        font-size: 22px;
        margin: 0 0 12px 0;
    }
`;

export const SelectedStudentsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
`;

export const SelectedStudentCard = styled.div`
    width: 100%;
    height: 50px;
    border: 1px solid ${colors.primary};
    border-radius: ${radius.md};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    
    &:hover {
        background-color: ${colors.primary100};
    }
`;

export const StudentName = styled.span`
    font-family: 'Paperlogy', sans-serif;
    font-weight: 400;
    font-size: clamp(14px, 1.1vw, 18px);
    line-height: 21.2px;
    color: ${colors.primary};
`;


export const ButtonWrapper = styled.div`
    display: flex;
    gap: 20px;

    ${mq.mobile} {
        position: fixed;
        bottom: 10%;
        left: 0;
        right: 0;
        padding: 12px 16px;
        gap: 12px;
        z-index: 10;
    }
`;
