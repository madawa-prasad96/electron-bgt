class UsersComponent extends BaseComponent {
    constructor() {
        super();
        this.currentUser = ComponentUtils.getCurrentUser();
    }

    async render() {
        // Fetch the HTML template
        try {
            const response = await fetch('../components/users/users.html');
            const html = await response.text();
            
            // Create a container div and set its innerHTML
            this.container = document.createElement('div');
            this.container.innerHTML = html;
            
            // Add event listeners
            this.attachEventListeners();
            
            return this.container;
        } catch (error) {
            console.error('Error loading users component:', error);
            return document.createElement('div');
        }
    }

    attachEventListeners() {
        // Add user button
        const addUserBtn = this.container.querySelector('#add-user-btn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                this.container.querySelector('#user-form-container').classList.remove('hidden');
                this.container.querySelector('#user-form').reset();
            });
        }

        // Cancel user button
        const cancelUserBtn = this.container.querySelector('#cancel-user-btn');
        if (cancelUserBtn) {
            cancelUserBtn.addEventListener('click', () => {
                this.container.querySelector('#user-form-container').classList.add('hidden');
            });
        }

        // User form submission
        const userForm = this.container.querySelector('#user-form');
        if (userForm) {
            userForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(userForm);
                const userData = {
                    username: formData.get('user-username'),
                    role: formData.get('user-role')
                };

                try {
                    const result = await window.electronAPI.createUser({
                        userData,
                        currentUser: this.currentUser
                    });

                    if (result.success) {
                        ComponentUtils.showMessage(
                            this.container.querySelector('#users-view .message') || this.container,
                            `User created successfully. Temporary password: ${result.tempPassword}`,
                            'success'
                        );
                        this.container.querySelector('#user-form-container').classList.add('hidden');
                        this.loadUsers();
                    } else {
                        ComponentUtils.showMessage(
                            this.container.querySelector('#users-view .message') || this.container,
                            result.message,
                            'error'
                        );
                    }
                } catch (error) {
                    ComponentUtils.showMessage(
                        this.container.querySelector('#users-view .message') || this.container,
                        'An error occurred while creating the user',
                        'error'
                    );
                    console.error('Create user error:', error);
                }
            });
        }

        // Load users when component is shown
        this.loadUsers();
    }

    async loadUsers() {
        try {
            const result = await window.electronAPI.getAllUsers(this.currentUser);

            if (result.success) {
                const usersTbody = this.container.querySelector('#users-tbody');
                usersTbody.innerHTML = '';

                result.users.forEach(user => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${user.username}</td>
                        <td>${user.role}</td>
                        <td>${user.isActive ? 'Active' : 'Inactive'}</td>
                        <td>${ComponentUtils.formatDate(user.createdAt)}</td>
                        <td>
                            <button class="btn btn-edit" data-id="${user.id}">Edit</button>
                            <button class="btn btn-danger" data-id="${user.id}">Delete</button>
                        </td>
                    `;
                    usersTbody.appendChild(row);
                });
            } else {
                ComponentUtils.showMessage(
                    this.container.querySelector('#users-view .message') || this.container,
                    result.message,
                    'error'
                );
            }
        } catch (error) {
            ComponentUtils.showMessage(
                this.container.querySelector('#users-view .message') || this.container,
                'An error occurred while loading users',
                'error'
            );
            console.error('Load users error:', error);
        }
    }
}

// Export the component
window.UsersComponent = UsersComponent;