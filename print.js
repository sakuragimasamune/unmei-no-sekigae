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
                    <label>印刷タイトル(教卓内に表示):</label>
                    <input type="text" id="print-title" value="教卓" placeholder="例: 1年A組 教卓">
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
            /* ★v2.2:上下の余白をぐっと詰めて1枚に収める */
            padding: 6mm 8mm 6mm 8mm;
            box-sizing: border-box;
            transform: scale(0.5);
            transform-origin: top left;  /* center → leftに変更:wrapperと位置を揃える */
        }

        .print-classroom {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            width: 100%;
            height: 100%;
        }

        /* ★v2.3:教卓ブロック - 3カラムグリッドで教卓を常に中央固定
           [1fr 左余白] [教卓 auto] [1fr 右余白(日付配置)] */
        .print-teacher-row {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            width: 100%;
            margin: 0 auto 8px auto;
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
            /* 行の高さを auto にして、コンテンツ(座席)に追従 */
            grid-auto-rows: minmax(60px, 1fr);
            flex: 1;  /* 残りの縦スペース全部使う */
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
            color: #666;
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
            body * {
                visibility: hidden;
            }
            #print-area-wrapper, #print-area-wrapper * {
                visibility: visible;
            }

            /* ★印刷プレビューモーダルの装飾を剥がす
               (モーダルの半透明黒背景、白パネル、設定UIなど全部消す) */
            #print-preview-modal {
                display: block !important;
                position: static !important;
                background: transparent !important;
                overflow: visible !important;
            }
            #print-preview-modal .modal-content {
                background: transparent !important;
                box-shadow: none !important;
                padding: 0 !important;
                max-width: none !important;
                max-height: none !important;
                width: auto !important;
                overflow: visible !important;
                border-radius: 0 !important;
            }

            /* ★Phase 2修正:印刷時はwrapperを解除して全画面に */
            #print-area-wrapper {
                width: auto;
                height: auto;
                overflow: visible;
                box-shadow: none;
                position: absolute;
                left: 0;
                top: 0;
                background: none;
            }
            #print-area {
                width: 100%;
                height: auto;
                padding: 6mm 8mm 6mm 8mm;
                transform: none;
            }
            @page {
                size: B5 landscape;
                margin: 0;
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
    
    // 印刷プレビューを生成する関数 ★v2.2:大幅改訂
    function generatePrintPreview() {
        const printClassroom = document.getElementById('print-classroom');
        printClassroom.innerHTML = '';

        const currentIsTeacherView = isCurrentlyTeacherView();

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

        // ─── 構造構築:教卓→座席 / 教員視点なら座席→教卓 ─
        if (currentIsTeacherView) {
            printClassroom.appendChild(printSeatingGrid);
            printClassroom.appendChild(teacherRow);
        } else {
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
     * ★v2.2:最適フォントサイズの動的計算
     * 各セルの実幅と名前文字数から、その名前が「1行に収まる最大サイズ」を逆算する。
     * これによって5文字でも6文字でも、列幅の許す限りでは1行に表示される。
     */
    function calculateOptimalFontSize() {
        const printSeatingGrid = document.getElementById('print-seating-grid');
        if (!printSeatingGrid) return;
        const seats = printSeatingGrid.querySelectorAll('.print-seat');
        if (!seats.length) return;

        const gridStyle = window.getComputedStyle(printSeatingGrid);
        const columnCount = gridStyle.getPropertyValue('grid-template-columns').split(' ').length;

        // 列数別の上限・下限フォントサイズ(プレビュー時の見た目基準)
        // ※ #print-area は scale(0.5) なので、ここのpx値はB5上の実サイズ基準
        const sizeBounds = {
            4:  { max: 32, min: 18 },
            5:  { max: 28, min: 16 },
            6:  { max: 24, min: 14 },
            7:  { max: 20, min: 12 },
            8:  { max: 18, min: 10 }
        };
        const bounds = sizeBounds[columnCount] || { max: 18, min: 10 };

        // 日本語1文字あたりの幅係数(font-sizeに対する文字幅の比率)
        // 全角文字は概ね font-size と同じ幅を取るので 1.0 だが、padding等も考えて 1.05 で余裕を見る
        const CHAR_WIDTH_RATIO = 1.05;

        seats.forEach(seat => {
            const nameElement = seat.querySelector('.print-seat-name');
            if (!nameElement) return;

            const nameText = nameElement.textContent;
            const nameLength = nameText.length;
            if (nameLength === 0) return;

            // セル本体の幅(プレビュー上の実測px)から、内側のpadding(2*3=6px)を引いた利用可能幅
            const cellWidth = seat.clientWidth - 6;
            if (cellWidth <= 0) return;

            // 「nameLength文字」がcellWidthに収まる最大font-sizeを逆算
            // cellWidth = nameLength * fontSize * CHAR_WIDTH_RATIO
            // → fontSize = cellWidth / (nameLength * CHAR_WIDTH_RATIO)
            let optimalSize = Math.floor(cellWidth / (nameLength * CHAR_WIDTH_RATIO));

            // 上限・下限でクランプ
            optimalSize = Math.min(bounds.max, Math.max(bounds.min, optimalSize));

            nameElement.style.setProperty('font-size', `${optimalSize}px`, 'important');

            // ふりがなは名前のさらに半分くらいで(最低8px)
            const furiganaElement = seat.querySelector('.print-seat-furigana');
            if (furiganaElement) {
                const furiganaSize = Math.max(8, Math.floor(optimalSize * 0.55));
                furiganaElement.style.setProperty('font-size', `${furiganaSize}px`, 'important');
            }
        });

        console.log('動的フォント計算完了:', { columnCount, bounds });
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
