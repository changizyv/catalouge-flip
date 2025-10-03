// /js/page-manager.js
// نکته: دیگر در این فایل صفحهٔ خالی اضافه نمی‌کنیم. مدیریتِ «آخر تکی» فقط در Book انجام می‌شود.

import { CONFIG } from './config.js';
import { fetchJSON, warn } from './utils.js';

export class PageManager {
  constructor(bookSelector = '#book') {
    this.$book = $(bookSelector);
    this.pages = [];
  }

  async load() {
    const manifest = await fetchJSON(CONFIG.MANIFEST_PATH);
    if (!manifest) {
      warn('مانیفست پیدا نشد، از نسخه inline استفاده می‌شود.');
      const inline = document.getElementById('manifest-json');
      this.pages = inline ? (JSON.parse(inline.textContent).pages || []) : [];
      return;
    }
    this.pages = manifest.pages || [];
  }

  build() {
    if (!this.pages || this.pages.length === 0) {
      warn('هیچ صفحه‌ای در مانیفست وجود ندارد.');
      return;
    }
    this.pages.forEach(p => {
      const sec = this._createPageSection(p);
      this.$book.append(sec);
    });
    // ❌ دیگر اینجا صفحهٔ خالی اضافه نمی‌کنیم؛ Book مسئول آن است.
  }

  _createPageSection(p) {
    if (p.template) {
      const tpl = document.getElementById(p.template);
      if (tpl) return tpl.content.cloneNode(true);
    }
    const sec = document.createElement('section');
    sec.className = 'page';
    sec.dataset.page = p.page;
    sec.innerHTML = `
      <div class="page-inner">
        <header class="page-head"><h2>${p.title || ''}</h2></header>
        <main class="page-body">${p.content || ''}</main>
      </div>
    `;
    return sec;
  }
}
