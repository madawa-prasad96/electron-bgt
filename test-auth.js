const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');

async function testAuth() {
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.join(__dirname, 'data/localFinTrack.db')}`
        }
      }
    });
    
    // Test finding the super admin user
    const user = await prisma.user.findUnique({
      where: {
        username: 'admin'
      }
    });
    
    console.log('User found:', user);
    
    if (user) {
      // Test password validation
      const isPasswordValid = await bcrypt.compare('Admin@123', user.passwordHash);
      console.log('Password valid:', isPasswordValid);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAuth();