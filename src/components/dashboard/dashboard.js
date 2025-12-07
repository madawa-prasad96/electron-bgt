class DashboardComponent {
    constructor() {
        this.container = null;
    }

    async render() {
        // Create the HTML directly instead of fetching it
        try {
            console.log('Rendering dashboard component...');
            
            this.container = document.createElement('div');
            // Remove the outer div with id since it will be added by the app controller
            this.container.innerHTML = `
<h2>Dashboard</h2>
<div class="dashboard-stats">
    <div class="stat-card">
        <h3>Total Balance</h3>
        <p class="amount">$0.00</p>
    </div>
    <div class="stat-card">
        <h3>Income (This Month)</h3>
        <p class="amount income">$0.00</p>
    </div>
    <div class="stat-card">
        <h3>Expenses (This Month)</h3>
        <p class="amount expense">$0.00</p>
    </div>
</div>
            `;
            
            // Initialize dashboard data
            this.initializeDashboard();
            
            return this.container;
        } catch (error) {
            console.error('Error rendering dashboard component:', error);
            // Create a fallback container with error message
            this.container = document.createElement('div');
            this.container.innerHTML = `
                <h2>Dashboard</h2>
                <p>Error rendering dashboard component: ${error.message}</p>
            `;
            return this.container;
        }
    }

    initializeDashboard() {
        // Make sure we have a container
        if (!this.container) {
            return;
        }
        
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