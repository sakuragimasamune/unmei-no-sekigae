// ============================================================
// Service Worker for 座席配置システム
//
// 全ファイルをキャッシュしてオフライン動作を実現する。
// バージョン番号(CACHE_VERSION)を上げると、古いキャッシュは破棄され
// 最新ファイルが取得される。
//
// 配信戦略:cache-first(高速・確実)
// 更新方法:アプリのファイルを変更したらCACHE_VERSIONを上げてpush。
//          ブラウザが次回起動時に新キャッシュを取得する。
// ============================================================

const CACHE_VERSION = 'v2.5.0';
const CACHE_NAME = `seat-app-${CACHE_VERSION}`;

// オフライン時に必要な全ファイル(プリキャッシュ)
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './sound.js',
    './fortune.js',
    './slot.js',
    './print.js',
    './script.js',
    './manifest.json',
    './icon.svg',
];

// ─── インストール時:全ファイルをキャッシュ ──────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] プリキャッシュ開始:', CACHE_VERSION);
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// ─── アクティベート時:古いキャッシュを削除 ──────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((k) => k !== CACHE_NAME)
                    .map((k) => {
                        console.log('[SW] 古いキャッシュ削除:', k);
                        return caches.delete(k);
                    })
            )
        ).then(() => self.clients.claim())
    );
});

// ─── フェッチ時:cache-first戦略 ────────────────────────
self.addEventListener('fetch', (event) => {
    // GET以外、外部URLは素通し
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== location.origin) return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;

            // キャッシュになければネットワークから取得し、後続のためにキャッシュ
            return fetch(event.request).then((response) => {
                if (response && response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            }).catch(() => {
                // ネットワークもダメな場合、ルートのindex.htmlを返してSPAらしく振る舞う
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
