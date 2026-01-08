# Complete Folder Structure - SIMS Project

## Project Root

```
CSC419_SIMS-Group_Project/
├── sims/                          # Main application directory
│   ├── convex/                    # Convex backend (database & functions)
│   ├── src/                       # Next.js frontend source code
│   ├── public/                    # Static assets
│   ├── package.json               # Dependencies and scripts
│   ├── tsconfig.json             # TypeScript configuration
│   ├── next.config.ts            # Next.js configuration
│   ├── eslint.config.mjs         # ESLint configuration
│   ├── postcss.config.mjs        # PostCSS configuration
│   └── README.md                 # Project documentation
├── ERROR_DOCUMENTATION.md        # Error documentation (newly created)
└── FOLDER_STRUCTURE.md           # This file
```

---

## Convex Backend Structure

```
sims/convex/
├── _generated/                    # Auto-generated Convex types
│   ├── api.d.ts                  # API type definitions
│   ├── api.js                    # API JavaScript
│   ├── dataModel.d.ts            # Data model type definitions
│   ├── server.d.ts               # Server type definitions
│   └── server.js                 # Server JavaScript
│
├── examples/                     # Example code
│   └── studentMutations.ts      # Example student mutations
│
├── functions/                    # Convex query/mutation functions
│   ├── academicSessions.ts       # Academic session queries
│   ├── alumni.ts                 # Alumni queries
│   ├── assessments.ts            # Assessment queries
│   ├── auth.ts                   # Authentication functions
│   ├── courses.ts                # Course queries
│   ├── cron.ts                   # Scheduled tasks
│   ├── dashboard.ts              # Dashboard data queries
│   ├── department.ts             # Department queries
│   ├── departments.ts            # Departments queries
│   ├── enrollments.ts            # Enrollment queries
│   ├── grades.ts                 # Grade queries
│   ├── importExport.ts           # ⭐ Import/Export functions (NEW)
│   ├── instructors.ts            # Instructor queries
│   ├── notifications.ts          # Notification queries
│   ├── programs.ts               # Program queries
│   ├── registrar.ts              # Registrar queries
│   ├── schools.ts                # School queries
│   ├── transcript.ts             # Transcript queries
│   └── users.ts                  # User queries
│
├── lib/                          # Shared library code
│   ├── aggregates/               # Domain aggregates
│   │   ├── academicCalendarAggregate.ts
│   │   ├── courseAggregate.ts
│   │   ├── enrollmentAggregate.ts
│   │   ├── graduationAggregate.ts
│   │   ├── index.ts
│   │   ├── schoolAggregate.ts
│   │   ├── sectionAggregate.ts
│   │   ├── studentAggregate.ts
│   │   ├── transcriptAggregate.ts
│   │   ├── types.ts
│   │   └── userAggregate.ts
│   │
│   ├── services/                 # Business logic services
│   │   ├── auditLogService.ts    # Audit logging service
│   │   ├── enrollmentService.ts   # Enrollment business logic
│   │   ├── gradingService.ts     # Grading service
│   │   ├── graduationService.ts  # Graduation service
│   │   ├── importExportService.ts # ⭐ Import/Export service (NEW)
│   │   ├── index.ts              # Service exports
│   │   ├── schedulingService.ts  # Scheduling service
│   │   ├── sectionService.ts     # Section service
│   │   └── transcriptService.ts  # Transcript service
│   │
│   ├── errors.ts                 # Custom error classes
│   └── session.ts                # Session management
│
├── mutations/                     # Database mutations
│   ├── assessmentMutations.ts    # Assessment mutations
│   ├── courseMutations.ts        # Course mutations
│   ├── enrollmentMutations.ts   # Enrollment mutations
│   ├── gradeMutations.ts         # Grade mutations
│   ├── graduationMutations.ts   # Graduation mutations
│   ├── sectionMutations.ts       # Section mutations
│   ├── transcriptMutations.ts   # Transcript mutations
│   └── userMutations.ts          # User mutations
│
├── schema.ts                     # Database schema definition
├── tsconfig.json                 # TypeScript config for Convex
└── README.md                     # Convex documentation
```

---

## Frontend Source Structure

