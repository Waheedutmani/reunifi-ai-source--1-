/**
 * Role-Based Access Control (RBAC) System for Reunifi AI
 *
 * Roles: admin, police, ngo, rescue, parent, guest
 *
 * Each role has specific:
 * - Sidebar navigation items
 * - Accessible views
 * - Dashboard redirection with role-specific titles
 * - API route permissions
 * - Granular permission checks
 */

// ─── View Types ─────────────────────────────────────────────────────
export type RBACViewType =
  | 'dashboard'
  | 'report-missing'
  | 'missing-list'
  | 'register-found'
  | 'found-list'
  | 'match-results'
  | 'face-compare'
  | 'case-tracker'
  | 'notifications'
  | 'map'
  | 'admin'
  | 'users'
  | 'settings'
  | 'analytics'
  | 'investigation'
  | 'my-reports'
  | 'match-status'
  | 'profile'

// ─── Role Types ─────────────────────────────────────────────────────
export type UserRole = 'admin' | 'police' | 'ngo' | 'rescue' | 'parent' | 'guest'

// ─── Sidebar Navigation Item ────────────────────────────────────────
export interface SidebarNavItem {
  id: RBACViewType
  label: string
  icon: string // Lucide icon name
  badge?: string
}

// ─── Role Access Matrix ─────────────────────────────────────────────
export const ROLE_ACCESS: Record<UserRole, RBACViewType[]> = {
  admin: [
    'dashboard',
    'users',
    'report-missing',
    'missing-list',
    'register-found',
    'found-list',
    'match-results',
    'face-compare',
    'case-tracker',
    'analytics',
    'notifications',
    'map',
    'settings',
    'admin',
  ],
  police: [
    'dashboard',
    'report-missing',
    'missing-list',
    'register-found',
    'found-list',
    'match-results',
    'case-tracker',
    'investigation',
    'notifications',
  ],
  ngo: [
    'dashboard',
    'report-missing',
    'missing-list',
    'register-found',
    'found-list',
    'match-results',
    'case-tracker',
    'notifications',
  ],
  rescue: [
    'dashboard',
    'register-found',
    'found-list',
    'match-results',
    'case-tracker',
    'notifications',
  ],
  parent: [
    'dashboard',
    'report-missing',
    'my-reports',
    'match-status',
    'match-results',
    'notifications',
    'profile',
  ],
  guest: [],
}

// ─── Role Sidebar Menus (matching user's exact specification) ───────
export const ROLE_SIDEBAR_MENUS: Record<UserRole, { id: RBACViewType; label: string; section?: string }[]> = {
  admin: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'users', label: 'Users', section: 'Management' },
    { id: 'report-missing', label: 'Reports' },
    { id: 'missing-list', label: 'Missing Children' },
    { id: 'register-found', label: 'Register Found' },
    { id: 'found-list', label: 'Found Children' },
    { id: 'match-results', label: 'AI Matches', section: 'AI & Analytics' },
    { id: 'face-compare', label: 'Face Comparison' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'case-tracker', label: 'Case Tracker', section: 'Operations' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'map', label: 'Map View' },
    { id: 'settings', label: 'Settings', section: 'System' },
  ],
  police: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'report-missing', label: 'Cases', section: 'Cases' },
    { id: 'missing-list', label: 'Missing Children' },
    { id: 'register-found', label: 'Register Found' },
    { id: 'found-list', label: 'Found Children' },
    { id: 'match-results', label: 'Matches', section: 'Investigation' },
    { id: 'case-tracker', label: 'Case Tracker' },
    { id: 'investigation', label: 'Investigation' },
    { id: 'notifications', label: 'Notifications', section: 'Other' },
  ],
  ngo: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'report-missing', label: 'Reports', section: 'Reports' },
    { id: 'missing-list', label: 'Missing Children' },
    { id: 'register-found', label: 'Register Found' },
    { id: 'found-list', label: 'Found Children' },
    { id: 'match-results', label: 'AI Matches', section: 'Cases' },
    { id: 'case-tracker', label: 'Case Tracker' },
    { id: 'notifications', label: 'Notifications' },
  ],
  rescue: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'register-found', label: 'Register Found', section: 'Reports' },
    { id: 'found-list', label: 'Found Children' },
    { id: 'match-results', label: 'AI Matches', section: 'Operations' },
    { id: 'case-tracker', label: 'Case Tracker' },
    { id: 'notifications', label: 'Notifications' },
  ],
  parent: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'report-missing', label: 'Report Missing', section: 'My Cases' },
    { id: 'my-reports', label: 'My Reports' },
    { id: 'match-status', label: 'Match Status' },
    { id: 'match-results', label: 'AI Matches', section: 'Updates' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'profile', label: 'Profile', section: 'Account' },
  ],
  guest: [],
}

// ─── Dashboard Redirection After Login ──────────────────────────────
export const ROLE_DASHBOARD: Record<UserRole, RBACViewType> = {
  admin: 'dashboard',
  police: 'dashboard',
  ngo: 'dashboard',
  rescue: 'dashboard',
  parent: 'dashboard',
  guest: 'dashboard',
}

// ─── Dashboard Titles Per Role ──────────────────────────────────────
export const ROLE_DASHBOARD_TITLE: Record<UserRole, string> = {
  admin: 'Admin Dashboard',
  police: 'Police Dashboard',
  ngo: 'NGO Dashboard',
  rescue: 'Rescue Dashboard',
  parent: 'Parent Dashboard',
  guest: 'Dashboard',
}

// ─── Granular Permission Checks (matching user's exact spec) ────────

/**
 * Check if a role can access a specific view
 */
