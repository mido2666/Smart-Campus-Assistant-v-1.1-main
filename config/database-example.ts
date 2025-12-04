// Example usage of the Prisma database client
// This file demonstrates how to use the database configuration

import prisma from './database';

// Example: Create a new user
export async function createUser(userData: {
  universityId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'STUDENT' | 'PROFESSOR' | 'ADMIN';
}) {
  try {
    const user = await prisma.user.create({
      data: {
        universityId: userData.universityId,
        email: userData.email,
        password: userData.password, // Note: Hash password before storing
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || 'STUDENT',
      },
    });
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Example: Find user by email
export async function findUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user;
  } catch (error) {
    console.error('Error finding user:', error);
    throw error;
  }
}

// Example: Find user by university ID
export async function findUserByUniversityId(universityId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { universityId },
    });
    return user;
  } catch (error) {
    console.error('Error finding user:', error);
    throw error;
  }
}

// Example: Get all users with a specific role
export async function getUsersByRole(role: 'STUDENT' | 'PROFESSOR' | 'ADMIN') {
  try {
    const users = await prisma.user.findMany({
      where: { role },
      select: {
        id: true,
        universityId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });
    return users;
  } catch (error) {
    console.error('Error finding users by role:', error);
    throw error;
  }
}

// Example: Update user information
export async function updateUser(id: number, updateData: {
  firstName?: string;
  lastName?: string;
  email?: string;
}) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    return user;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Example: Delete user
export async function deleteUser(id: number) {
  try {
    const user = await prisma.user.delete({
      where: { id },
    });
    return user;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// Example: Database health check
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'connected', timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Database connection failed:', error);
    return { status: 'disconnected', error: error.message, timestamp: new Date().toISOString() };
  }
}
