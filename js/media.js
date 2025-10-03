// /js/media.js

/**
 * مدیریت مدیاهای داخلی صفحات (ویدئو و صوت)
 * - ویدئوها و صوت‌ها با کلیک پخش/توقف می‌شوند
 * - در تغییر صفحه، پخش متوقف می‌گردد
 */

export class MediaManager {
  constructor(bookSelector = '#book') {
    this.book = document.querySelector(bookSelector);
  }

  init() {
    if (!this.book) return;
    this._setupMedia();
    this._stopOnPageChange();
  }

  _setupMedia() {
    this.book.querySelectorAll('video[data-control="custom"]').forEach(video => {
      video.addEventListener('click', () => {
        if (video.paused) video.play(); else video.pause();
      });
    });
    this.book.querySelectorAll('audio[data-control="custom"]').forEach(audio => {
      audio.addEventListener('click', () => {
        if (audio.paused) audio.play(); else audio.pause();
      });
    });
  }

  _stopOnPageChange() {
    if (!window.$ || !window.$.fn.turn) return;
    $('#book').bind('turning', () => {
      this.book.querySelectorAll('video, audio').forEach(el => {
        if (!el.paused) el.pause();
      });
    });
  }
}
