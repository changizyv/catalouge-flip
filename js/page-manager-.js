// /js/page-manager.js

/**
 * PageManager — مدیریت بارگذاری و درج صفحات بر اساس مانیفست
 * 
 * وظایف:
 *  - دریافت لیست صفحات از JSON
 *  - ساخت و افزودن صفحات به کتاب
 *  - پشتیبانی از lazy loading (در صورت نیاز)
 */

import { CONFIG } from './config.js';
import { fetchJSON, warn } from './utils.js';

export class PageManager {
  constructor(bookSelector = '#book') {
    this.$book = $(bookSelector);
    this.pages = [];
  }

  async load() {
    // تلاش برای خواندن فایل مانیفست خارجی
    const manifest = await fetchJSON(CONFIG.MANIFEST_PATH);
    if (!manifest) {
      warn('مانیفست پیدا نشد، از نسخه inline استفاده می‌شود.');
      const inline = document.getElementById('manifest-json');
      this.pages = inline ? JSON.parse(inline.textContent).pages || [] : [];
      return;
    }
    this.pages = manifest.pages || [];
  }

  build() {
    if (!this.pages || this.pages.length === 0) {
      warn('هیچ صفحه‌ای در مانیفست وجود ندارد.');
      return;
    }

    this.pages.forEach(page => {
      const section = this._createPageSection(page);
      this.$book.append(section);
    });

    // اگر تعداد صفحات فرد بود و حالت دوصفحه‌ای است یک صفحه خالی اضافه می‌کنیم
    if (CONFIG.DISPLAY === 'double' && this.$book.children('.page').length % 2 !== 0) {
      this.$book.append(this._blankPage());
    }
  }

  _createPageSection(p) {
    // اگر template در HTML موجود است
    if (p.template) {
      const tpl = document.getElementById(p.template);
      if (tpl) {
        return tpl.content.cloneNode(true);
      }
    }

    // صفحه ساده از داده‌های JSON
    const sec = document.createElement('section');
    sec.className = 'page';
    sec.dataset.page = p.page;
    sec.innerHTML = `
      <div class="page-inner">
        <header class="page-head">
          <h2>${p.title || ''}</h2>
        </header>
        <main class="page-body">${p.content || ''}</main>
      </div>
    `;
    return sec;
  }

  _blankPage() {
    const sec = document.createElement('section');
    sec.className = 'page';
    sec.dataset.page = 'blank';
    sec.innerHTML = `<div class="page-inner blank"></div>`;
    return sec;
  }
}
