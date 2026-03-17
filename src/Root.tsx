import { Suspense } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Global } from '@emotion/react'
import { globalStyles } from '@/styles/globalStyle'
import { ToastContainer } from 'react-toastify'
import { useLoadingStore } from '@/stores/useLoadingStore'
import Loading from '@/components/ui/loading'
import AuthProvider from '@/components/ui/providers'
import App from './App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function Root() {
  const isLoading = useLoadingStore((state) => state.isLoading);

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Global styles={globalStyles} />
        <AuthProvider>
          <Suspense fallback={<Loading />}>
            {isLoading && <Loading />}
            <App />
          </Suspense>
          <ToastContainer />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}
