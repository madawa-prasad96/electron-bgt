// Renderer process logic

document.addEventListener('DOMContentLoaded', async () => {
    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
    
    // Navigation functionality
    const navLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show corresponding view
            const viewName = link.getAttribute('data-view');
            views.forEach(view => {
                view.classList.add('hidden');
                view.classList.remove('active');
            });
            
            const targetView = document.getElementById(`${viewName}-view`);
            if (targetView) {
                targetView.classList.remove('hidden');
                targetView.classList.add('active');
                
                // Load data for the view if needed
                if (viewName === 'users') {
                    loadUsers();
                } else if (viewName === 'categories') {
                    loadCategories();
                } else if (viewName === 'transactions') {
                    loadTransactions();
                    loadCategoriesForFilter();
                }
            }
        });
    });
    
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('login-message');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                const result = await window.electronAPI.authenticateUser({ username, password });
                
                if (result.success) {
                    // Hide login container and show dashboard
                    document.getElementById('login-container').classList.add('hidden');
                    document.getElementById('dashboard-container').classList.remove('hidden');
                    
                    // Store user info in localStorage
                    localStorage.setItem('currentUser', JSON.stringify(result.user));
                } else {
                    showMessage(loginMessage, result.message, 'error');
                }
            } catch (error) {
                showMessage(loginMessage, 'An error occurred during login', 'error');
                console.error('Login error:', error);
            }
        });
    }
    
    // User management functionality
    const addUserBtn = document.getElementById('add-user-btn');
    const userFormContainer = document.getElementById('user-form-container');
    const userForm = document.getElementById('user-form');
    const cancelUserBtn = document.getElementById('cancel-user-btn');
    
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            userFormContainer.classList.remove('hidden');
            userForm.reset();
        });
    }
    
    if (cancelUserBtn) {
        cancelUserBtn.addEventListener('click', () => {
            userFormContainer.classList.add('hidden');
        });
    }
    
    if (userForm) {
        userForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('user-username').value;
            const role = document.getElementById('user-role').value;
            
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            
            try {
                const result = await window.electronAPI.createUser({
                    userData: { username, role },
                    currentUser
                });
                
                if (result.success) {
                    showMessage(document.querySelector('#users-view .message'), 
                        `User created successfully. Temporary password: ${result.tempPassword}`, 'success');
                    userFormContainer.classList.add('hidden');
                    loadUsers(); // Refresh the user list
                } else {
                    showMessage(document.querySelector('#users-view .message'), 
                        result.message, 'error');
                }
            } catch (error) {
                showMessage(document.querySelector('#users-view .message'), 
                    'An error occurred while creating the user', 'error');
                console.error('Create user error:', error);
            }
        });
    }
    
    // Category management functionality
    const addCategoryBtn = document.getElementById('add-category-btn');
    const categoryFormContainer = document.getElementById('category-form-container');
    const categoryForm = document.getElementById('category-form');
    const cancelCategoryBtn = document.getElementById('cancel-category-btn');
    const categoryColorInput = document.getElementById('category-color');
    const colorPreview = document.getElementById('color-preview');
    
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            categoryFormContainer.classList.remove('hidden');
            categoryForm.reset();
            // Set today's date as default
            document.getElementById('category-date').valueAsDate = new Date();
        });
    }
    
    if (cancelCategoryBtn) {
        cancelCategoryBtn.addEventListener('click', () => {
            categoryFormContainer.classList.add('hidden');
        });
    }
    
    if (categoryColorInput && colorPreview) {
        categoryColorInput.addEventListener('input', () => {
            colorPreview.style.backgroundColor = categoryColorInput.value;
        });
    }
    
    if (categoryForm) {
        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('category-name').value;
            const type = document.getElementById('category-type').value;
            const color = document.getElementById('category-color').value;
            
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            
            try {
                const result = await window.electronAPI.createCategory({
                    categoryData: { name, type, color },
                    currentUser
                });
                
                if (result.success) {
                    showMessage(document.querySelector('#categories-view .message'), 
                        'Category created successfully', 'success');
                    categoryFormContainer.classList.add('hidden');
                    loadCategories(); // Refresh the category list
                } else {
                    showMessage(document.querySelector('#categories-view .message'), 
                        result.message, 'error');
                }
            } catch (error) {
                showMessage(document.querySelector('#categories-view .message'), 
                    'An error occurred while creating the category', 'error');
                console.error('Create category error:', error);
            }
        });
    }
    
    // Transaction management functionality
    const addTransactionBtn = document.getElementById('add-transaction-btn');
    const transactionFormContainer = document.getElementById('transaction-form-container');
    const transactionForm = document.getElementById('transaction-form');
    const cancelTransactionBtn = document.getElementById('cancel-transaction-btn');
    
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', () => {
            transactionFormContainer.classList.remove('hidden');
            transactionForm.reset();
            // Set today's date as default
            document.getElementById('transaction-date').valueAsDate = new Date();
        });
    }
    
    if (cancelTransactionBtn) {
        cancelTransactionBtn.addEventListener('click', () => {
            transactionFormContainer.classList.add('hidden');
        });
    }
    
    if (transactionForm) {
        transactionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const date = document.getElementById('transaction-date').value;
            const type = document.getElementById('transaction-type').value;
            const amount = document.getElementById('transaction-amount').value;
            const categoryId = document.getElementById('transaction-category').value;
            const description = document.getElementById('transaction-description').value;
            const paymentMethod = document.getElementById('transaction-payment-method').value;
            const notes = document.getElementById('transaction-notes').value;
            
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            
            try {
                const result = await window.electronAPI.createTransaction({
                    transactionData: { date, type, amount, categoryId, description, paymentMethod, notes },
                    currentUser
                });
                
                if (result.success) {
                    showMessage(document.querySelector('#transactions-view .message'), 
                        'Transaction created successfully', 'success');
                    transactionFormContainer.classList.add('hidden');
                    loadTransactions(); // Refresh the transaction list
                } else {
                    showMessage(document.querySelector('#transactions-view .message'), 
                        result.message, 'error');
                }
            } catch (error) {
                showMessage(document.querySelector('#transactions-view .message'), 
                    'An error occurred while creating the transaction', 'error');
                console.error('Create transaction error:', error);
            }
        });
    }
    
    // Filter functionality for transactions
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', loadTransactions);
    }
    
    // Initialize dashboard with sample data
    initializeDashboard();
});

