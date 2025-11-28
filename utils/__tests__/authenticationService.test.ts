/**
 * Unit tests for AuthenticationService
 * Tests all authentication methods, error handling, and edge cases
 */

import { AuthenticationService, AuthErrorCode, AuthResult, TokenValidationResult } from '../authenticationService';
import { UserRepository, User, CreateUserData } from '../userRepository';
import { createJWT, verifyJWT } from '../auth';
import { AppErrorClass, ErrorCode } from '@/types/database';

// Mock dependencies
jest.mock('../userRepository');
jest.mock('../auth');
jest.mock('../logUtils', () => ({
  logWithTimestamp: jest.fn(),
}));

const MockUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;
const mockCreateJWT = createJWT as jest.MockedFunction<typeof createJWT>;
const mockVerifyJWT = verifyJWT as jest.MockedFunction<typeof verifyJWT>;

describe('AuthenticationService', () => {
  let authService: AuthenticationService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  // Test data
  const testUser: User = {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed-password',
    isGoogleUser: false,
    points: 100,
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const testGoogleUser: User = {
    id: 'google-user-id',
    name: 'Google User',
    email: 'google@example.com',
    isGoogleUser: true,
    googleId: 'google-123',
    points: 50,
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const testToken = 'test-jwt-token';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock user repository
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      validateCredentials: jest.fn(),
      updateLastLogin: jest.fn(),
      initialize: jest.fn(),
      getConnectionInfo: jest.fn(),
    } as any;

    MockUserRepository.mockImplementation(() => mockUserRepository);

    // Create service instance
    authService = new AuthenticationService(mockUserRepository, 'test-jwt-secret');
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default values', () => {
      const service = new AuthenticationService();
      expect(service).toBeDefined();
    });

    it('should initialize with provided parameters', () => {
      const service = new AuthenticationService(mockUserRepository, 'custom-secret');
      expect(service).toBeDefined();
    });

    it('should throw error if JWT_SECRET is missing', () => {
      expect(() => {
        new AuthenticationService(mockUserRepository, '');
      }).toThrow();
    });

    it('should initialize with environment', () => {
      const mockEnv = { JWT_SECRET: 'env-secret' } as any;
      authService.initialize(mockEnv);
      expect(mockUserRepository.initialize).toHaveBeenCalledWith(mockEnv);
    });
  });

  describe('loginWithPassword', () => {
    it('should successfully login with valid credentials', async () => {
      // Setup mocks
      mockUserRepository.findByEmail.mockResolvedValue(testUser);
      mockUserRepository.validateCredentials.mockResolvedValue(true);
      mockUserRepository.updateLastLogin.mockResolvedValue();
      mockCreateJWT.mockResolvedValue(testToken);

      // Execute
      const result = await authService.loginWithPassword('test@example.com', 'password');

      // Verify
      expect(result.success).toBe(true);
      expect(result.token).toBe(testToken);
      expect(result.user).toMatchObject({
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        points: testUser.points,
        isGoogleUser: false,
        status: 'active',
      });
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.validateCredentials).toHaveBeenCalledWith('test@example.com', 'password');
      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith(testUser.id);
    });

    it('should fail with empty email', async () => {
      const result = await authService.loginWithPassword('', 'password');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.VALIDATION_ERROR);
      expect(result.error?.message).toContain('Email and password are required');
    });

    it('should fail with empty password', async () => {
      const result = await authService.loginWithPassword('test@example.com', '');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.VALIDATION_ERROR);
      expect(result.error?.message).toContain('Email and password are required');
    });

    it('should fail with invalid email format', async () => {
      const result = await authService.loginWithPassword('invalid-email', 'password');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.VALIDATION_ERROR);
      expect(result.error?.message).toContain('Invalid email format');
    });

    it('should fail when user not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await authService.loginWithPassword('nonexistent@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.INVALID_CREDENTIALS);
      expect(result.error?.message).toContain('Invalid email or password');
    });

    it('should fail when user is not active', async () => {
      const inactiveUser = { ...testUser, status: 'suspended' };
      mockUserRepository.findByEmail.mockResolvedValue(inactiveUser);

      const result = await authService.loginWithPassword('test@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.INVALID_CREDENTIALS);
      expect(result.error?.message).toContain('Account is not active');
    });

    it('should fail with invalid password', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(testUser);
      mockUserRepository.validateCredentials.mockResolvedValue(false);

      const result = await authService.loginWithPassword('test@example.com', 'wrong-password');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.INVALID_CREDENTIALS);
      expect(result.error?.message).toContain('Invalid email or password');
    });

    it('should handle database errors', async () => {
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database connection failed'));

      const result = await authService.loginWithPassword('test@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.DATABASE_ERROR);
    });

    it('should handle JWT creation errors', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(testUser);
      mockUserRepository.validateCredentials.mockResolvedValue(true);
      mockUserRepository.updateLastLogin.mockResolvedValue();
      mockCreateJWT.mockRejectedValue(new Error('JWT creation failed'));

      const result = await authService.loginWithPassword('test@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.DATABASE_ERROR);
    });
  });

  describe('loginWithGoogle', () => {
    it('should successfully login existing Google user', async () => {
      // Setup mocks
      mockUserRepository.findByEmail.mockResolvedValue(testGoogleUser);
      mockUserRepository.updateLastLogin.mockResolvedValue();
      mockCreateJWT.mockResolvedValue(testToken);

      // Execute
      const result = await authService.loginWithGoogle('google-token', 'google@example.com');

      // Verify
      expect(result.success).toBe(true);
      expect(result.token).toBe(testToken);
      expect(result.user).toMatchObject({
        id: testGoogleUser.id,
        name: testGoogleUser.name,
        email: testGoogleUser.email,
        isGoogleUser: true,
      });
      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith(testGoogleUser.id);
    });

    it('should create new user for first-time Google login', async () => {
      // Setup mocks
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.createUser.mockResolvedValue(testGoogleUser);
      mockUserRepository.updateLastLogin.mockResolvedValue();
      mockCreateJWT.mockResolvedValue(testToken);

      // Execute
      const result = await authService.loginWithGoogle('google-token', 'newuser@example.com');

      // Verify
      expect(result.success).toBe(true);
      expect(mockUserRepository.createUser).toHaveBeenCalledWith({
        name: 'newuser',
        email: 'newuser@example.com',
        isGoogleUser: true,
        googleId: expect.any(String),
        points: 50,
      });
    });

    it('should update existing non-Google user to Google user', async () => {
      const regularUser = { ...testUser, isGoogleUser: false, googleId: undefined };
      const updatedUser = { ...regularUser, isGoogleUser: true, googleId: 'google-123' };
      
      mockUserRepository.findByEmail.mockResolvedValue(regularUser);
      mockUserRepository.updateUser.mockResolvedValue(updatedUser);
      mockUserRepository.updateLastLogin.mockResolvedValue();
      mockCreateJWT.mockResolvedValue(testToken);

      const result = await authService.loginWithGoogle('google-token', 'test@example.com');

      expect(result.success).toBe(true);
      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(regularUser.id, {
        isGoogleUser: true,
        googleId: expect.any(String),
      });
    });

    it('should fail with empty token', async () => {
      const result = await authService.loginWithGoogle('', 'test@example.com');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.VALIDATION_ERROR);
      expect(result.error?.message).toContain('Google token and email are required');
    });

    it('should fail with empty email', async () => {
      const result = await authService.loginWithGoogle('google-token', '');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.VALIDATION_ERROR);
      expect(result.error?.message).toContain('Google token and email are required');
    });

    it('should fail when Google user is not active', async () => {
      const inactiveGoogleUser = { ...testGoogleUser, status: 'suspended' };
      mockUserRepository.findByEmail.mockResolvedValue(inactiveGoogleUser);

      const result = await authService.loginWithGoogle('google-token', 'google@example.com');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.INVALID_CREDENTIALS);
      expect(result.error?.message).toContain('Account is not active');
    });
  });

  describe('registerUser', () => {
    const registrationData: CreateUserData = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
      isGoogleUser: false,
    };

    it('should successfully register new user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.createUser.mockResolvedValue(testUser);
      mockCreateJWT.mockResolvedValue(testToken);

      const result = await authService.registerUser(registrationData);

      expect(result.success).toBe(true);
      expect(result.token).toBe(testToken);
      expect(result.user).toMatchObject({
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
      });
      expect(mockUserRepository.createUser).toHaveBeenCalledWith({
        ...registrationData,
        points: 50,
      });
    });

    it('should fail with missing email', async () => {
      const invalidData = { ...registrationData, email: '' };
      const result = await authService.registerUser(invalidData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.VALIDATION_ERROR);
      expect(result.error?.message).toContain('Email and name are required');
    });

    it('should fail with missing name', async () => {
      const invalidData = { ...registrationData, name: '' };
      const result = await authService.registerUser(invalidData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.VALIDATION_ERROR);
      expect(result.error?.message).toContain('Email and name are required');
    });

    it('should fail with invalid email format', async () => {
      const invalidData = { ...registrationData, email: 'invalid-email' };
      const result = await authService.registerUser(invalidData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.VALIDATION_ERROR);
      expect(result.error?.message).toContain('Invalid email format');
    });

    it('should fail with missing password for non-Google user', async () => {
      const invalidData = { ...registrationData, password: undefined };
      const result = await authService.registerUser(invalidData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.VALIDATION_ERROR);
      expect(result.error?.message).toContain('Password is required for email registration');
    });

    it('should fail when user already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(testUser);

      const result = await authService.registerUser(registrationData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.EMAIL_ALREADY_EXISTS);
      expect(result.error?.message).toContain('An account with this email already exists');
    });

    it('should successfully register Google user without password', async () => {
      const googleRegistrationData = {
        name: 'Google User',
        email: 'google@example.com',
        isGoogleUser: true,
        googleId: 'google-123',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.createUser.mockResolvedValue(testGoogleUser);
      mockCreateJWT.mockResolvedValue(testToken);

      const result = await authService.registerUser(googleRegistrationData);

      expect(result.success).toBe(true);
      expect(mockUserRepository.createUser).toHaveBeenCalledWith({
        ...googleRegistrationData,
        points: 50,
      });
    });
  });

  describe('verifyToken', () => {
    const decodedToken = {
      userId: testUser.id,
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
    };

    it('should successfully verify valid token', async () => {
      mockVerifyJWT.mockResolvedValue(decodedToken);
      mockUserRepository.findById.mockResolvedValue(testUser);

      const result = await authService.verifyToken(testToken);

      expect(result.isValid).toBe(true);
      expect(result.user).toMatchObject({
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
      });
      expect(mockVerifyJWT).toHaveBeenCalledWith(testToken, 'test-jwt-secret');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(testUser.id);
    });

    it('should fail with empty token', async () => {
      const result = await authService.verifyToken('');

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.TOKEN_INVALID);
      expect(result.error?.message).toContain('Token is required');
    });

    it('should fail when user not found', async () => {
      mockVerifyJWT.mockResolvedValue(decodedToken);
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await authService.verifyToken(testToken);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.USER_NOT_FOUND);
      expect(result.error?.message).toContain('User not found or inactive');
    });

    it('should fail when user is inactive', async () => {
      const inactiveUser = { ...testUser, status: 'suspended' };
      mockVerifyJWT.mockResolvedValue(decodedToken);
      mockUserRepository.findById.mockResolvedValue(inactiveUser);

      const result = await authService.verifyToken(testToken);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.USER_NOT_FOUND);
      expect(result.error?.message).toContain('User not found or inactive');
    });

    it('should handle expired token', async () => {
      const expiredError = new Error('Token expired');
      mockVerifyJWT.mockRejectedValue(expiredError);

      const result = await authService.verifyToken(testToken);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.TOKEN_EXPIRED);
      expect(result.error?.message).toContain('Token has expired');
    });

    it('should handle invalid token', async () => {
      const invalidError = new Error('Invalid token');
      mockVerifyJWT.mockRejectedValue(invalidError);

      const result = await authService.verifyToken(testToken);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.TOKEN_INVALID);
      expect(result.error?.message).toContain('Invalid token');
    });
  });

  describe('refreshToken', () => {
    const decodedToken = {
      userId: testUser.id,
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
    };

    it('should successfully refresh valid token', async () => {
      const newToken = 'new-jwt-token';
      
      mockVerifyJWT.mockResolvedValue(decodedToken);
      mockUserRepository.findById.mockResolvedValue(testUser);
      mockCreateJWT.mockResolvedValue(newToken);

      const result = await authService.refreshToken(testToken);

      expect(result.success).toBe(true);
      expect(result.token).toBe(newToken);
      expect(result.user).toMatchObject({
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
      });
    });

    it('should fail with invalid token', async () => {
      mockVerifyJWT.mockRejectedValue(new Error('Invalid token'));

      const result = await authService.refreshToken('invalid-token');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.TOKEN_INVALID);
    });

    it('should fail when user not found after token verification', async () => {
      mockVerifyJWT.mockResolvedValue(decodedToken);
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await authService.refreshToken(testToken);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.USER_NOT_FOUND);
    });

    it('should fail when user is inactive', async () => {
      const inactiveUser = { ...testUser, status: 'suspended' };
      
      mockVerifyJWT.mockResolvedValue(decodedToken);
      mockUserRepository.findById.mockResolvedValue(inactiveUser);

      const result = await authService.refreshToken(testToken);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.USER_NOT_FOUND);
      expect(result.error?.message).toContain('User not found or inactive');
    });
  });

  describe('Error Handling', () => {
    it('should handle AppErrorClass errors correctly', async () => {
      const appError = new AppErrorClass({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        timestamp: new Date(),
      });

      mockUserRepository.findByEmail.mockRejectedValue(appError);

      const result = await authService.loginWithPassword('test@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.VALIDATION_ERROR);
      expect(result.error?.message).toBe('Validation failed');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network connection failed');
      mockUserRepository.findByEmail.mockRejectedValue(networkError);

      const result = await authService.loginWithPassword('test@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.NETWORK_ERROR);
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockUserRepository.findByEmail.mockRejectedValue(dbError);

      const result = await authService.loginWithPassword('test@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.DATABASE_ERROR);
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Something went wrong');
      mockUserRepository.findByEmail.mockRejectedValue(genericError);

      const result = await authService.loginWithPassword('test@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.DATABASE_ERROR);
      expect(result.error?.message).toContain('An unexpected error occurred');
    });
  });

  describe('Service Information', () => {
    it('should return service info', () => {
      mockUserRepository.getConnectionInfo.mockReturnValue({
        hasDatabase: true,
        hasEnv: true,
        environment: 'test',
        fallbackMode: false,
      });

      const info = authService.getServiceInfo();

      expect(info).toMatchObject({
        hasJwtSecret: true,
        hasUserRepository: true,
        isDevelopment: false,
        repositoryInfo: {
          hasDatabase: true,
          hasEnv: true,
          environment: 'test',
          fallbackMode: false,
        },
      });
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ];

      for (const email of validEmails) {
        mockUserRepository.findByEmail.mockResolvedValue(null);
        const result = await authService.registerUser({
          name: 'Test User',
          email,
          password: 'password',
        });

        // Should not fail due to email validation
        expect(result.error?.code).not.toBe(AuthErrorCode.VALIDATION_ERROR);
      }
    });

    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user@.com',
      ];

      for (const email of invalidEmails) {
        const result = await authService.registerUser({
          name: 'Test User',
          email,
          password: 'password',
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(AuthErrorCode.VALIDATION_ERROR);
        expect(result.error?.message).toContain('Invalid email format');
      }
    });
  });
});