```
sims/src/
├── app/                           # Next.js App Router
│   ├── (authenticated)/           # Authenticated route group
│   │   ├── _components/           # Shared authenticated components
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── DepartmentHeadDashboard.tsx
│   │   │   ├── InstructorDashboard.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   └── WeeklyCalendarView.tsx
│   │   │
│   │   ├── academic-sessions/    # Academic sessions management
│   │   │   ├── _components/
│   │   │   │   ├── CreateSessionForm.tsx
│   │   │   │   ├── CreateTermForm.tsx
│   │   │   │   ├── SessionsTable.tsx
│   │   │   │   └── TermsTable.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── account-settings/      # User account settings
│   │   │   ├── _components/
│   │   │   │   ├── ChangePasswordForm.tsx
│   │   │   │   └── ProfileUpdateForm.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── alumni/               # Alumni management
│   │   │   ├── _components/
│   │   │   │   ├── AlumniProfileForm.tsx
│   │   │   │   └── AlumniTable.tsx
│   │   │   ├── [alumniId]/       # Dynamic route for individual alumni
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── courses/              # Course management
│   │   │   ├── _components/
│   │   │   │   └── CoursesTable.tsx
│   │   │   ├── [courseId]/       # Dynamic route for course details
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── departments/           # Department management
│   │   │   ├── _components/
│   │   │   │   ├── CreateDepartmentForm.tsx
│   │   │   │   └── DepartmentsTable.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── grades/               # Grade management
│   │   │   ├── _components/
│   │   │   │   ├── RegistrarView.tsx
│   │   │   │   └── StudentView.tsx
│   │   │   ├── audit-log/        # Grade audit log
│   │   │   │   └── page.tsx
│   │   │   ├── calculator/       # Grade calculator
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── graduation/           # Graduation management
│   │   │   ├── _components/
│   │   │   │   ├── GraduationApprovalModal.tsx
│   │   │   │   ├── GraduationHistoryTable.tsx
│   │   │   │   └── StudentsEligibilityTable.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── import-export/        # ⭐ Import/Export module (NEW)
│   │   │   ├── _components/
│   │   │   │   ├── csvTemplateUtils.ts      # ⭐ CSV template utilities (NEW)
│   │   │   │   ├── ExportPanel.tsx          # ⭐ Export panel component (NEW)
│   │   │   │   ├── ImportCoursesForm.tsx    # ⭐ Course import form (NEW)
│   │   │   │   ├── ImportPreview.tsx        # ⭐ Import preview component (NEW)
│   │   │   │   └── ImportStudentsForm.tsx   # ⭐ Student import form (NEW)
│   │   │   └── page.tsx                     # ⭐ Main import/export page (NEW)
│   │   │
│   │   ├── notifications/        # Notifications
│   │   │   └── page.tsx
│   │   │
│   │   ├── processing/           # Processing page
│   │   │   └── page.tsx
│   │   │
│   │   ├── programs/             # Program management
│   │   │   ├── _components/
│   │   │   │   ├── CreateProgramForm.tsx
│   │   │   │   └── ProgramsTable.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── schools/              # School management
│   │   │   ├── _components/
│   │   │   │   ├── CreateSchoolForm.tsx
│   │   │   │   └── SchoolsTable.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── sections/             # Section management
│   │   │   ├── _components/
│   │   │   │   ├── CreateSectionModal.tsx
│   │   │   │   ├── InstructorWorkload.tsx
│   │   │   │   ├── SectionsTable.tsx
│   │   │   │   └── TermPlanner.tsx
│   │   │   ├── [id]/             # Dynamic route for section details
│   │   │   │   ├── _components/
│   │   │   │   │   ├── AssessmentsList.tsx
│   │   │   │   │   ├── BulkGradeUpload.tsx
│   │   │   │   │   ├── CreateAssessmentForm.tsx
│   │   │   │   │   ├── EditAssessmentForm.tsx
│   │   │   │   │   └── GradebookMatrix.tsx
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── transcript/           # Transcript management
│   │   │   └── page.tsx
│   │   │
│   │   ├── users/                # User management
│   │   │   ├── _components/
│   │   │   │   ├── CreateUserForm.tsx
│   │   │   │   └── UsersTable.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── layout.tsx           # Authenticated layout
│   │   └── page.tsx              # Authenticated home page
│   │
│   ├── (not-authenticated)/      # Public/unauthenticated routes
│   │   ├── forgot-password/      # Password recovery
│   │   │   ├── _components/
│   │   │   │   └── ForgotPasswordForm.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── import-export/        # Public import-export (if needed)
│   │   │   └── page.tsx
│   │   │
│   │   ├── login/                # Login page
│   │   │   ├── _components/
│   │   │   │   └── LoginForm.tsx
│   │   │   └── page.tsx
│   │   │
│   │   └── unauthorized/        # Unauthorized access page
│   │       └── page.tsx
│   │
│   ├── favicon.ico               # Site favicon
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── not-found.tsx             # 404 page
│   └── Providers.tsx             # React context providers
│
├── components/                    # Reusable React components
│   ├── auth/                     # Authentication components
│   │   ├── AuthPageLayout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── RequireAuth.tsx
│   │   └── RoleGuard.tsx
│   │
│   ├── calendar/                 # Calendar components
│   │   └── [calendar components]
│   │
│   ├── charts/                   # Chart components
│   │   └── [chart components]
│   │
│   ├── common/                   # Common UI components
│   │   ├── ComponentCard.tsx
│   │   ├── PageBreadCrumb.tsx
│   │   └── [other common components]
│   │
│   ├── empty-state/              # Empty state components
│   │   └── [empty state components]
│   │
│   ├── example/                   # Example components
│   │   └── [example components]
│   │
│   ├── form/                     # Form components
│   │   ├── input/
│   │   │   ├── FileInput.tsx
│   │   │   └── InputField.tsx
│   │   ├── Label.tsx
│   │   ├── Select.tsx
│   │   └── [other form components]
│   │
│   ├── header/                   # Header components
│   │   └── [header components]
│   │
│   ├── loading/                  # Loading components
│   │   └── [loading components]
│   │
│   ├── role/                     # Role-based components
│   │   └── [role components]
│   │
│   ├── search-bar/               # Search components
│   │   └── [search components]
│   │
│   ├── tables/                   # Table components
│   │   └── [table components]
│   │
│   ├── ui/                       # UI primitives
│   │   ├── alert/
│   │   │   └── Alert.tsx
│   │   ├── button/
│   │   │   └── Button.tsx
│   │   ├── modal/
│   │   │   └── index.tsx
│   │   ├── tabs/
│   │   │   ├── Tabs.tsx
│   │   │   └── TabPane.tsx
│   │   └── [other UI components]
│   │
│   ├── user-profile/             # User profile components
│   │   └── [user profile components]
│   │
│   └── videos/                   # Video components
│       └── [video components]
│
├── context/                      # React context providers
│   ├── AuthContext.tsx           # Authentication context
│   ├── SidebarContext.tsx        # Sidebar context
│   └── ThemeContext.tsx          # Theme context
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Authentication hook
│   ├── useCurrentUser.ts         # Current user hook
│   ├── useGoBack.ts              # Navigation hook
│   ├── useHasRole.ts             # Role checking hook
│   └── useModal.ts               # Modal hook
│
├── icons/                        # SVG icon files
│   ├── [various icon SVG files]
│   └── index.tsx                 # Icon exports
│
├── layout/                       # Layout components
│   ├── AppHeader.tsx             # Application header
│   ├── AppSidebar.tsx            # Application sidebar
│   └── Backdrop.tsx              # Backdrop component
│
├── lib/                          # Utility libraries
│   └── convex.ts                 # Convex client configuration
│
├── services/                     # Service layer
│   ├── permissions.service.ts    # Permission service
│   └── users.service.ts          # User service
│
├── store/                        # State management
│   └── user.ts                   # User store (Zustand)
│
├── types/                        # TypeScript type definitions
│   └── user.type.ts              # User types
│
├── utils/                        # Utility functions
│   └── capitalize.ts             # String utilities
│
└── svg.d.ts                      # SVG type declarations
```