export function canAccessView(role: string, view: RBACViewType): boolean {
  const userRole = role as UserRole
  const allowedViews = ROLE_ACCESS[userRole]
  if (!allowedViews) return false
  return allowedViews.includes(view)
}

/**
 * Get the default view for a role after login
 */
export function getDefaultView(role: string): RBACViewType {
  const userRole = role as UserRole
  return ROLE_DASHBOARD[userRole] || 'dashboard'
}

/**
 * Get the dashboard title for a role
 */
export function getDashboardTitle(role: string): string {
  const userRole = role as UserRole
  return ROLE_DASHBOARD_TITLE[userRole] || 'Dashboard'
}

/**
 * Get sidebar menu items for a role
 */
export function getSidebarMenu(role: string) {
  const userRole = role as UserRole
  return ROLE_SIDEBAR_MENUS[userRole] || ROLE_SIDEBAR_MENUS.parent
}

/**
 * Get all accessible views for a role
 */
export function getAccessibleViews(role: string): RBACViewType[] {
  const userRole = role as UserRole
  return ROLE_ACCESS[userRole] || ROLE_ACCESS.parent
}

/**
 * Check if a role has admin privileges
 */
export function isAdmin(role: string): boolean {
  return role === 'admin'
}

/**
 * Check if a role can manage users
 * Admin only
 */
export function canManageUsers(role: string): boolean {
  return role === 'admin'
}

/**
 * Check if a role can delete reports
 * Admin only
 */
export function canDeleteReports(role: string): boolean {
  return role === 'admin'
}

/**
 * Check if a role can access system settings
 * Admin only
 */
export function canAccessSettings(role: string): boolean {
  return role === 'admin'
}

/**
 * Check if a role can verify cases
 * Admin + Police
 */
export function canVerifyCases(role: string): boolean {
  return ['admin', 'police'].includes(role)
}

/**
 * Check if a role can manage investigations
 * Admin + Police
 */
export function canManageInvestigations(role: string): boolean {
  return ['admin', 'police'].includes(role)
}

/**
 * Check if a role can view all reports (not just own)
 * Admin + Police + NGO
 */
export function canViewAllReports(role: string): boolean {
  return ['admin', 'police', 'ngo'].includes(role)
}

/**
 * Check if a role can access analytics
 * Admin only
 */
export function canAccessAnalytics(role: string): boolean {
  return role === 'admin'
}

/**
 * Check if a role can upload found child reports
 * Admin + Police + NGO + Rescue
 */
export function canUploadFoundReports(role: string): boolean {
  return ['admin', 'police', 'ngo', 'rescue'].includes(role)
}

/**
 * Check if a role can view other users' reports
 * Parent cannot - only their own
 */
export function canViewOtherReports(role: string): boolean {
  return role !== 'parent' && role !== 'guest'
}

/**
 * Check if a role can access AI system controls
 * Admin + Police + NGO + Rescue
 */
export function canAccessAIControls(role: string): boolean {
  return ['admin', 'police', 'ngo', 'rescue'].includes(role)
}

/**
 * Check if a role can access emergency broadcast
 * Admin + Police
 */
export function canEmergencyBroadcast(role: string): boolean {
  return ['admin', 'police'].includes(role)
}

/**
 * Check if a role can report a missing child
 * All authenticated users
 */
export function canReportMissing(role: string): boolean {
  return role !== 'guest'
}

/**
 * Check if a role can update investigation status
 * Admin + Police
 */
export function canUpdateInvestigation(role: string): boolean {
  return ['admin', 'police'].includes(role)
}

/**
 * Get a fallback view if the user tries to access an unauthorized view
 */
export function getFallbackView(role: string): RBACViewType {
  return getDefaultView(role)
}

// ─── Role Display Info ──────────────────────────────────────────────
export const ROLE_INFO: Record<UserRole, { label: string; description: string; color: string; bgColor: string }> = {
  admin: {
    label: 'Administrator',
    description: 'Full system access and management',
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-900/40',
  },
  police: {
    label: 'Police Officer',
    description: 'Investigation and case management',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/40',
  },
  ngo: {
    label: 'NGO Staff',
    description: 'Report management and child welfare',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/40',
  },
  rescue: {
    label: 'Rescue Worker',
    description: 'Found child registration and rescue operations',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
  },
  parent: {
    label: 'Parent / Guardian',
    description: 'Report and track missing children',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
  guest: {
    label: 'Guest',
    description: 'Limited public access',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-900/40',
  },
}

/**
 * Get role display info
 */
export function getRoleInfo(role: string) {
  return ROLE_INFO[(role as UserRole)] || ROLE_INFO.guest
}

// ─── API Route Permissions ──────────────────────────────────────────
export const API_PERMISSIONS: Record<string, UserRole[]> = {
  '/api/admin': ['admin'],
  '/api/admin/users': ['admin'],
  '/api/admin/reports': ['admin'],
  '/api/admin/ai-logs': ['admin'],
  '/api/analytics': ['admin', 'police', 'ngo'],
  '/api/matching': ['admin', 'police', 'ngo', 'rescue'],
  '/api/missing': ['admin', 'police', 'ngo', 'rescue', 'parent'],
  '/api/found': ['admin', 'police', 'ngo', 'rescue'],
  '/api/cases': ['admin', 'police', 'ngo', 'rescue'],
  '/api/notifications': ['admin', 'police', 'ngo', 'rescue', 'parent'],
}

/**
 * Check if a role can access an API endpoint
 */
export function canAccessAPI(role: string, endpoint: string): boolean {
  const allowedRoles = API_PERMISSIONS[endpoint]
  if (!allowedRoles) return true // If not explicitly restricted, allow
  return allowedRoles.includes(role as UserRole)
}
