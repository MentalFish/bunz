/**
 * BUNZ Application - Event handlers
 */

// Global modal trigger
document.addEventListener('click', e => {
    if (e.target.closest('[data-action="open-login-modal"]')) {
        openModal?.('pages/login.htx');
    }
});

// Auth success
document.addEventListener('bunz:auth-success', async e => {
    console.log('🔐 Auth success:', e.detail);
    await new Promise(r => setTimeout(r, 100)); // Cookie delay
    
    closeModal?.();
    bunzNavbar?.updateAuthState();
    
    const route = e.detail.redirect || '/dashboard';
    const htxFile = route === '/' ? '/htx/pages/index.htx' : `/htx/pages${route}.htx`;
    await bunz?.load(htxFile, '#app');
});

// Auth logout
document.addEventListener('bunz:auth-logout', async () => {
    console.log('👋 Logging out...');
    await bunz?.load('/htx/pages/index.htx', '#app');
    bunzNavbar?.updateAuthState();
});

// Auto-load component scripts
// DEPRECATED: Page scripts are now embedded in HTX files
// Kept for backwards compatibility with old events, but does nothing
document.addEventListener('bz:loaded', e => {
    // Scripts are now self-contained in HTX files
});
document.addEventListener('bunz:loaded', e => {
    // Scripts are now self-contained in HTX files
});

console.log('🚀 BUNZ Application initialized');
