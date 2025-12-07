class UsersComponent extends BaseComponent {
    constructor() {
        super();
        this.currentUser = ComponentUtils.getCurrentUser();
    }

    async render() {
        try {
            console.log('Rendering users component...');
            
            // Create the HTML directly instead of fetching it
            this.container = document.createElement('div');
            // Remove the outer div with id since it will be added by the app controller
            this.container.innerHTML = `
<h2>User Management</h2>
<div class="view-actions">
    <button id="add-user-btn" class="btn btn-primary">Add User</button>
</div>
<div id="user-form-container" class="hidden">
    <form id="user-form">
        <div class="form-row">
            <div class="form-group">
                <label for="user-username">Username</label>
                <input type="text" id="user-username" required>
            </div>
            <div class="form-group">
                <label for="user-role">Role</label>
                <select id="user-role" required>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                </select>
            </div>
        </div>
        <div class="form-actions">
            <button type="button" id="cancel-user-btn" class="btn">Cancel</button>
            <button type="submit" class="btn btn-primary">Save User</button>
        </div>
    </form>
</div>
<table class="data-table">
    <thead>
        <tr>
            <th>Username</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody id="users-tbody">
        <!-- Users will be populated here -->
    </tbody>
</table>
            `;
            
            // Add event listeners
            this.attachEventListeners();
            
            return this.container;
        } catch (error) {
            console.error('Error rendering users component:', error);
            // Create a fallback container with error message
            this.container = document.createElement('div');
            this.container.innerHTML = `
                <h2>User Management</h2>
                <p>Error rendering users component: ${error.message}</p>
            `;
            return this.container;
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
                            this.container.querySelector('.message') || this.container,
                            `User created successfully. Temporary password: ${result.tempPassword}`,
                            'success'
                        );
                        this.container.querySelector('#user-form-container').classList.add('hidden');
                        this.loadUsers();
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
                    this.container.querySelector('.message') || this.container,
                    result.message,
                    'error'
                );
            }
        } catch (error) {
            ComponentUtils.showMessage(
                this.container.querySelector('.message') || this.container,
                'An error occurred while loading users',
                'error'
            );
            console.error('Load users error:', error);
        }
    }
}

// Export the component
window.UsersComponent = UsersComponent;