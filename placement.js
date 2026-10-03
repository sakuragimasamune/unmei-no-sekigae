// ============================================================
// SeatSolver - 配置ソルバー
//
// 抽選・交換・シャッフル・再会・ラストワンなど、席が動く処理は
// すべてここを通して「合法かつ最後まで配置可能な候補」だけを選ぶ。
//
// 不変条件:
//   どの時点でも「残りの生徒を条件どおりに全員座らせる配置」が
//   少なくとも1つ存在する状態を保つ。これにより終盤の詰みが起きない。
//
// 追加ルール(距離ルール)は教員用の非表示パネルで管理する。
//   開閉: Ctrl + Alt + K (Mac は control + option + K)
//   ルールが1件もなければ、従来とまったく同じ挙動になる。
// ============================================================

(function () {
    'use strict';

    // ─── 設定 ────────────────────────────────────────────────
    const STORE_KEY = 'seatApp.uiCache';            // localStorage キー
    const SHORTCUT = { ctrlKey: true, altKey: true, code: 'KeyK' };
    const NODE_LIMIT = 60000;                        // 探索の上限(フリーズ防止)
    const LIMIT = Symbol('limit');

    const RANGE_LABELS = { 1: '周囲8席', 2: '周囲24席' };

    // ─── ルールの保存・読み込み(平文で見えないよう軽く符号化) ─
    function defaultRules() {
        return { enabled: true, includeInExport: false, pairs: [] };
    }
    function encode(obj) {
        return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    }
    function decode(str) {
        return JSON.parse(decodeURIComponent(escape(atob(str))));
    }
    function loadRules() {
        try {
            const raw = localStorage.getItem(STORE_KEY);
            if (!raw) return defaultRules();
            return Object.assign(defaultRules(), decode(raw));
        } catch (e) {
            return defaultRules();
        }
    }
    function saveRules() {
        localStorage.setItem(STORE_KEY, encode(rules));
    }

    let rules = loadRules();

    // ─── 基本ヘルパー ─────────────────────────────────────────
    const key = (s) => `${s.row},${s.col}`;
    const dist = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col));
    const cloneGrid = (g) => g.map(r => r.slice());

    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function genderFits(row, col, student) {
        const g = seatingData.seats[row][col].properties.gender;
        if (!g) return true;
        const sg = student && student.gender;
        return (g === 'male' && sg === '男') || (g === 'female' && sg === '女');
    }

    function isPinned(row, col) {
        return !!seatingData.seats[row][col].properties.pinned;
    }

    function enabledSeats() {
        const out = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (seatingData.seats[r][c].enabled) out.push({ row: r, col: c });
            }
        }
        return out;
    }

    function posMapOf(grid) {
        const pos = {};
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (grid[r][c]) pos[grid[r][c].name] = { row: r, col: c };
            }
        }
        return pos;
    }

    function activePairs(r = rules) {
        if (!r.enabled) return [];
        return r.pairs.filter(p => p.a && p.b && p.a !== p.b);
    }

    function partnerIndex(pairs) {
        const idx = new Map();
        const add = (a, b, range) => {
            if (!idx.has(a)) idx.set(a, []);
            idx.get(a).push({ name: b, range });
        };
        pairs.forEach(p => {
            const range = parseInt(p.range) || 1;
            add(p.a, p.b, range);
            add(p.b, p.a, range);
        });
        return idx;
    }

    function hasRules() {
        return activePairs().length > 0;
    }

    /** 指定の生徒が seat に座ったとき、配置済みの相手と近すぎないか */
    function conflictsAt(name, seat, pos, idx) {
        const ps = idx.get(name);
        if (!ps) return false;
        return ps.some(p => {
            const q = pos[p.name];
            return q && dist(q, seat) <= p.range;
        });
    }

    /** 盤面上で違反しているペア一覧 */
    function violations(grid, pairs) {
        const pos = posMapOf(grid);
        return pairs.filter(p => {
            const a = pos[p.a], b = pos[p.b];
            return a && b && dist(a, b) <= (parseInt(p.range) || 1);
        });
    }

    // ─── 性別だけの数え上げ判定(厳密) ────────────────────────
    // 男子は男子席か指定なし席、女子は女子席か指定なし席、
    // 性別不明は指定なし席のみ。全員座れるかを人数で判定できる。
    function freeFits(students, seats) {
        if (students.length > seats.length) return false;
        let sm = 0, sf = 0, sx = 0;
        seats.forEach(s => {
            const g = seatingData.seats[s.row][s.col].properties.gender;
            if (g === 'male') sm++;
            else if (g === 'female') sf++;
            else sx++;
        });
        let fm = 0, ff = 0, fu = 0;
        students.forEach(s => {
            if (s.gender === '男') fm++;
            else if (s.gender === '女') ff++;
            else fu++;
        });
        return fu + Math.max(0, fm - sm) + Math.max(0, ff - sf) <= sx;
    }

    /** ルールのない生徒をランダムに割り当てる(シャッフル用) */
    function assignFree(free, seats, forbid) {
        for (let attempt = 0; attempt < 40; attempt++) {
            const students = shuffle(free.slice());
            // 性別不明(指定なし席しか座れない)を先に処理
            students.sort((a, b) => {
                const wa = (a.gender === '男' || a.gender === '女') ? 1 : 0;
                const wb = (b.gender === '男' || b.gender === '女') ? 1 : 0;
                return wa - wb;
            });
            let pool = shuffle(seats.slice());
            const result = {};
            let ok = true;
            for (let i = 0; i < students.length; i++) {
                const s = students[i];
                const rest = students.slice(i + 1);
                const pick = pool.find(seat =>
                    genderFits(seat.row, seat.col, s) &&
                    !(forbid && forbid(s, seat)) &&
                    freeFits(rest, pool.filter(x => x !== seat))
                );
                if (!pick) { ok = false; break; }
                result[s.name] = pick;
                pool = pool.filter(x => x !== pick);
            }
            if (ok) return result;
        }
        return null;
    }

    /**
     * 汎用ソルバー
     * @param pos       既に固定されている生徒の位置 { name: {row,col} }
     * @param students  これから座らせる生徒
     * @param seats     使える空席
     * @param idx       ペア索引
     * @param opts      { randomize, needFull, forbid(student, seat) }
     * @returns 割り当て {name: seat} / null(不可能) / LIMIT(打ち切り)
     */
    function solve(pos, students, seats, idx, opts = {}) {
        const hard = students.filter(s => idx.has(s.name));
        const free = students.filter(s => !idx.has(s.name));
        const used = new Set();
        const localPos = Object.assign({}, pos);
        let nodes = 0;

        const allowed = (s) => seats.filter(seat =>
            !used.has(key(seat)) &&
            genderFits(seat.row, seat.col, s) &&
            !(opts.forbid && opts.forbid(s, seat)) &&
            !conflictsAt(s.name, seat, localPos, idx)
        );

        const limit = opts.limit || NODE_LIMIT;
        const rec = (remainingHard) => {
            if (++nodes > limit) return LIMIT;
            const restSeats = seats.filter(s => !used.has(key(s)));
            if (!freeFits(remainingHard.concat(free), restSeats)) return null;

            if (remainingHard.length === 0) {
                if (!opts.needFull) return {};
                return assignFree(free, restSeats, opts.forbid);
            }

            // 最も選択肢の少ない生徒から(MRV)
            let best = null, bestOpts = null;
            for (const s of remainingHard) {
                const o = allowed(s);
                if (o.length === 0) return null;
                if (!best || o.length < bestOpts.length) { best = s; bestOpts = o; }
            }
            const order = opts.randomize ? shuffle(bestOpts.slice()) : bestOpts;
            const rest = remainingHard.filter(s => s !== best);

            for (const seat of order) {
                used.add(key(seat));
                localPos[best.name] = seat;
                const r = rec(rest);
                if (r === LIMIT) return LIMIT;
                if (r) { r[best.name] = seat; return r; }
                used.delete(key(seat));
                delete localPos[best.name];
            }
            return null;
        };

        return rec(hard);
    }

    /**
     * この盤面から残り全員を条件どおり座らせる配置を探す
     * @returns { status: 'ok', sol } 完成例あり(sol はペア対象生徒の席)
     *          { status: 'skip' }     生徒数>席数の構成(全員配置が前提でない)
     *          { status: 'none' }     不可能 / 打ち切り
     */
    function completion(grid, pairs, limit) {
        const idx = partnerIndex(pairs);
        const pos = posMapOf(grid);
        const remaining = seatingData.roster.filter(s => !pos[s.name]);
        const empty = enabledSeats().filter(s => !grid[s.row][s.col]);
        if (remaining.length > empty.length) return { status: 'skip' };
        const res = solve(pos, remaining, empty, idx, { needFull: false, limit });
        if (res && res !== LIMIT) return { status: 'ok', sol: res };
        return { status: 'none', limited: res === LIMIT };
    }

    /** 完成例が実際に見つかったときだけ true(打ち切りは不可扱い=安全側) */
    function canComplete(grid, pairs, limit) {
        const r = completion(grid, pairs, limit);
        return r.status === 'ok' || r.status === 'skip';
    }

    /** 盤面が(違反なし)かつ(完成可能)か */
    function gridOK(grid, pairs = activePairs()) {
        if (pairs.length === 0) return true;
        // すでに存在する違反(指定席同士など動かせないもの)は不問、新しい違反だけを禁止
        const existing = new Set(violations(seatingData.assignments, pairs));
        if (violations(grid, pairs).some(p => !existing.has(p))) return false;
        return canComplete(grid, pairs);
    }

    // ============================================================
    // 公開API
    // ============================================================

    /**
     * 抽選で選ばれた生徒が座れる席の候補
     * 1. 条件を満たし、最後まで配置可能な席
     * 2. (すでに詰んでいる場合の保険)近すぎないだけの席
     * 3. 性別だけ合う席
     */
    function candidateSeatsFor(student) {
        const A = seatingData.assignments;
        const empty = enabledSeats().filter(s =>
            !A[s.row][s.col] && genderFits(s.row, s.col, student)
        );
        if (!hasRules()) return empty;

        const pairs = activePairs();
        const idx = partnerIndex(pairs);
        const pos = posMapOf(A);

        const local = empty.filter(s => !conflictsAt(student.name, s, pos, idx));

        // 現在の盤面の完成例(witness)。これと矛盾しない席は探索なしで「可」と分かる
        const base = completion(A, pairs);
        if (base.status === 'skip') return local.length ? local : empty;

        let consistent = () => false;
        if (base.status === 'ok') {
            const hardSeats = new Set(Object.values(base.sol).map(key));
            if (idx.has(student.name)) {
                const w = base.sol[student.name];
                consistent = (s) => w && key(w) === key(s);
            } else {
                const remainingFree = seatingData.roster.filter(x =>
                    !pos[x.name] && !idx.has(x.name) && x.name !== student.name);
                consistent = (s) => {
                    if (hardSeats.has(key(s))) return false;
                    const rest = enabledSeats().filter(x =>
                        !A[x.row][x.col] && !hardSeats.has(key(x)) && key(x) !== key(s));
                    return freeFits(remainingFree, rest);
                };
            }
        }

        const strict = local.filter(s => {
            if (consistent(s)) return true;
            const g = cloneGrid(A);
            g[s.row][s.col] = student;
            return canComplete(g, pairs, 15000);
        });
        if (strict.length) return strict;
        // ここから下は「すでに詰んでいる」場合の保険(通常は到達しない)
        if (local.length) return local;
        return empty;
    }

    /** ラストワンチャレンジで奪ってよい席 */
    function stealTargets(lastName) {
        const A = seatingData.assignments;
        const last = seatingData.roster.find(s => s.name === lastName);
        if (!last) return [];
        const empty = enabledSeats().filter(s => !A[s.row][s.col]);
        if (empty.length !== 1) return [];
        const E = empty[0];
        const pairs = activePairs();

        const out = [];
        enabledSeats().forEach(X => {
            const victim = A[X.row][X.col];
            if (!victim || isPinned(X.row, X.col)) return;
            if (!genderFits(X.row, X.col, last)) return;
            if (!genderFits(E.row, E.col, victim)) return;
            if (pairs.length) {
                const g = cloneGrid(A);
                g[X.row][X.col] = last;
                g[E.row][E.col] = victim;
                const existing = new Set(violations(A, pairs));
                if (violations(g, pairs).some(p => !existing.has(p))) return;
            }
            out.push(X);
        });
        return out;
    }

    /** 2席の入れ替え(交換イベント・ドラッグ)が許されるか */
    function swapAllowed(r1, c1, r2, c2) {
        if (isPinned(r1, c1) || isPinned(r2, c2)) return false;
        const A = seatingData.assignments;
        if (A[r1][c1] && !genderFits(r2, c2, A[r1][c1])) return false;
        if (A[r2][c2] && !genderFits(r1, c1, A[r2][c2])) return false;
        if (!hasRules()) return true;
        const g = cloneGrid(A);
        [g[r1][c1], g[r2][c2]] = [g[r2][c2], g[r1][c1]];
        return gridOK(g);
    }

    /** 運命の再会:partner を target に座らせ、overridden を押し出してよいか */
    function reunionAllowed(partner, target, overridden) {
        if (isPinned(target.row, target.col)) return false;
        if (!hasRules()) return true;
        const g = cloneGrid(seatingData.assignments);
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (g[r][c] && g[r][c].name === partner.name) g[r][c] = null;
            }
        }
        g[target.row][target.col] = partner;   // overridden はここで上書き=プールへ戻る
        return gridOK(g);
    }

    /**
     * 地獄のシャッフル用:新しい盤面を作る
     * - 指定席の生徒は動かさない
     * - 元の席には戻さない(無理なら緩める)
     * - 未配置の生徒も含めて解き、最後まで配置可能な形を保証
     */
    function buildShuffledGrid() {
        const A = seatingData.assignments;
        const base = createEmptyAssignments();
        const original = {};
        const placed = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const s = A[r][c];
                if (!s) continue;
                if (isPinned(r, c)) {
                    base[r][c] = s;
                } else {
                    placed.push(s);
                    original[s.name] = { row: r, col: c };
                }
            }
        }
        const pinnedPos = posMapOf(base);
        const unplaced = seatingData.roster.filter(s => !posMapOf(A)[s.name]);
        const seats = enabledSeats().filter(s => !isPinned(s.row, s.col));
        const include = placed.length + unplaced.length <= seats.length ? unplaced : [];
        const students = placed.concat(include);
        const idx = partnerIndex(activePairs());

        for (const avoidOriginal of [true, false]) {
            const forbid = avoidOriginal
                ? (s, seat) => original[s.name] && original[s.name].row === seat.row && original[s.name].col === seat.col
                : null;
            for (let attempt = 0; attempt < 5; attempt++) {
                const res = solve(pinnedPos, students, seats, idx, { randomize: true, needFull: true, forbid });
                if (res && res !== LIMIT) {
                    const g = cloneGrid(base);
                    placed.forEach(s => {
                        const seat = res[s.name];
                        g[seat.row][seat.col] = s;
                    });
                    return g;
                }
            }
        }
        return null;
    }

    // ─── エクスポート連携 ────────────────────────────────────
    function shouldExport() {
        return !!rules.includeInExport && rules.pairs.length > 0;
    }
    function exportBlob() {
        return encode(rules);
    }
    function importBlob(blob) {
        try {
            rules = Object.assign(defaultRules(), decode(blob));
            saveRules();
        } catch (e) { /* 壊れたデータは無視 */ }
    }

    // ============================================================
    // 非表示パネル
    // ============================================================
    let panel = null;
    let draft = null;

    const panelStyles = `
        #sx-panel .sx-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }
        #sx-panel select { padding: 6px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; }
        #sx-panel .sx-name { min-width: 140px; }
        #sx-panel .sx-x { background: #f44336; color: #fff; border: none; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
        #sx-panel .sx-status { margin: 15px 0; padding: 10px 12px; border-radius: 8px; font-size: 14px; line-height: 1.6; }
        #sx-panel .sx-ok { background: #e8f5e9; color: #2e7d32; }
        #sx-panel .sx-warn { background: #fff3e0; color: #e65100; }
        #sx-panel .sx-note { font-size: 12px; color: #999; margin-top: 10px; }
        #sx-panel label { cursor: pointer; }
    `;

    function el(tag, attrs = {}, text) {
        const e = document.createElement(tag);
        Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
        if (text !== undefined) e.textContent = text;
        return e;
    }

    function buildPanel() {
        const style = el('style');
        style.textContent = panelStyles;
        document.head.appendChild(style);

        panel = el('div', { id: 'sx-panel', class: 'modal' });
        panel.innerHTML = `
            <div class="modal-content">
                <h2>近接回避設定</h2>
                <p style="margin-bottom:10px;">登録したペアは、抽選・交換・シャッフル・再会・ラストワンのすべてで
                   指定範囲内に入らないよう配置されます。スロットの見た目は通常と変わりません。</p>
                <div class="sx-row">
                    <label><input type="checkbox" id="sx-enabled"> ルールを有効にする</label>
                </div>
                <div id="sx-list"></div>
                <button class="btn" id="sx-add">ペアを追加</button>
                <div id="sx-status" class="sx-status"></div>
                <div class="sx-row">
                    <label><input type="checkbox" id="sx-export"> 「保存」で書き出す設定ファイルにこのルールを含める</label>
                </div>
                <div class="sx-note">Ctrl + Alt + K で開閉 / Esc で閉じる。投影中は開かないでください。</div>
                <div class="modal-buttons">
                    <button class="btn" id="sx-cancel">キャンセル</button>
                    <button class="btn" id="sx-save">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        panel.querySelector('#sx-add').addEventListener('click', () => {
            draft.pairs.push({ a: '', b: '', range: 1 });
            renderList();
        });
        panel.querySelector('#sx-enabled').addEventListener('change', (e) => {
            draft.enabled = e.target.checked;
            renderStatus();
        });
        panel.querySelector('#sx-export').addEventListener('change', (e) => {
            draft.includeInExport = e.target.checked;
        });
        panel.querySelector('#sx-cancel').addEventListener('click', closePanel);
        panel.querySelector('#sx-save').addEventListener('click', () => {
            draft.pairs = draft.pairs.filter(p => p.a && p.b && p.a !== p.b);
            rules = draft;
            saveRules();
            closePanel();
        });
    }

    function nameSelect(value) {
        const sel = el('select', { class: 'sx-name' });
        sel.appendChild(el('option', { value: '' }, '-- 生徒 --'));
        const names = seatingData.roster.map(s => s.name);
        seatingData.roster.forEach(s => {
            const label = s.number ? `${s.number} ${s.name}` : s.name;
            sel.appendChild(el('option', { value: s.name }, label));
        });
        if (value && !names.includes(value)) {
            sel.appendChild(el('option', { value }, `${value}(名簿外)`));
        }
        sel.value = value || '';
        return sel;
    }

    function renderList() {
        const list = panel.querySelector('#sx-list');
        list.innerHTML = '';
        if (seatingData.roster.length === 0) {
            list.appendChild(el('p', {}, '先に名簿を設定してください。'));
        }
        draft.pairs.forEach((p, i) => {
            const row = el('div', { class: 'sx-row' });
            const a = nameSelect(p.a);
            const b = nameSelect(p.b);
            const range = el('select');
            Object.entries(RANGE_LABELS).forEach(([v, label]) => {
                range.appendChild(el('option', { value: v }, label));
            });
            range.value = String(p.range || 1);
            const x = el('button', { class: 'sx-x' }, '削除');

            a.addEventListener('change', () => { p.a = a.value; renderStatus(); });
            b.addEventListener('change', () => { p.b = b.value; renderStatus(); });
            range.addEventListener('change', () => { p.range = parseInt(range.value); renderStatus(); });
            x.addEventListener('click', () => { draft.pairs.splice(i, 1); renderList(); });

            row.append(a, el('span', {}, '×'), b, range, x);
            list.appendChild(row);
        });
        renderStatus();
    }

    function renderStatus() {
        const box = panel.querySelector('#sx-status');
        const pairs = activePairs(draft);
        if (!draft.enabled) {
            box.className = 'sx-status sx-warn';
            box.textContent = 'ルールは無効です(通常の抽選になります)';
            return;
        }
        if (pairs.length === 0) {
            box.className = 'sx-status sx-ok';
            box.textContent = '登録されたペアはありません';
            return;
        }
        const msgs = [];
        const v = violations(seatingData.assignments, pairs);
        v.forEach(p => msgs.push(`⚠ ${p.a} と ${p.b} はすでに範囲内に配置されています(指定席か、ルール追加前の配置)`));
        const idx = partnerIndex(pairs);
        const res = solve(posMapOf(seatingData.assignments),
            seatingData.roster.filter(s => !posMapOf(seatingData.assignments)[s.name]),
            enabledSeats().filter(s => !seatingData.assignments[s.row][s.col]),
            idx, { needFull: false });
        if (res === null) {
            msgs.push('⚠ 残りの生徒を条件どおりに配置する方法が見つかりません。範囲を狭めるか、ペアを減らしてください。');
        } else if (res === LIMIT) {
            msgs.push('⚠ 条件が複雑すぎて、最後まで配置できるか確認しきれませんでした。範囲を狭めるか、ペアを減らすことをおすすめします。');
        }
        if (msgs.length) {
            box.className = 'sx-status sx-warn';
            box.innerHTML = msgs.map(m => m.replace(/</g, '&lt;')).join('<br>');
        } else {
            box.className = 'sx-status sx-ok';
            box.textContent = `✓ ${pairs.length}組のルールで、最後まで配置可能です`;
        }
    }

    function openPanel() {
        if (!panel) buildPanel();
        draft = JSON.parse(JSON.stringify(rules));
        panel.querySelector('#sx-enabled').checked = draft.enabled;
        panel.querySelector('#sx-export').checked = draft.includeInExport;
        renderList();
        panel.style.display = 'flex';
    }

    function closePanel() {
        if (panel) panel.style.display = 'none';
        draft = null;
    }

    document.addEventListener('keydown', (e) => {
        const isShortcut = e.ctrlKey === SHORTCUT.ctrlKey &&
                           e.altKey === SHORTCUT.altKey &&
                           e.code === SHORTCUT.code;
        if (isShortcut) {
            e.preventDefault();
            if (panel && panel.style.display === 'flex') closePanel();
            else openPanel();
        } else if (e.key === 'Escape' && panel && panel.style.display === 'flex') {
            closePanel();
        }
    });

    window.SeatSolver = {
        hasRules,
        isPinned,
        candidateSeatsFor,
        stealTargets,
        swapAllowed,
        reunionAllowed,
        buildShuffledGrid,
        shouldExport,
        exportBlob,
        importBlob
    };
})();
