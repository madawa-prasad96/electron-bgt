class ReportsComponent extends BaseComponent {
    constructor() {
        super();
        this.currentUser = ComponentUtils.getCurrentUser();
        this.reportData = null;
    }

    async render() {
        try {
            console.log('Rendering reports component...');
            
            // Create the HTML directly instead of fetching it
            this.container = document.createElement('div');
            // Remove the outer div with id since it will be added by the app controller
            this.container.innerHTML = `
<h2>Reports</h2>
<div class="report-filters">
    <input type="month" id="report-month">
    <button id="generate-report" class="btn btn-primary">Generate Report</button>
    <button id="export-pdf" class="btn">Export to PDF</button>
</div>
<div class="report-content">
    <div class="chart-container">
        <h3>Income vs Expenses</h3>
        <canvas id="income-expense-chart"></canvas>
    </div>
    <div class="chart-container">
        <h3>Category Breakdown</h3>
        <canvas id="category-breakdown-chart"></canvas>
    </div>
    <div class="report-summary">
        <h3>Summary</h3>
        <div class="summary-stats">
            <div class="stat-card">
                <h4>Total Income</h4>
                <p class="amount income">$0.00</p>
            </div>
            <div class="stat-card">
                <h4>Total Expenses</h4>
                <p class="amount expense">$0.00</p>
            </div>
            <div class="stat-card">
                <h4>Net Balance</h4>
                <p class="amount">$0.00</p>
            </div>
        </div>
    </div>
</div>
            `;
            
            // Initialize report view
            this.initReportView();
            
            // Add event listeners
            this.attachEventListeners();
            
            return this.container;
        } catch (error) {
            console.error('Error rendering reports component:', error);
            // Create a fallback container with error message
            this.container = document.createElement('div');
            this.container.innerHTML = `
                <h2>Reports</h2>
                <p>Error rendering reports component: ${error.message}</p>
            `;
            return this.container;
        }
    }

    initReportView() {
        // Set default month to current month
        const reportMonthInput = this.container.querySelector('#report-month');
        if (reportMonthInput) {
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            reportMonthInput.value = currentMonth;
        }
    }

    attachEventListeners() {
        // Generate report button
        const generateReportBtn = this.container.querySelector('#generate-report');
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', () => {
                this.generateReport();
            });
        }

        // Export PDF button
        const exportPdfBtn = this.container.querySelector('#export-pdf');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => {
                this.exportToPDF();
            });
        }
    }

    async generateReport() {
        try {
            const reportMonthInput = this.container.querySelector('#report-month');
            if (!reportMonthInput) return;
            
            const [year, month] = reportMonthInput.value.split('-').map(Number);
            
            const result = await window.electronAPI.getReportData({ 
                month, 
                year, 
                currentUser: this.currentUser 
            });
            
            if (result.success) {
                this.reportData = result.data;
                this.renderReport();
            } else {
                ComponentUtils.showMessage(
                    this.container.querySelector('.message') || this.container,
                    result.message || 'Failed to generate report',
                    'error'
                );
            }
        } catch (error) {
            ComponentUtils.showMessage(
                this.container.querySelector('.message') || this.container,
                'An error occurred while generating the report',
                'error'
            );
            console.error('Generate report error:', error);
        }
    }

    renderReport() {
        if (!this.reportData) return;

        // Update summary stats
        this.container.querySelector('.summary-stats .stat-card:nth-child(1) .amount').textContent = 
            ComponentUtils.formatCurrency(this.reportData.totalIncome);
        this.container.querySelector('.summary-stats .stat-card:nth-child(2) .amount').textContent = 
            ComponentUtils.formatCurrency(this.reportData.totalExpenses);
        this.container.querySelector('.summary-stats .stat-card:nth-child(3) .amount').textContent = 
            ComponentUtils.formatCurrency(this.reportData.totalIncome - this.reportData.totalExpenses);
        
        // Render charts
        this.renderIncomeExpenseChart();
        this.renderCategoryBreakdownChart();
    }

    renderIncomeExpenseChart() {
        const ctx = this.container.querySelector('#income-expense-chart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (window.incomeExpenseChart) {
            window.incomeExpenseChart.destroy();
        }
        
        window.incomeExpenseChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [{
                    label: 'Amount ($)',
                    data: [this.reportData.totalIncome, this.reportData.totalExpenses],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.7)',  // Green for income
                        'rgba(239, 68, 68, 0.7)'    // Red for expenses
                    ],
                    borderColor: [
                        'rgb(16, 185, 129)',
                        'rgb(239, 68, 68)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ComponentUtils.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return ComponentUtils.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    renderCategoryBreakdownChart() {
        const ctx = this.container.querySelector('#category-breakdown-chart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (window.categoryBreakdownChart) {
            window.categoryBreakdownChart.destroy();
        }
        
        // Prepare data for chart
        const labels = this.reportData.categoryData.map(cat => cat.name);
        const data = this.reportData.categoryData.map(cat => cat.income + cat.expense);
        const colors = this.reportData.categoryData.map(cat => cat.color);
        
        window.categoryBreakdownChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Category Breakdown',
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors.map(color => color.replace(')', ', 1)').replace('rgb', 'rgba')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                return `${label}: ${ComponentUtils.formatCurrency(value)}`;
                            }
                        }
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    async exportToPDF() {
        try {
            // If we don't have report data, generate it first
            if (!this.reportData) {
                await this.generateReport();
                if (!this.reportData) return;
            }
            
            // Create PDF document definition
            const docDefinition = {
                content: [
                    {
                        text: 'Financial Report',
                        style: 'header'
                    },
                    {
                        text: `${ComponentUtils.getMonthName(this.reportData.month)} ${this.reportData.year}`,
                        style: 'subheader'
                    },
                    {
                        text: `Generated on: ${new Date().toLocaleDateString()}`,
                        style: 'small'
                    },
                    '\n',
                    {
                        text: 'Summary',
                        style: 'sectionHeader'
                    },
                    {
                        columns: [
                            {
                                text: `Total Income: ${ComponentUtils.formatCurrency(this.reportData.totalIncome)}`,
                                style: 'incomeText'
                            },
                            {
                                text: `Total Expenses: ${ComponentUtils.formatCurrency(this.reportData.totalExpenses)}`,
                                style: 'expenseText'
                            },
                            {
                                text: `Net Balance: ${ComponentUtils.formatCurrency(this.reportData.totalIncome - this.reportData.totalExpenses)}`,
                                style: 'balanceText'
                            }
                        ]
                    },
                    '\n',
                    {
                        text: 'Transactions',
                        style: 'sectionHeader'
                    },
                    {
                        table: {
                            headerRows: 1,
                            widths: ['auto', '*', 'auto', 'auto'],
                            body: [
                                ['Date', 'Description', 'Category', 'Amount'],
                                ...this.reportData.transactions.map(transaction => [
                                    ComponentUtils.formatDate(transaction.date),
                                    transaction.description,
                                    transaction.category.name,
                                    {
                                        text: ComponentUtils.formatCurrency(transaction.amount),
                                        style: transaction.type === 'income' ? 'incomeText' : 'expenseText'
                                    }
                                ])
                            ]
                        },
                        layout: 'lightHorizontalLines'
                    }
                ],
                styles: {
                    header: {
                        fontSize: 22,
                        bold: true,
                        margin: [0, 0, 0, 10]
                    },
                    subheader: {
                        fontSize: 16,
                        bold: true,
                        margin: [0, 10, 0, 5]
                    },
                    sectionHeader: {
                        fontSize: 14,
                        bold: true,
                        margin: [0, 10, 0, 5]
                    },
                    small: {
                        fontSize: 10
                    },
                    incomeText: {
                        color: '#10B981'
                    },
                    expenseText: {
                        color: '#EF4444'
                    },
                    balanceText: {
                        bold: true
                    }
                },
                defaultStyle: {
                    columnGap: 20
                }
            };
            
            // Generate PDF and trigger download
            const pdfDocGenerator = pdfMake.createPdf(docDefinition);
            pdfDocGenerator.download(`financial-report-${this.reportData.year}-${String(this.reportData.month).padStart(2, '0')}.pdf`);
            
            ComponentUtils.showMessage(
                this.container.querySelector('.message') || this.container,
                'Report exported successfully',
                'success'
            );
        } catch (error) {
            ComponentUtils.showMessage(
                this.container.querySelector('.message') || this.container,
                'An error occurred while exporting the report',
                'error'
            );
            console.error('Export PDF error:', error);
        }
    }
}

// Export the component
window.ReportsComponent = ReportsComponent;