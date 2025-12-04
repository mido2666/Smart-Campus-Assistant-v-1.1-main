import pkg from '@prisma/client';
console.log('Default export:', pkg);
console.log('Keys:', Object.keys(pkg));
try {
    const { PrismaClient, UserRole } = pkg;
    console.log('PrismaClient:', PrismaClient);
    console.log('UserRole:', UserRole);
} catch (e) {
    console.error(e);
}
