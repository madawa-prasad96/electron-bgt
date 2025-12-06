const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  authenticateUser: (credentials) => ipcRenderer.invoke('authenticate-user', credentials),
  changePassword: (data) => ipcRenderer.invoke('change-password', data),
  getAllUsers: (currentUser) => ipcRenderer.invoke('get-all-users', currentUser),
  createUser: (data) => ipcRenderer.invoke('create-user', data),
  updateUser: (data) => ipcRenderer.invoke('update-user', data),
  deleteUser: (data) => ipcRenderer.invoke('delete-user', data),
  getCategories: (currentUser) => ipcRenderer.invoke('get-categories', currentUser),
  createCategory: (data) => ipcRenderer.invoke('create-category', data),
  updateCategory: (data) => ipcRenderer.invoke('update-category', data),
  deleteCategory: (data) => ipcRenderer.invoke('delete-category', data),
  getTransactions: (data) => ipcRenderer.invoke('get-transactions', data),
  createTransaction: (data) => ipcRenderer.invoke('create-transaction', data),
  updateTransaction: (data) => ipcRenderer.invoke('update-transaction', data),
  deleteTransaction: (data) => ipcRenderer.invoke('delete-transaction', data),
  getAuditLogs: (currentUser) => ipcRenderer.invoke('get-audit-logs', currentUser),
  backupDatabase: (currentUser) => ipcRenderer.invoke('backup-database', currentUser),
  restoreDatabase: (currentUser) => ipcRenderer.invoke('restore-database', currentUser),
  getReportData: (data) => ipcRenderer.invoke('get-report-data', data),
  // We'll add more API methods here as we implement features
});