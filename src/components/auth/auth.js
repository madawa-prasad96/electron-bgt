class AuthComponent {
    constructor() {
        this.container = document.getElementById('login-container');
        // Add event listeners
        this.attachEventListeners();
    }

    async render() {
        // The container already exists in the DOM, just return it
        return this.container;
    }

    attachEventListeners() {
        const loginForm = this.container.querySelector('#loginForm');
        const loginMessage = this.container.querySelector('#login-message');

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const username = this.container.querySelector('#username').value;
                const password = this.container.querySelector('#password').value;

                try {
                    const result = await window.electronAPI.authenticateUser({ username, password });

                    if (result.success) {
                        console.log('Login successful, user:', result.user);
                        // Store user info in localStorage
                        localStorage.setItem('currentUser', JSON.stringify(result.user));
                        
                        // Hide login container
                        this.hide();
                        
                        // Show main app container
                        const mainApp = document.getElementById('main-app');
                        if (mainApp) {
                            mainApp.classList.remove('hidden');
                            console.log('Main app container shown');
                        } else {
                            console.error('Main app container not found');
                        }
                        
                        // Notify the app controller that we're now authenticated
                        if (window.appController) {
                            window.appController.isAuthenticated = true;
                            console.log('Initializing main components...');
                            await window.appController.initMainComponents();
                            console.log('Showing dashboard view...');
                            window.appController.showView('dashboard');
                        } else {
                            console.error('App controller not found');
                        }
                    } else {
                        this.showMessage(loginMessage, result.message, 'error');
                    }
                } catch (error) {
                    this.showMessage(loginMessage, 'An error occurred during login', 'error');
                    console.error('Login error:', error);
                }
            });
        }
    }

    showMessage(element, message, type) {
        element.textContent = message;
        element.className = `message ${type}`;

        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                element.textContent = '';
                element.className = 'message';
            }, 3000);
        }
    }

    show() {
        if (this.container) {
            this.container.classList.remove('hidden');
        }
    }

    hide() {
        if (this.container) {
            this.container.classList.add('hidden');
        }
    }
}

// Export the component
window.AuthComponent = AuthComponent;