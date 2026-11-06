(() => {
    const search = document.getElementById('api-search');
    const sections = Array.from(document.querySelectorAll('.api-content > section'));
    const links = Array.from(document.querySelectorAll('.api-sidebar nav a'));

    const empty = document.getElementById('api-empty');

    const filter = () => {
        const query = search ? search.value.trim().toLowerCase() : '';
        let visible = 0;
        sections.forEach((section) => {
            section.hidden = Boolean(query) && !section.textContent.toLowerCase().includes(query);
            if (!section.hidden) visible += 1;
        });
        links.forEach((link) => {
            const id = link.getAttribute('href').slice(1);
            const section = document.getElementById(id);
            link.hidden = Boolean(query) && Boolean(section && section.hidden);
        });
        if (empty) empty.hidden = !query || visible > 0;
    };

    if (search) search.addEventListener('input', filter);

    document.querySelectorAll('.api-content pre').forEach((pre) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'code-copy';
        button.textContent = 'Copy';
        button.setAttribute('aria-label', 'Copy code sample');
        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(pre.textContent);
                button.textContent = 'Copied';
                setTimeout(() => { button.textContent = 'Copy'; }, 1200);
            } catch (error) {
                button.textContent = 'Copy failed';
            }
        });
        wrapper.appendChild(button);
    });
})();
