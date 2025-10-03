/* app.js — Orchestrator
 * نکات کلیدی پیاده‌سازی:
 * - حفظ ظاهر ثابت با scale-to-fit نسبت به viewport (مطابق معماری پروژه).
 * - نمایش دو صفحه‌ای RTL با Turn.js.
 * - رویدادها: دکمه‌های قبلی/بعدی، کلیدهای کیبورد، تمام‌صفحه، Fit.
 * - افکت صوتی ورق‌خوردن با Howler (اختیاری، اگر فایل صوتی موجود باشد).
 */

// ----- تنظیمات پایه (با داکیومنت هم‌راستا) -----
const CONFIG = {
  baseWidth: 1200,    // عرض طراحی هر صفحه (px)
  baseHeight: 1697,   // ارتفاع طراحی هر صفحه (px)؛ A4 ~= 1.414 نسبت
  display: 'double',  // 'double' یا 'single'
  direction: 'rtl',   // 'rtl' برای فارسی
  pageFlipDuration: 700, // ms
  autoCenter: true,
  pageShadow: true
};

// مسیر پیش‌فرض برای صدای ورق‌خوردن (در صورت موجود بودن)
const FLIP_SOUND_SRC = 'assets/sounds/flip.mp3';

// ----- انتخابگرهای اصلی -----
const $book = $('#book');
const $viewport = $('#viewport');
const $stage = $('#stage');
const $pageIndicator = $('#page-indicator');

const $btnPrev = $('#btn-prev');
const $btnNext = $('#btn-next');
const $btnFit = $('#btn-fit');
const $btnFullscreen = $('#btn-fullscreen');

// ----- وضعیت داخلی -----
let userInteracted = false;
let flipSound = null;

// مرحله: مقداردهی اولیه پس از DOMReady
$(function initApp() {
  // بارگذاری مانفیست از اسکریپت inline یا فایل JSON (بعداً)
  const manifest = loadManifest();

  // ایجاد صفحات بر مبنای templateهای inline (برای دمو)
  buildPagesFromTemplates(manifest.pages);

  // اگر تعداد صفحات فرد بود، یک صفحه خالی اضافه کن تا حالت دوصفحه‌ای درست شود
  if (CONFIG.display === 'double' && $book.children('.page').length % 2 !== 0) {
    $book.append(makeBlankPage());
  }

  // مقداردهی turn.js
  initTurn(manifest);

  // مقیاس‌دهی اولیه و شنونده‌های resize
  updateScale();
  window.addEventListener('resize', debounce(updateScale, 100));
  window.addEventListener('orientationchange', debounce(updateScale, 150));

  // کنترل‌ها
  wireControls();

  // صوت ورق‌خوردن (اختیاری)
  tryInitFlipSound();

  // دسترس‌پذیری اولیه
  updatePageIndicator();
});

// ----- بارگذاری/ساخت صفحات -----
function loadManifest() {
  try {
    const inline = document.getElementById('manifest-json');
    if (inline) {
      const parsed = JSON.parse(inline.textContent);
      if (parsed.display) CONFIG.display = parsed.display;
      if (parsed.direction) CONFIG.direction = parsed.direction;
      return parsed;
    }
  } catch (e) {
    console.warn('Manifest parse failed:', e);
  }
  // fallback
  return { display: CONFIG.display, direction: CONFIG.direction, pages: [] };
}

function buildPagesFromTemplates(pages = []) {
  pages.forEach((p) => {
    const tpl = document.getElementById(p.template);
    if (tpl) {
      const node = tpl.content.cloneNode(true);
      $book.append(node);
    }
  });
}

function makeBlankPage() {
  const $sec = $(`
    <section class="page" data-page="blank" aria-label="صفحه خالی">
      <div class="page-inner blank"></div>
    </section>
  `);
  return $sec;
}

