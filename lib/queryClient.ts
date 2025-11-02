import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30s
      gcTime: 5 * 60_000, // 5 minutes
      refetchOnWindowFocus: false, // avoid surprise reloads when tab focus changes
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
})
