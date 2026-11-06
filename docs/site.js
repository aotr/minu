(() => {
    document.querySelectorAll('[data-copy]').forEach((button) => {
        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(button.dataset.copy);
                button.textContent = 'Copied';
                setTimeout(() => { button.textContent = 'Copy'; }, 1400);
            } catch (error) {
                button.textContent = 'Copy failed';
            }
        });
    });

    minu.init();

    const links = Array.from(document.querySelectorAll('.api-sidebar nav a'));
    const sections = links
        .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
        .filter(Boolean);

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                links.forEach((link) => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
                });
            });
        }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 });

        sections.forEach((section) => observer.observe(section));
    }
})();
