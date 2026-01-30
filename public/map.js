const map = L.map('map', { zoomControl: true });

const defaultCenter = [20.5937, 78.9629];
map.setView(defaultCenter, 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function badgeHtml(status) {
  const s = String(status || 'Pending');
  const cls = s.toLowerCase() === 'resolved' ? 'resolved' : 'pending';
  return `<span class="badge ${cls}">${escapeHtml(s)}</span>`;
}

async function loadReports() {
  const res = await fetch('/api/reports');
  const reports = await res.json();

  if (!Array.isArray(reports)) return;

  const markers = [];

  for (const r of reports) {
    if (!Number.isFinite(r.lat) || !Number.isFinite(r.lng)) continue;

    const popup = `
      <div style="width: 240px;">
        <div style="margin-bottom: 8px;">${badgeHtml(r.status)}</div>
        <div style="margin-bottom: 8px; color: #b9c5e2;">${escapeHtml(r.description || 'No description')}</div>
        <img src="${escapeHtml(r.imageUrl)}" style="width: 100%; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12);" />
        <div style="margin-top: 8px; color: #b9c5e2; font-size: 12px;">${escapeHtml(r.createdAt || '')}</div>
      </div>
    `;

    const m = L.marker([r.lat, r.lng]).addTo(map).bindPopup(popup);
    markers.push(m);
  }

  if (markers.length) {
    const group = new L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.2));
  } else {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.setView([pos.coords.latitude, pos.coords.longitude], 13);
        },
        () => {}
      );
    }
  }
}

loadReports().catch(() => {});
