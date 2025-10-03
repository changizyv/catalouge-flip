// /js/book.js
// نسخه نهایی: صفحه اول تکی، میانی‌ها دوتایی، آخر تکی (در صورت زوج نبودن، یک خالی در انتها اضافه می‌شود)
// درگ موس/لمس هم با turn('size', ...) بدون transform درست کار می‌کند.

import { CONFIG } from './config.js';
import { debounce, warn, loadJSON } from './utils.js';

export class Book {
  constructor(containerSelector = '#book') {
    this.$book = $(containerSelector);
    this.$stage = $('#stage');
    this.$viewport = $('#viewport');
    this.pageIndicator = $('#page-indicator');
    this.manifest = null;
    this.flipSound = null;
    this.userInteracted = false;

    this.basePageWidth = CONFIG.PAGE_WIDTH;
    this.basePageHeight = CONFIG.PAGE_HEIGHT;
    this.baseBookWidth = CONFIG.DISPLAY === 'double'
      ? this.basePageWidth * 2
      : this.basePageWidth;
  }

  async init() {
    await this._loadManifest();
    this._buildPages();

    // اگر تعداد صفحات «فرد» است، یک صفحهٔ خالی در انتها اضافه کن تا صفحهٔ آخر تکی شود
    const total = this.$book.children('.page').length;
    if (CONFIG.DISPLAY === 'double' && total % 2 === 1) {
      this.$book.append(this._makeBlankPage());
    }

    this._initTurn();
    this._setupScale();
    this._bindControls();
    this._initSound();
    this._updateIndicator();
  }

  async _loadManifest() {
    this.manifest = await loadJSON(CONFIG.MANIFEST_PATH);
    if (!this.manifest) {
      warn('مانیفست بارگذاری نشد؛ از نسخهٔ inline استفاده می‌شود.');
      const inline = document.getElementById('manifest-json');
      this.manifest = inline ? JSON.parse(inline.textContent) : { pages: [] };
    }
  }

  _buildPages() {
    const pages = this.manifest?.pages || [];
    pages.forEach((p) => {
      if (p.template) {
        const tpl = document.getElementById(p.template);
        if (tpl) {
          this.$book.append(tpl.content.cloneNode(true));
          return;
        }
      }
      const $sec = $(`
        <section class="page" data-page="${p.page}">
          <div class="page-inner">
            <header class="page-head"><h2>${p.title || ''}</h2></header>
            <main class="page-body">${p.content ? p.content : ''}</main>
          </div>
        </section>
      `);
      this.$book.append($sec);
    });
  }

  _makeBlankPage() {
    return $(`
      <section class="page" data-page="blank" aria-label="صفحه خالی">
        <div class="page-inner blank"></div>
      </section>
    `);
  }

  _initTurn() {
    // اندازهٔ پایه
    this.$stage.css({ width: `${this.baseBookWidth}px`, height: `${this.basePageHeight}px` });
    this.$book.css({ width: `${this.baseBookWidth}px`, height: `${this.basePageHeight}px` });

    // مقداردهی turn.js — autoCenter: true تا صفحه اول و آخر مطابق الگوی چاپی باشند
    this.$book.turn({
      width: this.baseBookWidth,
      height: this.basePageHeight,
      display: CONFIG.DISPLAY,        // 'double'
      direction: CONFIG.DIRECTION,    // 'rtl' یا 'ltr'
      autoCenter: true,               // ✔ چینش استاندارد: 1 تکی، وسط دوتایی، آخر تکی
      duration: CONFIG.FLIP_DURATION,
      gradients: true,
      elevation: CONFIG.PAGE_SHADOW ? 50 : 0,
      when: {
        turning: () => {
          if (this.flipSound && this.userInteracted) {
            try { this.flipSound.play(); } catch (_) {}
          }
        },
        turned: () => this._updateIndicator()
      }
    });
  }

  _setupScale() {
    // به‌جای transform:scale، اندازهٔ خود کتاب را با API turn تغییر می‌دهیم
    const resize = () => {
      const vw = this.$viewport.innerWidth();
      const vh = this.$viewport.innerHeight();
      const baseW = this.baseBookWidth;
      const baseH = this.basePageHeight;

      const scale = Math.min(vw / baseW, vh / baseH);
      const scaledW = Math.max(1, Math.floor(baseW * scale));
      const scaledH = Math.max(1, Math.floor(baseH * scale));

      this.$book.turn('size', scaledW, scaledH);
      this.$stage.css({ width: `${scaledW}px`, height: `${scaledH}px` });
    };

    resize();
    window.addEventListener('resize', debounce(resize, 100));
    window.addEventListener('orientationchange', debounce(resize, 150));
  }

  _bindControls() {
    $('#btn-prev').on('click', () => this.prev());
    $('#btn-next').on('click', () => this.next());
    $('#btn-fit').on('click', () => this._setupScale());
    $('#btn-fullscreen').on('click', () => {
      import('./utils.js').then(m => m.toggleFullscreen());
    });

    $('body').on('mousedown touchstart keydown', () => (this.userInteracted = true));

    $(document).on('keydown', (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); this.prev(); break;
        case 'ArrowRight':
        case ' ':        e.preventDefault(); this.next(); break;
        case 'Home':     e.preventDefault(); this.goTo(1); break;
        case 'End':      e.preventDefault(); this.goTo(this.totalPages()); break;
      }
    });
  }

  _initSound() {
    if (window.Howl) {
      try {
        this.flipSound = new Howl({
          src: [CONFIG.FLIP_SOUND_SRC],
          preload: true,
          html5: true,
          volume: CONFIG.FLIP_SOUND_VOLUME
        });
      } catch (e) {
        warn('مشکل در بارگذاری صدای ورق‌خوردن', e);
      }
    }
  }

  prev() { this.$book.turn('previous'); }
  next() { this.$book.turn('next'); }
  goTo(n) { this.$book.turn('page', n); }
  totalPages() { return this.$book.turn('pages') || this.$book.children('.page').length; }

  _updateIndicator() {
    const current = this.$book.turn('page') || 1;
    const total = this.totalPages();
    this.pageIndicator.text(`${current} / ${total}`);
  }
}
