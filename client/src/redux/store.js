import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import authReducer from "../redux/slices/authSlice";

// ─── Persist config ───────────────────────────────────────────────────────────
// Persists the entire auth slice to AsyncStorage
// so state survives app restarts and refreshes
const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth"], // only persist auth — add more slices here as needed
};

const rootReducer = combineReducers({
  auth: authReducer,
  // add more reducers here as the app grows e.g:
  // health: healthReducer,
  // notifications: notificationsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// ─── Store ────────────────────────────────────────────────────────────────────
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Required: suppress serializable warnings for redux-persist actions
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);