// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off and `contextIsolation` is turned on.
// Use the ipcRenderer module to communicate with the main process.

window.addEventListener('DOMContentLoaded', async () => {
    // Get the user role from the main process
    const userRole = await window.api.getUserRole();
    
    // Display the user role in the UI
    const roleElement = document.getElementById('user-role');
    if (roleElement) {
        roleElement.textContent = userRole;
        roleElement.className = 'role';
    }
});