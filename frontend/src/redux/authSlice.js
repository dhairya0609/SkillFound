import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
  },
  reducers: {
    signedIn: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token || null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    signedOut: (state) => {
      state.user = null;
      state.token = null;
    },
  },
});

export const { signedIn, setUser, signedOut } = authSlice.actions;
export default authSlice.reducer;