// Helper function to show messages
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message';
        }, 3000);
    }
}

// Initialize dashboard with sample data
function initializeDashboard() {
    // In a real implementation, this would fetch actual data from the backend
    const totalBalanceElement = document.querySelector('.stat-card .amount');
    const incomeElement = document.querySelector('.stat-card .amount.income');
    const expenseElement = document.querySelector('.stat-card .amount.expense');
    
    if (totalBalanceElement) totalBalanceElement.textContent = '$5,240.50';
    if (incomeElement) incomeElement.textContent = '$3,200.00';
    if (expenseElement) expenseElement.textContent = '$1,850.25';
}

// Tab functionality for categories view
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked tab
        e.target.classList.add('active');
        
        // In a real implementation, this would load the appropriate categories
    }
});

// Load users for the user management view
async function loadUsers() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const result = await window.electronAPI.getAllUsers(currentUser);
        
        if (result.success) {
            const usersTbody = document.getElementById('users-tbody');
            usersTbody.innerHTML = '';
            
            result.users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.username}</td>
                    <td>${user.role}</td>
                    <td>${user.isActive ? 'Active' : 'Inactive'}</td>
                    <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-edit" data-id="${user.id}">Edit</button>
                        <button class="btn btn-danger" data-id="${user.id}">Delete</button>
                    </td>
                `;
                usersTbody.appendChild(row);
            });
        } else {
            showMessage(document.querySelector('#users-view .message'), 
                result.message, 'error');
        }
    } catch (error) {
        showMessage(document.querySelector('#users-view .message'), 
            'An error occurred while loading users', 'error');
        console.error('Load users error:', error);
    }
}

// Load categories for the category management view
async function loadCategories() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const result = await window.electronAPI.getCategories(currentUser);
        
        if (result.success) {
            const categoriesGrid = document.querySelector('.categories-grid');
            categoriesGrid.innerHTML = '';
            
            result.categories.forEach(category => {
                const card = document.createElement('div');
                card.className = 'category-card';
                card.innerHTML = `
                    <div class="category-header">
                        <span class="category-color" style="background-color: ${category.color};"></span>
                        <strong>${category.name}</strong>
                    </div>
                    <div class="category-type">${category.type}</div>
                `;
                categoriesGrid.appendChild(card);
            });
        } else {
            showMessage(document.querySelector('#categories-view .message'), 
                result.message, 'error');
        }
    } catch (error) {
        showMessage(document.querySelector('#categories-view .message'), 
            'An error occurred while loading categories', 'error');
        console.error('Load categories error:', error);
    }
}

// Load categories for the transaction filter dropdown
async function loadCategoriesForFilter() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const result = await window.electronAPI.getCategories(currentUser);
        
        if (result.success) {
            const categoryFilter = document.getElementById('category-filter');
            const transactionCategory = document.getElementById('transaction-category');
            
            // Clear existing options
            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            transactionCategory.innerHTML = '<option value="">Select Category</option>';
            
            result.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoryFilter.appendChild(option.cloneNode(true));
                transactionCategory.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Load categories for filter error:', error);
    }
}

// Load transactions for the transaction view
async function loadTransactions() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Get filter values
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const categoryId = document.getElementById('category-filter').value;
        const type = document.getElementById('type-filter').value;
        
        const filters = {};
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        if (categoryId) filters.categoryId = categoryId;
        if (type) filters.type = type;
        
        const result = await window.electronAPI.getTransactions({ filters, currentUser });
        
        if (result.success) {
            const transactionsTbody = document.getElementById('transactions-tbody');
            transactionsTbody.innerHTML = '';
            
            result.transactions.forEach(transaction => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(transaction.date).toLocaleDateString()}</td>
                    <td>${transaction.description}</td>
                    <td>
                        <span class="category-color" style="background-color: ${transaction.category.color};"></span>
                        ${transaction.category.name}
                    </td>
                    <td class="${transaction.type === 'income' ? 'income' : 'expense'}">
                        $${parseFloat(transaction.amount).toFixed(2)}
                    </td>
                    <td>
                        <button class="btn btn-edit" data-id="${transaction.id}">Edit</button>
                        <button class="btn btn-danger" data-id="${transaction.id}">Delete</button>
                    </td>
                `;
                transactionsTbody.appendChild(row);
            });
        } else {
            showMessage(document.querySelector('#transactions-view .message'), 
                result.message, 'error');
        }
    } catch (error) {
        showMessage(document.querySelector('#transactions-view .message'), 
            'An error occurred while loading transactions', 'error');
        console.error('Load transactions error:', error);
    }
}

// Sample data for demonstration
const sampleTransactions = [
    { id: 1, date: '2025-12-01', description: 'Salary Deposit', category: 'Salary', amount: 3200.00, type: 'income' },
    { id: 2, date: '2025-12-02', description: 'Grocery Shopping', category: 'Food', amount: 85.75, type: 'expense' },
    { id: 3, date: '2025-12-03', description: 'Electricity Bill', category: 'Utilities', amount: 120.50, type: 'expense' },
    { id: 4, date: '2025-12-05', description: 'Freelance Work', category: 'Consulting', amount: 500.00, type: 'income' },
];

const sampleCategories = [
    { id: 1, name: 'Salary', type: 'income', color: '#10B981' },
    { id: 2, name: 'Freelance', type: 'income', color: '#3B82F6' },
    { id: 3, name: 'Food', type: 'expense', color: '#EF4444' },
    { id: 4, name: 'Utilities', type: 'expense', color: '#F59E0B' },
    { id: 5, name: 'Entertainment', type: 'expense', color: '#8B5CF6' },
];