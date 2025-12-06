const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const safeStorage = require('electron-safe-storage');

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Open the DevTools for debugging in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  // Security: Block all external requests
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const url = new URL(details.url);
    if (url.protocol !== 'file:' && !url.hostname.endsWith('localhost') && !url.hostname.endsWith('127.0.0.1')) {
      console.log('Blocked external request:', details.url);
      callback({ cancel: true });
    } else {
      callback({});
    }
  });

  // Clear cache on startup for security
  session.defaultSession.clearCache();
  
  createWindow();
  
  // Initialize the application on first run
  await initializeApp();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Clear clipboard on app close if it contains sensitive data
app.on('before-quit', () => {
  // Note: We can't directly check clipboard content for security reasons
  // In a real implementation, we would track if sensitive data was copied
  // and clear accordingly
});

// Initialize the application on first run
async function initializeApp() {
  try {
    // Ensure data directory exists
    const dataDir = getDataDirectory();
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Generate encryption key on first run
    await generateEncryptionKey();
    
    // Create super admin user if it doesn't exist
    await createSuperAdminUser();
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
  }
}

// Get the appropriate data directory based on OS
function getDataDirectory() {
  const appName = 'LocalFinTrack';
  
  switch (process.platform) {
    case 'win32':
      return path.join(os.homedir(), 'AppData', 'Local', appName);
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', appName);
    default:
      return path.join(os.homedir(), '.config', appName);
  }
}

// Generate and store encryption key
async function generateEncryptionKey() {
  try {
    // Check if key already exists
    const keyPath = path.join(getDataDirectory(), 'encryption.key');
    
    if (!fs.existsSync(keyPath)) {
      // Generate a random 256-bit key
      const key = crypto.randomBytes(32);
      
      // For now, we'll store the key without encryption since electron-safe-storage
      // has compatibility issues. In a production app, you would use a more secure method.
      fs.writeFileSync(keyPath, key);
      console.log('Encryption key generated and stored');
    }
  } catch (error) {
    console.error('Failed to generate encryption key:', error);
    throw error;
  }
}

// Create super admin user on first run
async function createSuperAdminUser() {
  try {
    // Import Prisma client inside the function to avoid initialization issues
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.join(__dirname, '../../data/localFinTrack.db')}`
        }
      }
    });
    
    // Check if super admin user already exists
    const superAdmin = await prisma.user.findUnique({
      where: {
        username: 'admin'
      }
    });
    
    if (!superAdmin) {
      // Hash the temporary password
      const saltRounds = 10;
      const tempPassword = 'Admin@123';
      const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);
      
      // Create super admin user
      await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash: hashedPassword,
          role: 'superadmin',
          mustChangePassword: true,
          isActive: true,
          createdAt: new Date()
        }
      });
      
      console.log('Super admin user created with temporary password: Admin@123');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed to create super admin user:', error);
    throw error;
  }
}

// IPC handlers
ipcMain.handle('authenticate-user', async (event, { username, password }) => {
  try {
    // Import Prisma client inside the function to avoid initialization issues
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.join(__dirname, '../../data/localFinTrack.db')}`
        }
      }
    });
    
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!user || !user.isActive) {
      await prisma.$disconnect();
      return { success: false, message: 'Invalid credentials' };
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    await prisma.$disconnect();
    
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid credentials' };
    }
    
    // Omit password hash from returned user object
    const { passwordHash, ...userWithoutPassword } = user;
    
    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: 'Authentication failed' };
  }
});

// Get all users (Super Admin only)
ipcMain.handle('get-all-users', async (event, currentUser) => {
  try {
    // Check if current user is super admin
    if (currentUser.role !== 'superadmin') {
      return { success: false, message: 'Unauthorized access' };
    }
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.join(__dirname, '../../data/localFinTrack.db')}`
        }
      }
    });
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        createdById: true
      }
    });
    
    await prisma.$disconnect();
    
    return { success: true, users };
  } catch (error) {
    console.error('Get users error:', error);
    return { success: false, message: 'Failed to retrieve users' };
  }
});

// Create new user (Super Admin only)
ipcMain.handle('create-user', async (event, { userData, currentUser }) => {
  try {
    // Check if current user is super admin
    if (currentUser.role !== 'superadmin') {
      return { success: false, message: 'Unauthorized access' };
    }
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.join(__dirname, '../../data/localFinTrack.db')}`
        }
      }
    });
    
    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: userData.username }
    });
    
    if (existingUser) {
      await prisma.$disconnect();
      return { success: false, message: 'Username already exists' };
    }
    
    // Generate random temporary password
    const tempPassword = generateRandomPassword(12);
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);
    
    // Create user
    const newUser = await prisma.user.create({
      data: {
        username: userData.username,
        passwordHash: hashedPassword,
        role: userData.role,
        isActive: true,
        mustChangePassword: true,
        createdAt: new Date(),
        createdById: currentUser.id
      },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
    
    // Create audit log
    await prisma.audit.create({
      data: {
        userId: currentUser.id,
        action: 'CREATE_USER',
        entity: 'User',
        entityId: newUser.id,
        details: JSON.stringify({ username: userData.username, role: userData.role })
      }
    });
    
    await prisma.$disconnect();
    
    // Return user data and temporary password
    return { success: true, user: newUser, tempPassword };
  } catch (error) {
    console.error('Create user error:', error);
    return { success: false, message: 'Failed to create user' };
  }
});

