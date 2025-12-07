class CategoriesComponent extends BaseComponent {
    constructor() {
        super();
        this.currentUser = ComponentUtils.getCurrentUser();
    }

    async render() {
        try {
            console.log('Rendering categories component...');
            
            // Create the HTML directly instead of fetching it
            this.container = document.createElement('div');
            // Remove the outer div with id since it will be added by the app controller
            this.container.innerHTML = `
<h2>Categories</h2>
<div class="tabs">
    <button class="tab-btn active" data-tab="income">Income</button>
    <button class="tab-btn" data-tab="expense">Expense</button>
</div>
<div class="view-actions">
    <button id="add-category-btn" class="btn btn-primary">Add Category</button>
</div>
<div id="category-form-container" class="hidden">
    <form id="category-form">
        <div class="form-row">
            <div class="form-group">
                <label for="category-name">Name</label>
                <input type="text" id="category-name" required>
            </div>
            <div class="form-group">
                <label for="category-type">Type</label>
                <select id="category-type" required>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label for="category-color">Color</label>
            <div class="color-picker">
                <input type="color" id="category-color" value="#3B82F6">
                <span id="color-preview" class="color-preview" style="background-color: #3B82F6;"></span>
            </div>
        </div>
        <div class="form-actions">
            <button type="button" id="cancel-category-btn" class="btn">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Category</button>
        </div>
    </form>
</div>
<div class="categories-grid">
    <!-- Categories will be populated here -->
</div>
            `;
            
            // Add event listeners
            this.attachEventListeners();
            
            return this.container;
        } catch (error) {
            console.error('Error rendering categories component:', error);
            // Create a fallback container with error message
            this.container = document.createElement('div');
            this.container.innerHTML = `
                <h2>Categories</h2>
                <p>Error rendering categories component: ${error.message}</p>
            `;
            return this.container;
        }
    }

    attachEventListeners() {
        // Add category button
        const addCategoryBtn = this.container.querySelector('#add-category-btn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                this.container.querySelector('#category-form-container').classList.remove('hidden');
                this.container.querySelector('#category-form').reset();
            });
        }

        // Cancel category button
        const cancelCategoryBtn = this.container.querySelector('#cancel-category-btn');
        if (cancelCategoryBtn) {
            cancelCategoryBtn.addEventListener('click', () => {
                this.container.querySelector('#category-form-container').classList.add('hidden');
            });
        }

        // Category color picker
        const categoryColorInput = this.container.querySelector('#category-color');
        const colorPreview = this.container.querySelector('#color-preview');
        if (categoryColorInput && colorPreview) {
            categoryColorInput.addEventListener('input', () => {
                colorPreview.style.backgroundColor = categoryColorInput.value;
            });
        }

        // Category form submission
        const categoryForm = this.container.querySelector('#category-form');
        if (categoryForm) {
            categoryForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(categoryForm);
                const categoryData = {
                    name: formData.get('category-name'),
                    type: formData.get('category-type'),
                    color: formData.get('category-color')
                };

                try {
                    const result = await window.electronAPI.createCategory({
                        categoryData,
                        currentUser: this.currentUser
                    });

                    if (result.success) {
                        ComponentUtils.showMessage(
                            this.container.querySelector('.message') || this.container,
                            'Category created successfully',
                            'success'
                        );
                        this.container.querySelector('#category-form-container').classList.add('hidden');
                        this.loadCategories();
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
                        'An error occurred while creating the category',
                        'error'
                    );
                    console.error('Create category error:', error);
                }
            });
        }

        // Tab functionality
        const tabButtons = this.container.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked tab
                button.classList.add('active');
                // In a real implementation, this would load the appropriate categories
            });
        });

        // Load categories when component is shown
        this.loadCategories();
    }

    async loadCategories() {
        try {
            const result = await window.electronAPI.getCategories(this.currentUser);

            if (result.success) {
                const categoriesGrid = this.container.querySelector('.categories-grid');
                categoriesGrid.innerHTML = '';

                result.categories.forEach(category => {
                    const card = document.createElement('div');
                    card.className = 'category-card';
                    card.innerHTML = `
                        <div class="category-header">
                            <span class="category-color" style="background-color: ${category.color};"></span>
                            <strong>${category.name}</strong>
                        </div>
                        <div class="category-type">${category.type}</div>
                    `;
                    categoriesGrid.appendChild(card);
                });
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
                'An error occurred while loading categories',
                'error'
            );
            console.error('Load categories error:', error);
        }
    }
}

// Export the component
window.CategoriesComponent = CategoriesComponent;