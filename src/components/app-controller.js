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
    }

    async init() {
        // Initialize theme
        this.initTheme();
        
        // Initialize components
        await this.initComponents();
        
        // Attach event listeners
        this.attachEventListeners();
        
        // Show initial view
        this.showView(this.currentView);
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

    async initComponents() {
        // Initialize authentication component
        this.authComponent = new AuthComponent();
        const authContainer = await this.authComponent.render();
        document.getElementById('app').prepend(authContainer);
        
        // Initialize navigation component
        this.navigationComponent = new NavigationComponent();
        this.navigationComponent.onViewChange = (viewName) => {
            this.showView(viewName);
        };
        const navContainer = await this.navigationComponent.render();
        document.querySelector('.content-area').before(navContainer);
        
        // Initialize dashboard component
        this.dashboardComponent = new DashboardComponent();
        const dashboardContainer = await this.dashboardComponent.render();
        document.querySelector('.content-area').appendChild(dashboardContainer);
        
        // Initialize other components
        this.transactionsComponent = new TransactionsComponent();
        this.categoriesComponent = new CategoriesComponent();
        this.reportsComponent = new ReportsComponent();
        this.usersComponent = new UsersComponent();
        this.auditComponent = new AuditComponent();
        this.settingsComponent = new SettingsComponent();
    }

    attachEventListeners() {
        // Add any global event listeners here
    }

    async showView(viewName) {
        this.currentView = viewName;
        
        // Update navigation
        if (this.navigationComponent) {
            this.navigationComponent.setActiveView(viewName);
        }
        
        // Hide all views
        const views = document.querySelectorAll('.view');
        views.forEach(view => {
            view.classList.add('hidden');
            view.classList.remove('active');
        });
        
        // Show the requested view
        let targetView = document.getElementById(`${viewName}-view`);
        
        // If the view doesn't exist yet, create it
        if (!targetView) {
            let component = null;
            switch (viewName) {
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
            }
            
            if (component) {
                const container = await component.render();
                document.querySelector('.content-area').appendChild(container);
                targetView = container;
            }
        }
        
        if (targetView) {
            targetView.classList.remove('hidden');
            targetView.classList.add('active');
            
            // Load data for the view if needed
            switch (viewName) {
                case 'users':
                    if (this.usersComponent) this.usersComponent.loadUsers();
                    break;
                case 'categories':
                    if (this.categoriesComponent) this.categoriesComponent.loadCategories();
                    break;
                case 'transactions':
                    if (this.transactionsComponent) {
                        this.transactionsComponent.loadTransactions();
                        this.transactionsComponent.loadCategoriesForFilter();
                    }
                    break;
                case 'audit':
                    if (this.auditComponent) this.auditComponent.loadAuditLogs();
                    break;
                case 'reports':
                    // Report view is initialized in the component
                    break;
            }
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
    const app = new AppController();
    await app.init();
});

// Export the controller
window.AppController = AppController;