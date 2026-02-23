document.addEventListener('DOMContentLoaded', () => {
    const layout = document.querySelector('.post-layout');
    const toggle = document.querySelector('#toc-toggle');
    const toc = document.querySelector('#post-toc');

    if (!layout || !toggle || !toc) return;

    // Use a small delay to prevent transition on load if preferred, 
    // but here we just want to set the initial state correctly.
    const savedState = localStorage.getItem('tocState');
    
    // Default to open if no saved state
    const isClosed = savedState === 'closed';
    
    if (isClosed) {
        layout.setAttribute('data-toc', 'closed');
        const projectSingle = layout.closest('.project-single');
        if (projectSingle) {
            projectSingle.setAttribute('data-toc', 'closed');
        }
        toggle.setAttribute('aria-expanded', 'false');
    } else {
        layout.setAttribute('data-toc', 'open');
        const projectSingle = layout.closest('.project-single');
        if (projectSingle) {
            projectSingle.setAttribute('data-toc', 'open');
        }
        toggle.setAttribute('aria-expanded', 'true');
    }

    toggle.addEventListener('click', () => {
        const currentState = layout.getAttribute('data-toc');
        const newState = currentState === 'open' ? 'closed' : 'open';
        
        layout.setAttribute('data-toc', newState);
        const projectSingle = layout.closest('.project-single');
        if (projectSingle) {
            projectSingle.setAttribute('data-toc', newState);
        }
        toggle.setAttribute('aria-expanded', newState === 'open' ? 'true' : 'false');
        localStorage.setItem('tocState', newState);
    });
});

