/**
 * StreamFlow PM Business Types
 *
 * This module defines TypeScript interfaces for the fictional StreamFlow PM
 * project management SaaS application. These types provide realistic business
 * context for pattern demonstrations.
 *
 * StreamFlow PM is a modern project management tool that uses streaming AI
 * throughout its UX for features like sprint planning, task generation,
 * retrospectives, and team insights.
 *
 * @module types/streamflow
 */

/**
 * User role in StreamFlow PM
 */
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * User account
 */
export interface User {
  /** Unique user identifier */
  id: string;

  /** Full name */
  name: string;

  /** Email address */
  email: string;

  /** Avatar URL */
  avatarUrl?: string;

  /** User role */
  role: UserRole;

  /** Timestamp when user joined */
  joinedAt: number;
}

/**
 * Team in StreamFlow PM
 */
export interface Team {
  /** Unique team identifier */
  id: string;

  /** Team name */
  name: string;

  /** Team description */
  description?: string;

  /** Team members */
  memberIds: string[];

  /** Team lead user ID */
  leadId: string;

  /** Timestamp when team was created */
  createdAt: number;
}

/**
 * Project status
 */
export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';

/**
 * Project in StreamFlow PM
 */
export interface Project {
  /** Unique project identifier */
  id: string;

  /** Project name */
  name: string;

  /** Project description */
  description: string;

  /** Project status */
  status: ProjectStatus;

  /** Owning team ID */
  teamId: string;

  /** Project start date */
  startDate: number;

  /** Project target end date */
  targetEndDate?: number;

  /** Tags for categorization */
  tags: string[];

  /** Timestamp when project was created */
  createdAt: number;
}

/**
 * Sprint status
 */
export type SprintStatus = 'planned' | 'active' | 'completed';

/**
 * Sprint in StreamFlow PM
 */
export interface Sprint {
  /** Unique sprint identifier */
  id: string;

  /** Sprint name */
  name: string;

  /** Sprint goal/objective */
  goal: string;

  /** Parent project ID */
  projectId: string;

  /** Sprint status */
  status: SprintStatus;

  /** Sprint start date */
  startDate: number;

  /** Sprint end date */
  endDate: number;

  /** Team capacity in story points */
  capacity: number;

  /** Task IDs included in sprint */
  taskIds: string[];

  /** Timestamp when sprint was created */
  createdAt: number;
}

/**
 * Task priority
 */
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Task status
 */
export type TaskStatus = 'backlog' | 'ready' | 'in-progress' | 'in-review' | 'done' | 'blocked';

/**
 * Task type
 */
export type TaskType = 'feature' | 'bug' | 'chore' | 'research' | 'design';

/**
 * Task in StreamFlow PM
 */
export interface Task {
  /** Unique task identifier */
  id: string;

  /** Task title */
  title: string;

  /** Task description */
  description: string;

  /** Task type */
  type: TaskType;

  /** Task status */
  status: TaskStatus;

  /** Task priority */
  priority: TaskPriority;

  /** Story point estimate */
  storyPoints?: number;

  /** Parent project ID */
  projectId: string;

  /** Sprint ID if assigned to sprint */
  sprintId?: string;

  /** Assignee user ID */
  assigneeId?: string;

  /** Reporter user ID */
  reporterId: string;

  /** Tags for categorization */
  tags: string[];

  /** Timestamp when task was created */
  createdAt: number;

  /** Timestamp when task was last updated */
  updatedAt: number;

  /** Optional due date */
  dueDate?: number;
}

/**
 * Comment on a task
 */
export interface TaskComment {
  /** Unique comment identifier */
  id: string;

  /** Task ID this comment belongs to */
  taskId: string;

  /** Author user ID */
  authorId: string;

  /** Comment content (markdown) */
  content: string;

  /** Timestamp when comment was created */
  createdAt: number;

  /** Timestamp when comment was last edited */
  editedAt?: number;
}

/**
 * Retrospective in StreamFlow PM
 */
export interface Retrospective {
  /** Unique retrospective identifier */
  id: string;

  /** Associated sprint ID */
  sprintId: string;

