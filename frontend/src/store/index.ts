import { configureStore } from '@reduxjs/toolkit'

// Placeholder reducer - will be expanded in Phase 2
const initialState = {
  app: {
    isLoading: false,
    error: null,
  }
}

const appReducer = (state = initialState.app, action: any) => {
  switch (action.type) {
    default:
      return state
  }
}

export const store = configureStore({
  reducer: {
    app: appReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch