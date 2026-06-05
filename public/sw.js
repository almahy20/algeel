self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// التعامل مع حدث الاشعارات الفورية (Push Notification API) من الخادم (FCM / VAPID)
// هذا يسمح للموبايل باستلام التنبيه وعرضه حتى ولو كان المتصفح والتطبيق مغلقاً تماماً
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'تنبيه من منصة سكول ماستر', body: event.data.text() };
    }
  }

  const title = data.title || 'إشعار جديد • مدرسة الجيل الجديد';
  const options = {
    body: data.body || 'تحديث جديد بالمنظومة بانتظار مراجعتكم.',
    icon: '/icon-192.png', 
    badge: '/icon-192.png',
    dir: 'rtl',
    lang: 'ar-SA',
    vibrate: [300, 100, 300, 100, 400],
    tag: 'school-notification-tag',
    requireInteraction: true,
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'فتح البوابة المدرسية 🏫' },
      { action: 'close', title: 'تجاهل ❌' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// التعامل مع مؤقتات المراسلة التجريبية (Local Background Alerts Trigger)
// يتيح هذا للمستخدم اختبار استلام الإشعارات في الخلفية بعد إغلاق التطبيق بـ 5-10 ثوانٍ
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_NOTIFICATION') {
    const { title, body, delayMs, url } = event.data;
    
    const notificationOptions = {
      body: body || 'تنبيه اختباري من لوحة إدارة سكول ماستر',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      dir: 'rtl',
      lang: 'ar-SA',
      vibrate: [300, 100, 300, 100, 400],
      tag: 'test-notification-tag',
      data: { url: url || '/' },
      actions: [
        { action: 'open', title: 'فتح البوابة المدرسية 🏫' },
        { action: 'close', title: 'تجاهل ❌' }
      ]
    };

    if (delayMs && delayMs > 0) {
      // تشغيل إشعار مؤجل في الخلفية لضمان عمله بعد إغلاق أو قفل الهاتف المحمول
      setTimeout(() => {
        self.registration.showNotification(title || 'إشعار فوري في الخلفية 📱', notificationOptions);
      }, delayMs);
    } else {
      self.registration.showNotification(title || 'إشعار فوري في الخلفية 📱', notificationOptions);
    }
  }
});

// معالجة الضغط على الإشعار من شريط التنبيهات في الموبايل أو المتصفح
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data ? event.notification.data.url : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // إذا كان هناك نافذة مفتوحة بالفعل للموقع قم بتركيزها (Focus)
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        // وإلا افتح نافذة جديدة فورية متجهة للموقع
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
