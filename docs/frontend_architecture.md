# Frontend Architecture - Template Share

## Overview
React-based frontend architecture with modern development practices.

## Technology Stack
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit + RTK Query
- **Router**: React Router v6
- **UI Library**: Material-UI (MUI) or Ant Design
- **Editor**: Ace Editor (react-ace)
- **Styling**: Styled Components or CSS Modules
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library

## Project Structure
```
frontend/
├── public/
├── src/
│   ├── components/           # Reusable components
│   │   ├── common/          # Generic components
│   │   ├── forms/           # Form components
│   │   ├── layout/          # Layout components
│   │   └── ui/              # UI components
│   ├── pages/               # Page components
│   │   ├── Dashboard/
│   │   ├── Templates/
│   │   ├── Documents/
│   │   ├── Settings/
│   │   └── Admin/
│   ├── hooks/               # Custom hooks
│   ├── services/            # API services
│   ├── store/               # Redux store
│   │   ├── slices/         # Redux slices
│   │   └── api/            # RTK Query APIs
│   ├── types/               # TypeScript types
│   ├── utils/               # Utility functions
│   ├── constants/           # Constants
│   └── styles/              # Global styles
├── package.json
└── vite.config.ts
```

## Component Architecture

### Layout Components
```typescript
// src/components/layout/AppLayout.tsx
interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
```

### Main Dashboard Layout
```typescript
// src/pages/Dashboard/Dashboard.tsx
const Dashboard: React.FC = () => {
  const [splitRatio, setSplitRatio] = useState(0.5);

  return (
    <div className="dashboard">
      <SplitPane
        split="vertical"
        defaultSize={`${splitRatio * 100}%`}
        onChange={setSplitRatio}
      >
        <TemplateSearch />
        <DocumentEditor />
      </SplitPane>
    </div>
  );
};
```

### Template Search Component
```typescript
// src/components/templates/TemplateSearch.tsx
interface TemplateSearchProps {
  onTemplateSelect: (template: Template) => void;
}

const TemplateSearch: React.FC<TemplateSearchProps> = ({ onTemplateSelect }) => {
  const [filters, setFilters] = useState<TemplateFilters>({});
  const { data: templates, isLoading } = useGetTemplatesQuery(filters);

  return (
    <div className="template-search">
      <SearchFilters filters={filters} onChange={setFilters} />
      <TemplateList
        templates={templates}
        onSelect={onTemplateSelect}
        loading={isLoading}
      />
    </div>
  );
};
```

### Document Editor Component
```typescript
// src/components/editor/DocumentEditor.tsx
const DocumentEditor: React.FC = () => {
  const [content, setContent] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="document-editor">
      <EditorToolbar
        project={selectedProject}
        onProjectChange={setSelectedProject}
        onPreviewToggle={() => setShowPreview(!showPreview)}
      />

      {showPreview ? (
        <MarkdownPreview content={content} />
      ) : (
        <AceEditor
          mode="markdown"
          theme="github"
          value={content}
          onChange={setContent}
          name="document-editor"
          editorProps={{ $blockScrolling: true }}
          setOptions={{
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true,
            showLineNumbers: true,
            tabSize: 2
          }}
        />
      )}
    </div>
  );
};
```

## State Management

### Redux Store Structure
```typescript
// src/store/index.ts
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    templates: templatesSlice.reducer,
    documents: documentsSlice.reducer,
    projects: projectsSlice.reducer,
    preferences: preferencesSlice.reducer,
    api: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});
```

### Auth Slice
```typescript
// src/store/slices/authSlice.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdminMode: boolean;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isAdminMode = false;
    },
    toggleAdminMode: (state) => {
      state.isAdminMode = !state.isAdminMode;
    },
  },
});
```

### RTK Query API
```typescript
// src/store/api/templatesApi.ts
export const templatesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTemplates: builder.query<TemplatesResponse, TemplateFilters>({
      query: (filters) => ({
        url: '/templates',
        params: filters,
      }),
      providesTags: ['Template'],
    }),

    createTemplate: builder.mutation<Template, CreateTemplateRequest>({
      query: (template) => ({
        url: '/templates',
        method: 'POST',
        body: template,
      }),
      invalidatesTags: ['Template'],
    }),

    applyTemplate: builder.mutation<ApplyTemplateResponse, ApplyTemplateRequest>({
      query: ({ id, ...body }) => ({
        url: `/templates/${id}/apply`,
        method: 'POST',
        body,
      }),
    }),
  }),
});
```

