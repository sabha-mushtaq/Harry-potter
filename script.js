// script.js - Tabbed HP UI using hp-api.onrender.com with Pagination
const API = "https://hp-api.onrender.com/api";
const content = document.getElementById("content");
const tabs = Array.from(document.querySelectorAll('.tab'));
const searchInput = document.getElementById('searchInput');
const housesRow = document.getElementById('housesRow');
const houseButtons = Array.from(document.querySelectorAll('.house-btn'));

const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');

let currentTab = 'characters';
let currentData = []; // data for current tab (filtered)
let currentHouse = 'all';
let currentPage = 1;
const itemsPerPage = 12; // Number of items per page

// Create magical particles
function createParticles() {
  const particlesContainer = document.getElementById('particles');
  const particleCount = 50;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    // Random position
    const left = Math.random() * 100;
    const delay = Math.random() * 15;
    const duration = 10 + Math.random() * 10;
    const size = 2 + Math.random() * 4;
    
    particle.style.left = `${left}%`;
    particle.style.animationDelay = `${delay}s`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    // Random color variation
    const hue = 45 + Math.random() * 20; // yellow-gold range
    particle.style.background = `hsl(${hue}, 80%, 60%)`;
    
    particlesContainer.appendChild(particle);
  }
}

// utility: show loader
function showLoader() {
  content.innerHTML = `
    <div class="loader">
      <div class="sparkle"></div>
      <div class="sparkle"></div>
      <div class="sparkle"></div>
      <p>Loading magical content...</p>
    </div>
  `;
}

// utility: fetch with error handling
async function getJSON(url) {
  showLoader();
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json;
  } catch (err) {
    content.innerHTML = `<div class="loader">Failed to fetch: ${err.message}</div>`;
    console.error(err);
    return null;
  }
}

// IMPROVED cleaning: Only filter out truly problematic characters
function cleanCharacters(list) {
  return list.filter(ch => {
    const name = (ch.name || '').trim();
    
    // Only exclude if:
    // 1. Name is completely empty
    // 2. Name is just one character (likely errors)
    // 3. Image is completely missing or broken
    const hasValidName = name.length > 1;
    const hasImage = ch.image && ch.image.length > 10; // More lenient image check
    
    // Keep characters even if they don't have images - we'll show a placeholder
    return hasValidName;
  });
}

// Function to handle missing images
function getCharacterImage(ch) {
  if (ch.image && ch.image.length > 10) {
    return ch.image;
  } else {
    // Return a placeholder image or house-specific placeholder
    return 'images/hogwarts-crest.png'; // Fallback to crest
  }
}

// Pagination functions
function getPaginatedData(data, page = 1, itemsPerPage = 12) {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return data.slice(startIndex, endIndex);
}

