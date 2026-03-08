export interface Student {
  id?: number | string;
  studentNumber: number;
  name: string;
  grade?: number;
  classNumber?: number;
}

export interface FixedMovement {
  id: string;
  day: string;
  period: string;
  location: string;
  personnel: number;
  cause?: string;
  students: Student[];
}

export interface Team {
  id: string;
  name: string;
  students: Student[];
}
export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export type Period =
  | 'ONE_PERIOD'
  | 'TWO_PERIOD'
  | 'THREE_PERIOD'
  | 'FOUR_PERIOD'
  | 'FIVE_PERIOD'
  | 'SIX_PERIOD'
  | 'SEVEN_PERIOD'
  | 'EIGHT_AND_NINE_PERIOD'
  | 'TEN_AND_ELEVEN_PERIOD';

export interface FixedMovementStudentResponse {
  id?: string;
  number: number;
  name: string;
}

export interface FixedMovementResponse {
  static_leaveseat_id?: number;
  weekday?: Weekday;
  week_day?: Weekday;
  period: Period;
  place: string | { id: number; name: string };
  personnel?: number;
  cause?: string;
  students: FixedMovementStudentResponse[];
}

// === 고정 이석 작성 요청/응답 ===

export interface CreateFixedMovementRequest {
  week_day: Weekday;
  period: Period;
  place_id: number;
  cause: string;
  students: string[];
}

export interface CreateFixedMovementResponse {
  message: string;
}

export interface UpdateFixedMovementRequest {
  week_day: Weekday;
  period: Period;
  place: number;
  cause: string;
  students: string[];
}

export interface UpdateFixedMovementResponse {
  message: string;
}


export interface StudentSearchResponse {
  id: string;
  grade: number;
  classNumber: number;
  number: number;
  name: string;
}

export interface PlaceSearchResponse {
  id: number;
  name: string;
  floor: number;
}

export interface TeamSearchResponse {
  id: string;
  name: string;
  members: {
    id: string;
    number: number;
    name: string;
    grade: number;
    classNumber: number;
  }[];
}
export interface TeamResponse {
  id: string;
  name: string;
  members: {
    id: string;
    number: number;
    name: string;
    grade: number;
    classNumber: number;
  }[];
}

export interface CreateTeamRequest {
  name: string;
  students_id: string[];
}

export interface UpdateTeamRequest {
  id: string;
  name: string;
  students: {
    id: string;
    student_number: number;
    name: string;
  }[];
}

export interface DeleteTeamRequest {
  id: string;
}
