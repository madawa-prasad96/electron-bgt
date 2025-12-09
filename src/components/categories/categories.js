class CategoriesComponent extends BaseComponent {
    constructor() {
        super();
        this.currentUser = ComponentUtils.getCurrentUser();
        this.currentTab = 'income';
        this.editingCategoryId = null;
    }

    async render() {
        try {
            console.log('Rendering categories component...');
            
            // Create the HTML directly instead of fetching it
            this.container = document.createElement('div');
            // Remove the outer div with id since it will be added by the app controller
            this.container.innerHTML = `
<div class="page-header">
    <h2>Categories</h2>
    <button id="refresh-categories" class="refresh-button" title="Refresh Categories">
        <span class="refresh-icon">↻</span>
    </button>
</div>
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
                <input type="text" id="category-name" name="category-name" required>
            </div>
            <div class="form-group">
                <label for="category-type">Type</label>
                <select id="category-type" name="category-type" required>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label for="category-color">Color</label>
            <div class="color-picker">
                <input type="color" id="category-color" name="category-color" value="#3B82F6">
                <span id="color-preview" class="color-preview" style="background-color: #3B82F6;"></span>
            </div>
        </div>
        <div class="form-actions">
            <button type="button" id="cancel-category-btn" class="btn">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Category</button>
        </div>
    </form>
    <div class="message"></div>
</div>
<div class="categories-grid">
    <!-- Categories will be populated here -->
</div>
            `;
            
            // Add event listeners
            this.attachEventListeners();
                    
            // Add event listener for refresh button
            const refreshButton = this.container.querySelector('#refresh-categories');
            if (refreshButton) {
                refreshButton.addEventListener('click', async () => {
                    // Add loading indicator
                    refreshButton.classList.add('loading');
                            
                    try {
                        await this.loadCategories();
                    } catch (error) {
                        console.error('Error refreshing categories:', error);
                    } finally {
                        // Remove loading indicator
                        refreshButton.classList.remove('loading');
                    }
                });
            }
            
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
                this.editingCategoryId = null;
                this.container.querySelector('#category-type').value = this.currentTab;
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
                
                // Validate category data
                if (!categoryData.name || categoryData.name.trim() === '') {
                    ComponentUtils.showMessage(
                        this.container.querySelector('#category-form-container .message'),
                        'Category name is required',
                        'error'
                    );
                    return;
                }
                
                if (!categoryData.type) {
                    ComponentUtils.showMessage(
                        this.container.querySelector('#category-form-container .message'),
                        'Category type is required',
                        'error'
                    );
                    return;
                }
                
                if (!categoryData.color) {
                    ComponentUtils.showMessage(
                        this.container.querySelector('#category-form-container .message'),
                        'Category color is required',
                        'error'
                    );
                    return;
                }

                try {
                    let result;
                    if (this.editingCategoryId) {
                        result = await window.electronAPI.updateCategory({
                            categoryId: this.editingCategoryId,
                            categoryData,
                            currentUser: this.currentUser
                        });
                    } else {
                        result = await window.electronAPI.createCategory({
                            categoryData,
                            currentUser: this.currentUser
                        });
                    }

                    if (result.success) {
                        ComponentUtils.showMessage(
                            this.container.querySelector('#category-form-container .message'),
                            this.editingCategoryId ? 'Category updated successfully' : 'Category created successfully',
                            'success'
                        );
                        this.editingCategoryId = null;
                        this.container.querySelector('#category-form-container').classList.add('hidden');
                        this.loadCategories();
                    } else {
                        ComponentUtils.showMessage(
                            this.container.querySelector('#category-form-container .message'),
                            result.message || 'Failed to save category',
                            'error'
                        );
                    }
                } catch (error) {
                    ComponentUtils.showMessage(
                        this.container.querySelector('#category-form-container .message'),
                        'An error occurred while saving the category: ' + error.message,
                        'error'
                    );
                    console.error('Save category error:', error);
                }
            });
        }

        // Tab functionality
        const tabButtons = this.container.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.currentTab = button.getAttribute('data-tab');
                this.loadCategories();
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

                const filtered = this.currentTab
                    ? result.categories.filter(c => c.type === this.currentTab)
                    : result.categories;

                filtered.forEach(category => {
                    const card = document.createElement('div');
                    card.className = 'category-card';
                    // Set the card background to the category color
                    card.style.backgroundColor = category.color;
                    card.style.color = '#ffffff';
                    card.style.display = 'flex';
                    card.style.flexDirection = 'column';
                    card.style.justifyContent = 'space-between';
                    card.style.padding = '1rem';
                    card.innerHTML = `
                        <div class="category-header">
                            <strong>${category.name}</strong>
                        </div>
                        <div class="category-actions">
                            <button class="btn btn-edit" data-id="${category.id}">Edit</button>
                            <button class="btn btn-delete" data-id="${category.id}">Delete</button>
                        </div>
                    `;
                    categoriesGrid.appendChild(card);
                });

                // Attach action handlers via delegation
                categoriesGrid.onclick = async (e) => {
                    const button = e.target.closest('button');
                    if (!button) return;
                    const id = parseInt(button.getAttribute('data-id'));
                    if (isNaN(id)) return;

                    const category = result.categories.find(c => c.id === id);
                    if (!category) return;

                    if (button.classList.contains('btn-edit')) {
                        this.editingCategoryId = id;
                        this.container.querySelector('#category-name').value = category.name;
                        this.container.querySelector('#category-type').value = category.type;
                        this.container.querySelector('#category-color').value = category.color;
                        this.container.querySelector('#color-preview').style.backgroundColor = category.color;
                        this.container.querySelector('#category-form-container').classList.remove('hidden');
                    } else if (button.classList.contains('btn-delete')) {
                        if (!confirm('Delete this category?')) return;
                        try {
                            const res = await window.electronAPI.deleteCategory({
                                categoryId: id,
                                currentUser: this.currentUser
                            });
                            if (res.success) {
                                this.loadCategories();
                            } else {
                                ComponentUtils.showMessage(
                                    this.container.querySelector('.message') || this.container,
                                    res.message || 'Failed to delete category',
                                    'error'
                                );
                            }
                        } catch (err) {
                            ComponentUtils.showMessage(
                                this.container.querySelector('.message') || this.container,
                                'An error occurred while deleting the category: ' + err.message,
                                'error'
                            );
                        }
                    }
                };
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