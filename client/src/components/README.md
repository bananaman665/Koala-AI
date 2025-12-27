# Components Documentation

This directory contains all reusable React components for the Koala.ai application.

## Directory Structure

```
components/
├── ui/                     # Base UI components
│   ├── Button.tsx         # Button with variants (CVA)
│   ├── Input.tsx          # Input with validation
│   ├── Modal.tsx          # Accessible modal component
│   └── Skeleton.tsx       # Loading skeletons
├── ErrorBoundary.tsx      # Error boundary for error handling
├── Providers.tsx          # App-wide providers wrapper
├── Toast.tsx              # Toast notification system
├── AudioPlayer.tsx        # Audio playback component
├── VirtualizedLectureList.tsx  # Performant lecture list
└── ...
```

## Core UI Components

### Button

A versatile button component with multiple variants and sizes.

```tsx
import { Button } from '@/components/ui/Button'

// Primary button
<Button variant="primary" size="md">
  Click me
</Button>

// With loading state
<Button loading={isLoading}>
  Submit
</Button>

// With icons
<Button leftIcon={<FiPlus />}>
  Add New
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline'
- `size`: 'sm' | 'md' | 'lg' | 'icon'
- `fullWidth`: boolean
- `loading`: boolean
- `leftIcon`, `rightIcon`: ReactNode

### Input

Form input with validation, labels, and helper text.

```tsx
import { Input } from '@/components/ui/Input'

<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  error={errors.email}
  helperText="We'll never share your email"
/>
```

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `leftIcon`, `rightIcon`: ReactNode
- All standard input props

### Modal

Accessible modal with focus trap and keyboard navigation.

```tsx
import { Modal } from '@/components/ui/Modal'

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  description="Are you sure?"
  size="md"
>
  <p>Modal content here</p>
</Modal>
```

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`, `description`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `showCloseButton`: boolean
- `closeOnOverlayClick`: boolean

### Skeleton

Loading placeholder components.

```tsx
import { Skeleton, SkeletonCard, SkeletonList } from '@/components/ui/Skeleton'

<Skeleton variant="rectangular" height={100} />
<SkeletonCard />
<SkeletonList count={5} />
```

## State Management

### Dashboard Store (Zustand)

Centralized state for dashboard features.

```tsx
import { useDashboardStore } from '@/store/dashboardStore'

function MyComponent() {
  const { activeScreen, setActiveScreen } = useDashboardStore()
  const { modals, openModal, closeModal } = useDashboardStore()
  
  return (
    <button onClick={() => openModal('newCourse')}>
      Create Course
    </button>
  )
}
```

**Available state:**
- `activeScreen`: Current active screen
- `modals`: All modal states
- `recording`: Recording-related state
- `library`: Library filtering and selection
- `studyMode`: Study mode preferences

## Data Fetching (TanStack Query)

### Lectures

```tsx
import { useLectures, useDeleteLecture } from '@/lib/queries/lectures'

function LectureList() {
  const { data: lectures, isLoading } = useLectures(userId)
  const deleteLecture = useDeleteLecture()
  
  if (isLoading) return <SkeletonList />
  
  return (
    <div>
      {lectures?.map(lecture => (
        <div key={lecture.id}>
          {lecture.title}
          <button onClick={() => deleteLecture.mutate({ lectureId: lecture.id, userId })}>
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}
```

### Courses

```tsx
import { useCourses, useCreateCourse } from '@/lib/queries/courses'

function CourseList() {
  const { data: courses } = useCourses(userId)
  const createCourse = useCreateCourse()
  
  const handleCreate = () => {
    createCourse.mutate({
      userId,
      name: 'New Course',
      code: 'CS101',
      professor: 'Dr. Smith',
    })
  }
  
  return <div>{/* ... */}</div>
}
```

## Utilities

### Formatters

```tsx
import { formatDuration, formatRelativeDate, pluralize } from '@/lib/formatters'

formatDuration(3661) // "1:01:01"
formatRelativeDate(new Date()) // "Today"
pluralize(5, 'lecture') // "5 lectures"
```

### Design Tokens

```tsx
import { spacing, colors, borderRadius } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'

<div className={cn(
  spacing.card.padding,
  borderRadius.card,
  colors.primary.bg
)}>
  Styled content
</div>
```

## Custom Hooks

### useDebounce

Debounce values for search inputs.

```tsx
import { useDebounce } from '@/hooks/useDebounce'

const [search, setSearch] = useState('')
const debouncedSearch = useDebounce(search, 300)

useEffect(() => {
  // Only runs after user stops typing for 300ms
  fetchResults(debouncedSearch)
}, [debouncedSearch])
```

### useMediaQuery

Responsive design hooks.

```tsx
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery'

const isMobile = useIsMobile()
const isTablet = useIsTablet()

return (
  <div>
    {isMobile && <MobileView />}
    {isTablet && <TabletView />}
  </div>
)
```

## Best Practices

1. **Component Organization**: Keep components small and focused
2. **Accessibility**: Always include ARIA labels and keyboard navigation
3. **Performance**: Use React.memo, useCallback, and useMemo where appropriate
4. **Type Safety**: Use TypeScript types for all props
5. **Error Handling**: Wrap async operations in try-catch or use Error Boundaries
6. **Testing**: Write tests for critical user flows (future)

## Contributing

When adding new components:
1. Follow the existing naming conventions
2. Add TypeScript types
3. Include JSDoc comments for complex logic
4. Add accessibility features (ARIA labels, keyboard support)
5. Update this README