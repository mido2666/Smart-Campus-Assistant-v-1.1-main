/**
 * Swagger API Documentation Configuration
 * Comprehensive API documentation for the Student Management System
 */

import { OpenAPIV3 } from 'openapi-types';

export const swaggerConfig: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Student Management System API',
    version: '1.0.0',
    description: 'Comprehensive API for managing students, courses, attendance, and academic activities',
    contact: {
      name: 'API Support',
      email: 'support@studentmanagement.com',
      url: 'https://studentmanagement.com/support'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development server'
    },
    {
      url: 'https://api.studentmanagement.com',
      description: 'Production server'
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization'
    },
    {
      name: 'Users',
      description: 'User management operations'
    },
    {
      name: 'Courses',
      description: 'Course management operations'
    },
    {
      name: 'Attendance',
      description: 'Attendance tracking and management'
    },
    {
      name: 'Notifications',
      description: 'Notification system'
    },
    {
      name: 'Chatbot',
      description: 'AI-powered chatbot interactions'
    },
    {
      name: 'Analytics',
      description: 'Analytics and reporting'
    }
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticate user with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'student@university.edu'
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                    example: 'SecurePassword123!'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login successful' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        refreshToken: { type: 'string', example: 'refresh_token_here' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'User registration',
        description: 'Register a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName', 'role'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                  firstName: { type: 'string', example: 'John' },
                  lastName: { type: 'string', example: 'Doe' },
                  role: { type: 'string', enum: ['STUDENT', 'PROFESSOR', 'ADMIN'] }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User registered successfully' },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'Get all users',
        description: 'Retrieve a list of all users with pagination and filtering',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: { type: 'integer', minimum: 1, default: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
          },
          {
            name: 'role',
            in: 'query',
            description: 'Filter by user role',
            schema: { type: 'string', enum: ['STUDENT', 'PROFESSOR', 'ADMIN'] }
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search term for name or email',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Users retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        users: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/User' }
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        description: 'Retrieve a specific user by their ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'User retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      put: {
        tags: ['Users'],
        summary: 'Update user',
        description: 'Update user information',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  bio: { type: 'string' },
                  universityId: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'User updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User updated successfully' },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/courses': {
      get: {
        tags: ['Courses'],
        summary: 'Get all courses',
        description: 'Retrieve a list of all courses',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Courses retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Course' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Courses'],
        summary: 'Create new course',
        description: 'Create a new course',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['courseCode', 'courseName', 'credits'],
                properties: {
                  courseCode: { type: 'string', example: 'CS101' },
                  courseName: { type: 'string', example: 'Introduction to Computer Science' },
                  description: { type: 'string', example: 'Basic concepts of computer science' },
                  credits: { type: 'integer', minimum: 1, maximum: 6, example: 3 }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Course created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Course created successfully' },
                    data: { $ref: '#/components/schemas/Course' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/attendance': {
      get: {
        tags: ['Attendance'],
        summary: 'Get attendance records',
        description: 'Retrieve attendance records for a user or course',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'query',
            description: 'Filter by user ID',
            schema: { type: 'string' }
          },
          {
            name: 'courseId',
            in: 'query',
            description: 'Filter by course ID',
            schema: { type: 'string' }
          },
          {
            name: 'date',
            in: 'query',
            description: 'Filter by date (YYYY-MM-DD)',
            schema: { type: 'string', format: 'date' }
          }
        ],
        responses: {
          '200': {
            description: 'Attendance records retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Attendance' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Attendance'],
        summary: 'Mark attendance',
        description: 'Mark attendance for a student',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sessionId', 'status'],
                properties: {
                  sessionId: { type: 'string' },
                  status: { type: 'string', enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Attendance marked successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Attendance marked successfully' },
                    data: { $ref: '#/components/schemas/Attendance' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/chatbot/message': {
      post: {
        tags: ['Chatbot'],
        summary: 'Send message to chatbot',
        description: 'Send a message to the AI chatbot and receive a response',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: 'What is the schedule for today?' },
                  sessionId: { type: 'string', example: 'session_123' },
                  language: { type: 'string', example: 'en' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Chatbot response received',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        response: { type: 'string', example: 'Here is your schedule for today...' },
                        sessionId: { type: 'string', example: 'session_123' },
                        timestamp: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'user_123' },
          email: { type: 'string', format: 'email', example: 'student@university.edu' },
          firstName: { type: 'string', example: 'John' },
          lastName: { type: 'string', example: 'Doe' },
          role: { type: 'string', enum: ['STUDENT', 'PROFESSOR', 'ADMIN'], example: 'STUDENT' },
          phone: { type: 'string', example: '+1234567890' },
          bio: { type: 'string', example: 'Computer Science student' },
          universityId: { type: 'string', example: 'STU001' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Course: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'course_123' },
          courseCode: { type: 'string', example: 'CS101' },
          courseName: { type: 'string', example: 'Introduction to Computer Science' },
          description: { type: 'string', example: 'Basic concepts of computer science' },
          credits: { type: 'integer', example: 3 },
          professorId: { type: 'string', example: 'prof_123' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Attendance: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'attendance_123' },
          userId: { type: 'string', example: 'user_123' },
          sessionId: { type: 'string', example: 'session_123' },
          status: { type: 'string', enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'], example: 'PRESENT' },
          markedAt: { type: 'string', format: 'date-time' },
          notes: { type: 'string', example: 'Late due to traffic' }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 100 },
          totalPages: { type: 'integer', example: 10 },
          hasNext: { type: 'boolean', example: true },
          hasPrev: { type: 'boolean', example: false }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'An error occurred' },
          error: { type: 'string', example: 'VALIDATION_ERROR' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Email is required' }
              }
            }
          }
        }
      }
    }
  }
};

export default swaggerConfig;
