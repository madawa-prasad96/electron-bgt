class NavigationComponent {
    constructor() {
        this.container = null;
        this.onViewChange = null;
    }

    async render() {
        // Fetch the HTML template
        try {
            const response = await fetch('../components/navigation/sidebar.html');
            const html = await response.text();
            
            // Create a container div and set its innerHTML
            this.container = document.createElement('div');
            this.container.innerHTML = html;
            
            // Add event listeners
            this.attachEventListeners();
            
            return this.container;
        } catch (error) {
            console.error('Error loading navigation component:', error);
            return document.createElement('div');
        }
    }

    attachEventListeners() {
        const navLinks = this.container.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Notify about view change
                const viewName = link.getAttribute('data-view');
                if (this.onViewChange) {
                    this.onViewChange(viewName);
                }
            });
        });
    }

    setActiveView(viewName) {
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