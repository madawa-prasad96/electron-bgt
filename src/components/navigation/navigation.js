class NavigationComponent {
    constructor() {
        this.container = null;
        this.onViewChange = null;
    }

    async render() {
        // Create the HTML directly instead of fetching it
        try {
            console.log('Rendering navigation component...');
            
            this.container = document.createElement('div');
            this.container.innerHTML = `
<nav class="sidebar">
    <ul>
        <li><a href="#" class="nav-link active" data-view="dashboard">Dashboard</a></li>
        <li><a href="#" class="nav-link" data-view="transactions">Transactions</a></li>
        <li><a href="#" class="nav-link" data-view="categories">Categories</a></li>
        <li><a href="#" class="nav-link" data-view="reports">Reports</a></li>
        <li><a href="#" class="nav-link" data-view="users">User Management</a></li>
        <li><a href="#" class="nav-link" data-view="audit">Audit Logs</a></li>
        <li><a href="#" class="nav-link" data-view="settings">Settings</a></li>
    </ul>
</nav>
            `;
            
            // Add event listeners
            this.attachEventListeners();
            
            return this.container;
        } catch (error) {
            console.error('Error rendering navigation component:', error);
            // Create a fallback container with error message
            this.container = document.createElement('div');
            this.container.innerHTML = `
                <nav class="sidebar">
                    <p>Error rendering navigation component: ${error.message}</p>
                </nav>
            `;
            return this.container;
        }
    }

    attachEventListeners() {
        const navLinks = this.container.querySelectorAll('.nav-link');
        console.log('Found nav links:', navLinks.length);
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Nav link clicked');
                
                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                console.log('Active nav link updated');
                
                // Notify about view change
                const viewName = link.getAttribute('data-view');
                console.log('View change requested:', viewName);
                if (this.onViewChange) {
                    this.onViewChange(viewName);
                } else {
                    console.log('No onViewChange handler');
                }
            });
        });
    }

    setActiveView(viewName) {
        console.log('Setting active view:', viewName);
        const navLinks = this.container.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-view') === viewName) {
                link.classList.add('active');
            }
        });
    }
}

// Export the component
window.NavigationComponent = NavigationComponent;