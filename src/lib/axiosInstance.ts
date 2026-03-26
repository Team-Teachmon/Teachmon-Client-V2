import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import JSONbig from 'json-bigint';
import { toast } from 'react-toastify';
import { reissueToken } from '@/services/auth/auth.api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUserStore } from '@/stores/useUserStore';
import { useLoadingStore } from '@/stores/useLoadingStore';
import { showErrorToast } from '@/utils/error';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const JSONbigNative = JSONbig({ useNativeBigInt: false, storeAsString: true });

// 토큰 재발급 중복 방지를 위한 Promise 캐시
let reissuePromise: Promise<string> | null = null;

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 100000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    transformResponse: [(data) => {
        if (typeof data === 'string') {
            try {
                return JSONbigNative.parse(data);
            } catch {
                return data;
            }
        }
        return data;
    }],
});

// Request 인터셉터
axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // skipLoading이 true가 아니면 로딩 시작
        if (!config.skipLoading) {
            useLoadingStore.getState().startLoading();
        }

        // /auth/reissue, /auth/code, /auth/logout 요청은 토큰 체크 스킵
        const skipTokenCheck = config.url?.includes('/auth/reissue') ||
            config.url?.includes('/auth/code') ||
            config.url?.includes('/auth/logout');

        if (!skipTokenCheck) {
            // store에서 현재 토큰 가져오기
            let currentToken = useAuthStore.getState().accessToken;

            // 토큰이 없으면 재발급 시도
            if (!currentToken) {
                try {
                    // 이미 재발급 중이면 기다리고, 아니면 새로 시작
                    if (!reissuePromise) {
                        reissuePromise = reissueToken()
                            .then(({ access_token }) => {
                                // 새 토큰을 메모리에 저장
                                useAuthStore.getState().setAccessToken(access_token);
                                return access_token;
                            })
                            .finally(() => {
                                // 완료되면 캐시 초기화
                                reissuePromise = null;
                            });
                    }

                    // 재발급된 토큰 받기
                    const access_token = await reissuePromise;

                    // 현재 요청의 헤더에 새 토큰 적용
                    config.headers.Authorization = `Bearer ${access_token}`;
                } catch (error) {
                    // 토큰 재발급 실패 시 로그아웃 처리
                    useAuthStore.getState().clearAuth();
                    useUserStore.getState().clearUser();

                    // 로딩 중지
                    if (!config.skipLoading) {
                        useLoadingStore.getState().stopLoading();
                    }

                    // 토스트 메시지 표시
                    toast.error('세션이 만료되었습니다. 다시 로그인해주세요.');

                    // 루트 페이지로 리다이렉트
                    if (window.location.pathname !== '/') {
                        window.location.href = '/';
                    }

                    return Promise.reject(error);
                }
            } else {
                // 토큰이 있으면 헤더에 설정 (혹시 없을 경우 대비)
                if (!config.headers.Authorization) {
                    config.headers.Authorization = `Bearer ${currentToken}`;
                }
            }
        }

        return config;
    },
    (error: AxiosError) => {
        useLoadingStore.getState().stopLoading();
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => {
        if (!response.config.skipLoading) {
            useLoadingStore.getState().stopLoading();
        }
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // CORS 에러 감지 (네트워크 에러이면서 response가 없는 경우)
        if (!error.response && error.message === 'Network Error') {
            if (!error.config?.skipLoading) {
                useLoadingStore.getState().stopLoading();
            }

            // CORS 에러로 인한 인증 문제일 가능성이 높음
            useAuthStore.getState().clearAuth();
            useUserStore.getState().clearUser();

            // 루트 페이지로 리다이렉트
            if (window.location.pathname !== '/') {
                toast.error('세션이 만료되었습니다. 다시 로그인해주세요.');
                window.location.href = '/';
            }

            return Promise.reject(error);
        }

        // 401 에러이고 아직 재시도하지 않은 경우
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // 로딩 중지
            if (!originalRequest.skipLoading) {
                useLoadingStore.getState().stopLoading();
            }

            try {
                // 이미 재발급 중이면 기다리고, 아니면 새로 시작
                if (!reissuePromise) {
                    reissuePromise = reissueToken()
                        .then(({ access_token }) => {
                            // 새 토큰을 메모리에 저장 (defaults도 업데이트됨)
                            useAuthStore.getState().setAccessToken(access_token);
                            return access_token;
                        })
                        .finally(() => {
                            // 완료되면 캐시 초기화
                            reissuePromise = null;
                        });
                }

                // 재발급된 토큰 받기
                const access_token = await reissuePromise;

                // 원래 요청의 헤더에 새 토큰 적용
                originalRequest.headers.Authorization = `Bearer ${access_token}`;

                // 원래 요청 재시도
                return axiosInstance(originalRequest);
            } catch (reissueError) {
                // 토큰 재발급 실패 시 로그아웃 처리
                useAuthStore.getState().clearAuth();
                useUserStore.getState().clearUser();

                // 토스트 메시지 표시
                toast.error('세션이 만료되었습니다. 다시 로그인해주세요.');

                // 루트 페이지로 리다이렉트
                if (window.location.pathname !== '/') {
                    window.location.href = '/';
                }

                return Promise.reject(reissueError);
            }
        }

        if (!error.config?.skipLoading) {
            useLoadingStore.getState().stopLoading();
        }

        // 401 에러는 이미 처리했으므로 토스트 표시 안함
        if (!error.config?.skipErrorToast && error.response?.status !== 401) {
            showErrorToast(error);
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;