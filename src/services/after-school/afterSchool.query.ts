import { queryOptions } from '@tanstack/react-query';
import {
  getAfterSchoolClasses,
  getMyTodayAfterSchool,
  getMyAfterSchool,
  getAllAfterSchool,
  getBranchInfo,
} from './afterSchool.api';
import type { AfterSchoolSearchParams, AfterSchoolRequestParams } from '@/types/after-school';

export const afterSchoolQuery = {
  // 방과후 수업 목록
  classes: (params: AfterSchoolRequestParams) =>
    queryOptions({
      queryKey: ['afterSchool.classes', params],
      queryFn: () => getAfterSchoolClasses(params),
      enabled: !!params.grade,
    }),

  // 나의 오늘 방과후
  myToday: () =>
    queryOptions({
      queryKey: ['afterSchool.myToday'],
      queryFn: getMyTodayAfterSchool,
    }),

  my: (grade: number) =>
    queryOptions({
      queryKey: ['afterSchool.my', grade],
      queryFn: () => getMyAfterSchool(grade),
    }),

  all: (params: AfterSchoolSearchParams) =>
    queryOptions({
      queryKey: ['afterSchool.all', params],
      queryFn: () => getAllAfterSchool(params),
      enabled: !!params.grade && !!params.week_day && !!params.start_period && !!params.end_period && !!params.branch,
    }),

  branch: () =>
    queryOptions({
      queryKey: ['afterSchool.branch'],
      queryFn: getBranchInfo,
    }),
};
