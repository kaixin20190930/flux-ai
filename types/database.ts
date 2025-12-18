// 数据库相关类型定义
export interface GenerationHistory {
  id: string
  userId: string
  prompt: string
  model: string
  parameters: GenerationParameters
  imageUrl: string
  thumbnailUrl?: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
  isPublic: boolean
  downloadCount: number
}

export interface GenerationParameters {
  width: number
  height: number
  aspectRatio: string
  outputFormat: string
  seed?: number
  style?: string
}

export interface BatchJob {
  id: string
  userId: string
  name: string
  prompts: BatchPrompt[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  createdAt: Date
  completedAt?: Date
  results: GenerationResult[]
}

export interface BatchPrompt {
  prompt: string
  parameters: GenerationParameters
  variations: number
}

export interface GenerationResult {
  promptIndex: number
  variationIndex: number
  imageUrl?: string
  error?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface EditHistory {
  id: string
  generationId: string
  operations: EditOperation[]
  resultUrl: string
  originalUrl: string
  createdAt: Date
  userId: string
}

export interface EditOperation {
  type: 'crop' | 'rotate' | 'brightness' | 'contrast'
  params: any
}

export interface ShareRecord {
  id: string
  generationId: string
  platform: string
  sharedAt: Date
  userId: string
}

export interface SystemMetrics {
  id: string
  metricName: string
  metricValue: number
  recordedAt: Date
}

export interface UserAnalytics {
  id: string
  metricName: string
  metricValue: number
  metricDate: string
  recordedAt: Date
}

export interface UserSession {
  id: string
  userId: string
  sessionId: string
  platform: 'desktop' | 'mobile' | 'tablet'
  durationSeconds?: number
  createdAt: Date
  endedAt?: Date
}

export interface UserAnalyticsResponse {
  totalUsers: number
  activeUsers: {
    daily: number
    weekly: number
    monthly: number
  }
  newUsers: {
    daily: number
    weekly: number
    monthly: number
  }
  userGrowth: Array<{
    date: string
    count: number
  }>
  userRetention: {
    day1: number
    day7: number
    day30: number
  }
  conversionRate: number
  averageSessionDuration: number
  usersByPlatform: Array<{
    platform: string
    percentage: number
  }>
  usersByCountry: Array<{
    country: string
    count: number
  }>
}

// 图片搜索相关类型
export interface ImageSearchHistory {
  id: string
  userId: string
  query: string
  searchType: 'text' | 'image' // 新增：搜索类型
  imageUrl?: string // 新增：如果是图片搜索，存储上传的图片URL
  provider: string
  resultsCount: number
  createdAt: Date
  filters: ImageSearchFilters
}

export interface ImageSearchFilters {
  size?: string
  color?: string
  type?: string
  license?: string
  safeSearch?: boolean
  [key: string]: any
}

export interface ImageSearchResult {
  id: string
  searchId: string
  imageUrl: string
  thumbnailUrl?: string
  sourceUrl?: string
  title?: string
  description?: string
  createdAt: Date
  saved: boolean
}

export interface ImageSearchResponse {
  history: ImageSearchHistory
  results: ImageSearchResult[]
  total: number
  page: number
  limit: number
}

// API 响应类型
export interface HistoryListResponse {
  items: GenerationHistory[]
  total: number
  page: number
  limit: number
}

export interface HistoryDetailResponse {
  item: GenerationHistory
  relatedItems: GenerationHistory[]
}

export interface HistorySearchRequest {
  query?: string
  dateRange?: [Date, Date]
  model?: string
  tags?: string[]
  page?: number
  limit?: number
}

export interface BatchJobResponse {
  job: BatchJob
}

export interface BatchJobListResponse {
  jobs: BatchJob[]
  total: number
  page: number
  limit: number
}

// 认证会话类型
export interface AuthSession {
  id: string
  userId: string
  tokenHash: string
  expiresAt: Date
  createdAt: Date
  lastUsedAt: Date
  userAgent?: string
  ipAddress?: string
  isActive: boolean
}

export interface SessionInfo {
  sessionId: string
  userId: string
  isValid: boolean
  expiresAt: Date
  lastUsedAt: Date
}

// 用户类型 (优化后)
export interface User {
  id: string
  name: string
  email: string
  password?: string // Optional for Google users
  isGoogleUser: boolean
  googleId?: string
  points: number
  status: 'active' | 'suspended' | 'deleted'
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

export interface CreateUserData {
  name: string
  email: string
  password?: string
  isGoogleUser?: boolean
  googleId?: string
  points?: number
}

export interface UserCredentials {
  email: string
  password: string
}

export interface GoogleUserData {
  email: string
  name: string
  googleId: string
}

// 环境类型
export interface Env {
  DB?: any
  'DB-DEV'?: any
  JWT_SECRET: string
  ENVIRONMENT: 'development' | 'production'
}

// 错误类型
export enum ErrorCode {
  HISTORY_NOT_FOUND = 'HISTORY_NOT_FOUND',
  NOT_FOUND = 'NOT_FOUND',
  BATCH_LIMIT_EXCEEDED = 'BATCH_LIMIT_EXCEEDED',
  EDIT_OPERATION_FAILED = 'EDIT_OPERATION_FAILED',
  SHARE_PLATFORM_ERROR = 'SHARE_PLATFORM_ERROR',
  MOBILE_OPTIMIZATION_ERROR = 'MOBILE_OPTIMIZATION_ERROR',
  ADMIN_ACCESS_DENIED = 'ADMIN_ACCESS_DENIED',
  IMAGE_SEARCH_API_ERROR = 'IMAGE_SEARCH_API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

export interface AppError {
  code: ErrorCode
  message: string
  details?: any
  timestamp: Date
}

export class AppErrorClass extends Error implements AppError {
  code: ErrorCode
  details?: any
  timestamp: Date

  constructor(error: AppError) {
    super(error.message)
    this.name = 'AppError'
    this.code = error.code
    this.details = error.details
    this.timestamp = error.timestamp
  }
}