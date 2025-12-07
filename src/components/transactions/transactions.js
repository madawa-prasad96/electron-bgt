class TransactionsComponent extends BaseComponent {
    constructor() {
        super();
        this.currentUser = ComponentUtils.getCurrentUser();
    }

    async render() {
        try {
            console.log('Rendering transactions component...');
            
            // Create the HTML directly instead of fetching it
            this.container = document.createElement('div');
            // Remove the outer div with id since it will be added by the app controller
            this.container.innerHTML = `
<h2>Transactions</h2>
<div class="view-actions">
    <button id="add-transaction-btn" class="btn btn-primary">Add Transaction</button>
</div>
<div id="transaction-form-container" class="hidden">
    <form id="transaction-form">
        <div class="form-row">
            <div class="form-group">
                <label for="transaction-date">Date</label>
                <input type="date" id="transaction-date" required>
            </div>
            <div class="form-group">
                <label for="transaction-type">Type</label>
                <select id="transaction-type" required>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="transaction-amount">Amount</label>
                <input type="number" id="transaction-amount" step="0.01" min="0" required>
            </div>
            <div class="form-group">
                <label for="transaction-category">Category</label>
                <select id="transaction-category" required>
                    <option value="">Select Category</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label for="transaction-description">Description</label>
            <input type="text" id="transaction-description" required>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="transaction-payment-method">Payment Method</label>
                <input type="text" id="transaction-payment-method">
            </div>
            <div class="form-group">
                <label for="transaction-notes">Notes</label>
                <input type="text" id="transaction-notes">
            </div>
        </div>
        <div class="form-actions">
            <button type="button" id="cancel-transaction-btn" class="btn">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Transaction</button>
        </div>
    </form>
    <div class="message"></div>
</div>
<div class="filters">
    <input type="date" id="start-date">
    <input type="date" id="end-date">
    <select id="category-filter">
        <option value="">All Categories</option>
    </select>
    <select id="type-filter">
        <option value="">All Types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
    </select>
    <button id="apply-filters" class="btn">Apply Filters</button>
</div>
<table class="data-table">
    <thead>
        <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody id="transactions-tbody">
        <!-- Transactions will be populated here -->
    </tbody>
</table>
            `;
            
            console.log('Transactions component HTML created, container:', this.container);
            
            // Add event listeners
            this.attachEventListeners();
            
            console.log('Transactions component rendered successfully');
            return this.container;
        } catch (error) {
            console.error('Error rendering transactions component:', error);
            // Create a fallback container with error message
            this.container = document.createElement('div');
            this.container.innerHTML = `
                <h2>Transactions</h2>
                <p>Error rendering transactions component: ${error.message}</p>
            `;
            return this.container;
        }
    }

    attachEventListeners() {
        // Make sure we have a container
        if (!this.container) {
            console.warn('No container found for transactions component');
            return;
        }
        
        console.log('Attaching event listeners for transactions component');
        
        // Add transaction button
        const addTransactionBtn = this.container.querySelector('#add-transaction-btn');
        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', () => {
                console.log('Add transaction button clicked');
                this.container.querySelector('#transaction-form-container').classList.remove('hidden');
                // Set today's date as default
                const today = new Date();
                // Format date as YYYY-MM-DD for input type=date
                const formattedDate = today.toISOString().split('T')[0];
                this.container.querySelector('#transaction-date').value = formattedDate;
                console.log('Date field set to:', formattedDate);
                // Log the actual value in the date field
                setTimeout(() => {
                    const dateField = this.container.querySelector('#transaction-date');
                    console.log('Date field value:', dateField.value);
                }, 100);
            });
        }

        // Cancel transaction button
        const cancelTransactionBtn = this.container.querySelector('#cancel-transaction-btn');
        if (cancelTransactionBtn) {
            cancelTransactionBtn.addEventListener('click', () => {
                this.container.querySelector('#transaction-form-container').classList.add('hidden');
            });
        }

        // Transaction form submission
        const transactionForm = this.container.querySelector('#transaction-form');
        if (transactionForm) {
            transactionForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Validate form data
                // Directly access form field values for more reliable data extraction
                const dateField = this.container.querySelector('#transaction-date');
                console.log('Date field element:', dateField);
                if (!dateField) {
                    console.error('Date field not found!');
                    ComponentUtils.showMessage(
                        this.container.querySelector('.message') || this.container,
                        'Form error: Date field not found',
                        'error'
                    );
                    return;
                }
                
                const transactionData = {
                    date: dateField.value,
                    type: this.container.querySelector('#transaction-type').value,
                    amount: this.container.querySelector('#transaction-amount').value,
                    categoryId: this.container.querySelector('#transaction-category').value,
                    description: this.container.querySelector('#transaction-description').value,
                    paymentMethod: this.container.querySelector('#transaction-payment-method').value,
                    notes: this.container.querySelector('#transaction-notes').value
                };
                
                console.log('Date field value:', dateField.value);
                
                // Debugging: Log the form data
                console.log('Transaction form data:', transactionData);
                
                // Client-side validation
                console.log('Validating date field:', transactionData.date, typeof transactionData.date);
                // More robust date validation
                console.log('Checking date field value:', transactionData.date);
                console.log('Date field type:', typeof transactionData.date);
                
                // Check if date is valid
                if (!transactionData.date) {
                    console.log('Date is null or undefined');
                    ComponentUtils.showMessage(
                        this.container.querySelector('.message') || this.container,
                        'Please select a date',
                        'error'
                    );
                    return;
                }
                
                const dateString = transactionData.date.toString().trim();
                if (dateString === '') {
                    console.log('Date string is empty');
                    ComponentUtils.showMessage(
                        this.container.querySelector('.message') || this.container,
                        'Please select a date',
                        'error'
                    );
                    return;
                }
                
                // Try to parse the date to see if it's valid
                // HTML date inputs should be in YYYY-MM-DD format
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(dateString)) {
                    console.log('Date is not in valid YYYY-MM-DD format:', dateString);
                    ComponentUtils.showMessage(
                        this.container.querySelector('.message') || this.container,
                        'Please select a valid date',
                        'error'
                    );
                    return;
                }
                
                const parsedDate = new Date(dateString);
                if (isNaN(parsedDate.getTime())) {
                    console.log('Date is not valid:', dateString);
                    ComponentUtils.showMessage(
                        this.container.querySelector('.message') || this.container,
                        'Please select a valid date',
                        'error'
                    );
                    return;
                }
                
                console.log('Date validation passed');
                
                if (!transactionData.type) {
                    ComponentUtils.showMessage(
                        this.container.querySelector('.message') || this.container,
                        'Please select a transaction type',
                        'error'
                    );
                    return;
                }
                
                if (!transactionData.amount || isNaN(parseFloat(transactionData.amount)) || parseFloat(transactionData.amount) <= 0) {
                    ComponentUtils.showMessage(
                        this.container.querySelector('.message') || this.container,
                        'Please enter a valid amount',
                        'error'
                    );
                    return;
                }
                
                if (!transactionData.categoryId) {
                    ComponentUtils.showMessage(
                        this.container.querySelector('.message') || this.container,
                        'Please select a category',
                        'error'
                    );
                    return;
                }
                
                if (!transactionData.description) {
                    ComponentUtils.showMessage(
                        this.container.querySelector('.message') || this.container,
                        'Please enter a description',
                        'error'
                    );
                    return;
                }

                try {
                    const result = await window.electronAPI.createTransaction({
                        transactionData,
                        currentUser: this.currentUser
                    });

                    if (result.success) {
                        ComponentUtils.showMessage(
                            this.container.querySelector('.message') || this.container,
                            'Transaction created successfully',
                            'success'
                        );
                        transactionForm.reset();
                        this.container.querySelector('#transaction-form-container').classList.add('hidden');
                        this.loadTransactions();
                    } else {
                        ComponentUtils.showMessage(
                            this.container.querySelector('.message') || this.container,
                            result.message || 'Failed to create transaction',
                            'error'
                        );
                    }
                } catch (error) {
                    ComponentUtils.showMessage(
                        this.container.querySelector('.message') || this.container,
                        'An error occurred while creating the transaction: ' + error.message,
                        'error'
                    );
                    console.error('Create transaction error:', error);
                }
            });
        }

        // Apply filters button
        const applyFiltersBtn = this.container.querySelector('#apply-filters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.loadTransactions();
            });
        }

        // Load categories for filter and form when component is shown
        this.loadCategoriesForFilter();
        
        console.log('Event listeners attached for transactions component');
    }

    async loadTransactions() {
        // Make sure we have a container
        if (!this.container) {
            console.warn('No container found for transactions component when loading transactions');
            return;
        }
        
        try {
            // Get filter values
            const startDate = this.container.querySelector('#start-date').value;
            const endDate = this.container.querySelector('#end-date').value;
            const categoryId = this.container.querySelector('#category-filter').value;
            const type = this.container.querySelector('#type-filter').value;

            const filters = {};
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;
            if (categoryId) filters.categoryId = categoryId;
            if (type) filters.type = type;

            const result = await window.electronAPI.getTransactions({ 
                filters, 
                currentUser: this.currentUser 
            });

            if (result.success) {
                const transactionsTbody = this.container.querySelector('#transactions-tbody');
                if (transactionsTbody) {
                    transactionsTbody.innerHTML = '';

                    result.transactions.forEach(transaction => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${ComponentUtils.formatDate(transaction.date)}</td>
                            <td>${transaction.description}</td>
                            <td>
                                <span class="category-color" style="background-color: ${transaction.category.color};"></span>
                                ${transaction.category.name}
                            </td>
                            <td class="${transaction.type === 'income' ? 'income' : 'expense'}">
                                ${ComponentUtils.formatCurrency(transaction.amount)}
                            </td>
                            <td>
                                <button class="btn btn-edit" data-id="${transaction.id}">Edit</button>
                                <button class="btn btn-danger" data-id="${transaction.id}">Delete</button>
                            </td>
                        `;
                        transactionsTbody.appendChild(row);
                    });
                }
            } else {
                ComponentUtils.showMessage(
                    this.container.querySelector('.message') || this.container,
                    result.message,
                    'error'
                );
            }
        } catch (error) {
            ComponentUtils.showMessage(
                this.container.querySelector('.message') || this.container,
                'An error occurred while loading transactions',
                'error'
            );
            console.error('Load transactions error:', error);
        }
    }

    async loadCategoriesForFilter() {
        // Make sure we have a container
        if (!this.container) {
            console.warn('No container found for transactions component when loading categories');
            return;
        }
        
        try {
            const result = await window.electronAPI.getCategories(this.currentUser);

            if (result.success) {
                const categoryFilter = this.container.querySelector('#category-filter');
                const transactionCategory = this.container.querySelector('#transaction-category');

                // Clear existing options
                if (categoryFilter) {
                    categoryFilter.innerHTML = '<option value="">All Categories</option>';
                }
                if (transactionCategory) {
                    transactionCategory.innerHTML = '<option value="">Select Category</option>';
                }

                if (result.categories) {
                    result.categories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.id;
                        option.textContent = category.name;
                        if (categoryFilter) {
                            categoryFilter.appendChild(option.cloneNode(true));
                        }
                        if (transactionCategory) {
                            transactionCategory.appendChild(option);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Load categories for filter error:', error);
        }
    }
}

// Export the component
window.TransactionsComponent = TransactionsComponent;