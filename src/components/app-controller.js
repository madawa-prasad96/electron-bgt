// Main application controller that manages all components

class AppController {
    constructor() {
        this.authComponent = null;
        this.navigationComponent = null;
        this.dashboardComponent = null;
        this.transactionsComponent = null;
        this.categoriesComponent = null;
        this.reportsComponent = null;
        this.usersComponent = null;
        this.auditComponent = null;
        this.settingsComponent = null;
        this.currentView = 'dashboard';
        this.components = {};
        this.isAuthenticated = false;
    }

    async init() {
        // Make this instance globally accessible
        window.appController = this;
        
        // Initialize theme
        this.initTheme();
        
        // Check for existing valid session
        const currentUser = localStorage.getItem('currentUser');
        const loginExpiry = localStorage.getItem('loginExpiry');
        
        if (currentUser && loginExpiry) {
            const expiryDate = new Date(loginExpiry);
            const currentDate = new Date();
            
            // Check if session is still valid (within 7 days)
            if (expiryDate > currentDate) {
                // Valid session found, skip login
                console.log('Valid session found, skipping login');
                this.isAuthenticated = true;
                
                // Show main app
                document.getElementById('main-app').classList.remove('hidden');
                document.getElementById('login-container').classList.add('hidden');
                
                // Initialize main components
                await this.initMainComponents();
                this.showView('dashboard');
                return;
            } else {
                // Session expired, clear storage
                console.log('Session expired, clearing storage');
                localStorage.removeItem('currentUser');
                localStorage.removeItem('loginExpiry');
            }
        }
        
        // No valid session, show login screen
        document.getElementById('main-app').classList.add('hidden');
        await this.initAuthComponent();
    }

    initTheme() {
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
    }

    async initAuthComponent() {
        console.log('Initializing auth component...');
        // Initialize authentication component for handling login events
        this.authComponent = new AuthComponent();
        // The login form is already in the HTML, so we just need to ensure it's visible
        const loginContainer = document.getElementById('login-container');
        if (loginContainer) {
            loginContainer.classList.remove('hidden');
        }
        console.log('Auth component initialized');
    }

    async initMainComponents() {
        console.log('Initializing main components...');
        
        // Clear existing content
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            contentArea.innerHTML = '';
        }
        
        // Initialize authentication component for handling login events
        if (!this.authComponent) {
            this.authComponent = new AuthComponent();
        }
        
        // Remove existing navigation if present
        const existingNav = document.querySelector('.sidebar');
        if (existingNav) {
            existingNav.remove();
        }
        
        // Initialize navigation component
        console.log('Initializing navigation component...');
        this.navigationComponent = new NavigationComponent();
        this.navigationComponent.onViewChange = (viewName) => {
            console.log('Navigation view change requested:', viewName);
            this.showView(viewName);
        };
        const navContainer = await this.navigationComponent.render();
        const appMain = document.querySelector('.app-main');
        if (appMain && navContainer) {
            appMain.prepend(navContainer);
        }
        console.log('Navigation component initialized');
        
        // Initialize all components
        console.log('Initializing dashboard component...');
        this.dashboardComponent = new DashboardComponent();
        console.log('Initializing transactions component...');
        this.transactionsComponent = new TransactionsComponent();
        console.log('Initializing categories component...');
        this.categoriesComponent = new CategoriesComponent();
        console.log('Initializing reports component...');
        this.reportsComponent = new ReportsComponent();
        console.log('Initializing users component...');
        this.usersComponent = new UsersComponent();
        console.log('Initializing audit component...');
        this.auditComponent = new AuditComponent();
        console.log('Initializing settings component...');
        this.settingsComponent = new SettingsComponent();
        
