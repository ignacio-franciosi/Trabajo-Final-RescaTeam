// src/push/pushClient.js
const VAPID_URL = 'http://localhost:8083/api/chat/push/public-key';
const SUB_URL   = 'http://localhost:8083/api/chat/push/subscribe';

// Convierte la public key base64 (VAPID) a UInt8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const b64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(b64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function ensureServiceWorker() {
  if (!('serviceWorker' in navigator)) throw new Error('SW no soportado');
  // registra si no está registrado
  const reg = await navigator.serviceWorker.register('/sw.js');
  // espera a que esté listo para usar pushManager
  return await navigator.serviceWorker.ready;
}

export async function ensurePermission() {
  if (!('Notification' in window)) throw new Error('Notifications no soportado');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Permiso de notificación denegado');
  return perm;
}

async function fetchVapidPublicKey() {
  const res = await fetch(VAPID_URL, { credentials: 'include' });
  const json = await res.json();
  if (!json?.publicKey) throw new Error('No se obtuvo VAPID publicKey');
  return json.publicKey;
}

/**
 * Suscribe el navegador a Web Push y envía la suscripción al backend (autenticada con JWT)
 * - Llamala cuando haya `token`.
 */
export async function subscribePush(token) {
  const reg = await ensureServiceWorker();
  await ensurePermission();

  // Si ya existe una suscripción activa, reusala (evita duplicados del lado del navegador)
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const pubKey = await fetchVapidPublicKey();
    const appServerKey = urlBase64ToUint8Array(pubKey);
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: appServerKey,
    });
  }

  // Enviar al backend con JWT
  const res = await fetch(SUB_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(sub),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Error registrando suscripción: ${res.status} ${text}`);
  }
  return true;
}
