import { axiosChat } from './axiosConfigChat';

// Convierte base64url -> Uint8Array (para applicationServerKey)
function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

// Convierte ArrayBuffer -> base64url (para p256dh y auth)
function bufferToBase64Url(buf) {
  const bytes = new Uint8Array(buf);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  // base64 normal
  let b64 = btoa(str);
  // a base64url
  b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return b64;
}

export async function initPush(token) {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    // registrá el SW (asegurate de tener /public/sw.js)
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready; // por las dudas

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // Trae la VAPID public key (base64url) desde tu backend
    const { data } = await axiosChat.get('/push/public-key'); // { publicKey }
    const appServerKey = urlBase64ToUint8Array(data.publicKey);

    // Suscripción
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      });
    }

    // Serializar keys en base64url (recomendado por compatibilidad)
    const body = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: bufferToBase64Url(sub.getKey('p256dh')),
        auth: bufferToBase64Url(sub.getKey('auth')),
      },
    };

    await axiosChat.post('/api/push/subscribe', body, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    // No bloquees la app por esto, pero dejá el log
    console.warn('[Push] init falló:', err);
  }
}

export async function unsubscribePush(token) {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;

  const endpoint = encodeURIComponent(sub.endpoint);
  await axiosChat.delete(`/api/push/unsubscribe?endpoint=${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  await sub.unsubscribe();
}
