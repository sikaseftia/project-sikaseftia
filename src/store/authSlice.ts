import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const STORAGE_KEY = "sikaseftia.token";

type AuthState = {
  token: string | null;
  /** true setelah token dibaca dari localStorage (di browser). */
  hydrated: boolean;
};

const initialState: AuthState = { token: null, hydrated: false };

/** Membaca token tersimpan. Aman dipanggil meski localStorage diblokir. */
export function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Menyimpan atau menghapus token. Gagal diam-diam jika storage tidak tersedia. */
export function writeStoredToken(token: string | null) {
  try {
    if (token) {
      window.localStorage.setItem(STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage tidak tersedia (mode privat / diblokir). Sesi hanya berlaku sampai tab ditutup.
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
      state.hydrated = true;
    },
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
    },
    clearSession(state) {
      state.token = null;
    },
  },
});

export const { hydrate, setToken, clearSession } = authSlice.actions;
export default authSlice.reducer;
