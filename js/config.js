// /config.js

/**
 * فایل پیکربندی عمومی پروژه کاتالوگ دیجیتال
 * این مقادیر توسط بقیهٔ ماژول‌ها (app.js, book.js و …) استفاده می‌شوند.
 */

export const CONFIG = {
  // ابعاد طراحی هر صفحه (پیکسل)
  PAGE_WIDTH: 1200,
  PAGE_HEIGHT: 1697,

  // حالت نمایش: 'double' برای دوصفحه‌ای، 'single' برای تک صفحه
  DISPLAY: 'double',

  // جهت کتاب: 'rtl' یا 'ltr'
  DIRECTION: 'rtl',

  // مدت انیمیشن ورق‌خوردن (ms)
  FLIP_DURATION: 700,

  // آیا کتاب در وسط صفحه قرار بگیرد؟
  AUTO_CENTER: true,

  // سایه‌ی لبه صفحات
  PAGE_SHADOW: true,

  // مسیر فایل مانیفست صفحات
  MANIFEST_PATH: 'data/manifest-pages.json',

  // مسیر صدای ورق‌خوردن
  FLIP_SOUND_SRC: 'assets/sounds/flip.mp3',

  // حجم صدای ورق‌خوردن
  FLIP_SOUND_VOLUME: 0.25
};
