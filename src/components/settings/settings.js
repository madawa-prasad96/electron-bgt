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
<h2>Settings</h2>
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
            `;
            
            // Add event listeners
            this.attachEventListeners();
            
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
    }
}

// Export the component
window.SettingsComponent = SettingsComponent;