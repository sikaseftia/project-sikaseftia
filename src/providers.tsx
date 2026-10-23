"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { makeStore } from "@/store";
import { hydrate, readStoredToken } from "@/store/authSlice";

export default function Providers({ children }: { children: ReactNode }) {
  const [store] = useState(() => makeStore());
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  // Token dibaca setelah render pertama di browser, agar tidak terjadi perbedaan server/client.
  useEffect(() => {
    store.dispatch(hydrate(readStoredToken()));
  }, [store]);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
}