function createPagination(totalItems, currentPage, itemsPerPage, container) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) return;
  
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'pagination';
  
  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.className = `pagination-btn ${currentPage === 1 ? 'disabled' : ''}`;
  prevBtn.innerHTML = '← Previous';
  if (currentPage === 1) {
    prevBtn.disabled = true;
  } else {
    prevBtn.addEventListener('click', () => {
      currentPage = currentPage - 1;
      renderCurrentTab(currentData, currentPage);
    });
  }
  paginationContainer.appendChild(prevBtn);
  
  // Page numbers container
  const numbersContainer = document.createElement('div');
  numbersContainer.className = 'pagination-numbers';
  
  // Page numbers logic
  if (totalPages <= 7) {
    // Show all pages for small number of pages
    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `pagination-number ${i === currentPage ? 'active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', () => {
        currentPage = i;
        renderCurrentTab(currentData, currentPage);
      });
      numbersContainer.appendChild(pageBtn);
    }
  } else {
    // Complex pagination for many pages
    if (currentPage <= 3) {
      // Show first 4 pages and last page
      for (let i = 1; i <= 4; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
          currentPage = i;
          renderCurrentTab(currentData, currentPage);
        });
        numbersContainer.appendChild(pageBtn);
      }
      
      const ellipsis = document.createElement('span');
      ellipsis.className = 'pagination-ellipsis';
      ellipsis.textContent = '...';
      numbersContainer.appendChild(ellipsis);
      
      const lastPageBtn = document.createElement('button');
      lastPageBtn.className = 'pagination-number';
      lastPageBtn.textContent = totalPages;
      lastPageBtn.addEventListener('click', () => {
        currentPage = totalPages;
        renderCurrentTab(currentData, currentPage);
      });
      numbersContainer.appendChild(lastPageBtn);
    } else if (currentPage >= totalPages - 2) {
      // Show first page and last 4 pages
      const firstPageBtn = document.createElement('button');
      firstPageBtn.className = 'pagination-number';
      firstPageBtn.textContent = '1';
      firstPageBtn.addEventListener('click', () => {
        currentPage = 1;
        renderCurrentTab(currentData, currentPage);
      });
      numbersContainer.appendChild(firstPageBtn);
      
      const ellipsis = document.createElement('span');
      ellipsis.className = 'pagination-ellipsis';
      ellipsis.textContent = '...';
      numbersContainer.appendChild(ellipsis);
      
      for (let i = totalPages - 3; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
          currentPage = i;
          renderCurrentTab(currentData, currentPage);
        });
        numbersContainer.appendChild(pageBtn);
      }
    } else {
      // Show first page, pages around current, and last page
      const firstPageBtn = document.createElement('button');
      firstPageBtn.className = 'pagination-number';
      firstPageBtn.textContent = '1';
      firstPageBtn.addEventListener('click', () => {
        currentPage = 1;
        renderCurrentTab(currentData, currentPage);
      });
      numbersContainer.appendChild(firstPageBtn);
      
      const ellipsis1 = document.createElement('span');
      ellipsis1.className = 'pagination-ellipsis';
      ellipsis1.textContent = '...';
      numbersContainer.appendChild(ellipsis1);
      
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
          currentPage = i;
          renderCurrentTab(currentData, currentPage);
        });
        numbersContainer.appendChild(pageBtn);
      }
      
      const ellipsis2 = document.createElement('span');
      ellipsis2.className = 'pagination-ellipsis';
      ellipsis2.textContent = '...';
      numbersContainer.appendChild(ellipsis2);
      
      const lastPageBtn = document.createElement('button');
      lastPageBtn.className = 'pagination-number';
      lastPageBtn.textContent = totalPages;
      lastPageBtn.addEventListener('click', () => {
        currentPage = totalPages;
        renderCurrentTab(currentData, currentPage);
      });
      numbersContainer.appendChild(lastPageBtn);
    }
  }
  
  paginationContainer.appendChild(numbersContainer);
  
  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.className = `pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`;
  nextBtn.innerHTML = 'Next →';
  if (currentPage === totalPages) {
    nextBtn.disabled = true;
  } else {
    nextBtn.addEventListener('click', () => {
      currentPage = currentPage + 1;
      renderCurrentTab(currentData, currentPage);
    });
  }
  paginationContainer.appendChild(nextBtn);
  
  // Pagination info
  const infoDiv = document.createElement('div');
  infoDiv.className = 'pagination-info';
  infoDiv.textContent = `Showing ${((currentPage - 1) * itemsPerPage) + 1} - ${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems} characters`;
  
  container.appendChild(paginationContainer);
  container.appendChild(infoDiv);
}

/* RENDERERS */

// characters / students / staff -> card grid with pagination
function renderCharacterGrid(list, page = 1) {
  if (!list || list.length === 0) {
    content.innerHTML = `<div class="loader">No characters found.</div>`;
    return;
  }
  
  const paginatedData = getPaginatedData(list, page, itemsPerPage);
  const grid = document.createElement('div');
  grid.className = 'grid';

  paginatedData.forEach(ch => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img loading="lazy" src="${getCharacterImage(ch)}" alt="${escapeHtml(ch.name)}" 
           onerror="this.src='images/hogwarts-crest.png'">
      <h3>${escapeHtml(ch.name)}</h3>
      <p>${escapeHtml(ch.house || 'No House')}</p>
      ${!ch.image || ch.image.length <= 10 ? '<small style="color: var(--muted); font-size: 12px;">No image available</small>' : ''}
    `;
    card.addEventListener('click', () => openCharacterModal(ch));
    grid.appendChild(card);
  });

  content.innerHTML = '';
  content.appendChild(grid);
  createPagination(list.length, page, itemsPerPage, content);
}

// spells -> list view with pagination
function renderSpells(list, page = 1) {
  if (!list || list.length === 0) {
    content.innerHTML = `<div class="loader">No spells found.</div>`;
    return;
  }
  
  const paginatedData = getPaginatedData(list, page, itemsPerPage);
  const wrap = document.createElement('div');
  wrap.className = 'spells-list';

  paginatedData.forEach(s => {
    const el = document.createElement('div');
    el.className = 'spell';
    el.innerHTML = `<div><div class="name">${escapeHtml(s.name)}</div><div class="desc">${escapeHtml(s.description || '')}</div></div>`;
    wrap.appendChild(el);
  });

  content.innerHTML = '';
  content.appendChild(wrap);
  createPagination(list.length, page, itemsPerPage, content);
}

