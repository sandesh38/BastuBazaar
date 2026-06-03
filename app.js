/* ============================================
   BastuBazar — Home Page Logic
   Requires: data.js loaded before this file
   ============================================ */

// ========== DOM READY ==========

// Global combined array (base assets + custom ones)
let allAssets = [];

document.addEventListener('DOMContentLoaded', () => {
    // Merge custom assets from localStorage
    const custom = JSON.parse(localStorage.getItem('bastubazar_custom_assets') || '[]');
    allAssets = [...custom, ...assets]; // Custom first so they appear at top

    renderCategories();
    renderAssets('all');
    
    // Bind search functionality
    const searchBtn = document.getElementById('hero-search-btn');
    const searchInput = document.getElementById('hero-search-input');
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => performSearch(searchInput.value));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch(searchInput.value);
        });
    }

    initFilterBar();
    initNavbarScroll();
    initScrollReveal();

    // Wire up Load More button
    const loadMoreBtn = document.getElementById('btn-load-more');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            const originalText = loadMoreBtn.innerHTML;
            loadMoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Loading...';
            setTimeout(() => {
                loadMoreBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i> All listings loaded';
                loadMoreBtn.disabled = true;
                setTimeout(() => {
                    loadMoreBtn.style.display = 'none';
                }, 2000);
            }, 800);
        });
    }
});

// ========== RENDER CATEGORIES ==========

