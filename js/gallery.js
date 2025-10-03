// /js/gallery.js

/**
 * گالری تصاویر داخل صفحات
 * - نمایش لایت‌باکس ساده
 * - پشتیبانی از لمس و دکمه‌های بعدی/قبلی
 */

export class Gallery {
  constructor(selector = '[data-gallery]') {
    this.selector = selector;
    this.images = [];
    this.current = 0;
    this.modal = null;
  }

  init() {
    document.querySelectorAll(this.selector).forEach(img => {
      img.addEventListener('click', () => this.open(img));
    });
  }

  open(img) {
    const group = img.getAttribute('data-gallery') || 'default';
    this.images = Array.from(document.querySelectorAll(`${this.selector}[data-gallery="${group}"]`));
    this.current = this.images.indexOf(img);
    this._renderModal();
    this._showImage(this.current);
  }

  _renderModal() {
    if (this.modal) this.modal.remove();

    this.modal = document.createElement('div');
    this.modal.className = 'gallery-modal';
    this.modal.innerHTML = `
      <div class="gallery-backdrop"></div>
      <div class="gallery-content">
        <button class="gallery-prev" aria-label="قبلی">‹</button>
        <img class="gallery-img" alt="">
        <button class="gallery-next" aria-label="بعدی">›</button>
      </div>
      <button class="gallery-close" aria-label="بستن">×</button>
    `;
    document.body.appendChild(this.modal);

    this.modal.querySelector('.gallery-close').onclick = () => this.close();
    this.modal.querySelector('.gallery-backdrop').onclick = () => this.close();
    this.modal.querySelector('.gallery-prev').onclick = () => this.prev();
    this.modal.querySelector('.gallery-next').onclick = () => this.next();

    document.addEventListener('keydown', this._handleKeys);
  }

  _handleKeys = (e) => {
    if (!this.modal) return;
    if (e.key === 'Escape') this.close();
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'ArrowLeft') this.prev();
  };

  _showImage(index) {
    if (!this.modal) return;
    const img = this.images[index];
    const target = this.modal.querySelector('.gallery-img');
    target.src = img.src || img.getAttribute('data-src');
    target.alt = img.alt || '';
  }

  next() {
    if (this.images.length === 0) return;
    this.current = (this.current + 1) % this.images.length;
    this._showImage(this.current);
  }

  prev() {
    if (this.images.length === 0) return;
    this.current = (this.current - 1 + this.images.length) % this.images.length;
    this._showImage(this.current);
  }

  close() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
      document.removeEventListener('keydown', this._handleKeys);
    }
  }
}

/* CSS پیشنهادی برای گالری (به فایل style.css اضافه کنید):
.gallery-modal {
  position: fixed; inset: 0; background: rgba(0,0,0,.7);
  display:flex; justify-content:center; align-items:center; z-index:9999;
}
.gallery-content { position: relative; max-width:90%; max-height:90%; }
.gallery-img { max-width:100%; max-height:100%; border-radius:8px; }
.gallery-prev, .gallery-next {
  position:absolute; top:50%; transform:translateY(-50%);
  background:rgba(0,0,0,.4); border:none; color:#fff; font-size:2rem;
  padding:.25rem .5rem; cursor:pointer;
}
.gallery-prev{ left:-3rem; } .gallery-next{ right:-3rem; }
.gallery-close{
  position:absolute; top:1rem; right:1rem;
  background:rgba(0,0,0,.4); border:none; color:#fff; font-size:2rem;
  padding:.25rem .5rem; cursor:pointer;
}
*/
