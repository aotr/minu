/* Project-page metadata and gallery, generated from release.json by build.js. */
(() => {
    const script = document.currentScript;
    if (!script) return;

    const load = async () => {
        const response = await fetch(new URL('release.json', script.src));
        if (!response.ok) throw new Error(`release.json ${response.status}`);
        return response.json();
    };

    load().then((release) => {
        document.querySelectorAll('[data-release]').forEach((node) => {
            const value = release[node.dataset.release];
            if (value != null) node.textContent = value;
        });

        const gallery = document.querySelector('[data-gallery]');
        if (!gallery || !Array.isArray(release.examples)) return;

        const base = script.dataset.galleryBase || '';
        gallery.replaceChildren(...release.examples.map((example) => {
            const card = document.createElement('a');
            card.className = 'example-card';
            card.href = `${base}${example.slug}/`;

            const title = document.createElement('h2');
            title.textContent = example.title;
            const description = document.createElement('p');
            description.textContent = example.description;

            card.append(title, description);
            return card;
        }));
    }).catch((error) => {
        console.warn('minu: release metadata failed', error);
    });
})();