function renderCategories() {
    const grid = document.getElementById('category-grid');
    if (!grid) return;

    grid.innerHTML = categories.map((cat, index) => `
        <div class="col-6 col-md-3 reveal" style="transition-delay: ${index * 0.07}s">
            <div class="category-card" id="${cat.id}" role="button" tabindex="0">
                <div class="category-img-wrapper">
                    <img src="${cat.image}" alt="${cat.name}" class="category-img" loading="lazy">
                </div>
                <div class="category-name">${cat.name}</div>
                <div class="category-desc">${cat.desc}</div>
            </div>
        </div>
    `).join('');

    // Add click handler
    grid.querySelectorAll('.category-card').forEach((card, index) => {
        card.addEventListener('click', () => {
            const catName = categories[index].name;
            performSearch(catName);
            document.getElementById('featured-section').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// ========== RENDER ASSETS ==========

function renderAssets(filter) {
    const grid = document.getElementById('asset-grid');
    if (!grid) return;

    let displayAssets = filter === 'all'
        ? allAssets
        : allAssets.filter(a => a.tags.includes(filter));

    const savedIds = JSON.parse(localStorage.getItem('bastubazar_wishlist') || '[]');

    grid.innerHTML = displayAssets.map(asset => {
        const isWishlisted = savedIds.includes(asset.id);
        return `
        <div class="col-sm-6 col-md-4 col-lg-3 reveal">
            <div class="asset-card" role="button" tabindex="0" onclick="goToDetail('${asset.id}')">
                <div class="asset-card-img">
                    ${asset.imageSrc ? 
                        `<img src="${asset.imageSrc}" style="width:100%; height:100%; object-fit:cover;">` : 
                        `<div class="img-placeholder" style="background: linear-gradient(135deg, ${asset.color || '#D1FAE5'}, ${adjustColor(asset.color || '#D1FAE5', -10)})">
                            <span>${asset.emoji || '📦'}</span>
                        </div>`
                    }
                    <button class="asset-card-wishlist ${isWishlisted ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlistHome(this, '${asset.id}')">
                        <i class="bi bi-heart-fill"></i>
                    </button>
                    <span class="asset-card-category-badge">${asset.category}</span>
                </div>
                <div class="asset-card-body">
                    <div class="asset-card-title">${asset.title}</div>
                    <div class="asset-card-location">
                        <i class="bi bi-geo-alt-fill"></i> ${asset.location}
                    </div>
                    <div class="asset-card-tags">
                        ${asset.tags.map(tag => `<span class="tag tag-${tag}">${capitalize(tag)}</span>`).join('')}
                    </div>
                    <div class="asset-card-footer">
                        <div class="asset-price">
                            ${asset.price} <span>/ ${asset.period}</span>
                        </div>
                        <div class="asset-card-user">
                            <span class="user-avatar">${asset.user.initials}</span>
                            ${asset.user.name.split(' ')[0]}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `}).join('');

    // Re-trigger scroll reveal
    initScrollReveal();
}

// ========== NAVIGATE TO DETAIL ==========

function goToDetail(assetId) {
    window.location.href = `detail.html?id=${assetId}`;
}

// ========== FILTER BAR ==========

function initFilterBar() {
    const pills = document.querySelectorAll('.filter-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const filter = pill.getAttribute('data-filter');
            renderAssets(filter);
        });
    });
}

// ========== NAVBAR SCROLL ==========

function initNavbarScroll() {
    const navbar = document.getElementById('main-navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });
}

// ========== FILTERS & SEARCH ==========

function performSearch(query) {
    query = query.toLowerCase().trim();
    if (!query) {
        renderAssets('all');
        return;
    }
    
    // Switch filter pills to 'all' visually
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    document.getElementById('filter-all').classList.add('active');

    const grid = document.getElementById('asset-grid');
    if (!grid) return;

    const searchResults = allAssets.filter(a => 
        a.title.toLowerCase().includes(query) || 
        a.category.toLowerCase().includes(query) ||
        a.location.toLowerCase().includes(query) ||
        (a.description && a.description.toLowerCase().includes(query))
    );

    const savedIds = JSON.parse(localStorage.getItem('bastubazar_wishlist') || '[]');

    if (searchResults.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center text-muted py-5"><i class="bi bi-search fs-1 mb-3 d-block"></i>No listings found matching your search.</div>';
        return;
    }

    grid.innerHTML = searchResults.map(asset => {
        const isWishlisted = savedIds.includes(asset.id);
        return `
        <div class="col-sm-6 col-md-4 col-lg-3 reveal">
            <div class="asset-card" role="button" tabindex="0" onclick="goToDetail('${asset.id}')">
                <div class="asset-card-img">
                    ${asset.imageSrc ? 
                        `<img src="${asset.imageSrc}" style="width:100%; height:100%; object-fit:cover;">` : 
                        `<div class="img-placeholder" style="background: linear-gradient(135deg, ${asset.color || '#D1FAE5'}, ${adjustColor(asset.color || '#D1FAE5', -10)})">
                            <span>${asset.emoji || '📦'}</span>
                        </div>`
                    }
                    <button class="asset-card-wishlist ${isWishlisted ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlistHome(this, '${asset.id}')">
                        <i class="bi bi-heart-fill"></i>
                    </button>
                    <span class="asset-card-category-badge">${asset.category}</span>
                </div>
                <div class="asset-card-body">
                    <div class="asset-card-title">${asset.title}</div>
                    <div class="asset-card-location">
                        <i class="bi bi-geo-alt-fill"></i> ${asset.location}
                    </div>
                    <div class="asset-card-footer mt-auto pt-3 border-top">
                        <div class="asset-price">
                            ${asset.price} <span>/ ${asset.period}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
    
    // Scroll down to results
    document.getElementById('featured-section').scrollIntoView({ behavior: 'smooth' });
}

// ========== SCROLL REVEAL ==========

function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    reveals.forEach(el => observer.observe(el));
}

// ========== HELPERS ==========

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function adjustColor(hex, amount) {
    let color = hex.replace('#', '');
    if (color.length === 3) color = color.split('').map(c => c + c).join('');
    const num = parseInt(color, 16);
    let r = Math.min(255, Math.max(0, (num >> 16) + amount));
    let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    let b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

function toggleWishlistHome(btn, assetId) {
    btn.classList.toggle('active');
    let savedIds = JSON.parse(localStorage.getItem('bastubazar_wishlist') || '[]');
    if (savedIds.includes(assetId)) {
        savedIds = savedIds.filter(id => id !== assetId);
    } else {
        savedIds.push(assetId);
    }
    localStorage.setItem('bastubazar_wishlist', JSON.stringify(savedIds));
}
