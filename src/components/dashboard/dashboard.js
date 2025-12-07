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

<!-- Chart Controls -->
<div class="chart-controls">
    <label for="timePeriod">Select Time Period:</label>
    <select id="timePeriod" class="time-period-selector">
        <option value="week">Last 7 Days</option>
        <option value="month" selected>Last 30 Days</option>
        <option value="year">Last 12 Months</option>
    </select>
</div>

<!-- Chart Container -->
<div class="chart-container">
    <canvas id="transactionsChart"></canvas>
</div>
            `;
            
            // Initialize dashboard data
            await this.initializeDashboard();
            
            // Initialize chart
            this.initializeChart();
            
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
                
                // Update chart if it exists
                if (this.chart) {
                    // Get current time period from selector
                    const timePeriodSelector = this.container.querySelector('#timePeriod');
                    const timePeriod = timePeriodSelector ? timePeriodSelector.value : 'month';
                    
                    // Process data based on time period
                    const processedData = this.processTransactionsForChart(result.transactions, timePeriod);
                    
                    // Update chart data
                    this.chart.data.labels = processedData.labels;
                    this.chart.data.datasets[0].data = processedData.incomeData;
                    this.chart.data.datasets[1].data = processedData.expenseData;
                    
                    // Update chart
                    this.chart.update();
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
    
    initializeChart() {
        // Get the canvas element
        const canvas = this.container.querySelector('#transactionsChart');
        if (!canvas) {
            console.error('Chart canvas not found');
            return;
        }
        
        // Get the 2D context
        const ctx = canvas.getContext('2d');
        
        // Create the chart
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Income',
                        data: [],
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.1,
                        fill: true
                    },
                    {
                        label: 'Expenses',
                        data: [],
                        borderColor: '#F44336',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        tension: 0.1,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
        
        // Attach event listener to time period selector
        const timePeriodSelector = this.container.querySelector('#timePeriod');
        if (timePeriodSelector) {
            timePeriodSelector.addEventListener('change', (e) => {
                this.updateChartData(e.target.value);
            });
        }
        
        // Load initial data
        this.updateChartData('month');
    }
    
    async updateChartData(timePeriod) {
        // Check if chart is available
        if (!this.chart) {
            return;
        }
        
        try {
            // Fetch transactions data
            const result = await window.electronAPI.getTransactions({
                filters: {},
                currentUser: this.currentUser
            });
            
            if (result.success) {
                // Process data based on time period
                const processedData = this.processTransactionsForChart(result.transactions, timePeriod);
                
                // Update chart data
                this.chart.data.labels = processedData.labels;
                this.chart.data.datasets[0].data = processedData.incomeData;
                this.chart.data.datasets[1].data = processedData.expenseData;
                
                // Update chart
                this.chart.update();
            } else {
                console.error('Failed to load transactions data:', result.message);
            }
        } catch (error) {
            console.error('Error updating chart data:', error);
        }
    }
    
    processTransactionsForChart(transactions, timePeriod) {
        // Initialize data structures
        const dataMap = new Map();
        
        // Define date range based on time period
        const now = new Date();
        let startDate;
        
        switch (timePeriod) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        
        // Initialize data map with zeros for each period
        if (timePeriod === 'year') {
            // For yearly view, group by month
            for (let i = 11; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                const monthLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' });
                dataMap.set(monthKey, { label: monthLabel, income: 0, expense: 0 });
            }
        } else {
            // For weekly and monthly views, group by day
            const currentDate = new Date(startDate);
            while (currentDate <= now) {
                const dateKey = currentDate.toISOString().split('T')[0];
                const dateLabel = currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                dataMap.set(dateKey, { label: dateLabel, income: 0, expense: 0 });
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        
        // Process transactions
        transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            
            // Skip transactions outside the date range
            if (transactionDate < startDate || transactionDate > now) {
                return;
            }
            
            let key;
            if (timePeriod === 'year') {
                // For yearly view, use year-month
                key = `${transactionDate.getFullYear()}-${(transactionDate.getMonth() + 1).toString().padStart(2, '0')}`;
            } else {
                // For weekly and monthly views, use date
                key = transactionDate.toISOString().split('T')[0];
            }
            
            // Update data if key exists
            if (dataMap.has(key)) {
                const dataPoint = dataMap.get(key);
                if (transaction.type === 'income') {
                    dataPoint.income += transaction.amount;
                } else {
                    dataPoint.expense += transaction.amount;
                }
            }
        });
        
        // Convert map to arrays for chart
        const labels = [];
        const incomeData = [];
        const expenseData = [];
        
        dataMap.forEach((value, key) => {
            labels.push(value.label);
            incomeData.push(value.income);
            expenseData.push(value.expense);
        });
        
        return { labels, incomeData, expenseData };
    }
}

// Export the component
window.DashboardComponent = DashboardComponent;