const rowsEl = document.getElementById('rows');
const statusEl = document.getElementById('adminStatus');
const refreshBtn = document.getElementById('refreshBtn');

const overlayToast = document.getElementById('overlayToast');
const overlayOkBtn = document.getElementById('overlayOkBtn');

const loginSection = document.getElementById('loginSection');
const adminContent = document.getElementById('adminContent');
const loginForm = document.getElementById('loginForm');
const loginStatus = document.getElementById('loginStatus');
const logoutBtn = document.getElementById('logoutBtn');

function setLoginStatus(msg) {
  if (!loginStatus) return;
  loginStatus.textContent = msg;
}

function showLogin() {
  if (loginSection) loginSection.style.display = 'block';
  if (adminContent) adminContent.style.display = 'none';
}

function showAdmin() {
  if (loginSection) loginSection.style.display = 'none';
  if (adminContent) adminContent.style.display = 'block';
}

function setStatus(msg) {
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

function badge(status) {
  const s = String(status || 'Pending');
  const cls = s.toLowerCase() === 'resolved' ? 'resolved' : 'pending';
  return `<span class="badge ${cls}">${escapeHtml(s)}</span>`;
}

function showOverlay() {
  if (!overlayToast) return;
  overlayToast.classList.add('show');
}

function hideOverlay() {
  if (!overlayToast) return;
  overlayToast.classList.remove('show');
}

overlayOkBtn?.addEventListener('click', () => {
  hideOverlay();
});

overlayToast?.addEventListener('click', (e) => {
  if (e.target === overlayToast) hideOverlay();
});

async function api(path, options) {
  const res = await fetch(path, { credentials: 'same-origin', ...(options || {}) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function checkAuth() {
  try {
    const me = await api('/api/admin/me');
    if (me && me.authenticated) {
      showAdmin();
      return true;
    }
    showLogin();
    return false;
  } catch {
    showLogin();
    return false;
  }
}

async function load() {
  setStatus('Loading...');
  rowsEl.innerHTML = '';

  try {
    const reports = await api('/api/reports');
    if (!Array.isArray(reports) || reports.length === 0) {
      setStatus('No complaints yet.');
      return;
    }

    for (const r of reports) {
      const tr = document.createElement('tr');

      const isResolved = String(r.status || '').toLowerCase() === 'resolved';
      const resolveBtnHtml = isResolved
        ? ''
        : `<button class="btn" data-action="resolve" data-id="${escapeHtml(r.id)}">Resolve</button>`;

      tr.innerHTML = `
        <td><img class="thumb" src="${escapeHtml(r.imageUrl)}" /></td>
        <td>
          <div style="font-weight: 600; margin-bottom: 6px;">${escapeHtml(r.id)}</div>
          <div style="color:#b9c5e2;">${escapeHtml(r.description || 'No description')}</div>
          <div class="small" style="margin-top: 6px;">${escapeHtml(r.createdAt || '')}</div>
        </td>
        <td>
          <div class="small">Lat: ${escapeHtml(r.lat)}</div>
          <div class="small">Lng: ${escapeHtml(r.lng)}</div>
        </td>
        <td>${badge(r.status)}</td>
        <td>
          <div class="row-actions">
            ${resolveBtnHtml}
            <button class="btn danger" data-action="delete" data-id="${escapeHtml(r.id)}">Delete</button>
          </div>
        </td>
      `;
      rowsEl.appendChild(tr);
    }

    setStatus(`Loaded ${reports.length} complaints.`);
  } catch (e) {
    if (String(e.message || '').toLowerCase().includes('unauthorized')) {
      setStatus('Please login to access admin.');
      showLogin();
      return;
    }
    setStatus(e.message || 'Failed to load complaints');
  }
}

rowsEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const action = btn.getAttribute('data-action');
  const id = btn.getAttribute('data-id');
  if (!action || !id) return;

  try {
    if (action === 'resolve') {
      setStatus('Marking as resolved...');
      await api(`/api/reports/${encodeURIComponent(id)}/resolve`, { method: 'PUT' });
      showOverlay();
      await load();
    }

    if (action === 'delete') {
      const ok = confirm('Delete this complaint permanently?');
      if (!ok) return;
      setStatus('Deleting...');
      await api(`/api/reports/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await load();
    }
  } catch (e2) {
    if (String(e2.message || '').toLowerCase().includes('unauthorized')) {
      setStatus('Please login to perform this action.');
      showLogin();
      return;
    }
    setStatus(e2.message || 'Action failed');
  }
});

refreshBtn?.addEventListener('click', () => {
  load();
});

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  setLoginStatus('Logging in...');

  const fd = new FormData(loginForm);
  const payload = {
    username: String(fd.get('username') || ''),
    password: String(fd.get('password') || '')
  };

  try {
    await api('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setLoginStatus('Login successful.');
    showAdmin();
    await load();
  } catch (err) {
    setLoginStatus(err.message || 'Login failed');
  }
});

logoutBtn?.addEventListener('click', async () => {
  setStatus('Logging out...');
  try {
    await api('/api/admin/logout', { method: 'POST' });
  } catch {
  }
  rowsEl.innerHTML = '';
  setStatus('');
  showLogin();
});

(async () => {
  const ok = await checkAuth();
  if (ok) await load();
})();
