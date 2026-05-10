/**
 * cms.js  –  populates Webflow export HTML with data from content/*.json
 * Runs on: index.html, links.html, detail_releases.html
 */
(async function () {
  'use strict';

  // ── Helpers ────────────────────────────────────────────────────────────────
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hideEmpty(el) {
    const sib = el && el.nextElementSibling;
    if (sib && sib.classList.contains('w-dyn-empty')) sib.style.display = 'none';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } catch (_) { return ''; }
  }

  // Service icon map (same order as index.html template buttons)
  const SERVICES_INDEX = [
    { field: 'Deezer URL',       img: 'images/service-image-4.png', alt: 'Deezer' },
    { field: 'Tidal URL',        img: 'images/service-image-5.png', alt: 'Tidal' },
    { field: 'Amazon URL',       img: 'images/service-image-3.png', alt: 'Amazon Music' },
    { field: 'Soundcloud URL',   img: 'images/soundcloud.png',      alt: 'SoundCloud' },
    { field: 'iTunes URL',       img: 'images/service-image-2.png', alt: 'iTunes' },
    { field: 'Apple Music URL',  img: 'images/service-image-1.png', alt: 'Apple Music' },
    { field: 'Bandcamp URL',     img: 'images/bandcamp.png',        alt: 'Bandcamp' },
    { field: 'Spotify URL',      img: 'images/service-image.png',   alt: 'Spotify' },
  ];

  // Service detail map (matches .condition-* classes in detail_releases.html)
  const SERVICES_DETAIL = [
    { field: 'Spotify URL',     cls: 'condition-spotify',    img: 'images/service-image.png',   name: 'Spotify',       cta: 'Listen' },
    { field: 'Bandcamp URL',    cls: 'condition-bandcamp',   img: 'images/bandcamp.png',        name: 'Bandcamp',      cta: 'Buy' },
    { field: 'Soundcloud URL',  cls: 'condition-soundcloud', img: 'images/soundcloud.png',      name: 'Soundcloud',    cta: 'Listen' },
    { field: 'Apple Music URL', cls: 'condition-applemusic', img: 'images/service-image-1.png', name: 'Apple Music',   cta: 'Listen' },
    { field: 'iTunes URL',      cls: 'condition-itunes',     img: 'images/service-image-2.png', name: 'iTunes',        cta: 'Buy' },
    { field: 'Deezer URL',      cls: 'condition-deezer',     img: 'images/service-image-4.png', name: 'Deezer',        cta: 'Listen' },
    { field: 'Amazon URL',      cls: 'condition-amazon',     img: 'images/service-image-3.png', name: 'Amazon Music',  cta: 'Buy' },
    { field: 'Tidal URL',       cls: 'condition-tidal',      img: 'images/service-image-5.png', name: 'Tidal',         cta: 'Listen' },
  ];

  // ── Fetch data ─────────────────────────────────────────────────────────────
  let socialMedia = [], releases = [];
  try {
    [socialMedia, releases] = await Promise.all([
      fetch('content/social-media.json').then(r => r.json()),
      fetch('content/releases.json').then(r => r.json()),
    ]);
  } catch (err) {
    console.error('[cms.js] Could not load content JSON. Did you run "npm run build"?', err);
    return;
  }

  // ── Social media icons (appears in nav + album sections on multiple pages) ──
  document.querySelectorAll('.collection-social-media').forEach(list => {
    list.innerHTML = socialMedia.map(item => `
      <div role="listitem" class="collection-item-social-media w-dyn-item">
        <a href="${esc(item.Url)}" class="button-icon w-inline-block" target="_blank" rel="noopener noreferrer">
          <div class="button-state"></div>
          <img src="${esc(item.icon)}" loading="lazy" alt="${esc(item.Name)}" class="icon-24">
        </a>
      </div>`).join('');
    hideEmpty(list);
  });

  // ── Page detection ─────────────────────────────────────────────────────────
  const onIndex   = !!document.querySelector('.section-release-grid');
  const onLinks   = !!document.querySelector('.link-group');
  const onDetail  = !!document.querySelector('.album-bg');

  // ══════════════════════════════════════════════════════════════════════════
  // INDEX PAGE
  // ══════════════════════════════════════════════════════════════════════════
  if (onIndex) {
    function serviceIconsHTML(release) {
      return SERVICES_INDEX
        .filter(svc => release[svc.field])
        .map(svc => `<a href="${esc(release[svc.field])}" class="streaming-service-button w-inline-block" target="_blank" rel="noopener">
            <img src="${svc.img}" loading="lazy" alt="${svc.alt}" class="icon-32">
          </a>`)
        .join('');
    }

    function releaseCardHTML(release, colClass) {
      const date = formatDate(release['Release Date']) || release.Year || '';
      return `
        <div role="listitem" class="release-grid w-dyn-item ${colClass}">
          <div class="index-release glass">
            <a href="detail_releases.html?slug=${esc(release.Slug)}" class="album-cover-link w-inline-block">
              <img alt="${esc(release.Name)}" loading="lazy" src="${esc(release['Main Cover image'])}" class="album-img">
              <div class="album-meta">
                <h6 class="badge">${esc(release['Release type'] || '')}</h6>
              </div>
            </a>
            <div class="card-bottom-container">
              <h3 class="h3-card">${esc(release.Name)}</h3>
              <div class="streaming-services-container glass">
                ${date ? `<a class="pre-link w-inline-block"><div class="release-date">${esc(date)}</div></a>` : ''}
                ${serviceIconsHTML(release)}
              </div>
            </div>
          </div>
        </div>`;
    }

    const grids = document.querySelectorAll('.section-release-grid');

    // Recent releases (Highlighted = true) – first grid, 6-column cards
    if (grids[0]) {
      const list = grids[0].querySelector('[role="list"]');
      if (list) {
        const highlighted = releases.filter(r => r.Highlighted);
        list.innerHTML = highlighted.map(r => releaseCardHTML(r, 'w-col w-col-6')).join('');
        hideEmpty(list);
      }
    }

    // Previous releases (Highlighted = false) – second grid, 4-column cards
    if (grids[1]) {
      const list = grids[1].querySelector('[role="list"]');
      if (list) {
        const previous = releases.filter(r => !r.Highlighted);
        list.innerHTML = previous.map(r => releaseCardHTML(r, 'w-col w-col-4')).join('');
        hideEmpty(list);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LINKS PAGE
  // ══════════════════════════════════════════════════════════════════════════
  if (onLinks) {
    // Hide the placeholder "links" collection (no matching CSV data)
    document.querySelectorAll('.link-group h1').forEach(h1 => {
      if (/NNNN/i.test(h1.textContent)) {
        h1.style.display = 'none';
        const nextList = h1.nextElementSibling;
        if (nextList) nextList.style.display = 'none';
      }
    });

    // Populate "Recent Releases" list
    document.querySelectorAll('.link-group h1').forEach(h1 => {
      if (h1.textContent.trim() !== 'Recent Releases') return;
      const dynList = h1.nextElementSibling;
      if (!dynList) return;
      const items = dynList.querySelector('[role="list"]');
      const empty = dynList.querySelector('.w-dyn-empty');
      if (!items) return;

      const highlighted = releases.filter(r => r.Highlighted);
      items.innerHTML = highlighted.map(r => `
        <div role="listitem" class="w-dyn-item">
          <a href="detail_releases.html?slug=${esc(r.Slug)}" class="list-link w-inline-block">
            <div class="w-layout-grid grid">
              <div class="link-icon">
                <img loading="lazy" alt="${esc(r.Name)}" src="${esc(r['Main Cover image'])}" class="icon-link-page">
              </div>
              <div class="link-title">
                <p class="link-text">${esc(r.Name)}</p>
                <p class="byline-link-text">${esc(r.Year || '')}</p>
              </div>
            </div>
            <div class="badge">${esc(r['Release type'] || '')}</div>
          </a>
        </div>`).join('');

      if (empty) empty.style.display = 'none';
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETAIL RELEASE PAGE
  // ══════════════════════════════════════════════════════════════════════════
  if (onDetail) {
    const slug    = new URLSearchParams(window.location.search).get('slug');
    const release = slug && releases.find(r => r.Slug === slug);

    if (!release) {
      document.title = 'Release not found – Eli Muro';
      document.querySelector('.album-bg').innerHTML =
        '<p style="padding:4rem;color:#fff;">Release not found. <a href="index.html" style="color:inherit">← back</a></p>';
      return;
    }

    // Webflow marks empty CMS-bound elements with w-dyn-bind-empty (display:none !important).
    // Strip that class now that we have real data to populate them with.
    document.querySelectorAll('.w-dyn-bind-empty').forEach(el => el.classList.remove('w-dyn-bind-empty'));

    // Background image, colour, and text colour
    const albumBg = document.querySelector('.album-bg');
    if (release['Background-image']) albumBg.style.backgroundImage = `url('${release['Background-image']}')`;
    if (release['Primary-colour'])   albumBg.style.backgroundColor = release['Primary-colour'];
    if (release['text colour'])      albumBg.style.color            = release['text colour'];

    // Cover art
    const coverImg = document.querySelector('.album-cover-art img');
    if (coverImg) {
      coverImg.src = release['Main Cover image'] || '';
      coverImg.alt = release.Name;
    }

    // Logo-type (optional)
    const logoImg = document.querySelector('.album-info img.album-logotype');
    if (logoImg) {
      if (release['Logo-type']) {
        logoImg.src = release['Logo-type'];
      } else {
        logoImg.style.display = 'none';
      }
    }

    // Title
    const titleEl = document.querySelector('.album-info h1');
    if (titleEl) titleEl.textContent = release.Name;

    // Info text
    const infoEl = document.querySelector('.text-block-4');
    if (infoEl) infoEl.textContent = release['Info Text'] || '';

    // Page metadata
    document.title = `Eli Muro | ${release.Name}`;
    const setMeta = (sel, val) => document.querySelector(sel)?.setAttribute('content', val);
    setMeta('meta[property="og:title"]',       `Eli Muro | ${release.Name}`);
    setMeta('meta[property="og:image"]',       release['Main Cover image']);
    setMeta('meta[property="og:description"]', release['Info Text']?.slice(0, 160) || 'by Eli Muro');
    setMeta('meta[property="twitter:title"]',  `Eli Muro | ${release.Name}`);
    setMeta('meta[property="twitter:image"]',  release['Main Cover image']);
    setMeta('meta[name="description"]',        release['Info Text']?.slice(0, 160) || 'by Eli Muro');

    // Music video (YouTube)
    const videoDiv = document.querySelector('.release-video');
    if (videoDiv) {
      const yt = release['Music Video'];
      const ytMatch = yt && yt.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
      if (ytMatch) {
        videoDiv.style.display = '';
        videoDiv.innerHTML = `
          <div style="padding-top:56.17%" class="w-embed-youtubevideo youtube">
            <iframe src="https://www.youtube.com/embed/${ytMatch[1]}?rel=0&controls=1&autoplay=0&mute=0"
              frameborder="0"
              style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:auto"
              allow="autoplay; encrypted-media" allowfullscreen
              title="${esc(release.Name)}"></iframe>
          </div>`;
      } else {
        videoDiv.style.display = 'none';
      }
    }

    // Spotify embed
    const spotifyIframe = document.querySelector('.album-embed-spotify iframe');
    if (spotifyIframe) {
      const src = release['Spotify Embed SRC'];
      if (src) {
        spotifyIframe.src = src;
        spotifyIframe.closest('.album-embed').style.display = '';
      } else {
        spotifyIframe.closest('.album-embed').style.display = 'none';
      }
    }

    // SoundCloud embed
    const scIframe = document.querySelector('.album-embed-soundcloud iframe');
    if (scIframe) {
      const src = release['Soundcloud Embed SRC'];
      if (src) {
        scIframe.src = src + '&color=%23ff5500&inverse=false&auto_play=false&show_user=true';
        scIframe.closest('.album-embed').style.display = '';
      } else {
        scIframe.closest('.album-embed').style.display = 'none';
      }
    }

    // Streaming service links (show/hide each .condition-* block)
    SERVICES_DETAIL.forEach(svc => {
      const container = document.querySelector(`.${svc.cls}`);
      if (!container) return;
      const url = release[svc.field];
      if (url) {
        container.querySelector('a').href = url;
        container.style.display = '';
        // Replace all button-text elements with a single, correct CTA label
        const ctaWrapper = container.querySelector('.cta-primary');
        if (ctaWrapper) ctaWrapper.innerHTML = `<div class="button-text">${svc.cta}</div>`;
      } else {
        container.style.display = 'none';
      }
    });

    // Spline / BG embed
    const bgIframe = document.querySelector('.overlay-darken .html-embed iframe');
    const interactionHelper = document.querySelector('.interaction-helper');
    if (bgIframe) {
      if (release['BG embed link']) {
        bgIframe.src = release['BG embed link'];
      } else {
        bgIframe.closest('.overlay-darken').style.display = 'none';
        if (interactionHelper) interactionHelper.style.display = 'none';
      }
    }

    // "More Releases" grid
    const moreList = document.querySelector('.collection-list-3.w-dyn-items');
    if (moreList) {
      const others = releases.filter(r => r.Slug !== slug).slice(0, 6);
      moreList.innerHTML = others.map(r => `
        <div role="listitem" class="release-grid w-dyn-item w-col w-col-4">
          <div class="index-release glass">
            <div class="album-cover-link">
              <a href="detail_releases.html?slug=${esc(r.Slug)}" class="album-cover-link w-inline-block">
                <img alt="${esc(r.Name)}" loading="lazy" src="${esc(r['Main Cover image'])}" class="album-img">
              </a>
              <div class="album-meta">
                <div class="badge">${esc(r['Release type'] || '')}</div>
              </div>
            </div>
            <div class="card-bottom-container">
              <h4>${esc(r.Name)}</h4>
            </div>
          </div>
        </div>`).join('');
      hideEmpty(moreList);
    }
  }

})();