// ----- turn.js -----
function initTurn(manifest) {
  const pageWidth = CONFIG.baseWidth;
  const pageHeight = CONFIG.baseHeight;
  const bookWidth = CONFIG.display === 'double' ? pageWidth * 2 : pageWidth;

  // اعمال ابعاد پایه به stage/book
  $stage.css({
    width: `${bookWidth}px`,
    height: `${pageHeight}px`
  });

  $book.css({
    width: `${bookWidth}px`,
    height: `${pageHeight}px`
  });

  // مقداردهی turn
  $book.turn({
    width: bookWidth,
    height: pageHeight,
    duration: CONFIG.pageFlipDuration,
    display: CONFIG.display,
    direction: CONFIG.direction,
    autoCenter: CONFIG.autoCenter,
    gradients: true,
    elevation: CONFIG.pageShadow ? 50 : 0,
    when: {
      turning: function () {
        if (flipSound && userInteracted) {
          try { flipSound.play(); } catch (_) {}
        }
      },
      turned: function () {
        centerBookIfNeeded();
        updatePageIndicator();
      }
    }
  });

  if (CONFIG.autoCenter) centerBookIfNeeded();
}

function centerBookIfNeeded() {
  // turn.js خودش autoCenter دارد، اما در حالت scale بهتر است container را نیز وسط‌چین کنیم
  const vpRect = $viewport.get(0).getBoundingClientRect();
  const stageRect = $stage.get(0).getBoundingClientRect();
  const offsetX = (vpRect.width - stageRect.width) / 2;
  const offsetY = (vpRect.height - stageRect.height) / 2;
  $stage.css({ marginLeft: `${Math.max(0, offsetX)}px`, marginTop: `${Math.max(0, offsetY)}px` });
}

// ----- مقیاس‌دهی ثابت‌نما -----
function updateScale() {
  const pageWidth = CONFIG.baseWidth;
  const pageHeight = CONFIG.baseHeight;
  const bookWidth = CONFIG.display === 'double' ? pageWidth * 2 : pageWidth;

  const vw = $viewport.innerWidth();
  const vh = $viewport.innerHeight();

  const scale = Math.min(vw / bookWidth, vh / pageHeight);
  $stage.css({
    transform: `scale(${scale})`,
    transformOrigin: 'top center'
  });

  centerBookIfNeeded();
}

// ----- کنترل‌ها و تعامل -----
function wireControls() {
  $btnPrev.on('click', () => goPrev());
  $btnNext.on('click', () => goNext());
  $btnFit.on('click', () => updateScale());
  $btnFullscreen.on('click', () => toggleFullscreen());

  // تعامل کاربر را علامت بزن برای مجاز شدن پخش صدا
  $('body').on('mousedown touchstart keydown', () => (userInteracted = true));

  // کیبورد: Left/Right یا ArrowUp/Down در RTL برعکس عمل می‌کنند؛
  // برای سادگی: ArrowLeft => prev ، ArrowRight => next
  $(document).on('keydown', (e) => {
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault(); goPrev(); break;
      case 'ArrowRight':
      case ' ':
        e.preventDefault(); goNext(); break;
      case 'Home':
        e.preventDefault(); goTo(1); break;
      case 'End':
        e.preventDefault(); goTo($book.turn('pages')); break;
      case 'f':
      case 'F':
        e.preventDefault(); toggleFullscreen(); break;
    }
  });
}

function goPrev() { $book.turn('previous'); }
function goNext() { $book.turn('next'); }
function goTo(n) { $book.turn('page', n); }

function updatePageIndicator() {
  const current = $book.turn('page') || 1;
  const total = $book.turn('pages') || $book.children('.page').length;
  $pageIndicator.text(`${current} / ${total}`);
}

// ----- تمام‌صفحه -----
function toggleFullscreen() {
  const root = document.documentElement;
  if (!document.fullscreenElement) {
    root.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

// ----- صوت ورق‌خوردن -----
function tryInitFlipSound() {
  if (!window.Howl) return;
  try {
    flipSound = new Howl({
      src: [FLIP_SOUND_SRC],
      preload: true,
      html5: true,
      volume: 0.25
    });
  } catch (e) {
    console.warn('Flip sound init failed', e);
  }
}

// ----- ابزارها -----
function debounce(fn, wait = 100) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
