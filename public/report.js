const statusEl = document.getElementById('status');
const form = document.getElementById('reportForm');
const getLocationBtn = document.getElementById('getLocationBtn');

const latInput = document.getElementById('lat');
const lngInput = document.getElementById('lng');

let reportMap;
let reportMarker;

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function updateMapFromInputs() {
  if (!reportMap) return;
  const lat = toNum(latInput?.value);
  const lng = toNum(lngInput?.value);
  if (lat === null || lng === null) return;

  const ll = [lat, lng];
  if (!reportMarker) {
    reportMarker = L.marker(ll).addTo(reportMap);
  } else {
    reportMarker.setLatLng(ll);
  }
  reportMap.setView(ll, 15);
}

function initMiniMap() {
  const el = document.getElementById('reportMap');
  if (!el || typeof L === 'undefined') return;

  reportMap = L.map('reportMap', { zoomControl: true, attributionControl: false });
  reportMap.setView([20.5937, 78.9629], 4);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
    crossOrigin: true
  }).addTo(reportMap);

  // Handle tile loading errors for mini map
  reportMap.on('tileerror', function(error) {
    console.warn('Mini map tile loading error:', error);
    if (!window.miniMapFallback) {
      window.miniMapFallback = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        crossOrigin: true
      });
      window.miniMapFallback.addTo(reportMap);
    }
  });

  updateMapFromInputs();
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

initMiniMap();

latInput?.addEventListener('input', () => {
  updateMapFromInputs();
});

lngInput?.addEventListener('input', () => {
  updateMapFromInputs();
});

getLocationBtn.addEventListener('click', () => {
  setStatus('Getting location...');
  if (!navigator.geolocation) {
    setStatus('Geolocation not supported in this browser.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      document.getElementById('lat').value = latitude;
      document.getElementById('lng').value = longitude;
      updateMapFromInputs();
      setStatus('Location captured.');
    },
    () => {
      setStatus('Unable to get location. Please allow permission or enter coordinates manually.');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setStatus('Submitting report...');

  const fd = new FormData(form);

  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      body: fd
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(data.error || 'Failed to submit report');
      return;
    }

    setStatus('Submitted successfully. Redirecting to map...');
    setTimeout(() => {
      location.href = 'map.html';
    }, 600);
  } catch {
    setStatus('Network error while submitting.');
  }
});
