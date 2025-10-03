// /js/book.js

/**
 * ماژول مدیریت کتاب (ایجاد صفحات، مقداردهی Turn.js، پیمایش)
 * نسخهٔ اصلاح‌شده:
 * - منطق صفحات: صفحهٔ اول تکی + صفحات میانی دوتایی + صفحهٔ آخر تکی
 * - بهبود تعامل: ورق‌زدن با ماوس/لمس روی دسکتاپ با حذف transform-scale
 *   و استفاده از turn('size', ...) برای مقیاس‌دهی
 */

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

    // ابعاد پایه (ثابت) کتاب
    this.basePageWidth = CONFIG.PAGE_WIDTH;
    this.basePageHeight = CONFIG.PAGE_HEIGHT;
    this.baseBookWidth =
      CONFIG.DISPLAY === 'double' ? this.basePageWidth * 2 : this.basePageWidth;
  }

  async init() {
    await this._loadManifest();
    this._buildPages();

    // --- منطق «ابتدا تکی / انتها تکی» ---
    // صفحهٔ اول در turn.js به طور پیش‌فرض تکی است؛ اینجا فقط انتها را تنظیم می‌کنیم.
    const total = this.$book.children('.page').length;
    // اگر تعداد صفحات زوج بود، یک صفحهٔ خالی «انتهای» کتاب اضافه می‌کنیم تا آخر تکی شود.
    if (CONFIG.DISPLAY === 'double' && total % 2 === 0) {
      this.$book.append(this._makeBlankPage());
    }

    this._initTurn();
    this._setupScale();     // بدون transform:scale؛ مقیاس با turn('size', ...) اعمال می‌شود
    this._bindControls();
    this._initSound();
    this._updateIndicator();
  }

  async _loadManifest() {
    this.manifest = await loadJSON(CONFIG.MANIFEST_PATH);
    if (!this.manifest) {
      warn('مانیفست بارگذاری نشد؛ از نمونهٔ موجود در index.html استفاده کنید.');
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
      // درصورت نبود template، یک صفحه ساده با عنوان
      const $sec = $(`
        <section class="page" data-page="${p.page}">
          <div class="page-inner">
            <header class="page-head"><h2>${p.title || ''}</h2></header>
            <main class="page-body"><p>${p.content || ''}</p></main>
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
    // ابعاد پایهٔ کتاب را روی stage و book ست می‌کنیم
    this.$stage.css({
      width: `${this.baseBookWidth}px`,
      height: `${this.basePageHeight}px`
    });

    this.$book.css({
      width: `${this.baseBookWidth}px`,
      height: `${this.basePageHeight}px`
    });

    // مقداردهی turn.js
    this.$book.turn({
      width: this.baseBookWidth,
      height: this.basePageHeight,
      duration: CONFIG.FLIP_DURATION,
      display: CONFIG.DISPLAY,          // 'double'
      direction: CONFIG.DIRECTION,      // 'rtl' یا 'ltr'
      autoCenter: false,                // خودمان مرکز می‌کنیم تا صفحهٔ اول تکی بماند
      gradients: true,
      elevation: CONFIG.PAGE_SHADOW ? 50 : 0,
      // «pages» را turn خودش از DOM حساب می‌کند؛
      // اگر نیاز شد می‌توانیم: pages: this.$book.children('.page').length
      when: {
        turning: () => {
          if (this.flipSound && this.userInteracted) {
            try { this.flipSound.play(); } catch (_) {}
          }
        },
        turned: () => {
          this._centerIfNeeded();
          this._updateIndicator();
        }
      }
    });

    // مرکز چین اولیه
    this._centerIfNeeded();
  }

  _centerIfNeeded() {
    const vpRect = this.$viewport.get(0).getBoundingClientRect();
    const stageRect = this.$stage.get(0).getBoundingClientRect();
    const offsetX = (vpRect.width - stageRect.width) / 2;
    const offsetY = (vpRect.height - stageRect.height) / 2;
    this.$stage.css({
      marginLeft: `${Math.max(0, offsetX)}px`,
      marginTop: `${Math.max(0, offsetY)}px`
    });
  }

  _setupScale() {
    // به جای transform: scale روی کانتینر، اندازهٔ خود turn را تغییر می‌دهیم
    const resize = () => {
      // فضای در دسترس
      const vw = this.$viewport.innerWidth();
      const vh = this.$viewport.innerHeight();

      // ابعاد پایهٔ کتاب
      const baseW = this.baseBookWidth;
      const baseH = this.basePageHeight;

      // نسبت مقیاس
      const scale = Math.min(vw / baseW, vh / baseH);

      const scaledW = Math.max(1, Math.floor(baseW * scale));
      const scaledH = Math.max(1, Math.floor(baseH * scale));

      // تغییر اندازه خود کتاب با API داخلی turn.js
      // این کار باعث می‌شود هندل‌های درگ/لمس دقیق بمانند
      this.$book.turn('size', scaledW, scaledH);

      // stage را نیز هم‌اندازهٔ کتاب کنیم تا مرکزچینی درست شود
      this.$stage.css({ width: `${scaledW}px`, height: `${scaledH}px` });

      // مرکزچینی بعد از تغییر اندازه
      this._centerIfNeeded();
    };

    // اجرای اولیه و رویدادهای تغییر اندازه
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

    // اجازه پخش صدا پس از تعامل
    $('body').on('mousedown touchstart keydown', () => (this.userInteracted = true));

    // کیبورد
    $(document).on('keydown', (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault(); this.prev(); break;
        case 'ArrowRight':
        case ' ':
          e.preventDefault(); this.next(); break;
        case 'Home':
          e.preventDefault(); this.goTo(1); break;
        case 'End':
          e.preventDefault(); this.goTo(this.totalPages()); break;
        case 'f':
        case 'F':
          e.preventDefault();
          import('./utils.js').then(m => m.toggleFullscreen());
          break;
      }
    });

    // نکته: برای کمک به شروعِ ورق با ماوس در گوشه‌ها (اختیاری)
    // می‌توانید از peel استفاده کنید، اما به طور پیش‌فرض turn.js این را مدیریت می‌کند.
    // this.$book.on('mousedown touchstart', '.turn-page', () => {
    //   // this.$book.turn('peel', 'br');
    // });
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

  // --- API عمومی ---
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
