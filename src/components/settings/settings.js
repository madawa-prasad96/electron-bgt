class SettingsComponent extends BaseComponent {
    constructor() {
        super();
        this.currentUser = ComponentUtils.getCurrentUser();
    }

    async render() {
        // Fetch the HTML template
        try {
            const response = await fetch('../components/settings/settings.html');
            const html = await response.text();
            
            // Create a container div and set its innerHTML
            this.container = document.createElement('div');
            this.container.innerHTML = html;
            
            // Add event listeners
            this.attachEventListeners();
            
            return this.container;
        } catch (error) {
            console.error('Error loading settings component:', error);
            return document.createElement('div');
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
                        this.container.querySelector('#settings-view .message') || this.container,
                        'New passwords do not match',
                        'error'
                    );
                    return;
                }
                
                if (newPassword.length < 8) {
                    ComponentUtils.showMessage(
                        this.container.querySelector('#settings-view .message') || this.container,
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
                            this.container.querySelector('#settings-view .message') || this.container,
                            result.message,
                            'success'
                        );
                        changePasswordForm.reset();
                    } else {
                        ComponentUtils.showMessage(
                            this.container.querySelector('#settings-view .message') || this.container,
                            result.message,
                            'error'
                        );
                    }
                } catch (error) {
                    ComponentUtils.showMessage(
                        this.container.querySelector('#settings-view .message') || this.container,
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
                            this.container.querySelector('#settings-view .message') || this.container,
                            result.message,
                            'success'
                        );
                    } else {
                        ComponentUtils.showMessage(
                            this.container.querySelector('#settings-view .message') || this.container,
                            result.message,
                            'error'
                        );
                    }
                } catch (error) {
                    ComponentUtils.showMessage(
                        this.container.querySelector('#settings-view .message') || this.container,
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
                            this.container.querySelector('#settings-view .message') || this.container,
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
                            this.container.querySelector('#settings-view .message') || this.container,
                            result.message,
                            'error'
                        );
                    }
                } catch (error) {
                    ComponentUtils.showMessage(
                        this.container.querySelector('#settings-view .message') || this.container,
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