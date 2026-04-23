// ============================================================
// SoundManager - Web Audio API による効果音合成
//
// 外部音源ファイル不要。ブラウザ標準APIで全ての音を合成する。
// 教室の環境で動かすことを想定し、ON/OFFと音量を設定可能。
// AudioContext はブラウザの autoplay policy により最初の
// ユーザー操作後にしか音を出せないため、init() を play 時に呼ぶ。
// ============================================================

class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        // 既定値:有効、音量50%
        this.enabled = localStorage.getItem('soundEnabled') !== 'false';
        this.volume = parseInt(localStorage.getItem('soundVolume') || '50') / 100;

        // ティック音の最小間隔(高速回転中の音割れ防止)
        this._lastTickTime = 0;
        this._tickInterval = 0.06;
    }

    init() {
        if (!this.ctx) {
            const Ctor = window.AudioContext || window.webkitAudioContext;
            if (!Ctor) return false;
            this.ctx = new Ctor();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return true;
    }

    /** 設定モーダル保存後の再読み込み */
    refresh() {
        this.enabled = localStorage.getItem('soundEnabled') !== 'false';
        this.volume = parseInt(localStorage.getItem('soundVolume') || '50') / 100;
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    /**
     * 単音再生のヘルパー
     * @param {Object} opts
     * @param {number} opts.freq        - 開始周波数(Hz)
     * @param {number} opts.duration    - 持続時間(秒)
     * @param {string} [opts.type]      - 'sine'|'square'|'triangle'|'sawtooth'
     * @param {number} [opts.startGain] - 開始音量(0〜1)
     * @param {number} [opts.endGain]   - 終了音量(指数減衰)
     * @param {number} [opts.startTime] - 遅延(秒)
     * @param {number} [opts.freqEnd]   - 終了周波数(指定時はスイープ)
     */
    _tone({ freq, duration, type = 'sine', startGain = 0.3, endGain = 0.0001, startTime = 0, freqEnd = null }) {
        if (!this.enabled || !this.init()) return;
        const t0 = this.ctx.currentTime + startTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        if (freqEnd !== null) {
            osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + duration);
        }

        gain.gain.setValueAtTime(startGain, t0);
        gain.gain.exponentialRampToValueAtTime(endGain, t0 + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t0);
        osc.stop(t0 + duration + 0.01);
    }

    /** ノイズバースト(ホワイトノイズ風) */
    _noise({ duration, startGain = 0.2, filterFreq = 1000, startTime = 0 }) {
        if (!this.enabled || !this.init()) return;
        const t0 = this.ctx.currentTime + startTime;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(startGain, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(t0);
        noise.stop(t0 + duration);
    }

    // ─── 効果音ライブラリ ─────────────────────────────────

    /** スロット回転中の「ピッ」(高速で連続呼び出し可) */
    slotTick() {
        if (!this.enabled || !this.init()) return;
        const now = this.ctx.currentTime;
        if (now - this._lastTickTime < this._tickInterval) return;
        this._lastTickTime = now;
        this._tone({ freq: 1200, duration: 0.03, type: 'square', startGain: 0.06 });
    }

    /** スロット停止の「カチッ」 */
    slotStop() {
        this._tone({ freq: 1800, freqEnd: 600, duration: 0.12, type: 'triangle', startGain: 0.25 });
    }

    /** 当選チャイム(C-E-G-C上昇) */
    winChime() {
        if (!this.enabled || !this.init()) return;
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
            this._tone({ freq, duration: 0.25, type: 'sine', startGain: 0.22, startTime: i * 0.07 });
        });
    }

    /** 特別席(前後列)ジャジャーン和音 */
    frontBackChord() {
        if (!this.enabled || !this.init()) return;
        // C5 + E5 + G5 + C6 で華やかに
        [523.25, 659.25, 783.99, 1046.5].forEach(freq => {
            this._tone({ freq, duration: 0.7, type: 'triangle', startGain: 0.18 });
        });
    }

    /** 窓際席シャラララ(高音アルペジオ) */
    windowSparkle() {
        if (!this.enabled || !this.init()) return;
        const notes = [1046.5, 1318.5, 1568, 1975.5, 2349.3];
        notes.forEach((freq, i) => {
            this._tone({ freq, duration: 0.18, type: 'sine', startGain: 0.13, startTime: i * 0.05 });
        });
    }

    /** 運命の再会(キュン♥) */
    reunionChime() {
        if (!this.enabled || !this.init()) return;
        // 上昇音 → ハート拍動風
        this._tone({ freq: 659.25, freqEnd: 1318.5, duration: 0.4, type: 'sine', startGain: 0.28 });
        this._tone({ freq: 880, duration: 0.6, type: 'sine', startGain: 0.2, startTime: 0.4 });
        this._tone({ freq: 1046.5, duration: 0.5, type: 'sine', startGain: 0.18, startTime: 0.45 });
    }

    /** 運命の糸が伸びる音(高めのスイープ) */
    fateLine() {
        this._tone({ freq: 400, freqEnd: 2400, duration: 0.7, type: 'sine', startGain: 0.15 });
    }

    /** 地獄のシャッフル(不吉な低音ゴング+ノイズ) */
    hellGong() {
        if (!this.enabled || !this.init()) return;
        this._tone({ freq: 80, duration: 1.8, type: 'sawtooth', startGain: 0.35 });
        this._tone({ freq: 65, duration: 1.8, type: 'square', startGain: 0.25, startTime: 0.05 });
        this._noise({ duration: 0.8, startGain: 0.15, filterFreq: 400 });
    }

    /** 地獄シャッフル後の余韻(低い不協和音) */
    hellAftermath() {
        if (!this.enabled || !this.init()) return;
        this._tone({ freq: 110, duration: 2.5, type: 'sine', startGain: 0.18 });
        this._tone({ freq: 116, duration: 2.5, type: 'sine', startGain: 0.15, startTime: 0.1 });  // 半音ずれで不協和
    }

    /** ラストワンチャレンジ ファンファーレ(C-E-G-C上昇+ハイC伸ばし) */
    lastOneFanfare() {
        if (!this.enabled || !this.init()) return;
        const seq = [
            { freq: 523.25, dur: 0.18, t: 0 },
            { freq: 659.25, dur: 0.18, t: 0.18 },
            { freq: 783.99, dur: 0.18, t: 0.36 },
            { freq: 1046.5, dur: 0.7,  t: 0.54 },
        ];
        seq.forEach(({ freq, dur, t }) => {
            this._tone({ freq, duration: dur, type: 'triangle', startGain: 0.28, startTime: t });
        });
        // 5度上のハーモニーを重ねて派手に
        this._tone({ freq: 1568, duration: 0.7, type: 'triangle', startGain: 0.18, startTime: 0.54 });
    }

    /** カウントダウンビープ(3,2,1=低、GO!=高) */
    countdownBeep(isFinal = false) {
        if (!this.enabled || !this.init()) return;
        if (isFinal) {
            this._tone({ freq: 1320, duration: 0.4, type: 'square', startGain: 0.35 });
            this._tone({ freq: 1760, duration: 0.4, type: 'triangle', startGain: 0.25, startTime: 0.05 });
        } else {
            this._tone({ freq: 660, duration: 0.18, type: 'square', startGain: 0.25 });
        }
    }

    /** ルーレット(ラストワン)の最終確定 */
    rouletteFinal() {
        if (!this.enabled || !this.init()) return;
        this._tone({ freq: 261.63, duration: 0.8, type: 'triangle', startGain: 0.3 });
        this._tone({ freq: 523.25, duration: 0.8, type: 'triangle', startGain: 0.25 });
        this._tone({ freq: 1046.5, duration: 0.8, type: 'sine', startGain: 0.2, startTime: 0.1 });
    }

    /** 交換イベント(シュッ) */
    exchangeSwoosh() {
        if (!this.enabled || !this.init()) return;
        this._tone({ freq: 200, freqEnd: 2000, duration: 0.35, type: 'sawtooth', startGain: 0.18 });
    }

    /** 完了ファンファーレ(全員配置完了) */
    completionFanfare() {
        if (!this.enabled || !this.init()) return;
        // C, F, G, C のIV-V-Iカデンツ風
        const seq = [
            { freq: 523.25, t: 0 },
            { freq: 698.46, t: 0.15 },
            { freq: 783.99, t: 0.3 },
            { freq: 1046.5, t: 0.45 },
        ];
        seq.forEach(({ freq, t }) => {
            this._tone({ freq, duration: 0.3, type: 'triangle', startGain: 0.25, startTime: t });
        });
        this._tone({ freq: 1568, duration: 1.2, type: 'sine', startGain: 0.2, startTime: 0.45 });
    }
}

// グローバル登録
window.soundManager = new SoundManager();
