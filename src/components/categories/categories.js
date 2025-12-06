class CategoriesComponent extends BaseComponent {
    constructor() {
        super();
        this.currentUser = ComponentUtils.getCurrentUser();
    }

    async render() {
        // Fetch the HTML template
        try {
            const response = await fetch('../components/categories/categories.html');
            const html = await response.text();
            
            // Create a container div and set its innerHTML
            this.container = document.createElement('div');
            this.container.innerHTML = html;
            
            // Add event listeners
            this.attachEventListeners();
            
            return this.container;
        } catch (error) {
            console.error('Error loading categories component:', error);
            return document.createElement('div');
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
                            this.container.querySelector('#categories-view .message') || this.container,
                            'Category created successfully',
                            'success'
                        );
                        this.container.querySelector('#category-form-container').classList.add('hidden');
                        this.loadCategories();
                    } else {
                        ComponentUtils.showMessage(
                            this.container.querySelector('#categories-view .message') || this.container,
                            result.message,
                            'error'
                        );
                    }
                } catch (error) {
                    ComponentUtils.showMessage(
                        this.container.querySelector('#categories-view .message') || this.container,
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
                    this.container.querySelector('#categories-view .message') || this.container,
                    result.message,
                    'error'
                );
            }
        } catch (error) {
            ComponentUtils.showMessage(
                this.container.querySelector('#categories-view .message') || this.container,
                'An error occurred while loading categories',
                'error'
            );
            console.error('Load categories error:', error);
        }
    }
}

// Export the component
window.CategoriesComponent = CategoriesComponent;