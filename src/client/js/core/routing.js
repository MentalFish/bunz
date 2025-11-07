'use strict';

/**
 * BUNZ - Minimal Routing & Navigation
 * Full-featured: lifecycle, errors, state, cache, forms, a11y, realtime
 * 
 * Usage:
 *   <a href="/htx/pages/dashboard.htx#app" bz-guard="auth">Dashboard</a>
 *   <form bz-post="/api/login" bz-target="#app">...</form>
 *   <div bz-preserve="search-form">...</div>
 */

(function() {
    'use strict';
    
    // Configuration
    const config = {
        authEndpoint: '/api/me',
        loginModal: '/htx/pages/login.htx',
        defaultTarget: '#app'
    };
    
    // Auth guards
    const guards = {
        auth: async () => {
            const res = await fetch(config.authEndpoint, { credentials: 'include' });
            if (!res.ok && window.openModal) {
                await window.openModal(config.loginModal);
                return false;
            }
            return res.ok;
        },
        guest: async () => {
            const res = await fetch(config.authEndpoint, { credentials: 'include' });
            if (res.ok) {
                await load('/htx/pages/dashboard.htx', '#app');
                return false;
            }
            return true;
        }
    };
    
    // Load content with full feature integration
    async function load(url, target, pushState = true) {
        try {
            const targetEl = document.querySelector(target || config.defaultTarget);
            if (!targetEl) return;
            
            // Check if already on this page
            if (pushState && url.includes('.htx')) {
                let route = url.replace('/htx/pages/', '/').replace('.htx', '');
                if (route === '/index') route = '/';
                if (window.location.pathname === route) {
                    console.log('Already on this page, skipping reload');
                    return;
                }
            }
            
            // Check if content is pre-rendered (SSR)
            const isPrerendered = targetEl.getAttribute('data-prerendered') === 'true';
            if (isPrerendered && !pushState) {
                console.log('✅ Using pre-rendered SSR content');
                targetEl.removeAttribute('data-prerendered');
                
                // Still execute scripts in pre-rendered content
                if (window.bunzScripts) {
                    const html = targetEl.innerHTML;
                    await window.bunzScripts.execute(html, targetEl);
                }
                
                // Accessibility - manage focus for pre-rendered content
                if (window.bunzA11y) {
                    window.bunzA11y.manageFocus(targetEl);
                    window.bunzA11y.announce('Page loaded');
                }
                
                // Update URL (no animation for initial/prerendered load)
                if (url.includes('.htx')) {
                    let route = url.replace('/htx/pages/', '/').replace('.htx', '');
                    if (route === '/index') route = '/';
                    window.history.replaceState({ url, target }, '', route);
                }
                
                // Lifecycle: afterSwap
                if (window.bunzLifecycle) {
                    window.bunzLifecycle.afterSwap(target, url, targetEl.innerHTML);
                }
                
                // Dispatch event
                document.dispatchEvent(new CustomEvent('bz:loaded', { 
                    detail: { url, target, prerendered: true } 
                }));
                
                return;
            }
            
            // Lifecycle: beforeSwap + cleanup
            if (window.bunzLifecycle) {
                const proceed = await window.bunzLifecycle.beforeSwap(target, url);
                if (!proceed) return;
            }
            
            // Preserve state
            if (window.bunzState) {
                window.bunzState.preserveElements(targetEl);
            }
            
            // Fade out (only for client-side navigation)
            targetEl.classList.add('fade-out');
            await new Promise(r => setTimeout(r, 100));
            
            // Use bunzCore.fetch for fetching HTML with caching
            let html;
            try {
                if (window.bunzCore) {
                    html = await window.bunzCore.fetch(url);
                } else {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    html = await res.text();
                }
            } catch (error) {
                // Error boundary
                if (window.bunzErrors) {
                    return window.bunzErrors.handle(error, url, targetEl, { pushState });
                }
                throw error;
            }
            
            // Swap content
            targetEl.innerHTML = html;
            
            // Restore preserved state
            if (window.bunzState) {
                window.bunzState.restoreElements(targetEl);
            }
            
            // Execute scripts
            if (window.bunzScripts) {
                await window.bunzScripts.execute(html, targetEl);
            }
            
            // Fade in (trigger animation) - only for client-side navigation
            targetEl.classList.remove('fade-out');
            targetEl.classList.add('fade-in');
            // Remove fade-in class after animation completes
            setTimeout(() => targetEl.classList.remove('fade-in'), 100);
            
            // Accessibility
            if (window.bunzA11y) {
                window.bunzA11y.manageFocus(targetEl);
                window.bunzA11y.announce('Page loaded');
            }
            
            // Update URL
            if (pushState && url.includes('.htx')) {
                let route = url.replace('/htx/pages/', '/').replace('.htx', '');
                if (route === '/index') route = '/';
                window.history.pushState({ url, target }, '', route);
            }
            
            // Lifecycle: afterSwap
            if (window.bunzLifecycle) {
                window.bunzLifecycle.afterSwap(target, url, html);
            }
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('bz:loaded', { 
                detail: { url, target } 
            }));
            
        } catch (err) {
            console.error('BUNZ Load Error:', err);
            if (window.bunzErrors) {
                window.bunzErrors.handle(err, url, target, { pushState });
            }
        }
    }
    
    // Handle bz-get clicks
    document.addEventListener('click', async (e) => {
        const el = e.target.closest('[bz-get], a[href*=".htx"]');
        if (!el) return;
        
        e.preventDefault();
        
        // Extract URL and target
        let url, target;
        if (el.hasAttribute('bz-get')) {
            url = el.getAttribute('bz-get');
            target = el.getAttribute('bz-target');
        } else {
            const href = el.getAttribute('href');
            const [path, hash] = href.split('#');
            url = path;
            target = hash ? `#${hash}` : null;
        }
        
        const guard = el.getAttribute('bz-guard');
        
        // Check guard
        if (guard && guards[guard]) {
            const passed = await guards[guard]();
            if (!passed) return;
        }
        
        await load(url, target);
    });
    
    // Handle bz-post forms
    document.addEventListener('submit', async (e) => {
        const form = e.target.closest('[bz-post]');
        if (!form) return;
        
        e.preventDefault();
        
        const url = form.getAttribute('bz-post');
        const target = form.getAttribute('bz-target');
        
        // Validate if forms module available
        if (window.bunzForms) {
            const { valid, errors } = window.bunzForms.validate(form);
            if (!valid) {
                console.error('Form validation errors:', errors);
                // Could dispatch event for UI to handle
                return;
            }
        }
        
        const formData = new FormData(form);
        
        try {
            const res = await fetch(url, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            const html = await res.text();
            const targetEl = document.querySelector(target || config.defaultTarget);
            if (targetEl) {
                targetEl.innerHTML = html;
                
                // Execute scripts
                if (window.bunzScripts) {
                    await window.bunzScripts.execute(html, targetEl);
                }
            }
            
            document.dispatchEvent(new CustomEvent('bz:submitted', { 
                detail: { url, target } 
            }));
        } catch (err) {
            console.error('BUNZ Post Error:', err);
        }
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', async (e) => {
        if (e.state && e.state.url) {
            await load(e.state.url, e.state.target, false);
        }
    });
    
    // Helper to get HTX file path (handles dynamic routes)
    // Pages are now in /htx/pages/ subdirectory
    function getHTXPath(pathname) {
        if (pathname === '/') return '/htx/pages/index.htx';
        
        // Handle dynamic routes: /meeting/123 -> /htx/pages/meeting.htx
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length > 1) {
            return `/htx/pages/${segments[0]}.htx`;
        }
        
        return `/htx/pages${pathname}.htx`;
    }
    
    // Load initial page
    // Note: Scripts with defer run AFTER DOMContentLoaded fires
    // So we can't rely on DOMContentLoaded listener - check immediately
    function initPage() {
        const path = window.location.pathname;
        const appEl = document.querySelector(config.defaultTarget);
        
        console.log('🔍 Checking for SSR...');
        console.log('🔍 App element:', appEl);
        console.log('🔍 data-prerendered attribute:', appEl?.getAttribute('data-prerendered'));
        console.log('🔍 App innerHTML length:', appEl?.innerHTML?.length);
        
        // Check if content is already SSR'd (pre-rendered)
        if (appEl && appEl.getAttribute('data-prerendered') === 'true') {
            console.log('✅ Page is SSR\'d, no fade-in animation');
            appEl.removeAttribute('data-prerendered');
            
            // Still execute scripts in pre-rendered content
            if (window.bunzScripts && appEl.innerHTML.includes('<script>')) {
                const html = appEl.innerHTML;
                window.bunzScripts.execute(html, appEl);
            }
            
            // Dispatch loaded event for SSR content
            document.dispatchEvent(new CustomEvent('bz:loaded', { 
                detail: { url: path, target: config.defaultTarget, ssr: true } 
            }));
            
            return;
        }
        
        // No SSR, load client-side
        console.log('⚡ No SSR, loading client-side with animation');
        const htxFile = getHTXPath(path);
        fetch(htxFile, { method: 'HEAD' })
            .then(res => res.ok ? load(htxFile, config.defaultTarget, false) : null)
            .catch(() => load('/htx/pages/index.htx', config.defaultTarget, false));
    }
    
    // Call immediately if DOM ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPage);
    } else {
        initPage();
    }
    
    // Export API
    window.bunz = { load, guards, config };
    
    console.log('✅ BUNZ Routing initialized');
})();

