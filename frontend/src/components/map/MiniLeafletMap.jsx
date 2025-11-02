import { useEffect, useRef } from 'react';

// We rely on Leaflet via CDN-less ESM import if present, otherwise dynamic import.
// To keep it simple, we'll import from unpkg via dynamic injection only when needed.

export default function MiniLeafletMap({ barrioPoint, userPos, height = '360px', barrioLabel = 'Barrio', userLabel = 'Tu Ubicación' }) {
    const ref = useRef(null);
    const mapRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        async function setup() {
            if (!ref.current || cancelled) return;

            // Load Leaflet lazily and CSS once
            if (!document.getElementById('leaflet-css')) {
                const link = document.createElement('link');
                link.id = 'leaflet-css';
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
                link.crossOrigin = '';
                document.head.appendChild(link);
            }
            const L = await import('https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js').then(m => m.default || m);

            if (cancelled) return;

            // init map
            if (!mapRef.current) {
                mapRef.current = L.map(ref.current, { zoomControl: true });
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors',
                    maxZoom: 19,
                }).addTo(mapRef.current);
            }

            const map = mapRef.current;

            // Clear old markers layer group
            if (!map._markersLayer) {
                map._markersLayer = L.layerGroup().addTo(map);
            } else {
                map._markersLayer.clearLayers();
            }

            const pinIcon = (color) => L.divIcon({
                className: 'pin-icon',
                html: `
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
                                        <defs>
                                            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                                <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="rgba(0,0,0,0.4)" />
                                            </filter>
                                        </defs>
                                        <path filter="url(#shadow)" d="M12 2C8.686 2 6 4.686 6 8c0 4.418 4.5 9.5 5.4 10.5.33.36.87.36 1.2 0C13.5 17.5 18 12.418 18 8c0-3.314-2.686-6-6-6z" fill="${color}" stroke="white" stroke-width="1.2"/>
                                        <circle cx="12" cy="8.2" r="2.4" fill="white"/>
                                    </svg>
                                `,
                iconSize: [28, 28],
                iconAnchor: [14, 26],
                popupAnchor: [0, -26],
            });

            const pts = [];
            if (barrioPoint?.lat && barrioPoint?.lon) {
                const redIcon = pinIcon('#e11d48');
                const title = barrioPoint.name ? `${barrioLabel}: ${barrioPoint.name}` : barrioLabel;
                L.marker([barrioPoint.lat, barrioPoint.lon], { icon: redIcon }).addTo(map._markersLayer).bindPopup(`<strong>${title}</strong>`);
                pts.push([barrioPoint.lat, barrioPoint.lon]);
            }
            if (userPos && userPos.length === 2) {
                const [ulat, ulon] = userPos;
                const blueIcon = pinIcon('#2563eb');
                L.marker([ulat, ulon], { icon: blueIcon }).addTo(map._markersLayer).bindPopup(userLabel);
                pts.push([ulat, ulon]);
            }

            if (pts.length) {
                const bounds = L.latLngBounds(pts);
                map.fitBounds(bounds.pad(0.2));
            } else {
                map.setView([-31.417, -64.183], 12); // Córdoba centro approx
            }
        }

        setup();
        return () => { cancelled = true; };
    }, [barrioPoint?.lat, barrioPoint?.lon, userPos?.[0], userPos?.[1]]);

    return (
        <div className="relative z-0">
            <div>
                <div ref={ref} style={{ width: '100%', height }} />
                <div className="mt-2 text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                            <span style={{ width: 10, height: 10, background: '#2563eb', display: 'inline-block', borderRadius: 999 }} /> {userLabel}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <span style={{ width: 10, height: 10, background: '#e11d48', display: 'inline-block', borderRadius: 999 }} /> {barrioLabel}
                        </span>
                        <span className="opacity-70">Mapa por OpenStreetMap</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