// Update user (Super Admin only)
ipcMain.handle('update-user', async (event, { userId, userData, currentUser }) => {
  try {
    // Check if current user is super admin
    if (currentUser.role !== 'superadmin') {
      return { success: false, message: 'Unauthorized access' };
    }
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.join(__dirname, '../../data/localFinTrack.db')}`
        }
      }
    });
    
    // Prepare update data
    const updateData = {};
    if (userData.role) updateData.role = userData.role;
    if (userData.isActive !== undefined) updateData.isActive = userData.isActive;
    
    // If resetting password
    if (userData.resetPassword) {
      const tempPassword = generateRandomPassword(12);
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);
      updateData.passwordHash = hashedPassword;
      updateData.mustChangePassword = true;
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
    
    // Create audit log
    await prisma.audit.create({
      data: {
        userId: currentUser.id,
        action: 'UPDATE_USER',
        entity: 'User',
        entityId: userId,
        details: JSON.stringify(userData)
      }
    });
    
    await prisma.$disconnect();
    
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Update user error:', error);
    return { success: false, message: 'Failed to update user' };
  }
});

// Delete user (Super Admin only)
ipcMain.handle('delete-user', async (event, { userId, currentUser }) => {
  try {
    // Check if current user is super admin
    if (currentUser.role !== 'superadmin') {
      return { success: false, message: 'Unauthorized access' };
    }
    
    // Prevent deleting the super admin user
    if (userId === currentUser.id) {
      return { success: false, message: 'Cannot delete super admin user' };
    }
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.join(__dirname, '../../data/localFinTrack.db')}`
        }
      }
    });
    
    // Get user details for audit log
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!userToDelete) {
      await prisma.$disconnect();
      return { success: false, message: 'User not found' };
    }
    
    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    });
    
    // Create audit log
    await prisma.audit.create({
      data: {
        userId: currentUser.id,
        action: 'DELETE_USER',
        entity: 'User',
        entityId: userId,
        details: JSON.stringify({ username: userToDelete.username })
      }
    });
    
    await prisma.$disconnect();
    
    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false, message: 'Failed to delete user' };
  }
});

// Get all categories
ipcMain.handle('get-categories', async (event, currentUser) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.join(__dirname, '../../data/localFinTrack.db')}`
        }
      }
    });
    
    const categories = await prisma.category.findMany({
      where: {
        createdById: currentUser.id
      }
    });
    
    await prisma.$disconnect();
    
    return { success: true, categories };
  } catch (error) {
    console.error('Get categories error:', error);
    return { success: false, message: 'Failed to retrieve categories' };
  }
});

// Create category
ipcMain.handle('create-category', async (event, { categoryData, currentUser }) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.join(__dirname, '../../data/localFinTrack.db')}`
        }
      }
    });
    
    // Create category
    const category = await prisma.category.create({
      data: {
        name: categoryData.name,
        type: categoryData.type,
        color: categoryData.color,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: currentUser.id
      }
    });
    
    // Create audit log
    await prisma.audit.create({
      data: {
        userId: currentUser.id,
        action: 'CREATE_CATEGORY',
        entity: 'Category',
        entityId: category.id,
        details: JSON.stringify({ name: categoryData.name, type: categoryData.type })
      }
    });
    
    await prisma.$disconnect();
    
    return { success: true, category };
  } catch (error) {
    console.error('Create category error:', error);
    return { success: false, message: 'Failed to create category' };
  }
});

// Update category
ipcMain.handle('update-category', async (event, { categoryId, categoryData, currentUser }) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.join(__dirname, '../../data/localFinTrack.db')}`
        }
      }
    });
    
    // Update category
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: categoryData.name,
        type: categoryData.type,
        color: categoryData.color,
        updatedAt: new Date()
      }
    });
    
    // Create audit log
    await prisma.audit.create({
      data: {
        userId: currentUser.id,
        action: 'UPDATE_CATEGORY',
        entity: 'Category',
        entityId: categoryId,
        details: JSON.stringify(categoryData)
      }
    });
    
    await prisma.$disconnect();
    
    return { success: true, category };
  } catch (error) {
    console.error('Update category error:', error);
    return { success: false, message: 'Failed to update category' };
  }
});

// Delete category
ipcMain.handle('delete-category', async (event, { categoryId, currentUser }) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.join(__dirname, '../../data/localFinTrack.db')}`
        }
      }
    });
    
    // Get category details for audit log
    const categoryToDelete = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    
    if (!categoryToDelete) {
      await prisma.$disconnect();
      return { success: false, message: 'Category not found' };
    }
    
    // Delete category
    await prisma.category.delete({
      where: { id: categoryId }
    });
    
    // Create audit log
    await prisma.audit.create({
      data: {
        userId: currentUser.id,
        action: 'DELETE_CATEGORY',
        entity: 'Category',
        entityId: categoryId,
        details: JSON.stringify({ name: categoryToDelete.name })
      }
    });
    
    await prisma.$disconnect();
    
    return { success: true, message: 'Category deleted successfully' };
  } catch (error) {
    console.error('Delete category error:', error);
    return { success: false, message: 'Failed to delete category' };
  }
});

