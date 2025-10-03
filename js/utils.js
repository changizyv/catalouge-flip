// js/utils.js

/**
 * توابع کمکی عمومی برای پروژه کاتالوگ دیجیتال
 */

/** دی‌بونس — جلوگیری از فراخوانی مکرر تابع */
export function debounce(fn, wait = 100) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/** ورود پیغام هشدار در توسعه */
export function warn(msg, ...args) {
  console.warn(`[Catalog] ${msg}`, ...args);
}

/** بارگذاری JSON از مسیر */
export async function loadJSON(path) {
  try {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (e) {
    warn(`خطا در بارگذاری JSON (${path})`, e);
    return null;
  }
}

/** تمام‌صفحه */
export function toggleFullscreen() {
  const root = document.documentElement;
  if (!document.fullscreenElement) {
    root.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

/** بررسی دستگاه لمسی */
export const isTouch = () =>
  'ontouchstart' in window || navigator.maxTouchPoints > 0;
