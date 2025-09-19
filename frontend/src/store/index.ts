import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import { templateApi } from './api/templateApi'
import { sceneApi } from './api/sceneApi'
import { tagApi } from './api/tagApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [templateApi.reducerPath]: templateApi.reducer,
    [sceneApi.reducerPath]: sceneApi.reducer,
    [tagApi.reducerPath]: tagApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
    .concat(templateApi.middleware)
    .concat(sceneApi.middleware)
    .concat(tagApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch