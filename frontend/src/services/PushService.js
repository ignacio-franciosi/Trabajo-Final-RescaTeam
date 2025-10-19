import { axiosChat } from './axiosConfigChat';

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export async function initPush(token) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const reg = await navigator.serviceWorker.register('/sw.js');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const { data } = await axiosChat.get('/push/public-key'); // { publicKey }
  const appServerKey = urlBase64ToUint8Array(data.publicKey);

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: appServerKey,
    });
  }

  const body = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))),
      auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')))),
    },
  };

  await axiosChat.post('/api/push/subscribe', body, {
    headers: { Authorization: `Bearer ${token}` },
  });
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
