class TransactionsComponent extends BaseComponent {
    constructor() {
        super();
        this.currentUser = ComponentUtils.getCurrentUser();
    }

    async render() {
        // Fetch the HTML template
        try {
            const response = await fetch('../components/transactions/transactions.html');
            const html = await response.text();
            
            // Create a container div and set its innerHTML
            this.container = document.createElement('div');
            this.container.innerHTML = html;
            
            // Add event listeners
            this.attachEventListeners();
            
            return this.container;
        } catch (error) {
            console.error('Error loading transactions component:', error);
            return document.createElement('div');
        }
    }

    attachEventListeners() {
        // Add transaction button
        const addTransactionBtn = this.container.querySelector('#add-transaction-btn');
        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', () => {
                this.container.querySelector('#transaction-form-container').classList.remove('hidden');
                this.container.querySelector('#transaction-form').reset();
                // Set today's date as default
                this.container.querySelector('#transaction-date').valueAsDate = new Date();
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
                
                const formData = new FormData(transactionForm);
                const transactionData = {
                    date: formData.get('transaction-date'),
                    type: formData.get('transaction-type'),
                    amount: formData.get('transaction-amount'),
                    categoryId: formData.get('transaction-category'),
                    description: formData.get('transaction-description'),
                    paymentMethod: formData.get('transaction-payment-method'),
                    notes: formData.get('transaction-notes')
                };

                try {
                    const result = await window.electronAPI.createTransaction({
                        transactionData,
                        currentUser: this.currentUser
                    });

                    if (result.success) {
                        ComponentUtils.showMessage(
                            this.container.querySelector('#transactions-view .message') || this.container,
                            'Transaction created successfully',
                            'success'
                        );
                        this.container.querySelector('#transaction-form-container').classList.add('hidden');
                        this.loadTransactions();
                    } else {
                        ComponentUtils.showMessage(
                            this.container.querySelector('#transactions-view .message') || this.container,
                            result.message,
                            'error'
                        );
                    }
                } catch (error) {
                    ComponentUtils.showMessage(
                        this.container.querySelector('#transactions-view .message') || this.container,
                        'An error occurred while creating the transaction',
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
    }

    async loadTransactions() {
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
            } else {
                ComponentUtils.showMessage(
                    this.container.querySelector('#transactions-view .message') || this.container,
                    result.message,
                    'error'
                );
            }
        } catch (error) {
            ComponentUtils.showMessage(
                this.container.querySelector('#transactions-view .message') || this.container,
                'An error occurred while loading transactions',
                'error'
            );
            console.error('Load transactions error:', error);
        }
    }

    async loadCategoriesForFilter() {
        try {
            const result = await window.electronAPI.getCategories(this.currentUser);

            if (result.success) {
                const categoryFilter = this.container.querySelector('#category-filter');
                const transactionCategory = this.container.querySelector('#transaction-category');

                // Clear existing options
                categoryFilter.innerHTML = '<option value="">All Categories</option>';
                transactionCategory.innerHTML = '<option value="">Select Category</option>';

                result.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categoryFilter.appendChild(option.cloneNode(true));
                    transactionCategory.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Load categories for filter error:', error);
        }
    }
}

// Export the component
window.TransactionsComponent = TransactionsComponent;