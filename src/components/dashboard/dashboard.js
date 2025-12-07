class DashboardComponent {
    constructor() {
        this.container = null;
        this.currentUser = ComponentUtils.getCurrentUser();
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
            await this.initializeDashboard();
            
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

    async initializeDashboard() {
        // Make sure we have a container
        if (!this.container) {
            return;
        }
        
        try {
            // Fetch transactions data
            const result = await window.electronAPI.getTransactions({
                filters: {},
                currentUser: this.currentUser
            });
            
            if (result.success) {
                // Calculate dashboard statistics
                const stats = this.calculateDashboardStats(result.transactions);
                
                // Update UI with calculated values
                const statCards = this.container.querySelectorAll('.stat-card .amount');
                if (statCards.length >= 3) {
                    statCards[0].textContent = ComponentUtils.formatCurrency(stats.totalBalance);
                    statCards[1].textContent = ComponentUtils.formatCurrency(stats.incomeThisMonth);
                    statCards[2].textContent = ComponentUtils.formatCurrency(stats.expensesThisMonth);
                }
            } else {
                console.error('Failed to load dashboard data:', result.message);
            }
        } catch (error) {
            console.error('Error initializing dashboard:', error);
        }
    }
    
    calculateDashboardStats(transactions) {
        // Initialize stats
        const stats = {
            totalBalance: 0,
            incomeThisMonth: 0,
            expensesThisMonth: 0
        };
        
        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Calculate totals
        transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            
            if (transaction.type === 'income') {
                stats.totalBalance += transaction.amount;
                
                // Check if transaction is in current month
                if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
                    stats.incomeThisMonth += transaction.amount;
                }
            } else {
                stats.totalBalance -= transaction.amount;
                
                // Check if transaction is in current month
                if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
                    stats.expensesThisMonth += transaction.amount;
                }
            }
        });
        
        return stats;
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