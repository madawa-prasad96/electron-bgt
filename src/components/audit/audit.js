class AuditComponent extends BaseComponent {
    constructor() {
        super();
        this.currentUser = ComponentUtils.getCurrentUser();
    }

    async render() {
        // Fetch the HTML template
        try {
            const response = await fetch('../components/audit/audit.html');
            const html = await response.text();
            
            // Create a container div and set its innerHTML
            this.container = document.createElement('div');
            this.container.innerHTML = html;
            
            // Add event listeners
            this.attachEventListeners();
            
            return this.container;
        } catch (error) {
            console.error('Error loading audit component:', error);
            return document.createElement('div');
        }
    }

    attachEventListeners() {
        // Load audit logs when component is shown
        this.loadAuditLogs();
    }

    async loadAuditLogs() {
        try {
            const result = await window.electronAPI.getAuditLogs(this.currentUser);

            if (result.success) {
                const auditTbody = this.container.querySelector('#audit-tbody');
                auditTbody.innerHTML = '';

                result.auditLogs.forEach(log => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${log.user ? log.user.username : 'Unknown'}</td>
                        <td>${log.action}</td>
                        <td>${log.entity}</td>
                        <td>${ComponentUtils.formatDateTime(log.timestamp)}</td>
                        <td>${log.details ? log.details : ''}</td>
                    `;
                    auditTbody.appendChild(row);
                });
            } else {
                ComponentUtils.showMessage(
                    this.container.querySelector('#audit-view .message') || this.container,
                    result.message,
                    'error'
                );
            }
        } catch (error) {
            ComponentUtils.showMessage(
                this.container.querySelector('#audit-view .message') || this.container,
                'An error occurred while loading audit logs',
                'error'
            );
            console.error('Load audit logs error:', error);
        }
    }
}

// Export the component
window.AuditComponent = AuditComponent;