// houses tab: show sectioned rows for each house or selected house with pagination
function renderHouses(list, page = 1) {
  // if "all" show grouped by house
  const houses = ['Gryffindor','Slytherin','Ravenclaw','Hufflepuff'];
  content.innerHTML = '';
  
  if (currentHouse === 'all') {
    houses.forEach(h => {
      const section = document.createElement('div');
      const heading = document.createElement('h2');
      heading.style.fontFamily = "'Cinzel', serif";
      heading.style.color = '#f6c94b';
      heading.textContent = h;
      section.appendChild(heading);

      const group = list.filter(ch => (ch.house || '').toLowerCase() === h.toLowerCase());
      if (group.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'loader';
        empty.textContent = 'No characters for this house';
        section.appendChild(empty);
      } else {
        const grid = document.createElement('div');
        grid.className = 'grid';
        group.forEach(ch => {
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = `
            <img loading="lazy" src="${getCharacterImage(ch)}" alt="${escapeHtml(ch.name)}"
                 onerror="this.src='images/hogwarts-crest.png'">
            <h3>${escapeHtml(ch.name)}</h3>
            <p>${escapeHtml(ch.house || 'No House')}</p>
            ${!ch.image || ch.image.length <= 10 ? '<small style="color: var(--muted); font-size: 12px;">No image available</small>' : ''}
          `;
          card.addEventListener('click', () => openCharacterModal(ch));
          grid.appendChild(card);
        });
        section.appendChild(grid);
      }
      content.appendChild(section);
    });
  } else {
    // single house view with pagination
    const h = capitalize(currentHouse);
    const heading = document.createElement('h2');
    heading.style.fontFamily = "'Cinzel', serif";
    heading.style.color = '#f6c94b';
    heading.textContent = h;
    content.appendChild(heading);

    const group = list.filter(ch => (ch.house || '').toLowerCase() === currentHouse.toLowerCase());
    const paginatedData = getPaginatedData(group, page, itemsPerPage);
    
    const grid = document.createElement('div');
    grid.className = 'grid';
    paginatedData.forEach(ch => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img loading="lazy" src="${getCharacterImage(ch)}" alt="${escapeHtml(ch.name)}"
             onerror="this.src='images/hogwarts-crest.png'">
        <h3>${escapeHtml(ch.name)}</h3>
        <p>${escapeHtml(ch.house || 'No House')}</p>
        ${!ch.image || ch.image.length <= 10 ? '<small style="color: var(--muted); font-size: 12px;">No image available</small>' : ''}
      `;
      card.addEventListener('click', () => openCharacterModal(ch));
      grid.appendChild(card);
    });
    content.appendChild(grid);
    
    createPagination(group.length, page, itemsPerPage, content);
  }
}

/* MODAL */
function openCharacterModal(ch) {
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');

  const wand = ch.wand ? `${ch.wand.wood || ''} ${ch.wand.core || ''} ${ch.wand.length ? ch.wand.length + ' in' : ''}`.trim() : '—';

  modalBody.innerHTML = `
    <div class="modal-body">
      <img src="${getCharacterImage(ch)}" alt="${escapeHtml(ch.name)}" onerror="this.src='images/hogwarts-crest.png'">
      <div class="modal-info">
        <h2>${escapeHtml(ch.name)}</h2>
        <p><strong>House:</strong> ${escapeHtml(ch.house || 'Unknown')}</p>
        <p><strong>Actor:</strong> ${escapeHtml(ch.actor || '—')}</p>
        <p><strong>Species:</strong> ${escapeHtml(ch.species || '—')}</p>
        <p><strong>Patronus:</strong> ${escapeHtml(ch.patronus || '—')}</p>
        <p><strong>Wand:</strong> ${escapeHtml(wand)}</p>
        <p><strong>Born:</strong> ${escapeHtml(ch.dateOfBirth || (ch.yearOfBirth || '—'))}</p>
        <p style="margin-top:10px;color:var(--muted)"><em>Click outside or ✕ to close</em></p>
      </div>
    </div>
  `;
}
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
function closeModal() {
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

/* TAB HANDLING */
tabs.forEach(btn => btn.addEventListener('click', async (e) => {
  tabs.forEach(t=>t.classList.remove('active'));
  e.currentTarget.classList.add('active');
  currentTab = e.currentTarget.dataset.tab;
  currentPage = 1; // Reset to first page when changing tabs

  // show/hide house controls
  housesRow.style.display = (currentTab === 'houses') ? 'flex' : 'none';
  searchInput.placeholder = (currentTab === 'spells') ? 'Search spells...' : 'Search characters... (e.g. Harry)';

  await loadTab(currentTab);
}));

/* HOUSE BUTTONS */
houseButtons.forEach(b => b.addEventListener('click', async (e) => {
  houseButtons.forEach(x => x.classList.remove('active'));
  e.currentTarget.classList.add('active');
  currentHouse = e.currentTarget.dataset.house;
  currentPage = 1; // Reset to first page when changing houses
  if (currentHouse === 'all') currentHouse = 'all';
  // re-render houses using current data
  renderHouses(currentData, currentPage);
}));

/* SEARCH */
let searchTimeout = null;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => performSearch(e.target.value.trim().toLowerCase()), 200);
});

async function performSearch(query) {
  currentPage = 1; // Reset to first page when searching
  
  if (!query) {
    // reload current tab (or show already fetched data)
    if (currentData && currentData.length) {
      renderCurrentTab(currentData, currentPage);
      return;
    }
  }

  // If searching spells we filter spells; else for characters we fetch and filter
  if (currentTab === 'spells') {
    const spells = await getJSON(`${API}/spells`);
    if (!spells) return;
    const filtered = spells.filter(s => (s.name || '').toLowerCase().includes(query) || (s.description || '').toLowerCase().includes(query));
    renderSpells(filtered, currentPage);
  } else {
    // search characters by name locally if we already have currentData, else fetch all and filter
    if (!currentData || currentData.length === 0) {
      // fetch appropriate endpoint
      await loadTab(currentTab, query);
      return;
    }
    const filtered = currentData.filter(ch => (ch.name || '').toLowerCase().includes(query));
    renderCurrentTab(filtered, currentPage);
  }
}

/* LOAD TAB MAIN */
async function loadTab(tabName, searchQuery = '') {
  showLoader();
  switch (tabName) {
    case 'characters': {
      const url = `${API}/characters`;
      const list = await getJSON(url);
      if (!list) return;
      currentData = cleanCharacters(list);
      console.log(`Loaded ${currentData.length} characters after cleaning`); // Debug log
      if (searchQuery) currentData = currentData.filter(ch => (ch.name||'').toLowerCase().includes(searchQuery));
      renderCharacterGrid(currentData, currentPage);
      break;
    }

    case 'students': {
      const url = `${API}/characters/students`;
      const list = await getJSON(url);
      if (!list) return;
      currentData = cleanCharacters(list);
      console.log(`Loaded ${currentData.length} students after cleaning`); // Debug log
      if (searchQuery) currentData = currentData.filter(ch => (ch.name||'').toLowerCase().includes(searchQuery));
      renderCharacterGrid(currentData, currentPage);
      break;
    }

    case 'staff': {
      const url = `${API}/characters/staff`;
      const list = await getJSON(url);
      if (!list) return;
      currentData = cleanCharacters(list);
      console.log(`Loaded ${currentData.length} staff after cleaning`); // Debug log
      if (searchQuery) currentData = currentData.filter(ch => (ch.name||'').toLowerCase().includes(searchQuery));
      renderCharacterGrid(currentData, currentPage);
      break;
    }

    case 'houses': {
      // load all characters once and subgroup; API offers house-specific route too but grouping gives more control
      const url = `${API}/characters`;
      const list = await getJSON(url);
      if (!list) return;
      currentData = cleanCharacters(list);
      console.log(`Loaded ${currentData.length} characters for houses after cleaning`); // Debug log
      if (searchQuery) currentData = currentData.filter(ch => (ch.name||'').toLowerCase().includes(searchQuery));
      renderHouses(currentData, currentPage);
      break;
    }

    case 'spells': {
      const url = `${API}/spells`;
      const list = await getJSON(url);
      if (!list) return;
      currentData = list; // spells not cleaned the same way
      if (searchQuery) {
        const filtered = list.filter(s => (s.name||'').toLowerCase().includes(searchQuery) || (s.description||'').toLowerCase().includes(searchQuery));
        renderSpells(filtered, currentPage);
      } else {
        renderSpells(list, currentPage);
      }
      break;
    }
    default:
      content.innerHTML = '<div class="loader">Unknown tab</div>';
  }
}

// helper to rerender according to active tab type
function renderCurrentTab(list, page = 1) {
  if (currentTab === 'spells') renderSpells(list, page);
  else if (currentTab === 'houses') renderHouses(list, page);
  else renderCharacterGrid(list, page);
}

/* small helpers */
function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'", '&#39;');
}
function capitalize(s=''){ return s.charAt(0).toUpperCase()+s.slice(1) }

/* initial load */
(async function init(){
  // Create magical particles
  createParticles();
  
  // show houses controls only when houses tab is active
  housesRow.style.display = 'none';
  await loadTab(currentTab);
})();