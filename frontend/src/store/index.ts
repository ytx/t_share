import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import { templateApi } from './api/templateApi'
import { sceneApi } from './api/sceneApi'
import { tagApi } from './api/tagApi'
import { projectApi } from './api/projectApi'
import { documentApi } from './api/documentApi'
import { userVariableApi } from './api/userVariableApi'
import { projectVariableApi } from './api/projectVariableApi'
import { userPreferenceApi } from './api/userPreferenceApi'
import { adminApi } from './api/adminApi'
import { dataExportImportApi } from './api/dataExportImportApi'
import { portManagementApi } from './api/portManagementApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [templateApi.reducerPath]: templateApi.reducer,
    [sceneApi.reducerPath]: sceneApi.reducer,
    [tagApi.reducerPath]: tagApi.reducer,
    [projectApi.reducerPath]: projectApi.reducer,
    [documentApi.reducerPath]: documentApi.reducer,
    [userVariableApi.reducerPath]: userVariableApi.reducer,
    [projectVariableApi.reducerPath]: projectVariableApi.reducer,
    [userPreferenceApi.reducerPath]: userPreferenceApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [dataExportImportApi.reducerPath]: dataExportImportApi.reducer,
    [portManagementApi.reducerPath]: portManagementApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
    .concat(templateApi.middleware)
    .concat(sceneApi.middleware)
    .concat(tagApi.middleware)
    .concat(projectApi.middleware)
    .concat(documentApi.middleware)
    .concat(userVariableApi.middleware)
    .concat(projectVariableApi.middleware)
    .concat(userPreferenceApi.middleware)
    .concat(adminApi.middleware)
    .concat(dataExportImportApi.middleware)
    .concat(portManagementApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch