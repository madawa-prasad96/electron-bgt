class AuditComponent extends BaseComponent {
    constructor() {
        super();
        this.currentUser = ComponentUtils.getCurrentUser();
    }

    async render() {
        try {
            console.log('Rendering audit component...');
            
            // Create the HTML directly instead of fetching it
            this.container = document.createElement('div');
            // Remove the outer div with id since it will be added by the app controller
            this.container.innerHTML = `
<div class="page-header">
    <h2>Audit Logs</h2>
    <button id="refresh-audit" class="refresh-button" title="Refresh Audit Logs">
        <span class="refresh-icon">↻</span>
    </button>
</div>
<table class="data-table">
    <thead>
        <tr>
            <th>User</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Timestamp</th>
            <th>Details</th>
        </tr>
    </thead>
    <tbody id="audit-tbody">
        <!-- Audit logs will be populated here -->
    </tbody>
</table>
            `;
            
            // Add event listeners
            this.attachEventListeners();
                    
            // Add event listener for refresh button
            const refreshButton = this.container.querySelector('#refresh-audit');
            if (refreshButton) {
                refreshButton.addEventListener('click', async () => {
                    // Add loading indicator
                    refreshButton.classList.add('loading');
                            
                    try {
                        await this.loadAuditLogs();
                    } catch (error) {
                        console.error('Error refreshing audit logs:', error);
                    } finally {
                        // Remove loading indicator
                        refreshButton.classList.remove('loading');
                    }
                });
            }
            
            return this.container;
        } catch (error) {
            console.error('Error rendering audit component:', error);
            // Create a fallback container with error message
            this.container = document.createElement('div');
            this.container.innerHTML = `
                <h2>Audit Logs</h2>
                <p>Error rendering audit component: ${error.message}</p>
            `;
            return this.container;
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
                    this.container.querySelector('.message') || this.container,
                    result.message,
                    'error'
                );
            }
        } catch (error) {
            ComponentUtils.showMessage(
                this.container.querySelector('.message') || this.container,
                'An error occurred while loading audit logs',
                'error'
            );
            console.error('Load audit logs error:', error);
        }
    }
}

// Export the component
window.AuditComponent = AuditComponent;