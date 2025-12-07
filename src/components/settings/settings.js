class SettingsComponent extends BaseComponent {
    constructor() {
        super();
        this.currentUser = ComponentUtils.getCurrentUser();
    }

    async render() {
        try {
            console.log('Rendering settings component...');
            
            // Create the HTML directly instead of fetching it
            this.container = document.createElement('div');
            // Remove the outer div with id since it will be added by the app controller
            this.container.innerHTML = `
<div class="page-header">
    <h2>Settings</h2>
    <button id="refresh-settings" class="refresh-button" title="Refresh Settings">
        <span class="refresh-icon">↻</span>
    </button>
</div>
<div class="settings-section">
    <h3>Change Password</h3>
    <form id="change-password-form">
        <div class="form-group">
            <label for="current-password">Current Password</label>
            <input type="password" id="current-password" required>
        </div>
        <div class="form-group">
            <label for="new-password">New Password</label>
            <input type="password" id="new-password" required>
        </div>
        <div class="form-group">
            <label for="confirm-password">Confirm New Password</label>
            <input type="password" id="confirm-password" required>
        </div>
        <button type="submit" class="btn btn-primary">Change Password</button>
    </form>
</div>
<div class="settings-section">
    <h3>Database Management</h3>
    <div class="form-group">
        <button id="backup-btn" class="btn btn-primary">Backup Database</button>
        <button id="restore-btn" class="btn">Restore Database</button>
    </div>
</div>
<div class="settings-section">
    <h3>Application Information</h3>
    <div class="info-item">
        <label>Version:</label>
        <span>1.0.0</span>
    </div>
    <div class="info-item">
        <label>Data Directory:</label>
        <span id="data-directory">-</span>
    </div>
</div>
<div class="settings-section">
    <h3>Account</h3>
    <button id="logout-btn" class="btn btn-danger">Logout</button>
</div>
            `;
            
            // Add event listeners
            this.attachEventListeners();
                    
            // Add event listener for refresh button
            const refreshButton = this.container.querySelector('#refresh-settings');
            if (refreshButton) {
                refreshButton.addEventListener('click', async () => {
                    // Add loading indicator
                    refreshButton.classList.add('loading');
                            
                    try {
                        // For settings, we just re-render the component
                        await this.render();
                    } catch (error) {
                        console.error('Error refreshing settings:', error);
                    } finally {
                        // Remove loading indicator
                        refreshButton.classList.remove('loading');
                    }
                });
            }
            
            return this.container;
        } catch (error) {
            console.error('Error rendering settings component:', error);
            // Create a fallback container with error message
            this.container = document.createElement('div');
            this.container.innerHTML = `
                <h2>Settings</h2>
                <p>Error rendering settings component: ${error.message}</p>
            `;
            return this.container;
        }
    }

    attachEventListeners() {
        // Change password form submission
        const changePasswordForm = this.container.querySelector('#change-password-form');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const currentPassword = this.container.querySelector('#current-password').value;
                const newPassword = this.container.querySelector('#new-password').value;
                const confirmPassword = this.container.querySelector('#confirm-password').value;
                
                // Validate passwords
                if (newPassword !== confirmPassword) {
                    ComponentUtils.showMessage(
                        this.container.querySelector('.message') || this.container,
                        'New passwords do not match',
                        'error'
                    );
                    return;
                }
                
                if (newPassword.length < 8) {
                    ComponentUtils.showMessage(
                        this.container.querySelector('.message') || this.container,
                        'Password must be at least 8 characters long',
                        'error'
                    );
                    return;
                }
                
                try {
                    const result = await window.electronAPI.changePassword({
                        currentPassword,
                        newPassword,
                        currentUser: this.currentUser
                    });
                    
                    if (result.success) {
                        ComponentUtils.showMessage(
                            this.container.querySelector('.message') || this.container,
                            result.message,
                            'success'
                        );
                        changePasswordForm.reset();
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
                        'An error occurred while changing the password',
                        'error'
                    );
                    console.error('Change password error:', error);
                }
            });
        }
        
        // Backup button
        const backupBtn = this.container.querySelector('#backup-btn');
        if (backupBtn) {
            backupBtn.addEventListener('click', async () => {
                try {
                    const result = await window.electronAPI.backupDatabase(this.currentUser);
                    if (result.success) {
                        ComponentUtils.showMessage(
                            this.container.querySelector('.message') || this.container,
                            result.message,
                            'success'
                        );
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
                        'An error occurred while backing up the database',
                        'error'
                    );
                    console.error('Backup error:', error);
                }
            });
        }
        
        // Restore button
        const restoreBtn = this.container.querySelector('#restore-btn');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', async () => {
                try {
                    const result = await window.electronAPI.restoreDatabase(this.currentUser);
                    if (result.success) {
                        ComponentUtils.showMessage(
                            this.container.querySelector('.message') || this.container,
                            result.message,
                            'success'
                        );
                        // If restore was successful, restart the application
                        if (result.message.includes('Application will restart')) {
                            setTimeout(() => {
                                window.location.reload();
                            }, 3000);
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
                        'An error occurred while restoring the database',
                        'error'
                    );
                    console.error('Restore error:', error);
                }
            });
        }
        
        // Logout button
        const logoutBtn = this.container.querySelector('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                // Confirm logout
                if (confirm('Are you sure you want to logout?')) {
                    // Perform logout
                    this.logout();
                }
            });
        }
    }
    
    logout() {
        // Clear user data from localStorage
        localStorage.removeItem('currentUser');
        localStorage.removeItem('loginToken');
        localStorage.removeItem('loginExpiry');
        
        // Hide main app
        const mainApp = document.getElementById('main-app');
        if (mainApp) {
            mainApp.classList.add('hidden');
        }
        
        // Show login screen
        const loginContainer = document.getElementById('login-container');
        if (loginContainer) {
            loginContainer.classList.remove('hidden');
        }
        
        // Reset app controller state
        if (window.appController) {
            window.appController.isAuthenticated = false;
            // Clear any existing content
            const contentArea = document.querySelector('.content-area');
            if (contentArea) {
                contentArea.innerHTML = '';
            }
        }
        
        // Reset form fields and ensure form is enabled
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.reset();
            // Ensure form is enabled
            const inputs = loginForm.querySelectorAll('input');
            inputs.forEach(input => {
                input.disabled = false;
            });
            const buttons = loginForm.querySelectorAll('button');
            buttons.forEach(button => {
                button.disabled = false;
            });
        }
        
        console.log('User logged out successfully');
    }
}

// Export the component
window.SettingsComponent = SettingsComponent;