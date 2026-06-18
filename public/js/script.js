// Gaman 2.0 Frontend Controller Script
(() => {
  'use strict';

  // State Store
  const state = {
    wishlist: window.currentUserId ? (window.currentUserWishlist || []) : JSON.parse(localStorage.getItem('gaman_wishlist') || '[]'),
    bookings: window.currentUserBookings || [],
    searches: JSON.parse(localStorage.getItem('gaman_searches') || '[]'),
    activeView: 'explore',
    taxShown: false
  };

  // Toast Notification System
  function showToast(message, type = 'success') {
    const container = document.getElementById('toastManagerContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-alert-card';
    toast.innerHTML = `
      <span><i class="fa-solid ${type === 'success' ? 'fa-circle-check text-success' : 'fa-circle-info text-info'} me-2"></i>${message}</span>
      <button style="background:transparent;border:none;color:white;" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Save dynamic notifications client-side
  function saveLocalNotification(title, message) {
    const list = JSON.parse(localStorage.getItem('gaman_notifications') || '[]');
    list.unshift({
      id: Date.now(),
      title: title,
      message: message,
      date: 'Just Now'
    });
    localStorage.setItem('gaman_notifications', JSON.stringify(list));
    
    let unreadCount = parseInt(localStorage.getItem('gaman_unread_notifications_count') || '0');
    localStorage.setItem('gaman_unread_notifications_count', (unreadCount + 1).toString());
  }

  // Global Notifications Dropdown Initialization
  function setupGlobalNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    const badge = document.getElementById('notificationBadge');
    const btn = document.getElementById('notificationBtn');

    let list = localStorage.getItem('gaman_notifications');
    if (!list) {
      const defaultNotifications = [
        { id: 1, title: 'Welcome to Gaman 2.0!', message: 'Explore curated stays, cabins, and castles near you.', date: 'Just Now' },
        { id: 2, title: 'Summer Travel Deal!', message: 'Use code GAMAN2026 to get 10% discount on your next trip.', date: '2 hours ago' }
      ];
      localStorage.setItem('gaman_notifications', JSON.stringify(defaultNotifications));
      localStorage.setItem('gaman_unread_notifications_count', '2');
    }

    const renderList = () => {
      const items = JSON.parse(localStorage.getItem('gaman_notifications') || '[]');
      if (notificationsList) {
        if (items.length === 0) {
          notificationsList.innerHTML = '<div class="text-center py-3 text-muted">No new notifications.</div>';
        } else {
          notificationsList.innerHTML = items.map(item => `
            <div class="mb-3 pb-2 border-bottom" style="border-bottom: 1px solid var(--border) !important;">
              <div class="d-flex justify-content-between font-weight-bold text-dark mb-1" style="font-size: 0.8rem;">
                <span>${item.title}</span>
                <span class="text-muted" style="font-size: 0.7rem;">${item.date}</span>
              </div>
              <p class="mb-0 text-secondary" style="font-size: 0.78rem; line-height:1.4;">${item.message}</p>
            </div>
          `).join('');
        }
      }
    };

    const updateBadge = () => {
      const unreadCount = parseInt(localStorage.getItem('gaman_unread_notifications_count') || '0');
      if (badge) {
        if (unreadCount > 0) {
          badge.style.display = 'block';
        } else {
          badge.style.display = 'none';
        }
      }
    };

    if (btn) {
      btn.addEventListener('click', () => {
        localStorage.setItem('gaman_unread_notifications_count', '0');
        updateBadge();
        renderList();
      });
    }

    updateBadge();
    renderList();
  }

  // Handle URL Routing client-side
  function handleUrlRouting() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const tab = params.get('tab');
    
    // Hide all main panel sections
    const exploreEl = document.getElementById('exploreViewSection');
    const catEl = document.getElementById('categorySliderBar');
    const guestEl = document.getElementById('guestDashboardView');
    const hostEl = document.getElementById('hostDashboardView');
    const aiEl = document.getElementById('aiAssistantView');

    if (exploreEl) exploreEl.style.display = 'none';
    if (catEl) catEl.style.display = 'none';
    if (guestEl) guestEl.style.display = 'none';
    if (hostEl) hostEl.style.display = 'none';
    if (aiEl) aiEl.style.display = 'none';

    // Remove active markers on bottom mobile tabs
    document.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));

    if (view === 'guest-dashboard') {
      state.activeView = 'guest-dashboard';
      if (guestEl) guestEl.style.display = 'block';
      if (tab) switchGuestDashboardTab(tab);
      else switchGuestDashboardTab('trips');
      document.getElementById('mobileTabWishlist')?.classList.add(tab === 'wishlist' ? 'active' : '');
      document.getElementById('mobileTabTrips')?.classList.add(tab === 'trips' ? 'active' : '');
      renderGuestDashboard();
    } else if (view === 'host-dashboard') {
      state.activeView = 'host-dashboard';
      if (hostEl) hostEl.style.display = 'block';
      document.getElementById('mobileTabProfile')?.classList.add('active');
      renderHostDashboard();
    } else if (view === 'ai-assistant') {
      state.activeView = 'ai-assistant';
      if (aiEl) aiEl.style.display = 'block';
      document.getElementById('mobileTabAI')?.classList.add('active');
    } else {
      state.activeView = 'explore';
      if (exploreEl) exploreEl.style.display = 'block';
      if (catEl) catEl.style.display = 'block';
      document.getElementById('mobileTabExplore')?.classList.add('active');
      renderExploreSections();
    }
  }

  // ==========================================
  // 1. EXPLORE & CAROUSELS RENDERING
  // ==========================================
  function renderExploreSections() {
    const container = document.getElementById('themedCarouselsContainer');
    if (!container || !window.allListingsData) return;

    // Distribute data logically into themes for startup discovery layout
    const themes = [
      { id: 'near-you', title: 'Popular Near You', data: allListingsData.slice(0, 8) },
      { id: 'weekend', title: 'Weekend Getaways', data: allListingsData.slice(3, 11) },
      { id: 'favorites', title: 'Guest Favorites', data: allListingsData.filter(x => x.price > 1200) },
      { id: 'luxury', title: 'Luxury Stays', data: allListingsData.filter(x => x.price > 1400) },
      { id: 'nature', title: 'Cabins & Nature escapes', data: allListingsData.slice(2, 10) }
    ];

    let html = '';
    themes.forEach(theme => {
      if (theme.data.length === 0) return;
      html += `
        <div class="horizontal-carousel-section mt-4" id="section-${theme.id}">
          <div class="section-header-row">
            <h3 class="section-title-h3">${theme.title}</h3>
            <div class="carousel-nav-arrows">
              <button class="carousel-arrow-btn prev-btn" data-target="carousel-${theme.id}"><i class="fa-solid fa-chevron-left"></i></button>
              <button class="carousel-arrow-btn next-btn" data-target="carousel-${theme.id}"><i class="fa-solid fa-chevron-right"></i></button>
            </div>
          </div>
          <div class="horizontal-scroll-container" id="carousel-${theme.id}">
            ${theme.data.map(listing => renderListingCardMarkup(listing)).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    attachCardEvents();
    setupCarouselScrollArrows();
  }

  function renderListingCardMarkup(listing) {
    const isWishlisted = state.wishlist.includes(listing._id);
    const priceFormatted = listing.price.toLocaleString('en-IN');
    const taxPrice = (listing.price * 1.18).toLocaleString('en-IN');
    const imageUrl = listing.image.url || listing.image;

    return `
      <div class="card-item-col" data-id="${listing._id}">
        <div class="listing-card-modern hover-lift">
          <div class="card-media-slider">
            <a href="/listings/${listing._id}">
              <img src="${imageUrl}" class="img-zoom-child" alt="Listing Stay Image" loading="lazy">
            </a>
            <div class="card-media-overlay-actions">
              <span class="favorite-badge-pill"><i class="fa-solid fa-medal text-danger me-1"></i>Guest Favorite</span>
              <button class="wishlist-heart-btn ${isWishlisted ? 'active' : ''}" data-id="${listing._id}">
                <i class="fa-solid fa-heart"></i>
              </button>
            </div>
          </div>
          <div class="card-details-info">
            <div class="card-details-title-row">
              <div class="card-details-title">${listing.title}</div>
              <div class="card-details-rating">
                <i class="fa-solid fa-star text-danger"></i>
                <span>4.92</span>
              </div>
            </div>
            <div class="card-details-subtitle">${listing.location}, ${listing.country}</div>
            <div class="card-details-price">
              <span class="price-normal"><strong>₹${priceFormatted}</strong> / night</span>
              <span class="price-tax" style="display:none;"><strong>₹${taxPrice}</strong> total after tax</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function attachCardEvents() {
    // Wishlist Toggle Event
    document.querySelectorAll('.wishlist-heart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Verify user login status
        if (!window.currentUserId) {
          showToast('Please log in to add stays to your Wishlist.', 'error');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
          return;
        }

        const id = btn.getAttribute('data-id');

        if (window.currentUserId) {
          fetch(`/listings/${id}/favorite`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          .then(res => {
            if (res.status === 401) {
              showToast('Please log in to add stays to your Wishlist.', 'error');
              setTimeout(() => {
                window.location.href = '/login';
              }, 1000);
              return null;
            }
            if (!res.ok) throw new Error('Failed to update wishlist');
            return res.json();
          })
          .then(data => {
            if (!data) return;
            if (data.success) {
              if (data.action === 'added') {
                if (!state.wishlist.includes(id)) {
                  state.wishlist.push(id);
                }
                btn.classList.add('active');
                showToast('Added stay to Wishlist!', 'success');
              } else {
                let index = state.wishlist.indexOf(id);
                if (index > -1) {
                  state.wishlist.splice(index, 1);
                }
                btn.classList.remove('active');
                showToast('Removed stay from Wishlist', 'info');

                // If in guest-dashboard wishlist view, update DOM immediately
                if (state.activeView === 'guest-dashboard') {
                  const cardItem = btn.closest('.card-item-col');
                  if (cardItem) {
                    cardItem.style.opacity = '0';
                    cardItem.style.transform = 'scale(0.9)';
                    cardItem.style.transition = 'opacity 0.3s, transform 0.3s';
                    setTimeout(() => {
                      cardItem.remove();
                      // Check if wishlist is now empty
                      const wishlistGrid = document.getElementById('guestWishlistGrid');
                      const wishlistEmpty = document.getElementById('guestWishlistEmpty');
                      if (wishlistGrid && wishlistEmpty && window.allListingsData) {
                        const matches = allListingsData.filter(x => state.wishlist.includes(x._id));
                        if (matches.length === 0) {
                          wishlistGrid.style.display = 'none';
                          wishlistEmpty.style.display = 'block';
                        }
                      }
                    }, 300);
                  }
                }
              }
            }
          })
          .catch(err => {
            console.error(err);
            showToast('Error updating wishlist', 'error');
          });
        } else {
          let index = state.wishlist.indexOf(id);
          if (index > -1) {
            state.wishlist.splice(index, 1);
            btn.classList.remove('active');
            showToast('Removed stay from Wishlist', 'info');
          } else {
            state.wishlist.push(id);
            btn.classList.add('active');
            showToast('Added stay to Wishlist!', 'success');
          }
          localStorage.setItem('gaman_wishlist', JSON.stringify(state.wishlist));
        }
      });
    });
  }

  function setupCarouselScrollArrows() {
    document.querySelectorAll('.carousel-arrow-btn').forEach(arrow => {
      arrow.addEventListener('click', () => {
        const targetId = arrow.getAttribute('data-target');
        const container = document.getElementById(targetId);
        if (!container) return;
        const scrollAmount = container.clientWidth * 0.75;
        if (arrow.classList.contains('prev-btn')) {
          container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      });
    });
  }

  // ==========================================
  // 2. SEARCH AND CATEGORIES FILTERS
  // ==========================================
  function setupSearchAndCategories() {
    // Tax switch selector toggler
    const taxSwitch = document.getElementById('taxSwitchCheck');
    if (taxSwitch) {
      taxSwitch.addEventListener('change', () => {
        state.taxShown = taxSwitch.checked;
        document.querySelectorAll('.price-normal').forEach(el => el.style.display = state.taxShown ? 'none' : 'inline');
        document.querySelectorAll('.price-tax').forEach(el => el.style.display = state.taxShown ? 'inline' : 'none');
        showToast(state.taxShown ? 'Showing prices including 18% GST' : 'Showing normal nightly rates');
      });
    }

    // Expand search component logic
    const trigger = document.getElementById('searchPillTrigger');
    const panel = document.getElementById('searchExpandedPanel');
    if (trigger && panel) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
      });
      document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !trigger.contains(e.target)) {
          panel.style.display = 'none';
        }
      });
    }

    // Search destination logic
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const searchInput = document.getElementById('searchInputWhere').value.trim();
        if (!searchInput) return;

        // Perform local filtration
        const matches = allListingsData.filter(x => 
          x.location.toLowerCase().includes(searchInput.toLowerCase()) || 
          x.country.toLowerCase().includes(searchInput.toLowerCase()) ||
          x.title.toLowerCase().includes(searchInput.toLowerCase())
        );

        // Save search query
        state.searches.unshift({ query: searchInput, dates: 'Any Week', guests: '2 guests' });
        if (state.searches.length > 5) state.searches.pop();
        localStorage.setItem('gaman_searches', JSON.stringify(state.searches));

        renderSearchResults(matches, `Stays in "${searchInput}"`);
        if (panel) panel.style.display = 'none';
      });
    }

    // Category Slider click events
    document.querySelectorAll('.category-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        
        const cat = item.getAttribute('data-category');
        if (cat === 'all') {
          document.getElementById('searchResultsSection').style.display = 'none';
          document.getElementById('themedCarouselsContainer').style.display = 'block';
        } else {
          // Filter dynamically based on simulated tags
          const keys = {
            beach: ['beach', 'ocean', 'coast', 'malibu', 'water', 'sand'],
            cabins: ['cabin', 'retreat', 'mountain', 'wood', 'nature', 'forest'],
            camping: ['camp', 'tent', 'dome', 'nature', 'arctic', 'glamping'],
            castles: ['castle', 'historic', 'fort', 'villa', 'mansion'],
            pools: ['pool', 'swim', 'villa', 'modern', 'resort'],
            farms: ['farm', 'rustic', 'cottage', 'pasture', 'countryside'],
            rooms: ['room', 'loft', 'apartment', 'studio', 'bed'],
            luxury: ['villa', 'luxury', 'modern', 'mansion', 'resort']
          };
          const tags = keys[cat] || [cat];
          const matches = allListingsData.filter(x => 
            tags.some(tag => x.title.toLowerCase().includes(tag) || x.description.toLowerCase().includes(tag) || x.location.toLowerCase().includes(tag))
          );
          renderSearchResults(matches, `Curated stays in Category: ${item.querySelector('span').innerText}`);
        }
      });
    });

    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        document.getElementById('searchResultsSection').style.display = 'none';
        document.getElementById('themedCarouselsContainer').style.display = 'block';
        document.querySelector('.category-item[data-category="all"]').click();
      });
    }
  }

  function renderSearchResults(matches, title) {
    const section = document.getElementById('searchResultsSection');
    const grid = document.getElementById('searchResultsGrid');
    const carousels = document.getElementById('themedCarouselsContainer');
    const titleText = document.getElementById('searchResultTitle');
    
    if (!section || !grid || !carousels) return;

    carousels.style.display = 'none';
    section.style.display = 'block';
    titleText.innerText = title;

    if (matches.length === 0) {
      grid.innerHTML = `
        <div class="col-12 py-5 text-center text-muted">
          <i class="fa-solid fa-house-circle-exclamation display-3 mb-3"></i>
          <h5>No matches found</h5>
          <p>Try searching another keyword or clearing your category filters.</p>
        </div>
      `;
    } else {
      grid.innerHTML = matches.map(listing => renderListingCardMarkup(listing)).join('');
      attachCardEvents();
    }
    window.scrollTo({ top: 150, behavior: 'smooth' });
  }

  // ==========================================
  // 3. GUEST DASHBOARD SYSTEM
  // ==========================================
  function switchGuestDashboardTab(tabName) {
    document.querySelectorAll('#guestDashboardTabs .dashboard-nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
    document.querySelectorAll('.dashboard-tab-panel').forEach(panel => {
      panel.style.display = 'none';
    });
    
    const activePanel = document.getElementById(`guestTab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    if (activePanel) activePanel.style.display = 'block';
  }

  function renderGuestDashboard() {
    // Trips
    const tripsGrid = document.getElementById('guestTripsGrid');
    if (tripsGrid) {
      const bookings = state.bookings || [];
      if (bookings.length === 0) {
        tripsGrid.innerHTML = '<div class="col-12 text-center text-muted py-4">No upcoming trips planned.</div>';
      } else {
        tripsGrid.innerHTML = bookings.map((booking) => {
          const item = booking.listing;
          if (!item) return '';
          const checkInDate = new Date(booking.checkIn);
          const checkOutDate = new Date(booking.checkOut);
          const checkInStr = checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const checkOutStr = checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const year = checkInDate.getFullYear();
          const imageUrl = item.image ? (item.image.url || item.image) : '';
          return `
            <div class="col">
              <div class="card border shadow-sm h-100 overflow-hidden flex-row" style="border-radius: var(--radius);">
                <img src="${imageUrl}" style="width: 150px; object-fit: cover;" alt="Stay image">
                <div class="card-body p-3 d-flex flex-column justify-content-between">
                  <div>
                    <div class="badge bg-success mb-2">Confirmed Trip</div>
                    <h6 class="fw-bold mb-1">${item.title}</h6>
                    <p class="text-muted small mb-0"><i class="fa-regular fa-calendar-days me-2"></i>${checkInStr} &ndash; ${checkOutStr}, ${year}</p>
                    <p class="text-muted small mb-0"><i class="fa-solid fa-location-dot me-2"></i>${item.location}</p>
                  </div>
                  <a href="/listings/${item._id}" class="btn btn-outline-dark btn-sm rounded-pill mt-3 align-self-start">Details</a>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Past Stays
    const pastGrid = document.getElementById('guestPastStaysGrid');
    if (pastGrid && window.allListingsData) {
      const list = allListingsData.slice(2, 5);
      pastGrid.innerHTML = list.map((item, idx) => `
        <div class="col">
          <div class="card border-0 shadow-sm h-100" style="border-radius: var(--radius);">
            <img src="${item.image.url || item.image}" class="card-img-top" style="height: 120px; object-fit: cover;" alt="Stay image">
            <div class="card-body p-3">
              <span class="text-muted small">Stayed in May 2026</span>
              <h6 class="fw-bold my-1 text-truncate">${item.title}</h6>
              <div class="d-flex text-warning small gap-1 mb-2">
                <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
              </div>
              <a href="/listings/${item._id}" class="btn btn-light btn-sm w-100 rounded-pill">Write another review</a>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Wishlist Tab
    const wishlistGrid = document.getElementById('guestWishlistGrid');
    const wishlistEmpty = document.getElementById('guestWishlistEmpty');
    if (wishlistGrid && wishlistEmpty && window.allListingsData) {
      const matches = allListingsData.filter(x => state.wishlist.includes(x._id));
      if (matches.length === 0) {
        wishlistGrid.style.display = 'none';
        wishlistEmpty.style.display = 'block';
      } else {
        wishlistGrid.style.display = 'flex';
        wishlistEmpty.style.display = 'none';
        wishlistGrid.innerHTML = matches.map(listing => renderListingCardMarkup(listing)).join('');
        attachCardEvents();
      }
    }

    // Saved Searches
    const searchesList = document.getElementById('guestSavedSearchesList');
    if (searchesList) {
      if (state.searches.length === 0) {
        searchesList.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">No saved search history yet.</td></tr>';
      } else {
        searchesList.innerHTML = state.searches.map((s, idx) => `
          <tr>
            <td><strong>${s.query}</strong></td>
            <td>${s.dates}</td>
            <td>${s.guests}</td>
            <td>
              <button class="btn btn-danger btn-sm rounded-pill search-again-btn" data-query="${s.query}">Search Stays</button>
            </td>
          </tr>
        `).join('');
        document.querySelectorAll('.search-again-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const query = btn.getAttribute('data-query');
            const searchField = document.getElementById('searchInputWhere');
            if (searchField) searchField.value = query;
            window.history.pushState(null, '', '/listings');
            handleUrlRouting();
            setTimeout(() => {
              const form = document.getElementById('searchForm');
              if (form) form.dispatchEvent(new Event('submit'));
            }, 100);
          });
        });
      }
    }
  }

  // ==========================================
  // 4. HOST DASHBOARD SYSTEM
  // ==========================================
  function renderHostDashboard() {
    if (!window.allListingsData) return;

    // Filter properties listed by this owner client-side
    const myProperties = allListingsData.filter(x => x.owner === currentUserId || x.owner._id === currentUserId);
    
    // Fallback display logic for demonstration value
    const finalProps = myProperties.length > 0 ? myProperties : allListingsData.slice(0, 3);
    
    const countEl = document.getElementById('hostStatsCount');
    if (countEl) countEl.innerText = finalProps.length;

    const listContainer = document.getElementById('hostPropertiesList');
    const emptyContainer = document.getElementById('hostPropertiesEmpty');
    
    if (listContainer && emptyContainer) {
      if (finalProps.length === 0) {
        listContainer.parentElement.style.display = 'none';
        emptyContainer.style.display = 'block';
      } else {
        listContainer.parentElement.style.display = 'table';
        emptyContainer.style.display = 'none';
        listContainer.innerHTML = finalProps.map(item => `
          <tr>
            <td><img src="${item.image.url || item.image}" style="width: 54px; height: 54px; border-radius: var(--radius-sm); object-fit: cover;" alt="Stay"></td>
            <td><strong>${item.title}</strong></td>
            <td>${item.location}, ${item.country}</td>
            <td>₹${item.price.toLocaleString('en-IN')} / night</td>
            <td><i class="fa-solid fa-star text-danger me-1"></i>4.92 (${item.reviews ? item.reviews.length : 0})</td>
            <td>
              <div class="d-flex gap-2">
                <a href="/listings/${item._id}/edit" class="btn btn-outline-dark btn-sm rounded-pill"><i class="fa-regular fa-pen-to-square"></i> Edit</a>
                <a href="/listings/${item._id}" class="btn btn-light btn-sm rounded-pill"><i class="fa-regular fa-eye"></i> View</a>
              </div>
            </td>
          </tr>
        `).join('');
      }
    }

    // Render Host SVG Earnings Area Chart
    const graphContainer = document.getElementById('hostEarningsGraph');
    if (graphContainer) {
      graphContainer.innerHTML = `
        <svg viewBox="0 0 500 150" class="w-100 h-100">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#FF385C" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#FF385C" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <!-- Grid lines -->
          <line x1="0" y1="30" x2="500" y2="30" stroke="#f0f0f0" stroke-width="1"/>
          <line x1="0" y1="75" x2="500" y2="75" stroke="#f0f0f0" stroke-width="1"/>
          <line x1="0" y1="120" x2="500" y2="120" stroke="#f0f0f0" stroke-width="1"/>
          
          <!-- Area under line -->
          <path d="M 0 150 L 0 120 Q 80 60 100 85 T 200 40 T 300 70 T 400 30 T 500 20 L 500 150 Z" fill="url(#chartGradient)"/>
          
          <!-- Line plot -->
          <path d="M 0 120 Q 80 60 100 85 T 200 40 T 300 70 T 400 30 T 500 20" fill="none" stroke="#FF385C" stroke-width="3"/>
          
          <!-- Points -->
          <circle cx="100" cy="85" r="4" fill="#FF385C"/>
          <circle cx="200" cy="40" r="4" fill="#FF385C"/>
          <circle cx="300" cy="70" r="4" fill="#FF385C"/>
          <circle cx="400" cy="30" r="4" fill="#FF385C"/>
          <circle cx="500" cy="20" r="4" fill="#FF385C"/>
        </svg>
      `;
    }
  }

  // ==========================================
  // 5. AI TRAVEL ASSISTANT WIDGETS
  // ==========================================
  function setupAITravelAssistant() {
    const generateBtn = document.getElementById('aiPlanItineraryBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        const dest = document.getElementById('aiPlannerDest').value.trim();
        const days = parseInt(document.getElementById('aiPlannerDays').value);
        const budget = document.getElementById('aiPlannerBudget').value;

        if (!dest) {
          showToast('Please enter a destination name', 'error');
          return;
        }

        const spinner = document.getElementById('aiItinerarySpinner');
        const responseCard = document.getElementById('aiItineraryResponse');

        if (spinner && responseCard) {
          responseCard.style.display = 'none';
          spinner.style.display = 'block';

          setTimeout(() => {
            spinner.style.display = 'none';
            responseCard.style.display = 'block';
            renderAIItinerary(dest, days, budget);
            showToast('AI Itinerary generated successfully!', 'success');
          }, 1200);
        }
      });
    }
  }

  function renderAIItinerary(dest, days, budget) {
    const title = document.getElementById('aiItineraryTitle');
    const timeline = document.getElementById('aiItineraryTimeline');
    if (title) title.innerText = `${days}-Day Adventure in ${dest} (${budget.toUpperCase()})`;

    // Generate dynamic itinerary schedule timeline based on days input
    let timelineHTML = '';
    const activities = [
      { t: 'Morning check-in & refreshing breakfast', desc: 'Settle into your boutique stay and sample local pastries nearby.' },
      { t: 'Heritage landmark exploration walking tour', desc: 'Visit historic architecture sites with scenic local guide narratives.' },
      { t: 'Sunset photography & rooftop dining', desc: 'Capture stunning landscapes and dine at top rated neighborhood restaurants.' },
      { t: 'Watersports & shoreline exploration', desc: 'Enjoy ocean kayaking, surfing, or relaxing on sandy beach bars.' },
      { t: 'Culinary cooking masterclass', desc: 'Learn to make local signature dishes from native chefs.' },
      { t: 'Souvenirs craft market shopping', desc: 'Pick up local spices, handicrafts, and artifacts at local markets.' },
      { t: 'Eco trail hikes & waterfall swims', desc: 'Recharge hiking forest paths and swimming in freshwater lagoons.' }
    ];

    for (let i = 1; i <= days; i++) {
      const act1 = activities[(i * 1) % activities.length];
      const act2 = activities[(i * 3) % activities.length];
      timelineHTML += `
        <div class="timeline-event-node">
          <div class="timeline-event-marker"></div>
          <h6 class="fw-bold text-dark">DAY ${i}: Discovery & Adventure</h6>
          <div class="timeline-event-details mb-3">
            <p class="mb-1 text-dark"><strong>9:00 AM</strong> - ${act1.t}</p>
            <span class="text-secondary small mb-3 d-block">${act1.desc}</span>
            <p class="mb-1 text-dark"><strong>4:00 PM</strong> - ${act2.t}</p>
            <span class="text-secondary small mb-0 d-block">${act2.desc}</span>
          </div>
        </div>
      `;
    }
    if (timeline) timeline.innerHTML = timelineHTML;

    // Render Cost Estimator Breakdown
    const costGrid = document.getElementById('aiCostEstimatorGrid');
    if (costGrid) {
      let multiplier = budget === 'luxury' ? 2.5 : (budget === 'moderate' ? 1.5 : 0.8);
      const stayCost = Math.round(5000 * multiplier * days);
      const foodCost = Math.round(1500 * multiplier * days);
      const transportCost = Math.round(1000 * multiplier * days);
      const total = stayCost + foodCost + transportCost;

      costGrid.innerHTML = `
        <h5 class="fw-bold mb-3">Estimated Budget: ₹${total.toLocaleString('en-IN')}</h5>
        <div>
          <div class="d-flex justify-content-between text-dark" style="font-size: 0.8rem;">
            <span>Accommodation Stay</span>
            <span class="fw-bold">₹${stayCost.toLocaleString('en-IN')}</span>
          </div>
          <div class="cost-meter-progress-container">
            <div class="cost-meter-fill bg-danger" style="width: 60%;"></div>
          </div>
        </div>
        <div>
          <div class="d-flex justify-content-between text-dark" style="font-size: 0.8rem;">
            <span>Food & Gourmet</span>
            <span class="fw-bold">₹${foodCost.toLocaleString('en-IN')}</span>
          </div>
          <div class="cost-meter-progress-container">
            <div class="cost-meter-fill bg-dark" style="width: 25%;"></div>
          </div>
        </div>
        <div>
          <div class="d-flex justify-content-between text-dark" style="font-size: 0.8rem;">
            <span>Transit & Touring</span>
            <span class="fw-bold">₹${transportCost.toLocaleString('en-IN')}</span>
          </div>
          <div class="cost-meter-progress-container">
            <div class="cost-meter-fill bg-secondary" style="width: 15%;"></div>
          </div>
        </div>
      `;
    }

    // Render simulated forecast widget
    const weatherContainer = document.getElementById('aiWeatherForecastWidget');
    if (weatherContainer) {
      const temps = budget === 'luxury' ? [32, 28, 30] : [27, 26, 28];
      weatherContainer.innerHTML = `
        <div class="weather-primary-info mb-3">
          <div>
            <h6 class="fw-bold text-dark mb-1">${dest}</h6>
            <p class="text-muted small mb-0">Sunny Skies</p>
          </div>
          <div class="weather-temp-degree">${temps[0]}°C</div>
        </div>
        <div class="weather-3day-forecast-row">
          <div class="forecast-day-box">
            <div class="text-muted small">Day 1</div>
            <i class="fa-solid fa-sun text-warning my-1"></i>
            <div class="text-dark">${temps[0]}°/22°</div>
          </div>
          <div class="forecast-day-box">
            <div class="text-muted small">Day 2</div>
            <i class="fa-solid fa-cloud-sun text-secondary my-1"></i>
            <div class="text-dark">${temps[1]}°/20°</div>
          </div>
          <div class="forecast-day-box">
            <div class="text-muted small">Day 3</div>
            <i class="fa-solid fa-sun text-warning my-1"></i>
            <div class="text-dark">${temps[2]}°/21°</div>
          </div>
        </div>
      `;
    }
  }

  // ==========================================
  // 6. PROPERTY DETAILS PAGE INTERACTIVITY (Show.ejs)
  // ==========================================
  function setupPropertyShowPage() {
    if (!window.listing) return;

    // Calculate dates night rates breakdowns
    const checkIn = document.getElementById('bookingCheckIn');
    const checkOut = document.getElementById('bookingCheckOut');
    const guestsInput = document.getElementById('bookingGuests');

    if (checkIn && checkOut) {
      const calculatePricingBreakdown = () => {
        const d1 = new Date(checkIn.value);
        const d2 = new Date(checkOut.value);
        let diffTime = d2 - d1;
        let nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (nights <= 0) nights = 1;

        // Label update
        const label = document.getElementById('breakdownNightsLabel');
        const nightsVal = document.getElementById('breakdownNightsVal');
        const serviceVal = document.getElementById('breakdownServiceVal');
        const taxVal = document.getElementById('breakdownTaxVal');
        const totalVal = document.getElementById('breakdownTotalVal');
        
        // Widget Cost updates
        const widgetStay = document.getElementById('widgetCostStay');
        const weatherCity = document.getElementById('weatherWidgetCityName');

        const stayTotal = listing.price * nights;
        const serviceTotal = 1200;
        const taxTotal = Math.round(stayTotal * 0.18);
        const grantTotal = stayTotal + serviceTotal + taxTotal;

        if (label) label.innerText = `₹${listing.price.toLocaleString('en-IN')} x ${nights} nights`;
        if (nightsVal) nightsVal.innerText = `₹${stayTotal.toLocaleString('en-IN')}`;
        if (taxVal) taxVal.innerText = `₹${taxTotal.toLocaleString('en-IN')}`;
        if (totalVal) totalVal.innerText = `₹${grantTotal.toLocaleString('en-IN')}`;
        if (widgetStay) widgetStay.innerText = `₹${stayTotal.toLocaleString('en-IN')}`;

        // Update mobile sticky booking bar
        const mobileDateLabel = document.getElementById('mobileBookingDateLabel');
        if (mobileDateLabel) {
          const checkInDateStr = d1.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const checkOutDateStr = d2.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          mobileDateLabel.innerText = `${checkInDateStr} &ndash; ${checkOutDateStr}`;
        }
      };

      checkIn.addEventListener('change', calculatePricingBreakdown);
      checkOut.addEventListener('change', calculatePricingBreakdown);
      calculatePricingBreakdown();
    }

    // Scroll to section shortcuts
    const reviewsTrigger = document.getElementById('reviewsScrollTrigger');
    if (reviewsTrigger) {
      reviewsTrigger.addEventListener('click', () => {
        document.getElementById('reviewsScrollTarget')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
    const locationTrigger = document.getElementById('locationScrollTrigger');
    if (locationTrigger) {
      locationTrigger.addEventListener('click', () => {
        document.getElementById('locationScrollTarget')?.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Review verified text filter list
    const searchReview = document.getElementById('searchReviewInput');
    if (searchReview) {
      searchReview.addEventListener('keyup', () => {
        const query = searchReview.value.toLowerCase().trim();
        document.querySelectorAll('.review-card-element').forEach(card => {
          const text = card.getAttribute('data-comment');
          card.style.display = text.includes(query) ? 'block' : 'none';
        });
      });
    }

    // Photos Gallery Swiper Modal Handlers
    const openBtn = document.getElementById('openGalleryBtn');
    const closeBtn = document.getElementById('closeGalleryBtn');
    const modal = document.getElementById('fullscreenGalleryModal');
    
    // Setup photo slide variables
    const secImages = [
      listing.image.url || listing.image,
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
      "https://images.unsplash.com/photo-1552321554-5fecd8c7856a?w=800&q=80"
    ];
    let galleryIndex = 0;

    const showGallerySlide = (idx) => {
      const img = document.getElementById('galleryModalActiveImg');
      if (img) img.src = secImages[idx];
    };

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        galleryIndex = 0;
        showGallerySlide(galleryIndex);
        modal.style.display = 'flex';
      });
    }

    // Grid images also trigger opening modal at specific index
    for (let i = 0; i < 5; i++) {
      const gridTrigger = document.getElementById(`galleryImgTrigger${i}`);
      if (gridTrigger) {
        gridTrigger.addEventListener('click', () => {
          galleryIndex = i;
          showGallerySlide(galleryIndex);
          modal.style.display = 'flex';
        });
      }
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.style.display = 'none');
    }

    const prevArrow = document.getElementById('prevGalleryBtn');
    const nextArrow = document.getElementById('nextGalleryBtn');

    if (prevArrow) {
      prevArrow.addEventListener('click', () => {
        galleryIndex = (galleryIndex - 1 + secImages.length) % secImages.length;
        showGallerySlide(galleryIndex);
      });
    }
    if (nextArrow) {
      nextArrow.addEventListener('click', () => {
        galleryIndex = (galleryIndex + 1) % secImages.length;
        showGallerySlide(galleryIndex);
      });
    }

    // Weather Forecast City simulator
    const weatherWidgetTemp = document.getElementById('weatherWidgetTemp');
    const weatherWidgetSky = document.getElementById('weatherWidgetSky');
    if (weatherWidgetTemp && weatherWidgetSky) {
      const citySeed = listing.location.toLowerCase();
      let temp = 26;
      let condition = 'Partly Cloudy';
      if (citySeed.includes('goa') || citySeed.includes('beach') || citySeed.includes('malibu')) {
        temp = 31;
        condition = 'Sunny Shores';
      } else if (citySeed.includes('manali') || citySeed.includes('mountain') || citySeed.includes('aspen')) {
        temp = 16;
        condition = 'Cold Breeze';
      }
      weatherWidgetTemp.innerText = `${temp}°C`;
      weatherWidgetSky.innerText = condition;
    }

    // Reserve alerts simulator
    const handleReserveAlert = () => {
      if (!window.currentUserId) {
        showToast('Please log in to reserve a stay.', 'error');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
        return;
      }

      const checkInInput = document.getElementById('bookingCheckIn');
      const checkOutInput = document.getElementById('bookingCheckOut');
      const guestsInput = document.getElementById('bookingGuests');

      const checkIn = checkInInput ? checkInInput.value : '';
      const checkOut = checkOutInput ? checkOutInput.value : '';
      const guests = guestsInput ? parseInt(guestsInput.value) : 1;

      if (!checkIn || !checkOut) {
        showToast('Please select valid check-in and check-out dates.', 'error');
        return;
      }

      // Calculate total price
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      let diffTime = d2 - d1;
      let nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (nights <= 0) nights = 1;
      const stayTotal = listing.price * nights;
      const serviceTotal = 1200;
      const taxTotal = Math.round(stayTotal * 0.18);
      const totalPrice = stayTotal + serviceTotal + taxTotal;

      fetch(`/listings/${listing._id}/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          checkIn,
          checkOut,
          guests,
          totalPrice
        })
      })
      .then(res => {
        if (res.status === 401) {
          showToast('Please log in to reserve stays.', 'error');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
          return null;
        }
        if (!res.ok) throw new Error('Failed to reserve stay');
        return res.json();
      })
      .then(data => {
        if (!data) return;
        if (data.success) {
          showToast('Stay booked successfully!', 'success');
          saveLocalNotification('Stay Booked!', `You have reserved a stay at "${listing.title}" for ${nights} nights.`);
          setTimeout(() => {
            window.location.href = '/listings?view=guest-dashboard&tab=trips';
          }, 1500);
        } else {
          showToast(data.message || 'Error booking stay', 'error');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Error booking stay', 'error');
      });
    };
    document.getElementById('reserveWidgetBtn')?.addEventListener('click', handleReserveAlert);
    document.getElementById('mobileReserveBtn')?.addEventListener('click', handleReserveAlert);
  }

  // ==========================================
  // 7. WIZARD CREATION FORM EXPERIENCE (New.ejs)
  // ==========================================
  function setupWizardForm() {
    const wizardForm = document.querySelector('.needs-validation');
    const panels = document.querySelectorAll('.wizard-form-step-panel');
    const nodes = document.querySelectorAll('.wizard-progress-node');
    const lineFill = document.querySelector('.wizard-progress-line-fill');
    
    const prevBtn = document.getElementById('wizardPrevBtn');
    const nextBtn = document.getElementById('wizardNextBtn');

    if (!wizardForm || panels.length === 0) return;

    let activeStep = 0;

    const updateStep = () => {
      // Show active panel
      panels.forEach((p, idx) => {
        p.classList.toggle('active', idx === activeStep);
      });

      // Update progress nodes
      nodes.forEach((n, idx) => {
        n.classList.toggle('active', idx === activeStep);
        n.classList.toggle('completed', idx < activeStep);
      });

      // Update progress line percentage fill
      const percent = (activeStep / (panels.length - 1)) * 100;
      if (lineFill) lineFill.style.width = `${percent}%`;

      // Update buttons text/visibility
      if (prevBtn) prevBtn.style.visibility = activeStep === 0 ? 'hidden' : 'visible';
      if (nextBtn) {
        if (activeStep === panels.length - 1) {
          nextBtn.innerText = 'Publish Listing';
          nextBtn.classList.add('btn-danger');
        } else {
          nextBtn.innerText = 'Next Step';
          nextBtn.classList.remove('btn-danger');
        }
      }

      // If review step, update fields preview values
      if (activeStep === panels.length - 1) {
        document.getElementById('previewTitleVal').innerText = document.getElementById('title').value || 'My Gaman Stay';
        document.getElementById('previewDescVal').innerText = document.getElementById('description').value || 'Relaxing stay in countryside.';
        document.getElementById('previewPriceVal').innerText = '₹' + (document.getElementById('price').value || '1500') + ' / night';
        document.getElementById('previewLocationVal').innerText = (document.getElementById('location').value || 'Malibu') + ', ' + (document.getElementById('country').value || 'India');
      }
    };

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        // Validate inputs in active panel
        const currentPanelInputs = panels[activeStep].querySelectorAll('input[required], textarea[required]');
        let isValid = true;
        
        currentPanelInputs.forEach(input => {
          if (!input.checkValidity()) {
            input.classList.add('is-invalid');
            isValid = false;
          } else {
            input.classList.remove('is-invalid');
          }
        });

        if (!isValid) {
          showToast('Please verify all required fields are filled correctly', 'error');
          return;
        }

        if (activeStep < panels.length - 1) {
          activeStep++;
          updateStep();
        } else {
          // Submit the actual form
          const offerVal = document.getElementById('listingOffer')?.value.trim();
          const titleVal = document.getElementById('title')?.value.trim() || 'New Stay';
          if (offerVal) {
            saveLocalNotification('New Listing Offer!', `Host offered: "${offerVal}" on listing "${titleVal}"`);
          }
          wizardForm.submit();
        }
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (activeStep > 0) {
          activeStep--;
          updateStep();
        }
      });
    }

    // Custom checkbox card events
    document.querySelectorAll('.amenity-checkbox-card').forEach(card => {
      const checkbox = card.querySelector('input');
      card.addEventListener('click', () => {
        checkbox.checked = !checkbox.checked;
        card.classList.toggle('selected', checkbox.checked);
      });
    });

    // File image preview logic
    const fileInput = document.getElementById('image');
    const previewContainer = document.getElementById('imagePreviewPlaceholder');
    if (fileInput && previewContainer) {
      fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            previewContainer.innerHTML = `
              <img src="${e.target.result}" alt="Listing cover preview">
              <p class="text-success small mt-2">Ready to upload: ${file.name}</p>
            `;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    updateStep();
  }

  // ==========================================
  // 8. INITIALIZE ALL HANDLERS
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    // Scroll window effect on navbar
    window.addEventListener('scroll', () => {
      const nav = document.querySelector('.navbar-airbnb');
      if (nav) {
        if (window.scrollY > 30) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
      }
    });

    // Setup tabs for Guest Dashboard
    document.querySelectorAll('#guestDashboardTabs .dashboard-nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        switchGuestDashboardTab(tab);
      });
    });

    // Setup password toggle triggers
    document.querySelectorAll('.password-eye-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const input = btn.previousElementSibling;
        const icon = btn.querySelector('i');
        if (input.type === 'password') {
          input.type = 'text';
          icon.className = 'fa-regular fa-eye-slash';
        } else {
          input.type = 'password';
          icon.className = 'fa-regular fa-eye';
        }
      });
    });

    // Forgot password transition layout toggle
    const forgotTrigger = document.getElementById('forgotPasswordLink');
    const forgotBack = document.getElementById('backToLoginLink');
    if (forgotTrigger && forgotBack) {
      forgotTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginInputsBlock').style.display = 'none';
        document.getElementById('forgotInputsBlock').style.display = 'block';
        document.getElementById('authCardTitle').innerText = 'Reset Password';
      });
      forgotBack.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginInputsBlock').style.display = 'block';
        document.getElementById('forgotInputsBlock').style.display = 'none';
        document.getElementById('authCardTitle').innerText = 'Welcome Back';
      });
    }

      // Edit form notifications interceptor
      const editForm = document.querySelector('form[action^="/listings/"][action*="?_method=PUT"]');
      if (editForm) {
        editForm.addEventListener('submit', () => {
          const offerVal = document.getElementById('listingOffer')?.value.trim();
          const titleVal = document.getElementById('title')?.value.trim() || 'Stay';
          if (offerVal) {
            saveLocalNotification('Listing Update Offer!', `Host updated stay: "${offerVal}" on listing "${titleVal}"`);
          }
        });
      }

      setupGlobalNotifications();
      handleUrlRouting();
      setupSearchAndCategories();
      setupAITravelAssistant();
      setupPropertyShowPage();
      setupWizardForm();
  });

  // Watch URL back/forward history transitions
  window.addEventListener('popstate', handleUrlRouting);

})();