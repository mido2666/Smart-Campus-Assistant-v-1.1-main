export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.app.json',
      isolatedModules: true,
      diagnostics: false,
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@?react-router|uuid|nanoid)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.js',
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/tests/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/generated/prisma$': '<rootDir>/tests/__mocks__/prismaMock.ts',
    '^src/generated/prisma$': '<rootDir>/tests/__mocks__/prismaMock.ts',
    '^.+/generated/prisma$': '<rootDir>/tests/__mocks__/prismaMock.ts',
    '^nodemailer$': '<rootDir>/tests/__mocks__/nodemailer.js',
    '^qrcode$': '<rootDir>/tests/__mocks__/qrcode.js',
    '^uuid$': '<rootDir>/tests/__mocks__/uuid.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '(.+)\\.js$': '$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
  testMatch: [
    '**/tests/**/*.(test|spec).(ts|tsx|js)',
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)'
  ],
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'server/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/generated/**',
    '!src/vite-env.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  verbose: true
};