## Custom Hooks

### Template Management Hook
```typescript
// src/hooks/useTemplates.ts
export const useTemplates = () => {
  const [filters, setFilters] = useState<TemplateFilters>({});
  const { data, isLoading, error } = useGetTemplatesQuery(filters);

  const applyTemplate = useCallback(async (
    templateId: number,
    variables: Record<string, string>,
    projectId?: number
  ) => {
    // Apply template logic
  }, []);

  return {
    templates: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    filters,
    setFilters,
    applyTemplate,
  };
};
```

### Variable Management Hook
```typescript
// src/hooks/useVariables.ts
export const useVariables = (projectId?: number) => {
  const { data: userVariables } = useGetUserVariablesQuery();
  const { data: projectVariables } = useGetProjectVariablesQuery(
    projectId!,
    { skip: !projectId }
  );

  const getAllVariables = useCallback(() => {
    const combined = { ...userVariables };
    if (projectVariables) {
      Object.assign(combined, projectVariables);
    }
    return combined;
  }, [userVariables, projectVariables]);

  return {
    userVariables: userVariables || {},
    projectVariables: projectVariables || {},
    allVariables: getAllVariables(),
  };
};
```

## Theme and Styling

### Theme Configuration
```typescript
// src/styles/theme.ts
export const lightTheme = {
  colors: {
    primary: '#1976d2',
    secondary: '#dc004e',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#000000',
    textSecondary: '#666666',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
};

export const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: '#121212',
    surface: '#1e1e1e',
    text: '#ffffff',
    textSecondary: '#aaaaaa',
  },
};
```

### Responsive Design
```typescript
// src/styles/breakpoints.ts
export const breakpoints = {
  xs: '480px',
  sm: '768px',
  md: '1024px',
  lg: '1200px',
  xl: '1440px',
};

export const mediaQuery = {
  mobile: `@media (max-width: ${breakpoints.sm})`,
  tablet: `@media (max-width: ${breakpoints.md})`,
  desktop: `@media (min-width: ${breakpoints.lg})`,
};
```

## Performance Optimization

### Code Splitting
```typescript
// src/pages/index.ts
export const Dashboard = lazy(() => import('./Dashboard/Dashboard'));
export const Templates = lazy(() => import('./Templates/Templates'));
export const Admin = lazy(() => import('./Admin/Admin'));
```

### Memoization
```typescript
// src/components/templates/TemplateList.tsx
const TemplateList = memo<TemplateListProps>(({ templates, onSelect }) => {
  const memoizedTemplates = useMemo(() =>
    templates.map(template => ({
      ...template,
      formattedDate: formatDate(template.updated_at)
    })),
    [templates]
  );

  return (
    <div className="template-list">
      {memoizedTemplates.map(template => (
        <TemplateCard
          key={template.id}
          template={template}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
});
```

## Error Handling
```typescript
// src/components/common/ErrorBoundary.tsx
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}
```

## Testing Strategy
```typescript
// src/components/__tests__/TemplateSearch.test.tsx
describe('TemplateSearch', () => {
  it('renders search filters and template list', () => {
    render(
      <Provider store={store}>
        <TemplateSearch onTemplateSelect={jest.fn()} />
      </Provider>
    );

    expect(screen.getByRole('textbox', { name: /search/i })).toBeInTheDocument();
    expect(screen.getByText(/templates/i)).toBeInTheDocument();
  });

  it('calls onTemplateSelect when template is clicked', async () => {
    const mockOnSelect = jest.fn();
    const user = userEvent.setup();

    render(
      <Provider store={store}>
        <TemplateSearch onTemplateSelect={mockOnSelect} />
      </Provider>
    );

    await user.click(screen.getByText('Test Template'));
    expect(mockOnSelect).toHaveBeenCalledWith(expect.objectContaining({
      id: 1,
      title: 'Test Template'
    }));
  });
});
```