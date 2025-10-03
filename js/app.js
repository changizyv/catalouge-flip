// /js/app.js
// Orchestrator (ESM): فقط کلاس Book را مقداردهی می‌کند و سپس گالری/مدیا را فعال می‌کند.

import { Book } from './book-.js';
import { Gallery } from './gallery.js';
import { MediaManager } from './media.js';

document.addEventListener('DOMContentLoaded', async () => {
  const book = new Book('#book');
  await book.init();

  // فعال‌سازی گالری و مدیا بعد از ساخته‌شدن صفحات
  const gallery = new Gallery('[data-gallery]');
  gallery.init();

  const media = new MediaManager('#book');
  media.init();
});