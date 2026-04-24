// 印刷機能の実装 - Phase 1リファクタ版
// (動的ボタン生成を削除し、HTMLの#print-btnを使用)
document.addEventListener('DOMContentLoaded', () => {
    // 印刷ボタンはHTMLに既にあるので取得するだけ
    const printBtn = document.getElementById('print-btn');
    if (!printBtn) {
        console.error('print-btnがHTMLに見つかりません');
        return;
    }
    
    // プレビューモーダルの作成
    const printPreviewModal = document.createElement('div');
    printPreviewModal.id = 'print-preview-modal';
    printPreviewModal.className = 'modal';
    printPreviewModal.innerHTML = `
        <div class="modal-content print-preview-content">
            <h2>印刷プレビュー</h2>
            <div class="print-instructions">
                <p>※ 印刷時には用紙サイズでB5横向きを選択してください</p>
            </div>
            <div id="print-settings">
                <div class="print-setting-group">
                    <label>
                        <input type="checkbox" id="optimize-layout" checked>
                        未使用の座席を省略し最適化する
                    </label>
                </div>
                <div class="print-setting-group">
                    <label>
                        <input type="checkbox" id="show-date" checked>
                        日付を表示(教卓の右に小さく)
                    </label>
                </div>
                <div class="print-setting-group">
                    <label>見出しタイトル(教卓の上・空欄で非表示):</label>
                    <input type="text" id="print-heading" value="" placeholder="例: 1年A組 座席表">
                </div>
                <div class="print-setting-group">
                    <label>教卓に表示する文字:</label>
                    <input type="text" id="print-title" value="教卓" placeholder="例: 教卓">
                </div>
                <div class="print-setting-group">
                    <label>文字サイズ調整:</label>
                    <select id="font-size-option">
                        <option value="auto">自動調整（推奨）</option>
                        <option value="large">大きめ</option>
                        <option value="medium">中くらい</option>
                        <option value="small">小さめ</option>
                    </select>
                </div>
            </div>
            <div id="print-preview-container">
                <!-- wrapper:transform: scale で縮小したコンテンツの占有スペースを補正 -->
                <div id="print-area-wrapper">
                    <div id="print-area">
                        <div id="print-classroom" class="print-classroom">
                            <!-- 教卓・日付・座席は動的に生成 -->
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-buttons">
                <button class="btn" id="print-cancel">キャンセル</button>
                <button class="btn" id="execute-print">印刷実行</button>
            </div>
        </div>
    `;
    document.body.appendChild(printPreviewModal);
    
    // 印刷用スタイルを追加
    const printStyle = document.createElement('style');
    printStyle.textContent = `
        /* 印刷プレビューモーダルのスタイル */
        .print-preview-content {
            width: 95%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .print-instructions {
            background-color: #fff3cd;
            color: #856404;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
            font-weight: bold;
            text-align: center;
        }
        
        #print-settings {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 8px;
        }
        
        .print-setting-group {
            margin-bottom: 10px;
        }
        
        #print-title, #font-size-option {
            padding: 5px 10px;
            width: 100%;
            margin-top: 5px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        #print-preview-container {
            background-color: #e0e0e0;
            padding: 20px;
            border-radius: 8px;
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
            overflow: auto;
        }

        /* ★ Phase 2修正:wrapperで占有スペースを補正
         *    transform: scale(0.5) は見た目だけ縮み、レイアウトは元サイズのまま
         *    なので親要素(wrapper)で実サイズを指定して overflow: hidden で囲む */
        #print-area-wrapper {
            width: calc(257mm * 0.5);   /* B5幅の半分 ≒ 128mm */
            height: calc(182mm * 0.5);  /* B5高さの半分 ≒ 91mm */
            overflow: hidden;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
            background-color: white;
        }

        #print-area {
            width: 257mm;  /* B5横向きの実サイズ */
            height: 182mm;
            background-color: white;
            /* ★v2.6:padding最小化(印刷時の@page marginに任せる)
               プレビューと印刷で同じ見た目になるよう揃える */
            padding: 2mm;
            box-sizing: border-box;
            transform: scale(0.5);
            transform-origin: top left;
        }

        .print-classroom {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            /* ★v2.8:縦方向も中央揃え。教卓+座席のかたまりをページ中央に置く */
            justify-content: center;
            width: 100%;
            height: 100%;
        }

        /* ★v2.11:見出しタイトル(○年○組 座席表 など) */
        .print-heading {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
            margin: 0 auto 8px auto;
            letter-spacing: 0.05em;
        }

        /* ★v2.3:教卓ブロック - 3カラムグリッドで教卓を常に中央固定
           [1fr 左余白] [教卓 auto] [1fr 右余白(日付配置)]
           ★v2.12:上下両方にマージン。教員視点でも座席との間隔を確保 */
        .print-teacher-row {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            width: 100%;
            margin: 8px auto;
        }
        .print-teacher-desk {
            grid-column: 2;  /* 真ん中の列 */
            width: 180px;
            height: 32px;
            background-color: #34495e;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            font-weight: bold;
            font-size: 18px;
            box-shadow: 0 2px 3px rgba(0,0,0,0.2);
            border: 2px solid #2c3e50;
        }
        .print-date-inline {
            grid-column: 3;       /* 右列(教卓の右隣) */
            justify-self: start;  /* 右列の左端に配置 = 教卓のすぐ右 */
            padding-left: 12px;
            font-size: 13px;
            color: #555;
            white-space: nowrap;
        }

        .print-seating-grid {
            display: grid;
            grid-gap: 4px;
            width: 100%;
            /* ★v2.8:1fr→auto。行の高さは内容ベース、余白はflexの中央揃えで配分 */
            grid-auto-rows: minmax(68px, auto);
            flex: 0 1 auto;  /* 伸縮しない(自然な高さでいる) */
        }

        /* 教員視点のグリッド回転 */
        .print-seating-grid.teacher-view {
            transform: rotate(180deg);
        }
        .print-seating-grid.teacher-view .print-seat {
            transform: rotate(180deg);
        }

        /* ★v2.2:座席を「番号行 + 名前行」の2行レイアウトに変更
           番号と名前が重ならないよう grid-template-rows で厳密分離 */
        .print-seat {
            width: 100%;
            min-height: 60px;
            display: grid;
            grid-template-rows: auto 1fr;  /* 上=番号(自動), 下=名前(残り全部) */
            grid-template-columns: 1fr;
            border-radius: 4px;
            border: 1px solid #ccc;
            padding: 2px 3px;
            text-align: center;
            line-height: 1.1;
            position: relative;
            overflow: hidden;
            box-sizing: border-box;
            font-size: 18px;
        }

        /* 上段:番号エリア(出席番号 or 座席番号) */
        .print-seat-header {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            min-height: 14px;
            padding: 0 1px;
        }
        .print-seat-number {
            font-size: 11px;
            color: #888;
            font-weight: normal;
            line-height: 1;
        }
        .print-seat-number.has-student-number {
            font-weight: bold;
            color: #333;
            background-color: rgba(255, 255, 255, 0.85);
            padding: 1px 4px;
            border-radius: 2px;
            font-size: 12px;
        }

        /* 下段:名前+ふりがな */
        .print-seat-body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            padding: 0 2px;
        }
        .print-seat-furigana {
            font-size: 0.5em;
            /* ★v2.9:親要素(.print-seat)の文字色を継承 + opacity 0.75で馴染ませる
               座席の背景色に応じてgetTextColorで自動生成された色を使うので
               緑の座席・黄色の座席など、どの色でも自然に馴染む */
            color: inherit;
            opacity: 0.75;
            line-height: 1;
            margin-bottom: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
        }
        .print-seat-name {
            font-weight: bold;
            line-height: 1.1;
            white-space: nowrap;  /* ★v2.2:絶対に1行 */
            overflow: hidden;
            text-overflow: clip;
            max-width: 100%;
        }

        .print-seat.empty {
            border: 1px dashed #ddd;
            color: #999;
        }
        .print-seat.empty .print-seat-name {
            font-weight: normal;
            font-size: 12px;
        }

        /* 文字サイズのプリセット */
        .print-seating-grid.font-auto .print-seat-name { font-size: var(--auto-font-size, 18px); }
        .print-seating-grid.font-large .print-seat-name { font-size: 26px; }
        .print-seating-grid.font-medium .print-seat-name { font-size: 20px; }
        .print-seating-grid.font-small .print-seat-name { font-size: 14px; }
        
        @media print {
            /* ★v2.7:v2.5の動く方式(visibility)に戻す + 空白追加ページ対策 */

            /* モーダル自体は"表示されてる状態"のまま触らない
               (触るとflex配置が崩れて本体が消えるリスクがある) */
            #print-preview-modal {
                background: transparent !important;
                display: block !important;
                position: static !important;
                overflow: visible !important;
                inset: auto !important;
            }
            #print-preview-modal .modal-content {
                background: transparent !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                max-width: none !important;
                max-height: none !important;
                width: auto !important;
                overflow: visible !important;
                border-radius: 0 !important;
                display: block !important;
            }

            /* モーダル内の飾りUIは画面外に追い出す(display:noneではなく) */
            #print-preview-modal h2,
            .print-instructions,
            #print-settings,
            .modal-buttons {
                visibility: hidden !important;
                position: absolute !important;
                left: -9999px !important;
                height: 0 !important;
                overflow: hidden !important;
            }

            /* プレビュー用の背景枠を解除 */
            #print-preview-container {
                background: transparent !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                display: block !important;
                border-radius: 0 !important;
            }

            /* ★本体:position: fixed で1ページ目の左上に強制配置
               これで後続に空白要素があっても絶対に2ページ目にズレない */
            #print-area-wrapper {
                display: block !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                /* ★v2.10:幅は100% (@pageマージン内の領域全体を使う)
                          高さは明示指定。これで子のheight: 100%が効く */
                width: 100% !important;
                height: 176mm !important;
                overflow: visible !important;
                box-shadow: none !important;
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
                break-after: avoid !important;
                break-inside: avoid !important;
            }
            #print-area {
                width: 100% !important;
                height: 100% !important;
                padding: 2mm !important;
                margin: 0 !important;
                transform: none !important;
                box-sizing: border-box !important;
                background: white !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
            }

            body, html {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                height: auto !important;
            }

            .print-seat {
                aspect-ratio: auto;
            }

            @page {
                size: B5 landscape;
                margin: 3mm;
            }
        }
    `;
    document.head.appendChild(printStyle);
    
    // 印刷ボタンクリックイベント
    printBtn.addEventListener('click', () => {
        generatePrintPreview();
        printPreviewModal.style.display = 'flex';
    });
    
    // キャンセルボタンクリックイベント
    document.getElementById('print-cancel').addEventListener('click', () => {
        printPreviewModal.style.display = 'none';
    });
    
    // 印刷実行ボタンクリックイベント
    document.getElementById('execute-print').addEventListener('click', () => {
        window.print();
    });
    
    // 設定変更時のイベント
    document.getElementById('optimize-layout').addEventListener('change', generatePrintPreview);
    document.getElementById('show-date').addEventListener('change', () => {
        const dateEl = document.querySelector('.print-date-inline');
        if (dateEl) {
            dateEl.style.display = document.getElementById('show-date').checked ? 'inline' : 'none';
        }
    });
    document.getElementById('print-title').addEventListener('input', (e) => {
        const deskEl = document.querySelector('.print-teacher-desk');
        if (deskEl) deskEl.textContent = e.target.value || '教卓';
    });
    // ★v2.11:見出しのライブ更新
    document.getElementById('print-heading').addEventListener('input', () => {
        generatePrintPreview();
    });
    document.getElementById('font-size-option').addEventListener('change', () => {
        updateFontSizeClass();
        if (document.getElementById('font-size-option').value === 'auto') {
            calculateOptimalFontSize();
        }
    });
    
    // ★★★ 教員視点かどうかを確認する関数 ★★★
    function isCurrentlyTeacherView() {
        // teacherViewBtnの状態から現在の表示モードを判定
        const teacherViewBtn = document.getElementById('teacher-view-btn');
        return teacherViewBtn && teacherViewBtn.classList.contains('active');
    }
    
    // 印刷プレビューを生成する関数 ★v2.2:大幅改訂 ★v2.11:見出し追加
    function generatePrintPreview() {
        const printClassroom = document.getElementById('print-classroom');
        printClassroom.innerHTML = '';

        const currentIsTeacherView = isCurrentlyTeacherView();

        // ─── 見出し(○年○組 座席表など:空欄時は非表示) ──
        const headingText = document.getElementById('print-heading').value.trim();
        let headingEl = null;
        if (headingText) {
            headingEl = document.createElement('div');
            headingEl.className = 'print-heading';
            headingEl.textContent = headingText;
        }

        // ─── 教卓ブロック(教卓+日付横並び) ──────────
        const teacherRow = document.createElement('div');
        teacherRow.className = 'print-teacher-row';

        const teacherDesk = document.createElement('div');
        teacherDesk.className = 'print-teacher-desk';
        teacherDesk.textContent = document.getElementById('print-title').value || '教卓';

        const dateInline = document.createElement('span');
        dateInline.className = 'print-date-inline';
        const now = new Date();
        dateInline.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
        if (!document.getElementById('show-date').checked) {
            dateInline.style.display = 'none';
        }

        teacherRow.appendChild(teacherDesk);
        teacherRow.appendChild(dateInline);

        // ─── 座席グリッド ────────────────────────────
        const printSeatingGrid = document.createElement('div');
        printSeatingGrid.id = 'print-seating-grid';
        printSeatingGrid.className = 'print-seating-grid';

        if (currentIsTeacherView) {
            printSeatingGrid.classList.add('teacher-view');
        }

        // ─── 構造構築 ──────────────────────────────
        // 通常視点: 見出し → 教卓 → 座席
        // 教員視点: 座席 → 教卓 → 見出し (見出しも教卓側=教員側に置く)
        if (currentIsTeacherView) {
            printClassroom.appendChild(printSeatingGrid);
            printClassroom.appendChild(teacherRow);
            if (headingEl) printClassroom.appendChild(headingEl);
        } else {
            if (headingEl) printClassroom.appendChild(headingEl);
            printClassroom.appendChild(teacherRow);
            printClassroom.appendChild(printSeatingGrid);
        }

        // ─── 座席データ ──────────────────────────────
        const { seats, assignments } = seatingData;
        const shouldOptimize = document.getElementById('optimize-layout').checked;
        updateFontSizeClass();

        if (shouldOptimize) {
            const usedSeats = getUsedSeatsRange(seats, assignments);
            if (!usedSeats) {
                printSeatingGrid.innerHTML = '<div class="no-seats-message">有効な座席がありません</div>';
                return;
            }
            const gridColumns = usedSeats.maxCol - usedSeats.minCol + 1;
            printSeatingGrid.style.gridTemplateColumns = `repeat(${gridColumns}, 1fr)`;

            for (let row = usedSeats.minRow; row <= usedSeats.maxRow; row++) {
                for (let col = usedSeats.minCol; col <= usedSeats.maxCol; col++) {
                    addPrintSeat(printSeatingGrid, row, col, usedSeats);
                }
            }
        } else {
            printSeatingGrid.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
            for (let row = 0; row < ROWS; row++) {
                for (let col = 0; col < COLS; col++) {
                    addPrintSeat(printSeatingGrid, row, col);
                }
            }
        }

        // 自動フォントサイズの計算は座席DOMが揃った後に
        if (document.getElementById('font-size-option').value === 'auto') {
            // requestAnimationFrameで実DOMサイズが確定してから計算
            requestAnimationFrame(() => calculateOptimalFontSize());
        }
    }

    // 印刷用の座席要素を追加する関数 ★v2.2:番号と名前を構造的に分離
    function addPrintSeat(container, row, col, usedSeats = null) {
        const seatData = seatingData.seats[row][col];
        const student = seatingData.assignments[row][col];

        if (usedSeats && (row < usedSeats.minRow || row > usedSeats.maxRow ||
                         col < usedSeats.minCol || col > usedSeats.maxCol)) {
            return;
        }

        const seatNumber = `${String.fromCharCode(65 + col)}${row + 1}`;
        const seatDiv = document.createElement('div');
        seatDiv.className = 'print-seat';

        if (!seatData.enabled) {
            seatDiv.className += ' empty';
            seatDiv.innerHTML = `
                <div class="print-seat-header">
                    <span class="print-seat-number">${seatNumber}</span>
                </div>
                <div class="print-seat-body">
                    <div class="print-seat-name">-</div>
                </div>
            `;
        } else if (student) {
            // 性別による色分け
            let bgColor = colorSettings.defaultColor;
            let textColor = getTextColor(colorSettings.defaultColor);
            if (colorSettings.enableGenderColors && student.gender) {
                if (student.gender === '男') {
                    bgColor = colorSettings.maleColor;
                    textColor = getTextColor(colorSettings.maleColor);
                } else if (student.gender === '女') {
                    bgColor = colorSettings.femaleColor;
                    textColor = getTextColor(colorSettings.femaleColor);
                }
            }

            // 番号:出席番号があればそれ、なければ座席番号
            let numberHtml;
            if (student.number) {
                numberHtml = `<span class="print-seat-number has-student-number">${student.number}</span>`;
            } else {
                numberHtml = `<span class="print-seat-number">${seatNumber}</span>`;
            }

            const furiganaHtml = student.furigana
                ? `<div class="print-seat-furigana">${student.furigana}</div>`
                : '';

            seatDiv.innerHTML = `
                <div class="print-seat-header">${numberHtml}</div>
                <div class="print-seat-body">
                    ${furiganaHtml}
                    <div class="print-seat-name">${student.name}</div>
                </div>
            `;
            seatDiv.style.backgroundColor = bgColor;
            seatDiv.style.color = textColor;
        } else {
            // 有効だが空席
            seatDiv.innerHTML = `
                <div class="print-seat-header">
                    <span class="print-seat-number">${seatNumber}</span>
                </div>
                <div class="print-seat-body">
                    <div class="print-seat-name">空席</div>
                </div>
            `;
        }

        container.appendChild(seatDiv);
    }
    
    // フォントサイズクラスを更新
    function updateFontSizeClass() {
        const printSeatingGrid = document.getElementById('print-seating-grid');
        const fontSizeOption = document.getElementById('font-size-option').value;
        
        // 既存のフォントサイズクラスをすべて削除
        printSeatingGrid.classList.remove('font-auto', 'font-large', 'font-medium', 'font-small');
        
        // 選択されたオプションに基づいてクラスを追加
        printSeatingGrid.classList.add(`font-${fontSizeOption}`);
    }
    
    /**
     * ★v2.2〜v2.6:最適フォントサイズの動的計算
     * 各セルの実幅と名前文字数から、その名前が「1行に収まる最大サイズ」を逆算する。
     * これによって5文字でも6文字でも、列幅の許す限りでは1行に表示される。
     *
     * v2.6:全体的に上限を引き上げ(印刷エリアが広がったので余裕ができた)、
     *      ルビは名前サイズに引きずられないよう独立計算に変更。
     */
    function calculateOptimalFontSize() {
        const printSeatingGrid = document.getElementById('print-seating-grid');
        if (!printSeatingGrid) return;
        const seats = printSeatingGrid.querySelectorAll('.print-seat');
        if (!seats.length) return;

        const gridStyle = window.getComputedStyle(printSeatingGrid);
        const columnCount = gridStyle.getPropertyValue('grid-template-columns').split(' ').length;

        // 列数別の上限・下限フォントサイズ(プレビュー時の見た目基準)
        // ★v2.6:全体的に引き上げ。paddingが小さくなった分セル幅が広がる
        const sizeBounds = {
            4:  { max: 36, min: 22 },
            5:  { max: 32, min: 20 },
            6:  { max: 28, min: 18 },
            7:  { max: 24, min: 16 },
            8:  { max: 22, min: 13 }
        };
        const bounds = sizeBounds[columnCount] || { max: 22, min: 13 };

        // ★v2.8:ルビ(フリガナ)の列数別独立サイズを引き上げ
        // 半角カナは細いのでもっと攻められる
        const furiganaBounds = {
            4:  { max: 20, min: 15 },
            5:  { max: 18, min: 14 },
            6:  { max: 16, min: 13 },
            7:  { max: 15, min: 12 },
            8:  { max: 14, min: 11 }
        };
        const furBounds = furiganaBounds[columnCount] || { max: 14, min: 11 };

        // 日本語1文字あたりの幅係数
        const CHAR_WIDTH_RATIO = 1.05;

        seats.forEach(seat => {
            const nameElement = seat.querySelector('.print-seat-name');
            if (!nameElement) return;

            const nameText = nameElement.textContent;
            const nameLength = nameText.length;
            if (nameLength === 0) return;

            const cellWidth = seat.clientWidth - 6;
            if (cellWidth <= 0) return;

            // 名前:1行に収まる最大サイズをcellWidthから逆算
            let optimalSize = Math.floor(cellWidth / (nameLength * CHAR_WIDTH_RATIO));
            optimalSize = Math.min(bounds.max, Math.max(bounds.min, optimalSize));
            nameElement.style.setProperty('font-size', `${optimalSize}px`, 'important');

            // ルビも同様に、セル幅から収まるサイズを逆算(ただし独立の上下限で)
            const furiganaElement = seat.querySelector('.print-seat-furigana');
            if (furiganaElement) {
                const furiganaText = furiganaElement.textContent;
                const furiganaLength = furiganaText.length;
                if (furiganaLength > 0) {
                    // 半角カナは全角の約半分の幅なので係数0.6
                    const furSize = Math.floor(cellWidth / (furiganaLength * 0.6));
                    const clampedFurSize = Math.min(furBounds.max, Math.max(furBounds.min, furSize));
                    furiganaElement.style.setProperty('font-size', `${clampedFurSize}px`, 'important');
                }
            }
        });

        console.log('動的フォント計算完了:', { columnCount, bounds, furBounds });
    }
    
    // 使用中の座席の範囲を取得する関数
    function getUsedSeatsRange(seats, assignments) {
        let minRow = ROWS, maxRow = -1, minCol = COLS, maxCol = -1;
        let foundUsed = false;

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (assignments[row][col] || seats[row][col].enabled) {
                    foundUsed = true;
                    minRow = Math.min(minRow, row);
                    maxRow = Math.max(maxRow, row);
                    minCol = Math.min(minCol, col);
                    maxCol = Math.max(maxCol, col);
                }
            }
        }
        return foundUsed ? { minRow, maxRow, minCol, maxCol } : null;
    }
    
    // debug用の表示
    console.log('印刷機能が初期化されました - 回転・教卓配置修正版');
});
