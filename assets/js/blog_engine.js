document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    let postSlug = urlParams.get('post');
    const container = document.getElementById('active-blog-post');

    if (!container) return;

    const scriptTag = document.querySelector('script[src*="blog-engine.js"]');
    const projectName = scriptTag ? scriptTag.getAttribute('data-project') : 'sph';
    const targetPath = `/projects/${projectName}/blog.json`;
    
    let globalPostsArray = []; 

    // 1. INITIAL FETCH
    fetch(targetPath)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            return response.json();
        })
        .then(postsArray => {
            globalPostsArray = postsArray;
            if (!globalPostsArray || globalPostsArray.length === 0) {
                container.innerHTML = `<p>No log entries found.</p>`;
                return;
            }
            navigateToPost(postSlug);
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = `<p>Error loading log configurations.</p>`;
        });

    // 2. CORE ROUTING ENGINE
    function navigateToPost(slug) {
        let activeIndex = 0; 
        if (slug) {
            activeIndex = globalPostsArray.findIndex(post => post.slug === slug);
        }

        if (activeIndex !== -1) {
            renderPostAndNavigation(activeIndex);
            if (slug) {
                window.history.pushState({ slug: slug }, "", `?post=${slug}`);
            } else {
                window.history.pushState({ slug: "" }, "", window.location.pathname);
            }
        } else {
            container.innerHTML = `<p>Error: Log entry "${slug}" could not be found.</p>`;
        }
    }

    // 3. RENDER CONTENT AND INTERFACE
    function renderPostAndNavigation(index) {
        const post = globalPostsArray[index];
        const nextPost = globalPostsArray[index - 1]; 
        const prevPost = globalPostsArray[index + 1]; 

        // ─── GENERATE DROPDOWN OPTIONS ───
        let dropdownOptions = '';
        globalPostsArray.forEach((p) => {
            const isSelected = p.slug === post.slug ? 'selected' : '';
            dropdownOptions += `<option value="${p.slug}" ${isSelected}>${p.date} -   ${p.title}</option>`;
        });

        // ─── GENERATE THE HEADER DROPDOWN HTML ───
        let headerHtml = `
            <div class="blog-header-controls" style="margin-bottom: 2rem;">
                <div class="field">
                    <div class="select-wrapper" style="max-width: 100%;">
                        <select name="blog-select" id="blog-select" style="background-color: #2e3141; color: #fff; border-color: rgba(255,255,255,0.15); font-size: 1.1em; height: 3em;">
                            ${dropdownOptions}
                        </select>
                    </div>
                </div>
            </div>
        `;

        // ─── GENERATE THE FOOTER BUTTONS HTML ───
        let paginationHtml = `
            <div class="blog-pagination" style="display: flex; justify-content: space-between; align-items: center; margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1);">
        `;

        if (prevPost) {
            paginationHtml += `<button data-slug="${prevPost.slug}" class="button small blog-nav-btn" style="text-transform: uppercase; letter-spacing: 0.1em;">← Older</button>`;
        } else {
            paginationHtml += `<span></span>`;
        }

        if (nextPost) {
            paginationHtml += `<button data-slug="${nextPost.slug}" class="button small blog-nav-btn" style="text-transform: uppercase; letter-spacing: 0.1em;">Newer →</button>`;
        } else {
            paginationHtml += `<span></span>`;
        }

        paginationHtml += `</div>`;

        // Inject elements cleanly—Header Dropdown at the top, followed by Summary, Body, and Pagination
        container.innerHTML = `
            ${headerHtml}
            <div class="blog-meta" style="margin-bottom: 1.5rem;">
                <p style="font-style: italic; color: #a2a5b5; line-height: 1.5; font-size: 1.1em;">${post.summary}</p>
            </div>
            <div class="blog-body" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1.5rem; line-height: 1.75;">
                ${post.content}
            </div>
            ${paginationHtml}
        `;

        // ─── WIRE INTERACTION EVENT LISTENERS ───
        
        const selectElement = container.querySelector('#blog-select');
        if (selectElement) {
            selectElement.addEventListener('change', (e) => {
                navigateToPost(e.target.value);
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }

        container.querySelectorAll('.blog-nav-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSlug = button.getAttribute('data-slug');
                navigateToPost(targetSlug);
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    window.addEventListener('popstate', (event) => {
        const currentParams = new URLSearchParams(window.location.search);
        navigateToPost(currentParams.get('post'));
    });
});