// Get transactions with filters
ipcMain.handle('get-transactions', async (event, { filters, currentUser }) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.join(__dirname, '../../data/localFinTrack.db')}`
        }
      }
    });
    
    // Build where clause
    const whereClause = {
      createdById: currentUser.id
    };
    
    if (filters.startDate) {
      whereClause.date = { ...whereClause.date, gte: new Date(filters.startDate) };
    }
    
    if (filters.endDate) {
      whereClause.date = { ...whereClause.date, lte: new Date(filters.endDate) };
    }
    
    if (filters.categoryId) {
      whereClause.categoryId = parseInt(filters.categoryId);
    }
    
    if (filters.type) {
      whereClause.type = filters.type;
    }
    
    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        category: true
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    await prisma.$disconnect();
    
    return { success: true, transactions };
  } catch (error) {
    console.error('Get transactions error:', error);
    return { success: false, message: 'Failed to retrieve transactions' };
  }
});

// Create transaction
ipcMain.handle('create-transaction', async (event, { transactionData, currentUser }) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.join(__dirname, '../../data/localFinTrack.db')}`
        }
      }
    });
    
    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(transactionData.date),
        type: transactionData.type,
        amount: parseFloat(transactionData.amount),
        categoryId: parseInt(transactionData.categoryId),
        description: transactionData.description,
        paymentMethod: transactionData.paymentMethod,
        notes: transactionData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: currentUser.id
      },
      include: {
        category: true
      }
    });
    
    // Create audit log
    await prisma.audit.create({
      data: {
        userId: currentUser.id,
        action: 'CREATE_TRANSACTION',
        entity: 'Transaction',
        entityId: transaction.id,
        details: JSON.stringify({
          amount: transaction.amount,
          type: transaction.type,
          description: transaction.description
        })
      }
    });
    
    await prisma.$disconnect();
    
    return { success: true, transaction };
  } catch (error) {
    console.error('Create transaction error:', error);
    return { success: false, message: 'Failed to create transaction' };
  }
});

// Update transaction
ipcMain.handle('update-transaction', async (event, { transactionId, transactionData, currentUser }) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.join(__dirname, '../../data/localFinTrack.db')}`
        }
      }
    });
    
    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        date: new Date(transactionData.date),
        type: transactionData.type,
        amount: parseFloat(transactionData.amount),
        categoryId: parseInt(transactionData.categoryId),
        description: transactionData.description,
        paymentMethod: transactionData.paymentMethod,
        notes: transactionData.notes,
        updatedAt: new Date(),
        updatedById: currentUser.id
      },
      include: {
        category: true
      }
    });
    
    // Create audit log
    await prisma.audit.create({
      data: {
        userId: currentUser.id,
        action: 'UPDATE_TRANSACTION',
        entity: 'Transaction',
        entityId: transactionId,
        details: JSON.stringify(transactionData)
      }
    });
    
    await prisma.$disconnect();
    
    return { success: true, transaction };
  } catch (error) {
    console.error('Update transaction error:', error);
    return { success: false, message: 'Failed to update transaction' };
  }
});

// Delete transaction
ipcMain.handle('delete-transaction', async (event, { transactionId, currentUser }) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.join(__dirname, '../../data/localFinTrack.db')}`
        }
      }
    });
    
    // Get transaction details for audit log
    const transactionToDelete = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });
    
    if (!transactionToDelete) {
      await prisma.$disconnect();
      return { success: false, message: 'Transaction not found' };
    }
    
    // Delete transaction
    await prisma.transaction.delete({
      where: { id: transactionId }
    });
    
    // Create audit log
    await prisma.audit.create({
      data: {
        userId: currentUser.id,
        action: 'DELETE_TRANSACTION',
        entity: 'Transaction',
        entityId: transactionId,
        details: JSON.stringify({
          amount: transactionToDelete.amount,
          type: transactionToDelete.type,
          description: transactionToDelete.description
        })
      }
    });
    
    await prisma.$disconnect();
    
    return { success: true, message: 'Transaction deleted successfully' };
  } catch (error) {
    console.error('Delete transaction error:', error);
    return { success: false, message: 'Failed to delete transaction' };
  }
});

// Generate random password
function generateRandomPassword(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.