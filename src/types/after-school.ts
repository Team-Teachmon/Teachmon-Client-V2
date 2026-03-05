// AfterSchool 관련 타입
// 공통 타입은 common.ts에서 import

import type { Teacher, Student, Place } from './common';

export interface AffordableReinforcement {
    day: string;
    start_period: number;
    end_period: number;
}

export interface PlaceSearchResult {
    id: string | number;
    name: string;
    floor: number;
}

export interface AdminAfterSchoolClass {
    id: string;
    grade: 1 | 2 | 3;
    day: string;
    period: string;
    teacher: string;
    teacherId: number;
    location: string;
    placeId: number;
    subject: string;
    students: string[];
    studentIds: number[];
}

export interface TableColumn<T> {
  key: string;
  header: string | React.ReactNode;
  width?: string;
  render?: (row: T) => React.ReactNode;
}

// 공통 타입 재export
export type { Teacher, Student, Place };

export interface AfterSchoolResponse {
  id: number;
  week_day: string;
  period: string;
  name: string;
  teacher: Teacher;
  place: Place;
  students: Student[];
}

export interface AfterSchoolRequestParams {
  grade?: number;
  branch?: number;
  week_day?: string;
  start_period?: number;
  end_period?: number;
}

export interface CreateAfterSchoolRequest {
  grade: number;
  week_day: string;
  period: string;
  year: number;
  branch: number;
  teacher_id: number;
  place_id: number;
  name: string;
  students_id: string[];
}

export interface UpdateAfterSchoolRequest {
  grade: number;
  week_day: string;
  period: string;
  year: number;
  branch: number;
  after_school_id: string;
  teacher_id: number;
  place_id: number;
  name: string;
  students_id: string[];
}

// 전체 방과후 조회용 타입
export interface AllAfterSchool {
  id: number;
  week_day: string;
  period: string;
  name: string;
  teacher: Teacher;
  place: Place;
  students: Student[];
}

// 나의 방과후 조회용 타입
export interface MyAfterSchool {
  id: number;
  grade: number;
  week_day: string;
  period: string;
  name: string;
  teacher?: Teacher;
  place: Place;
  students: Student[];
}

// 나의 오늘 방과후 조회용 타입
export interface TodayAfterSchool {
  id: number;
  branch: number;
  grade: number;
  day: string;
  week_day: string;
  period: string;
  name: string;
  teacher?: Teacher;
  place: Place;
  students: Student[];
}

// 방과후 검색 파라미터 타입
export interface AfterSchoolSearchParams {
  grade?: number;
  branch?: number;
  week_day?: string;
  start_period?: number;
  end_period?: number;
}
