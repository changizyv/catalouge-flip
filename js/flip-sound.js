// /js/flip-sound.js

/**
 * مدیریت افکت صوتی ورق‌خوردن
 * از Howler.js استفاده می‌شود.
 */

import { CONFIG } from './config.js';

export class FlipSound {
  constructor() {
    this.sound = null;
    this.userInteracted = false;
    this._initEvents();
  }

  _initEvents() {
    // برای اجازه پخش صدا در مرورگر، نیاز است کاربر ابتدا تعامل داشته باشد
    const enable = () => {
      this.userInteracted = true;
      document.body.removeEventListener('mousedown', enable);
      document.body.removeEventListener('touchstart', enable);
      document.body.removeEventListener('keydown', enable);
    };
    document.body.addEventListener('mousedown', enable);
    document.body.addEventListener('touchstart', enable);
    document.body.addEventListener('keydown', enable);
  }

  init() {
    if (!window.Howl) {
      console.warn('[FlipSound] Howler.js در دسترس نیست.');
      return;
    }
    try {
      this.sound = new Howl({
        src: [CONFIG.FLIP_SOUND_SRC],
        volume: CONFIG.FLIP_SOUND_VOLUME,
        preload: true,
        html5: true
      });
    } catch (e) {
      console.warn('[FlipSound] مشکل در بارگذاری صدا', e);
    }
  }

  play() {
    if (this.sound && this.userInteracted) {
      try {
        this.sound.play();
      } catch (e) {
        console.warn('[FlipSound] پخش صدا ناموفق بود', e);
      }
    }
  }
}
