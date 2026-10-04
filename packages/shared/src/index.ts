export { healthResponseSchema } from "./schemas/health.js";
export type { HealthResponse } from "./schemas/health.js";

export { visitCountResponseSchema } from "./schemas/visit-counter.js";
export type { VisitCountResponse } from "./schemas/visit-counter.js";

export {
  activeTimetableSchema,
  activeTimetablesResponseSchema,
} from "./schemas/timetable.js";
export type {
  ActiveTimetable,
  ActiveTimetablesResponse,
} from "./schemas/timetable.js";

export {
  gradeRefSchema,
  classItemSchema,
  classListResponseSchema,
  classRefSchema,
  studentItemSchema,
  studentSearchResponseSchema,
  teacherItemSchema,
  teacherSearchResponseSchema,
  searchQuerySchema,
} from "./schemas/directory.js";
export type {
  GradeRef,
  ClassItem,
  ClassListResponse,
  ClassRef,
  StudentItem,
  StudentSearchResponse,
  TeacherItem,
  TeacherSearchResponse,
  SearchQuery,
} from "./schemas/directory.js";

export {
  gridSessionSchema,
  gridDaySchema,
  gridPeriodSchema,
  gridCellSchema,
  gridSlotSchema,
  weekGridSchema,
} from "./schemas/grid.js";
export type {
  GridSession,
  GridDay,
  GridPeriod,
  GridCell,
  GridSlot,
  WeekGrid,
} from "./schemas/grid.js";

export {
  adminTimetableSchema,
  adminTimetableListResponseSchema,
  toggleTimetableRequestSchema,
  importResultSchema,
  importErrorSchema,
  importErrorResponseSchema,
} from "./schemas/admin-timetable.js";
export type {
  AdminTimetable,
  AdminTimetableListResponse,
  ToggleTimetableRequest,
  ImportResult,
  ImportError,
  ImportErrorResponse,
} from "./schemas/admin-timetable.js";

export {
  loginRequestSchema,
  loginResponseSchema,
} from "./schemas/admin-auth.js";
export type { LoginRequest, LoginResponse } from "./schemas/admin-auth.js";
