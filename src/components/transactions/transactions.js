class TransactionsComponent extends BaseComponent {
    constructor() {
        super();
        console.log('TransactionsComponent constructor called');
        this.currentUser = ComponentUtils.getCurrentUser();
        console.log('Current user in constructor:', this.currentUser);
    }

    async render() {
        try {
            console.log('Rendering transactions component...');
            console.log('Current user in render:', this.currentUser);
            
            // Create the HTML directly instead of fetching it
            this.container = document.createElement('div');
            // Remove the outer div with id since it will be added by the app controller
            this.container.innerHTML = `
<div class="page-header">
    <h2>Transactions</h2>
    <button id="refresh-transactions" class="refresh-button" title="Refresh Transactions">
        <span class="refresh-icon">↻</span>
    </button>
</div>
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
                <select id="transaction-payment-method">
                    <option value="">Select Payment Method</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                </select>
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
                    
            // Add event listener for refresh button (store handler for cleanup)
            const refreshButton = this.container.querySelector('#refresh-transactions');
            if (refreshButton) {
                this.refreshButton = refreshButton;
                if (!this.refreshButtonListener) {
                    this.refreshButtonListener = async () => {
                        refreshButton.classList.add('loading');
                        try {
                            await this.loadTransactions();
                            await this.loadCategoriesForFilter();
                        } catch (error) {
                            console.error('Error refreshing transactions:', error);
                        } finally {
                            refreshButton.classList.remove('loading');
                        }
                    };
                }
                refreshButton.addEventListener('click', this.refreshButtonListener);
            }
            
            console.log('Transactions component rendered successfully');
            console.log('Returning container with buttons:', this.container.querySelectorAll('button').length);
            
            // Load transactions after a short delay to ensure DOM is ready
            setTimeout(() => {
                console.log('Loading transactions after render');
                this.loadTransactions();
            }, 100);
            
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
        console.log('attachEventListeners called');
        // Make sure we have a container
        if (!this.container) {
            console.warn('No container found for transactions component');
            return;
        }
        
        console.log('Attaching event listeners for transactions component');
        console.log('Container element:', this.container);
        
        // Remove any existing event listeners to prevent duplicates
        this.cleanupEventListeners();
        
        // Lazily create handler references so add/remove use the same function identity
        if (!this.addTransactionBtnListener) {
            this.addTransactionBtnListener = () => {
                console.log('Add transaction button clicked');
                this.container.querySelector('#transaction-form-container').classList.remove('hidden');
                const today = new Date();
                const formattedDate = today.toISOString().split('T')[0];
                this.container.querySelector('#transaction-date').value = formattedDate;
                setTimeout(() => {
                    const dateField = this.container.querySelector('#transaction-date');
                    console.log('Date field value:', dateField.value);
                }, 100);
                this.loadCategoriesForTransactionForm('income');
            };
        }

        const addTransactionBtn = this.container.querySelector('#add-transaction-btn');
        console.log('Add transaction button element:', addTransactionBtn);
        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', this.addTransactionBtnListener);
            console.log('Add transaction button event listener attached');
        } else {
            console.log('Add transaction button not found');
        }
        
        if (!this.transactionTypeListener) {
            this.transactionTypeListener = (e) => {
                this.loadCategoriesForTransactionForm(e.target.value);
            };
        }
        const transactionType = this.container.querySelector('#transaction-type');
        if (transactionType) {
            transactionType.addEventListener('change', this.transactionTypeListener);
        }

        if (!this.cancelTransactionBtnListener) {
            this.cancelTransactionBtnListener = () => {
                const transactionForm = this.container.querySelector('#transaction-form');
                if (transactionForm) {
                    transactionForm.reset();
                    const dateField = this.container.querySelector('#transaction-date');
                    if (dateField) {
                        dateField.value = '';
                    }
                }
                this.container.querySelector('#transaction-form-container').classList.add('hidden');
            };
        }
        const cancelTransactionBtn = this.container.querySelector('#cancel-transaction-btn');
        if (cancelTransactionBtn) {
            cancelTransactionBtn.addEventListener('click', this.cancelTransactionBtnListener);
        }

        if (!this.transactionFormListener) {
            this.transactionFormListener = async (e) => {
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
                        // Stay on the current page and just reload the transactions
                        await this.loadTransactions(); // Use await to ensure proper execution
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
            };
        }

        // Refresh button (re-attach after cleanup)
        if (!this.refreshButtonListener) {
            this.refreshButtonListener = async () => {
                const refreshButton = this.container.querySelector('#refresh-transactions');
                if (refreshButton) refreshButton.classList.add('loading');
                try {
                    await this.loadTransactions();
                    await this.loadCategoriesForFilter();
                } catch (error) {
                    console.error('Error refreshing transactions:', error);
                } finally {
                    const btn = this.container.querySelector('#refresh-transactions');
                    if (btn) btn.classList.remove('loading');
                }
            };
        }
        const refreshButton = this.container.querySelector('#refresh-transactions');
        if (refreshButton) {
            this.refreshButton = refreshButton;
            refreshButton.addEventListener('click', this.refreshButtonListener);
        }

        // Wire form submit with stored handler
        const transactionForm = this.container.querySelector('#transaction-form');
        if (transactionForm) {
            transactionForm.addEventListener('submit', this.transactionFormListener);
        }

        // Apply filters button
        if (!this.applyFiltersBtnListener) {
            this.applyFiltersBtnListener = () => {
                this.loadTransactions();
            };
        }
        const applyFiltersBtn = this.container.querySelector('#apply-filters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', this.applyFiltersBtnListener);
        }

        // Load categories for filter and form when component is shown
        this.loadCategoriesForFilter();
        
        // Load income categories by default for transaction form
        this.loadCategoriesForTransactionForm('income');
        
        // Add event listeners for view, edit and delete buttons
        console.log('Attaching event listeners to container:', this.container);
        if (this.container) {
            // Use event delegation on the container
            console.log('Adding container click listener');
            const containerClickHandler = (e) => {
                console.log('Container clicked, target:', e.target);
                console.log('Target tag name:', e.target.tagName);
                console.log('Target classes:', e.target.classList);
                
                // Check if the clicked element is a button with the specific classes
                if (e.target.tagName === 'BUTTON') {
                    console.log('Button clicked:', e.target);
                    console.log('Target classes:', Array.from(e.target.classList));
                    
                    // Get the closest button element (in case the click was on a child element)
                    const button = e.target.closest('button');
                    if (button) {
                        console.log('Closest button:', button);
                        console.log('Button classes:', Array.from(button.classList));
                        
                        if (button.classList.contains('btn-view')) {
                            console.log('View button clicked');
                            const transactionId = parseInt(button.getAttribute('data-id'));
                            console.log('Transaction ID:', transactionId);
                            if (!isNaN(transactionId)) {
                                this.showTransactionDetails(transactionId);
                            }
                        } else if (button.classList.contains('btn-edit')) {
                            console.log('Edit button clicked');
                            const transactionId = parseInt(button.getAttribute('data-id'));
                            console.log('Edit transaction ID:', transactionId);
                            if (!isNaN(transactionId)) {
                                this.editTransaction(transactionId);
                            }
                        } else if (button.classList.contains('btn-delete')) {
                            console.log('Delete button clicked');
                            const transactionId = parseInt(button.getAttribute('data-id'));
                            console.log('Delete transaction ID:', transactionId);
                            if (!isNaN(transactionId)) {
                                this.deleteTransaction(transactionId);
                            }
                        } else {
                            console.log('Other button clicked, classes:', Array.from(button.classList));
                        }
                    }
                } else {
                    console.log('Non-button element clicked');
                }
            };
            
            this.container.addEventListener('click', containerClickHandler);
            console.log('Container click listener added');
            
            // Store the handler for potential cleanup
            this.containerClickHandler = containerClickHandler;
        } else {
            console.error('Container is not available for attaching event listeners');
        }
        
        console.log('Event listeners attached for transactions component');
    }

    // Method to clean up event listeners to prevent duplicates
    cleanupEventListeners() {
        console.log('Cleaning up event listeners');
        if (this.container) {
            // Clean up container click listener
            if (this.containerClickHandler) {
                this.container.removeEventListener('click', this.containerClickHandler);
                this.containerClickHandler = null;
            }
            
            // Clean up specific button listeners
            const addTransactionBtn = this.container.querySelector('#add-transaction-btn');
            if (addTransactionBtn && this.addTransactionBtnListener) {
                addTransactionBtn.removeEventListener('click', this.addTransactionBtnListener);
            }

            // Clean up refresh button listener
            if (this.refreshButton && this.refreshButtonListener) {
                this.refreshButton.removeEventListener('click', this.refreshButtonListener);
            }
            
            const transactionType = this.container.querySelector('#transaction-type');
            if (transactionType && this.transactionTypeListener) {
                transactionType.removeEventListener('change', this.transactionTypeListener);
            }
            
            const cancelTransactionBtn = this.container.querySelector('#cancel-transaction-btn');
            if (cancelTransactionBtn && this.cancelTransactionBtnListener) {
                cancelTransactionBtn.removeEventListener('click', this.cancelTransactionBtnListener);
            }
            
            const transactionForm = this.container.querySelector('#transaction-form');
            if (transactionForm && this.transactionFormListener) {
                transactionForm.removeEventListener('submit', this.transactionFormListener);
            }
            
            const applyFiltersBtn = this.container.querySelector('#apply-filters');
            if (applyFiltersBtn && this.applyFiltersBtnListener) {
                applyFiltersBtn.removeEventListener('click', this.applyFiltersBtnListener);
            }
        }
        console.log('Event listeners cleaned up');
    }

    async loadTransactions() {
        console.log('Loading transactions...');
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
                    // Clean up event listeners before updating the DOM
                    this.cleanupEventListeners();
                    
                    transactionsTbody.innerHTML = '';

                    result.transactions.forEach(transaction => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${ComponentUtils.formatDate(transaction.date)}</td>
                            <td title="${transaction.description}">${this.truncateText(transaction.description, 25)}</td>
                            <td>
                                <span class="category-color" style="background-color: ${transaction.category.color};"></span>
                                ${transaction.category.name}
                            </td>
                            <td class="${transaction.type === 'income' ? 'income' : 'expense'}">
                                ${ComponentUtils.formatCurrency(transaction.amount)}
                            </td>
                            <td>
                                <button class="btn btn-view" data-id="${transaction.id}">View</button>
                                <button class="btn btn-edit" data-id="${transaction.id}">Edit</button>
                                <button class="btn btn-delete" data-id="${transaction.id}">Delete</button>
                            </td>
                        `;
                        transactionsTbody.appendChild(row);
                    });
                    
                    // Log the buttons for debugging
                    const buttons = transactionsTbody.querySelectorAll('button');
                    console.log('Total buttons found:', buttons.length);
                    buttons.forEach((button, index) => {
                        console.log(`Button ${index}:`, button.classList, button.getAttribute('data-id'));
                    });
                    
                    // Reattach event listeners after loading transactions
                    console.log('Reattaching event listeners after loading transactions');
                    this.attachEventListeners();
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
                
                // Store categories for filtering
                this.allCategories = result.categories;
            }
        } catch (error) {
            console.error('Load categories for filter error:', error);
        }
    }
    
    async loadCategoriesForTransactionForm(transactionType) {
        // Make sure we have a container and categories
        if (!this.container) {
            console.warn('No container found for transactions component when loading categories for form');
            return;
        }
        
        // If we don't have all categories yet, load them
        if (!this.allCategories) {
            await this.loadCategoriesForFilter();
        }
        
        // Filter categories by transaction type
        const transactionCategory = this.container.querySelector('#transaction-category');
        if (transactionCategory && this.allCategories) {
            // Clear existing options
            transactionCategory.innerHTML = '<option value="">Select Category</option>';
            
            // Filter and add categories
            this.allCategories
                .filter(category => category.type === transactionType)
                .forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    transactionCategory.appendChild(option);
                });
        }
    }
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    async showTransactionDetails(transactionId) {
        console.log('Showing transaction details for ID:', transactionId);
        try {
            // Get all transactions to find the selected one
            const result = await window.electronAPI.getTransactions({ 
                filters: {},
                currentUser: this.currentUser 
            });
            
            console.log('Transactions result:', result);
            
            if (result.success) {
                const transaction = result.transactions.find(t => t.id === transactionId);
                console.log('Found transaction:', transaction);
                if (transaction) {
                    this.createModal(transaction);
                } else {
                    ComponentUtils.showMessage(
                        this.container.querySelector('.message') || this.container,
                        'Transaction not found',
                        'error'
                    );
                }
            } else {
                ComponentUtils.showMessage(
                    this.container.querySelector('.message') || this.container,
                    result.message || 'Failed to load transaction details',
                    'error'
                );
            }
        } catch (error) {
            ComponentUtils.showMessage(
                this.container.querySelector('.message') || this.container,
                'An error occurred while loading transaction details: ' + error.message,
                'error'
            );
            console.error('Load transaction details error:', error);
        }
    }
    
    createModal(transaction) {
        console.log('Creating modal for transaction:', transaction);
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Transaction Details</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="detail-row">
                        <span class="detail-label">Date:</span>
                        <span class="detail-value">${ComponentUtils.formatDate(transaction.date)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Type:</span>
                        <span class="detail-value ${transaction.type === 'income' ? 'income' : 'expense'}">${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Amount:</span>
                        <span class="detail-value ${transaction.type === 'income' ? 'income' : 'expense'}">${ComponentUtils.formatCurrency(transaction.amount)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Category:</span>
                        <span class="detail-value">
                            <span class="category-color" style="background-color: ${transaction.category.color};"></span>
                            ${transaction.category.name}
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Description:</span>
                        <span class="detail-value">${transaction.description}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Payment Method:</span>
                        <span class="detail-value">${transaction.paymentMethod || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Notes:</span>
                        <span class="detail-value">${transaction.notes || 'N/A'}</span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary close-modal-btn">Close</button>
                </div>
            </div>
        `;
        
        // Add modal to document
        document.body.appendChild(modal);
        
        // Add event listeners for closing the modal
        const closeButtons = modal.querySelectorAll('.close-modal, .close-modal-btn');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        });
        
        // Close modal when clicking outside of it
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Close modal with Escape key
        const closeModalOnEscape = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', closeModalOnEscape);
            }
        };
        document.addEventListener('keydown', closeModalOnEscape);
    }
    
    async deleteTransaction(transactionId) {
        console.log('Deleting transaction with ID:', transactionId);
        if (!confirm('Are you sure you want to delete this transaction?')) {
            return;
        }
        
        try {
            const result = await window.electronAPI.deleteTransaction({
                transactionId,
                currentUser: this.currentUser
            });
            
            if (result.success) {
                ComponentUtils.showMessage(
                    this.container.querySelector('.message') || this.container,
                    'Transaction deleted successfully',
                    'success'
                );
                // Stay on the current page and just reload the transactions
                await this.loadTransactions(); // Use await to ensure proper execution
            } else {
                ComponentUtils.showMessage(
                    this.container.querySelector('.message') || this.container,
                    result.message || 'Failed to delete transaction',
                    'error'
                );
            }
        } catch (error) {
            ComponentUtils.showMessage(
                this.container.querySelector('.message') || this.container,
                'An error occurred while deleting the transaction: ' + error.message,
                'error'
            );
            console.error('Delete transaction error:', error);
        }
    }
    
    async editTransaction(transactionId) {
        console.log('Editing transaction:', transactionId);
        try {
            // Get all transactions to find the selected one
            const result = await window.electronAPI.getTransactions({ 
                filters: {},
                currentUser: this.currentUser 
            });
            
            if (result.success) {
                const transaction = result.transactions.find(t => t.id === transactionId);
                if (transaction) {
                    this.createEditModal(transaction);
                } else {
                    ComponentUtils.showMessage(
                        this.container.querySelector('.message') || this.container,
                        'Transaction not found',
                        'error'
                    );
                }
            } else {
                ComponentUtils.showMessage(
                    this.container.querySelector('.message') || this.container,
                    result.message || 'Failed to load transaction details',
                    'error'
                );
            }
        } catch (error) {
            ComponentUtils.showMessage(
                this.container.querySelector('.message') || this.container,
                'An error occurred while loading transaction details: ' + error.message,
                'error'
            );
            console.error('Load transaction details error:', error);
        }
    }
    
    createEditModal(transaction) {
        console.log('Creating edit modal for transaction:', transaction);
        
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Transaction</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="edit-transaction-form">
                        <input type="hidden" id="edit-transaction-id" value="${transaction.id}">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit-transaction-date">Date</label>
                                <input type="date" id="edit-transaction-date" required>
                            </div>
                            <div class="form-group">
                                <label for="edit-transaction-type">Type</label>
                                <select id="edit-transaction-type" required>
                                    <option value="income" ${transaction.type === 'income' ? 'selected' : ''}>Income</option>
                                    <option value="expense" ${transaction.type === 'expense' ? 'selected' : ''}>Expense</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit-transaction-amount">Amount</label>
                                <input type="number" id="edit-transaction-amount" step="0.01" min="0" value="${transaction.amount}" required>
                            </div>
                            <div class="form-group">
                                <label for="edit-transaction-category">Category</label>
                                <select id="edit-transaction-category" required>
                                    <option value="">Select Category</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="edit-transaction-description">Description</label>
                            <input type="text" id="edit-transaction-description" value="${transaction.description}" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit-transaction-payment-method">Payment Method</label>
                                <select id="edit-transaction-payment-method">
                                    <option value="">Select Payment Method</option>
                                    <option value="Cash" ${transaction.paymentMethod === 'Cash' ? 'selected' : ''}>Cash</option>
                                    <option value="Card" ${transaction.paymentMethod === 'Card' ? 'selected' : ''}>Card</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="edit-transaction-notes">Notes</label>
                                <input type="text" id="edit-transaction-notes" value="${transaction.notes || ''}">
                            </div>
                        </div>
                        <div class="message"></div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn close-modal-btn">Cancel</button>
                    <button class="btn btn-primary" id="save-transaction-btn">Save Changes</button>
                </div>
            </div>
        `;
        
        // Add modal to document
        document.body.appendChild(modal);
        
        // Set the date value after the modal is added to the DOM
        const dateInput = modal.querySelector('#edit-transaction-date');
        // Format the date properly for the date input (YYYY-MM-DD)
        const formattedDate = new Date(transaction.date).toISOString().split('T')[0];
        dateInput.value = formattedDate;
        
        // Load categories for the edit form
        this.loadCategoriesForEditForm(modal, transaction.categoryId, transaction.type);
        
        // Manage modal close handlers and ensure they clean up the Escape listener
        const removeModal = () => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            document.removeEventListener('keydown', closeModalOnEscape);
        };
        // Expose remover for delayed closes
        modal._removeModal = removeModal;

        const closeButtons = modal.querySelectorAll('.close-modal, .close-modal-btn');
        closeButtons.forEach(button => {
            button.addEventListener('click', removeModal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                removeModal();
            }
        });
        
        const closeModalOnEscape = (e) => {
            if (e.key === 'Escape') {
                removeModal();
            }
        };
        document.addEventListener('keydown', closeModalOnEscape);
        
        // Add event listener for saving changes
        const saveButton = modal.querySelector('#save-transaction-btn');
        saveButton.addEventListener('click', async () => {
            await this.saveTransactionChanges(modal, transaction.id);
        });
    }
    
    async loadCategoriesForEditForm(modal, selectedCategoryId, transactionType) {
        try {
            const result = await window.electronAPI.getCategories(this.currentUser);
            
            if (result.success) {
                const categorySelect = modal.querySelector('#edit-transaction-category');
                
                // Clear existing options
                categorySelect.innerHTML = '<option value="">Select Category</option>';
                
                // Filter and add categories based on transaction type
                result.categories
                    .filter(category => category.type === transactionType)
                    .forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.id;
                        option.textContent = category.name;
                        if (category.id === selectedCategoryId) {
                            option.selected = true;
                        }
                        categorySelect.appendChild(option);
                    });
                
                // Add event listener to update categories when type changes
                const typeSelect = modal.querySelector('#edit-transaction-type');
                typeSelect.addEventListener('change', (e) => {
                    const selectedType = e.target.value;
                    this.updateCategoriesForEditForm(modal, result.categories, selectedType);
                });
            }
        } catch (error) {
            console.error('Load categories for edit form error:', error);
            ComponentUtils.showMessage(
                modal.querySelector('.modal-body') || modal,
                'An error occurred while loading categories: ' + error.message,
                'error'
            );
        }
    }
    
    updateCategoriesForEditForm(modal, allCategories, transactionType) {
        const categorySelect = modal.querySelector('#edit-transaction-category');
        
        // Clear existing options
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        
        // Filter and add categories based on transaction type
        allCategories
            .filter(category => category.type === transactionType)
            .forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
    }
    
    async saveTransactionChanges(modal, transactionId) {
        try {
            // Get form data
            const formData = {
                date: modal.querySelector('#edit-transaction-date').value,
                type: modal.querySelector('#edit-transaction-type').value,
                amount: parseFloat(modal.querySelector('#edit-transaction-amount').value),
                categoryId: parseInt(modal.querySelector('#edit-transaction-category').value),
                description: modal.querySelector('#edit-transaction-description').value,
                paymentMethod: modal.querySelector('#edit-transaction-payment-method').value,
                notes: modal.querySelector('#edit-transaction-notes').value
            };
            
            // Validate form data
            if (!formData.date || !formData.type || isNaN(formData.amount) || formData.amount <= 0 || 
                isNaN(formData.categoryId) || !formData.description) {
                ComponentUtils.showMessage(
                    modal.querySelector('.message'),
                    'Please fill in all required fields',
                    'error'
                );
                return;
            }
            
            // Call API to update transaction
            const result = await window.electronAPI.updateTransaction({
                transactionId,
                transactionData: formData,
                currentUser: this.currentUser
            });
            
            if (result.success) {
                ComponentUtils.showMessage(
                    modal.querySelector('.message'),
                    'Transaction updated successfully',
                    'success'
                );
                
                // Close modal after a short delay (safe even if already closed)
                setTimeout(async () => { // Made the callback async
                    if (modal._removeModal) {
                        modal._removeModal();
                    } else if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                    // Stay on the current page and just reload the transactions
                    await this.loadTransactions(); // Use await to ensure proper execution
                }, 1000);
            } else {
                ComponentUtils.showMessage(
                    modal.querySelector('.message'),
                    result.message || 'Failed to update transaction',
                    'error'
                );
            }
        } catch (error) {
            ComponentUtils.showMessage(
                modal.querySelector('.message'),
                'An error occurred while updating the transaction: ' + error.message,
                'error'
            );
            console.error('Update transaction error:', error);
        }
    }
}

// Export the component
window.TransactionsComponent = TransactionsComponent;