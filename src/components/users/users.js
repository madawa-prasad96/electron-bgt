class UsersComponent extends BaseComponent {
    constructor() {
        super();
        this.currentUser = ComponentUtils.getCurrentUser();
        this.editingUserId = null;
    }

    async render() {
        try {
            console.log('Rendering users component...');
            
            // Create the HTML directly instead of fetching it
            this.container = document.createElement('div');
            // Remove the outer div with id since it will be added by the app controller
            this.container.innerHTML = `
<div class="page-header">
    <h2>User Management</h2>
    <button id="refresh-users" class="refresh-button" title="Refresh Users">
        <span class="refresh-icon">↻</span>
    </button>
</div>
<div class="view-actions">
    <button id="add-user-btn" class="btn btn-primary">Add User</button>
</div>
<div id="user-form-container" class="hidden">
    <form id="user-form">
        <div class="form-row">
            <div class="form-group">
                <label for="user-username">Username</label>
                <input type="text" id="user-username" name="user-username" required>
            </div>
            <div class="form-group">
                <label for="user-role">Role</label>
                <select id="user-role" name="user-role" required>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="user-status">Status</label>
                <select id="user-status" name="user-status">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="user-reset-password" name="user-reset-password">
                    Reset password (generate new temp)
                </label>
            </div>
        </div>
        <div class="form-actions">
            <button type="button" id="cancel-user-btn" class="btn">Cancel</button>
            <button type="submit" class="btn btn-primary">Save User</button>
        </div>
    </form>
    <div class="message"></div>
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
                    
            // Add event listener for refresh button
            const refreshButton = this.container.querySelector('#refresh-users');
            if (refreshButton) {
                refreshButton.addEventListener('click', async () => {
                    // Add loading indicator
                    refreshButton.classList.add('loading');
                            
                    try {
                        await this.loadUsers();
                    } catch (error) {
                        console.error('Error refreshing users:', error);
                    } finally {
                        // Remove loading indicator
                        refreshButton.classList.remove('loading');
                    }
                });
            }
            
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
                this.editingUserId = null;
                this.container.querySelector('#user-status').value = 'active';
                this.container.querySelector('#user-reset-password').checked = false;
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
                    role: formData.get('user-role'),
                    isActive: formData.get('user-status') === 'active',
                    resetPassword: formData.get('user-reset-password') === 'on'
                };

                try {
                    let result;
                    if (this.editingUserId) {
                        result = await window.electronAPI.updateUser({
                            userId: this.editingUserId,
                            userData,
                            currentUser: this.currentUser
                        });
                    } else {
                        result = await window.electronAPI.createUser({
                            userData,
                            currentUser: this.currentUser
                        });
                    }

                    if (result.success) {
                        const msg = this.editingUserId
                            ? `User updated successfully${result.tempPassword ? `. New temp password: ${result.tempPassword}` : ''}`
                            : `User created successfully. Temporary password: ${result.tempPassword}`;
                        ComponentUtils.showMessage(
                            this.container.querySelector('.message') || this.container,
                            msg,
                            'success'
                        );
                        this.editingUserId = null;
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
                        'An error occurred while saving the user',
                        'error'
                    );
                    console.error('Save user error:', error);
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
                            <button class="btn ${user.isActive ? 'btn-danger' : 'btn-primary'}" data-action="toggle" data-id="${user.id}">
                                ${user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                        </td>
                    `;
                    usersTbody.appendChild(row);
                });

                // Actions delegation
                usersTbody.onclick = async (e) => {
                    const button = e.target.closest('button');
                    if (!button) return;
                    const id = parseInt(button.getAttribute('data-id'));
                    if (isNaN(id)) return;
                    const user = result.users.find(u => u.id === id);
                    if (!user) return;

                    if (button.classList.contains('btn-edit')) {
                        this.editingUserId = id;
                        this.container.querySelector('#user-username').value = user.username;
                        this.container.querySelector('#user-role').value = user.role;
                        this.container.querySelector('#user-status').value = user.isActive ? 'active' : 'inactive';
                        this.container.querySelector('#user-reset-password').checked = false;
                        this.container.querySelector('#user-form-container').classList.remove('hidden');
                    } else if (button.getAttribute('data-action') === 'toggle') {
                        try {
                            const res = await window.electronAPI.updateUser({
                                userId: id,
                                userData: { isActive: !user.isActive },
                                currentUser: this.currentUser
                            });
                            if (res.success) {
                                this.loadUsers();
                            } else {
                                ComponentUtils.showMessage(
                                    this.container.querySelector('.message') || this.container,
                                    res.message || 'Failed to update user status',
                                    'error'
                                );
                            }
                        } catch (err) {
                            ComponentUtils.showMessage(
                                this.container.querySelector('.message') || this.container,
                                'An error occurred while updating user status: ' + err.message,
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
                'An error occurred while loading users',
                'error'
            );
            console.error('Load users error:', error);
        }
    }
}

// Export the component
window.UsersComponent = UsersComponent;