  /** Facilitator user ID */
  facilitatorId: string;

  /** What went well */
  wentWell: string[];

  /** What could be improved */
  improvements: string[];

  /** Action items */
  actionItems: ActionItem[];

  /** Timestamp when retrospective was conducted */
  conductedAt: number;
}

/**
 * Action item from retrospective
 */
export interface ActionItem {
  /** Unique action item identifier */
  id: string;

  /** Action description */
  description: string;

  /** Owner user ID */
  ownerId: string;

  /** Target completion date */
  targetDate?: number;

  /** Whether action is completed */
  isCompleted: boolean;
}

/**
 * Velocity metric for a sprint
 */
export interface SprintVelocity {
  /** Sprint ID */
  sprintId: string;

  /** Planned story points */
  planned: number;

  /** Completed story points */
  completed: number;

  /** Completion percentage */
  completionRate: number;

  /** Tasks completed count */
  tasksCompleted: number;

  /** Tasks total count */
  tasksTotal: number;
}

/**
 * Team capacity for sprint planning
 */
export interface TeamCapacity {
  /** Team ID */
  teamId: string;

  /** Sprint ID */
  sprintId: string;

  /** Total available story points */
  availablePoints: number;

  /** Story points allocated */
  allocatedPoints: number;

  /** Story points remaining */
  remainingPoints: number;

  /** Team member capacities */
  memberCapacities: MemberCapacity[];
}

/**
 * Individual team member capacity
 */
export interface MemberCapacity {
  /** User ID */
  userId: string;

  /** Available story points */
  availablePoints: number;

  /** Planned time off days */
  timeOffDays: number;

  /** Notes about capacity */
  notes?: string;
}

/**
 * Burndown chart data point
 */
export interface BurndownPoint {
  /** Date of measurement */
  date: number;

  /** Story points remaining */
  remaining: number;

  /** Ideal remaining (trend line) */
  ideal: number;

  /** Tasks completed that day */
  tasksCompleted: number;
}

/**
 * Sprint burndown chart data
 */
export interface SprintBurndown {
  /** Sprint ID */
  sprintId: string;

  /** Data points */
  points: BurndownPoint[];

  /** Start date */
  startDate: number;

  /** End date */
  endDate: number;

  /** Total story points */
  totalPoints: number;
}

/**
 * AI-generated insight
 */
export interface AIInsight {
  /** Unique insight identifier */
  id: string;

  /** Insight type */
  type: 'risk' | 'opportunity' | 'suggestion' | 'observation';

  /** Insight title */
  title: string;

  /** Insight description */
  description: string;

  /** Confidence score (0.0 to 1.0) */
  confidence: number;

  /** Related entity type */
  entityType: 'project' | 'sprint' | 'task' | 'team';

  /** Related entity ID */
  entityId: string;

  /** Timestamp when insight was generated */
  generatedAt: number;

  /** Whether insight was dismissed */
  isDismissed: boolean;
}

/**
 * Notification in StreamFlow PM
 */
export interface Notification {
  /** Unique notification identifier */
  id: string;

  /** Recipient user ID */
  userId: string;

  /** Notification type */
  type: 'task_assigned' | 'task_updated' | 'comment_added' | 'sprint_started' | 'sprint_completed' | 'mention';

  /** Notification title */
  title: string;

  /** Notification message */
  message: string;

  /** Related entity type */
  entityType?: 'task' | 'sprint' | 'project' | 'comment';

  /** Related entity ID */
  entityId?: string;

  /** Whether notification was read */
  isRead: boolean;

  /** Timestamp when notification was created */
  createdAt: number;
}

/**
 * Workspace settings
 */
export interface WorkspaceSettings {
  /** Workspace ID */
  id: string;

  /** Workspace name */
  name: string;

  /** Default sprint duration (days) */
  defaultSprintDuration: number;

  /** Story point scale */
  storyPointScale: number[];

  /** Working days per week */
  workingDaysPerWeek: number;

  /** Working hours per day */
  workingHoursPerDay: number;

  /** AI features enabled */
  aiEnabled: boolean;

  /** Timestamp format preference */
  timestampFormat: string;
}