        console.log('All main components initialized');
    }

    attachEventListeners() {
        // Add any global event listeners here
        
        // Extend session on user activity
        this.setupSessionExtension();
    }
    
    setupSessionExtension() {
        // Extend session on user activity
        const extendSession = () => {
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser && this.isAuthenticated) {
                // Extend session for another 7 days
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 7);
                localStorage.setItem('loginExpiry', expiryDate.toISOString());
                console.log('Session extended for another 7 days');
            }
        };
        
        // Extend session on various user activities
        document.addEventListener('click', extendSession);
        document.addEventListener('keypress', extendSession);
        document.addEventListener('mousemove', extendSession);
    }

    async showView(viewName) {
        console.log('Showing view:', viewName);
        
        // Don't show any view if not authenticated
        if (!this.isAuthenticated) {
            console.log('User not authenticated, cannot show view');
            return;
        }
        
        this.currentView = viewName;
        
        // Update navigation
        if (this.navigationComponent) {
            console.log('Updating navigation active view');
            this.navigationComponent.setActiveView(viewName);
        }
        
        // Hide all views
        const views = document.querySelectorAll('.view');
        console.log('Found views to hide:', views.length);
        views.forEach(view => {
            view.classList.add('hidden');
            view.classList.remove('active');
        });
        
        // Show the requested view
        let targetView = document.getElementById(`${viewName}-view`);
        console.log('Existing view element:', targetView);
        
        // If the view doesn't exist yet, create it
        if (!targetView) {
            console.log('Creating new view for:', viewName);
            let component = null;
            switch (viewName) {
                case 'dashboard':
                    component = this.dashboardComponent;
                    break;
                case 'transactions':
                    component = this.transactionsComponent;
                    break;
                case 'categories':
                    component = this.categoriesComponent;
                    break;
                case 'reports':
                    component = this.reportsComponent;
                    break;
                case 'users':
                    component = this.usersComponent;
                    break;
                case 'audit':
                    component = this.auditComponent;
                    break;
                case 'settings':
                    component = this.settingsComponent;
                    break;
                default:
                    console.log('Unknown view:', viewName);
                    return;
            }
            
            if (component) {
                console.log('Rendering component for:', viewName);
                const container = await component.render();
                console.log('Component rendered, container:', container);
                
                // Extract the content from the container and create a new element with the correct ID
                if (container) {
                    // Create a new div with the correct ID and class
                    const viewElement = document.createElement('div');
                    viewElement.id = `${viewName}-view`;
                    viewElement.className = 'view';
                    
                    // Move all children from the container to the new view element
                    while (container.firstChild) {
                        viewElement.appendChild(container.firstChild);
                    }
                    
                    const contentArea = document.querySelector('.content-area');
                    if (contentArea) {
                        contentArea.appendChild(viewElement);
                        targetView = viewElement;
                        console.log('New view appended to DOM:', targetView);
                    } else {
                        console.error('Content area not found');
                    }
                } else {
                    console.error('Component render returned null container');
                }
                
                // Dashboard initialization is handled in the switch statement below
            } else {
                console.log('No component found for:', viewName);
            }
        }
        
        if (targetView) {
            console.log('Activating view:', targetView);
            targetView.classList.remove('hidden');
            targetView.classList.add('active');
            
            // Load data for the view if needed
            console.log('Loading data for view:', viewName);
            switch (viewName) {
                case 'users':
                    if (this.usersComponent) {
                        // Reattach the component's container to ensure proper data loading
                        this.usersComponent.container = targetView;
                        this.usersComponent.loadUsers();
                    }
                    break;
                case 'categories':
                    if (this.categoriesComponent) {
                        // Reattach the component's container to ensure proper data loading
                        this.categoriesComponent.container = targetView;
                        this.categoriesComponent.loadCategories();
                    }
                    break;
                case 'transactions':
                    if (this.transactionsComponent) {
                        // Reattach the component's container to ensure proper data loading
                        this.transactionsComponent.container = targetView;
                        this.transactionsComponent.loadTransactions();
                        this.transactionsComponent.loadCategoriesForFilter();
                    }
                    break;
                case 'audit':
                    if (this.auditComponent) {
                        // Reattach the component's container to ensure proper data loading
                        this.auditComponent.container = targetView;
                        this.auditComponent.loadAuditLogs();
                    }
                    break;
                case 'reports':
                    // Report view is initialized in the component
                    break;
                case 'dashboard':
                    if (this.dashboardComponent) {
                        this.dashboardComponent.container = targetView;
                        await this.dashboardComponent.initializeDashboard();
                    }
                    break;
                case 'settings':
                    if (this.settingsComponent) {
                        // Reattach the component's container to ensure proper data loading
                        this.settingsComponent.container = targetView;
                    }
                    break;
            }
        } else {
            console.log('No target view found or created for:', viewName);
        }
    }

    // These methods would be implemented with actual data loading
    async loadUsers() {
        if (this.usersComponent) {
            await this.usersComponent.loadUsers();
        }
    }

    async loadCategories() {
        if (this.categoriesComponent) {
            await this.categoriesComponent.loadCategories();
        }
    }

    async loadTransactions() {
        if (this.transactionsComponent) {
            await this.transactionsComponent.loadTransactions();
        }
    }

    async loadCategoriesForFilter() {
        if (this.transactionsComponent) {
            await this.transactionsComponent.loadCategoriesForFilter();
        }
    }

    async loadAuditLogs() {
        if (this.auditComponent) {
            await this.auditComponent.loadAuditLogs();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing app controller');
    const app = new AppController();
    await app.init();
});

// Export the controller
window.AppController = AppController;