---

## Import/Export Module Structure (Newly Created)

```
sims/
├── convex/
│   ├── functions/
│   │   └── importExport.ts                    # ⭐ Main import/export functions
│   │       ├── Validation Queries:
│   │       │   ├── validateStudentCSV
│   │       │   ├── validateCourseCSV
│   │       │   └── validateEnrollmentCSV
│   │       ├── Import Mutations:
│   │       │   ├── importStudents
│   │       │   ├── importCourses
│   │       │   └── importEnrollments
│   │       └── Export Queries:
│   │           ├── exportStudents
│   │           ├── exportCourses
│   │           └── exportEnrollments
│   │
│   └── lib/services/
│       └── importExportService.ts             # ⭐ Import/Export service layer
│           ├── CSV Parsing:
│           │   └── parseCSV()
│           ├── Validation:
│           │   ├── validateStudentData()
│           │   └── validateCourseData()
│           ├── Import Functions:
│           │   ├── importStudentsFromCSV()
│           │   ├── importCoursesFromCSV()
│           │   └── importEnrollmentsFromCSV()
│           └── Export Functions:
│               ├── exportStudentsToCSV()
│               ├── exportCoursesToCSV()
│               └── exportEnrollmentsToCSV()
│
└── src/app/(authenticated)/import-export/
    ├── page.tsx                                # ⭐ Main import/export page
    │   └── Features:
    │       ├── Tabs for Import and Export
    │       ├── File upload area
    │       └── Progress indicators
    │
    └── _components/
        ├── csvTemplateUtils.ts                 # ⭐ CSV template utilities
        │   ├── downloadCSVTemplate()
        │   ├── downloadStudentTemplate()
        │   ├── downloadCourseTemplate()
        │   └── downloadEnrollmentTemplate()
        │
        ├── ExportPanel.tsx                     # ⭐ Export panel component
        │   └── Features:
        │       ├── Export students with filters
        │       ├── Export courses with filters
        │       ├── Export enrollments by section
        │       └── Download buttons
        │
        ├── ImportCoursesForm.tsx                # ⭐ Course import form
        │   └── Features:
        │       ├── File upload (CSV)
        │       ├── Preview imported data
        │       ├── Show validation errors
        │       └── Confirm before import
        │
        ├── ImportPreview.tsx                    # ⭐ Import preview component
        │   └── Features:
        │       ├── Table showing parsed data
        │       ├── Highlight validation errors
        │       └── Show success/error counts
        │
        └── ImportStudentsForm.tsx               # ⭐ Student import form
            └── Features:
                ├── File upload (CSV)
                ├── Preview imported data
                ├── Show validation errors
                └── Confirm before import
```

