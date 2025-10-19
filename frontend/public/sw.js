/* sw.js */

// Mantener una referencia al último payload para depurar
let lastPayload = null;

// Se dispara cuando llega un push (backend envía JSON con title/body/data)
self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    lastPayload = data;

    const title = data.title || 'Nuevo mensaje';
    const body  = data.body  || 'Tienes un nuevo mensaje en RescaTeam 🐾';
    const icon  = '/icons/icon-192.png'; // ajusta a tu ícono
    const badge = '/icons/badge-72.png'; // opcional

    const options = {
      body,
      icon,
      badge,
      data: data.data || {},   // ej: { chatId, fromUser }
      tag: data.data?.chatId,  // agrupa por chat para evitar spam
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[SW] error en push:', err);
  }
});

// Click en la notificación → enfoca o abre la conversación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const chatId = event.notification.data?.chatId;

  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });

    // Si ya hay una pestaña abierta de la app, enfócala y navega al chat
    for (const client of allClients) {
      // Ajusta la condición según tu base path o dominio
      if ('focus' in client) {
        await client.focus();
        if (chatId) {
          // manda un mensaje a la página para que navegue a /chat/:id (tu SPA lo escucha)
          client.postMessage({ type: 'openChat', chatId });
        }
        return;
      }
    }

    // Si no había clientes, abre una nueva pestaña con el chat (o con la app)
    const url = chatId ? `/chat/${chatId}` : '/';
    await clients.openWindow(url);
  })());
});
