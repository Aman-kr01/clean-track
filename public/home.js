const totalEl = document.getElementById('statTotal');
const resolvedEl = document.getElementById('statResolved');
const pendingEl = document.getElementById('statPending');
const recentEl = document.getElementById('recentReports');
const statusEl = document.getElementById('homeStatus');

function setStatus(msg) {
  if (!statusEl) return;
  statusEl.textContent = msg;
}

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderRecent(reports) {
  if (!recentEl) return;
  recentEl.innerHTML = '';

  const items = reports.slice(0, 6);
  if (items.length === 0) {
    setStatus('No reports yet. Create the first report from the Report page.');
    return;
  }

  for (const r of items) {
    const status = String(r.status || 'Pending');
    const cls = status.toLowerCase() === 'resolved' ? 'resolved' : 'pending';

    const card = document.createElement('a');
    card.className = 'recent-card';
    card.href = 'map.html';
    card.innerHTML = `
      <img class="recent-img" src="${escapeHtml(r.imageUrl)}" alt="Report image" />
      <div class="recent-body">
        <div class="recent-row">
          <span class="badge ${cls}">${escapeHtml(status)}</span>
          <span class="small">${escapeHtml((r.createdAt || '').slice(0, 10))}</span>
        </div>
        <div class="recent-text">${escapeHtml(r.description || 'No description')}</div>
        <div class="small">Lat: ${escapeHtml(r.lat)} | Lng: ${escapeHtml(r.lng)}</div>
      </div>
    `;
    recentEl.appendChild(card);
  }

  setStatus('');
}

async function loadHome() {
  try {
    setStatus('Loading...');
    const res = await fetch('/api/reports');
    const reports = await res.json();

    const list = Array.isArray(reports) ? reports : [];
    const total = list.length;
    const resolved = list.filter((r) => String(r.status || '').toLowerCase() === 'resolved').length;
    const pending = total - resolved;

    if (totalEl) totalEl.textContent = String(total);
    if (resolvedEl) resolvedEl.textContent = String(resolved);
    if (pendingEl) pendingEl.textContent = String(pending);

    renderRecent(list);
  } catch {
    setStatus('Unable to load reports.');
  }
}

loadHome();
