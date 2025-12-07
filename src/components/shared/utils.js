// Shared utility functions for components

class ComponentUtils {
    // Helper function to show messages
    static showMessage(element, message, type) {
        // Clear any existing content
        element.innerHTML = '';
        
        // Create message content
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        
        // Add dismiss button for error messages
        let dismissButton = null;
        if (type === 'error') {
            dismissButton = document.createElement('button');
            dismissButton.textContent = '×';
            dismissButton.className = 'message-dismiss';
            dismissButton.style.cssText = `
                background: none;
                border: none;
                color: inherit;
                font-size: 1.2rem;
                cursor: pointer;
                float: right;
                margin-left: 10px;
                padding: 0;
                line-height: 1;
            `;
            dismissButton.addEventListener('click', () => {
                element.textContent = '';
                element.className = 'message';
            });
        }
        
        // Add elements to container
        if (dismissButton) {
            element.appendChild(dismissButton);
        }
        element.appendChild(messageSpan);
        
        // Set class
        element.className = `message ${type}`;
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                element.textContent = '';
                element.className = 'message';
            }, 3000);
        }
    }

    // Helper function to get current user from localStorage
    static getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('currentUser'));
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    // Helper function to format currency
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Helper function to format date
    static formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    // Helper function to format datetime
    static formatDateTime(dateTimeString) {
        return new Date(dateTimeString).toLocaleString();
    }

    // Helper function to get month name
    static getMonthName(monthNumber) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthNumber - 1];
    }

    // Helper function to create DOM element from HTML string
    static createElementFromHTML(htmlString) {
        const div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.firstChild;
    }

    // Helper function to debounce function calls
    static debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    }
}

// Export the utilities
window.ComponentUtils = ComponentUtils;