---

## Key Files Summary

### Backend Files (Convex)

1. **`convex/functions/importExport.ts`** (677 lines)

   - Validation queries
   - Import mutations with error handling
   - Export queries

2. **`convex/lib/services/importExportService.ts`** (886 lines)
   - CSV parsing logic
   - Data validation functions
   - Import/export business logic

### Frontend Files (React/Next.js)

1. **`src/app/(authenticated)/import-export/page.tsx`** (824 lines)

   - Main import/export page with tabs
   - File upload functionality
   - Progress indicators

2. **`src/app/(authenticated)/import-export/_components/ImportStudentsForm.tsx`** (655 lines)

   - Student import form
   - CSV validation
   - Preview and confirmation

3. **`src/app/(authenticated)/import-export/_components/ImportCoursesForm.tsx`** (663 lines)

   - Course import form
   - Course-specific validation
   - Preview and confirmation

4. **`src/app/(authenticated)/import-export/_components/ExportPanel.tsx`** (392 lines)

   - Export functionality
   - Filter options
   - Download buttons

5. **`src/app/(authenticated)/import-export/_components/ImportPreview.tsx`** (249 lines)

   - Reusable preview component
   - Validation error highlighting
   - Success/error counts

6. **`src/app/(authenticated)/import-export/_components/csvTemplateUtils.ts`** (153 lines)
   - Template generation utilities
   - Download functions for each import type

---

## File Count Summary

### Newly Created Files (Import/Export Module)

- **Backend**: 2 files

  - `convex/functions/importExport.ts`
  - `convex/lib/services/importExportService.ts`

- **Frontend**: 6 files

  - `src/app/(authenticated)/import-export/page.tsx`
  - `src/app/(authenticated)/import-export/_components/ImportStudentsForm.tsx`
  - `src/app/(authenticated)/import-export/_components/ImportCoursesForm.tsx`
  - `src/app/(authenticated)/import-export/_components/ExportPanel.tsx`
  - `src/app/(authenticated)/import-export/_components/ImportPreview.tsx`
  - `src/app/(authenticated)/import-export/_components/csvTemplateUtils.ts`

- **Documentation**: 2 files
  - `ERROR_DOCUMENTATION.md`
  - `FOLDER_STRUCTURE.md` (this file)

**Total New Files**: 10 files

---

## Technology Stack

### Backend

- **Convex** - Backend-as-a-Service
- **TypeScript** - Type safety
- **Zod** - Schema validation

### Frontend

- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Convex React** - Convex integration

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **TypeScript** - Type checking

---

## Notes

- ⭐ indicates newly created files for the import/export module
- All import/export functionality is located in:
  - Backend: `sims/convex/functions/importExport.ts` and `sims/convex/lib/services/importExportService.ts`
  - Frontend: `sims/src/app/(authenticated)/import-export/`
- The module follows the existing project structure and patterns
- Components are organized in `_components` subdirectories following Next.js conventions
