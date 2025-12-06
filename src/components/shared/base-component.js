// Base component class that other components can extend

class BaseComponent {
    constructor() {
        this.container = null;
        this.isVisible = false;
    }

    // Method to render the component
    async render() {
        throw new Error('Render method must be implemented by subclass');
    }

    // Method to show the component
    show() {
        if (this.container) {
            this.container.classList.remove('hidden');
            this.container.classList.add('active');
            this.isVisible = true;
        }
    }

    // Method to hide the component
    hide() {
        if (this.container) {
            this.container.classList.add('hidden');
            this.container.classList.remove('active');
            this.isVisible = false;
        }
    }

    // Method to toggle visibility
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    // Method to attach event listeners
    attachEventListeners() {
        // This method can be overridden by subclasses
    }

    // Method to destroy the component
    destroy() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }

    // Method to get the container element
    getContainer() {
        return this.container;
    }

    // Method to set data for the component
    setData(data) {
        // This method can be overridden by subclasses
    }

    // Method to get data from the component
    getData() {
        // This method can be overridden by subclasses
        return null;
    }
}

// Export the base component
window.BaseComponent = BaseComponent;