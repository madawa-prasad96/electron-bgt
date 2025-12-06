class AuthComponent {
    constructor() {
        this.container = null;
    }

    async render() {
        // Fetch the HTML template
        try {
            const response = await fetch('../components/auth/login.html');
            const html = await response.text();
            
            // Create a container div and set its innerHTML
            this.container = document.createElement('div');
            this.container.innerHTML = html;
            
            // Add event listeners
            this.attachEventListeners();
            
            return this.container;
        } catch (error) {
            console.error('Error loading auth component:', error);
            return document.createElement('div');
        }
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
                        // Hide login container and show dashboard
                        this.container.classList.add('hidden');
                        document.getElementById('dashboard-container').classList.remove('hidden');

                        // Store user info in localStorage
                        localStorage.setItem('currentUser', JSON.stringify(result.user));
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