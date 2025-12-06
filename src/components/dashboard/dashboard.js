class DashboardComponent {
    constructor() {
        this.container = null;
    }

    async render() {
        // Fetch the HTML template
        try {
            const response = await fetch('../components/dashboard/dashboard.html');
            const html = await response.text();
            
            // Create a container div and set its innerHTML
            this.container = document.createElement('div');
            this.container.innerHTML = html;
            
            // Initialize dashboard data
            this.initializeDashboard();
            
            return this.container;
        } catch (error) {
            console.error('Error loading dashboard component:', error);
            return document.createElement('div');
        }
    }

    initializeDashboard() {
        // In a real implementation, this would fetch actual data from the backend
        const totalBalanceElement = this.container.querySelector('.stat-card .amount');
        const incomeElement = this.container.querySelector('.stat-card .amount.income');
        const expenseElement = this.container.querySelector('.stat-card .amount.expense');
        
        if (totalBalanceElement) totalBalanceElement.textContent = '$5,240.50';
        if (incomeElement) incomeElement.textContent = '$3,200.00';
        if (expenseElement) expenseElement.textContent = '$1,850.25';
    }

    show() {
        if (this.container) {
            this.container.classList.remove('hidden');
            this.container.classList.add('active');
        }
    }

    hide() {
        if (this.container) {
            this.container.classList.add('hidden');
            this.container.classList.remove('active');
        }
    }
}

// Export the component
window.DashboardComponent = DashboardComponent;