import request from 'supertest';

// Mock the chat router to avoid import errors with ES modules in Jest
jest.mock('../server/api/chat.js', () => ({
  __esModule: true,
  default: require('express').Router()
}));

// Mock AuthMiddleware to bypass rate limits and other checks
// Mock AuthMiddleware to bypass rate limits and other checks
jest.mock('../src/middleware/auth.middleware.js', () => {
  class MockAuthMiddleware {
    static rateLimit() { return (req: any, res: any, next: any) => next(); }
    static authenticate() { return (req: any, res: any, next: any) => next(); }
    static corsOptions() { return (req: any, res: any, next: any) => next(); }
    static requestLogger() { return (req: any, res: any, next: any) => next(); }
    static requireRole() { return (req: any, res: any, next: any) => next(); }
    static requireAdmin() { return (req: any, res: any, next: any) => next(); }
    static requireProfessorOrAdmin() { return (req: any, res: any, next: any) => next(); }
    static requireAnyRole() { return (req: any, res: any, next: any) => next(); }
    static optionalAuth() { return (req: any, res: any, next: any) => next(); }
    static resetRateLimit() { }
  }
  return {
    __esModule: true,
    default: MockAuthMiddleware,
    AuthMiddleware: MockAuthMiddleware
  };
});

import app from '../server/index';
import { prisma } from '../src/config/database';

// Mock prisma to avoid actual DB operations if needed, or use a test DB
// For integration tests, we might want to mock the service layer or use a test DB.
// Since we are testing validation middleware, we don't necessarily need to reach the DB if validation fails.
// But if validation succeeds, it will try to hit the controller which calls the service.
// We can mock the service to avoid DB writes.

jest.mock('../src/services/auth.service', () => ({
  register: jest.fn().mockResolvedValue({ user: { id: 1 }, accessToken: 'token' }),
  login: jest.fn().mockResolvedValue({ user: { id: 1 }, accessToken: 'token' }),
  changePassword: jest.fn().mockResolvedValue(true),
}));

describe('Input Validation Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should return 400 when fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({}); // Empty body

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'firstName' }),
          expect.objectContaining({ field: 'lastName' }),
          expect.objectContaining({ field: 'universityId' }),
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'password' }),
        ])
      );
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          universityId: '12345',
          email: 'not-an-email',
          password: 'Password123'
        });

      expect(res.status).toBe(400);
      const emailError = res.body.errors.find((e: any) => e.field === 'email');
      expect(emailError).toBeDefined();
      expect(emailError.message).toBe('Invalid email format');
    });

    it('should return 400 for weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          universityId: '12345',
          email: 'john@example.com',
          password: 'weak'
        });

      expect(res.status).toBe(400);
      const passwordError = res.body.errors.find((e: any) => e.field === 'password');
      expect(passwordError).toBeDefined();
    });

    it('should pass validation with correct data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          universityId: '12345',
          email: 'john@example.com',
          password: 'StrongPassword123',
          role: 'student'
        });

      // Since we mocked the service, it should return 201 if validation passes
      expect(res.status).toBe(201);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 when fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'universityId' }),
          expect.objectContaining({ field: 'password' }),
        ])
      );
    });
  });
});
