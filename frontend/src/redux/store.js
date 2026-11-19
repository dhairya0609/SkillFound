import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer, { signedOut } from "./authSlice";
import { connectAuth } from "@/lib/api";

const rootReducer = combineReducers({ auth: authReducer });

const persisted = persistReducer({ key: "skillfound-v2", version: 1, storage, whitelist: ["auth"] }, rootReducer);

const store = configureStore({
  reducer: persisted,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] },
    }),
});

connectAuth({
  tokenGetter: () => store.getState().auth.token,
  unauthorized: () => store.dispatch(signedOut()),
});

export default store;
