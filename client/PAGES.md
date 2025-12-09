# Koala.ai Frontend Pages

## 🎨 Available Pages

### 1. **Landing Page** - `/`
**URL**: http://localhost:3004

Beautiful marketing homepage featuring:
- Hero section with compelling CTA
- Feature showcase (Recording, Transcription, Notes)
- How it works (3-step process)
- Call-to-action section
- Footer with links

**Key Components**:
- Responsive navigation
- Gradient design elements
- Feature cards with icons
- Social proof section

---

### 2. **Dashboard** - `/dashboard`
**URL**: http://localhost:3004/dashboard

Main recording interface with:
- **Recording Controls**: Start/pause/stop functionality
- **Live Timer**: Real-time duration display
- **Audio Visualization**: Animated waveform
- **Quick Stats**: Lectures, hours, storage usage
- **Recent Lectures**: Status indicators (completed/processing)
- **Sidebar**: Quick actions, tips, storage meter

**Interactive Elements**:
- Record button with animation
- Lecture metadata form (title, course, professor)
- Pause/resume controls
- Audio level indicators

---

### 3. **Library** - `/dashboard/library`
**URL**: http://localhost:3004/dashboard/library

Complete lecture management system:
- **View Modes**: Grid and list view toggle
- **Search**: Full-text search across lectures
- **Filters**: By status, date, favorites
- **Sorting**: Date, title, duration, course
- **Course Browser**: Filter by course with counts
- **Tag System**: Popular tags for quick filtering
- **Pagination**: Navigate through large collections

**Grid View**:
- Beautiful cards with thumbnails
- Status badges
- Quick info (date, duration)
- Tag chips

**List View**:
- Tabular format
- Sortable columns
- Quick actions (download, edit, delete)
- Hover effects

---

### 4. **Analytics** - `/dashboard/analytics`
**URL**: http://localhost:3004/dashboard/analytics

Comprehensive learning insights:
- **Key Metrics**: 4 stat cards with growth indicators
- **Weekly Activity Chart**: Bar chart showing daily recording hours
- **Top Courses**: Progress bars with percentages
- **Study Patterns**: Most active day, completion rate, peak time, streak
- **Weekly Goal Tracker**: Progress toward weekly target
- **Recent Activity**: Timeline of actions
- **Achievements**: Gamification badges
- **Storage Breakdown**: Detailed usage by file type

**Time Range Selector**:
- Last 7 days
- Last 30 days
- Last 90 days
- Last year

**Export Options**:
- Download analytics report

---

### 5. **Notes Viewer** - `/notes`
**URL**: http://localhost:3004/notes

Detailed lecture notes display:
- **Audio Player**: Integrated playback with timeline
- **AI Summary**: Concise overview of lecture
- **Key Points**: Time-stamped important concepts (8 points)
- **Detailed Topics**: 3 major topics with explanations
- **Vocabulary**: Key terms with definitions
- **Action Items**: Assignments and to-dos with checkboxes
- **Lecture Stats**: Duration, word count, topics
- **Tags**: Course and topic tags
- **Export Options**: PDF, Markdown, Notion, Email
- **Related Lectures**: Suggestions for related content

**Interactive Features**:
- Clickable timestamps to jump to audio position
- Checkbox task lists
- Export buttons
- Share functionality

---

## 🎯 Design System

### Colors
- **Primary**: Blue (#0ea5e9) to Purple (#a855f7) gradient
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#ef4444)
- **Gray Scale**: 50-900

### Typography
- **Font**: Inter (Google Fonts)
- **Headings**: Bold, 2xl-4xl
- **Body**: Regular, sm-base
- **Labels**: Medium, xs-sm

### Components
- **Cards**: White background, rounded-xl, subtle shadow
- **Buttons**: Gradient primary, solid secondary
- **Inputs**: Border with focus ring
- **Badges**: Colored backgrounds with rounded-full
- **Icons**: React Icons (Feather icon set)

### Animations
- Hover effects on cards and buttons
- Pulse animation for recording indicator
- Smooth transitions (200-300ms)
- Loading states

---

## 🚀 Running the Frontend

```bash
cd /Users/andrew/Koala.ai/client
npm run dev
```

Frontend will be available at: **http://localhost:3004**

---

## 📱 Responsive Design

All pages are fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

---

## 🧩 Component Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles
│   ├── dashboard/
│   │   ├── page.tsx               # Recording dashboard
│   │   ├── library/
│   │   │   └── page.tsx           # Library with grid/list view
│   │   └── analytics/
│   │       └── page.tsx           # Analytics & insights
│   └── notes/
│       └── page.tsx                # Notes viewer
```

---

## 🎨 Featured UI Patterns

### Recording Interface
- Large circular record button with gradient
- Animated recording indicator (pulsing ring)
- Live audio waveform visualization
- Timer with monospace font
- Pause/stop controls

### Dashboard Cards
- Gradient backgrounds for stats
- Icon badges with brand colors
- Progress bars with animations
- Status indicators (completed, processing)

### Library Views
- Toggleable grid/list layouts
- Filtered sidebar navigation
- Search with instant results
- Sortable table columns
- Pagination controls

### Analytics Charts
- Horizontal bar charts
- Progress indicators
- Achievement badges
- Timeline activity feed
- Circular progress for goals

---

## 🔜 Next Steps

To make these pages functional:
1. **Connect Supabase**: Auth, database, storage
2. **Implement Recording**: Browser MediaRecorder API
3. **Add State Management**: Zustand store for global state
4. **API Integration**: Connect to MCP server
5. **Real-time Updates**: WebSocket for transcription status
6. **File Upload**: Audio file upload to Supabase Storage
7. **Auth Flow**: Login/signup pages

---

## 💡 Design Inspiration

- Clean, modern aesthetic
- Apple/Notion-inspired minimalism
- Gradient accents for visual interest
- Generous whitespace
- Clear information hierarchy
- Delightful micro-interactions

---

**Built with**:
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- React Icons
- TypeScript

**Access the mockup**: http://localhost:3004 🚀
