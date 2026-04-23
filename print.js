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
                        <input type="checkbox" id="show-header" checked>
                        ヘッダー（タイトル・日付）を表示
                    </label>
                </div>
                <div class="print-setting-group">
                    <label>印刷タイトル:</label>
                    <input type="text" id="print-title" value="座席表" placeholder="例: 1年A組 座席表">
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
                        <div id="print-header">
                            <h1 id="print-title-display">座席表</h1>
                            <div id="print-date"></div>
                        </div>
                        <div id="print-classroom" class="print-classroom">
                            <!-- 教卓は動的に生成 -->
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
            padding: 20mm 10mm 10mm 10mm;
            box-sizing: border-box;
            transform: scale(0.5);
            transform-origin: top left;  /* center → leftに変更:wrapperと位置を揃える */
        }
        
        #print-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            position: relative;
            top: -5mm; /* ヘッダーを上に移動 */
        }
        
        #print-title-display {
            font-size: 26px;
            font-weight: bold;
            margin-right: 15px;
        }
        
        #print-date {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
        
        .print-classroom {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .print-teacher-desk {
            width: 180px;
            height: 40px;
            background-color: #34495e;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
            font-size: 20px;
            box-shadow: 0 3px 5px rgba(0,0,0,0.2);
            border: 2px solid #2c3e50;
        }
        
        .print-seating-grid {
            display: grid;
            grid-gap: 5px;
            width: 100%;
            /* max-heightを削除して全行表示可能に */
            grid-auto-rows: minmax(80px, auto); /* 行の高さを自動調整 */
        }
        
        /* 教員視点のグリッド回転 */
        .print-seating-grid.teacher-view {
            transform: rotate(180deg);
        }
        
        .print-seating-grid.teacher-view .print-seat {
            transform: rotate(180deg);
        }
        
        .print-seat {
            width: 100%;
            min-height: 80px; /* デフォルトの最小高さ */
            aspect-ratio: 1.2 / 1; /* アスペクト比で高さを自動調整 */
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            border: 1px solid #ccc;
            padding: 5px;
            text-align: center;
            font-size: 18px; /* 基本サイズ - 動的に調整される */
            line-height: 1.1;
            position: relative; /* 番号表示のため */
            overflow: hidden; /* オーバーフローを隠す */
            box-sizing: border-box; /* ボックスサイズを固定 */
        }
        
        /* 行数に応じた座席の高さ調整 */
        .print-seating-grid.rows-7 .print-seat {
            min-height: 70px;
            height: 70px;
            justify-content: flex-start; /* 上から配置してふりがながめり込まないように */
            padding: 5px; /* パディングを標準に */
            gap: 5px; /* ふりがなと名前の間を適度に開ける */
            font-size: 16px; /* 全体のベースサイズを少し小さく */
        }
        
        /* 7行のときは出席番号を小さく */
        .print-seating-grid.rows-7 .print-seat-number {
            font-size: 0.5em;
        }
        
        .print-seating-grid.rows-7 .print-seat-number.has-student-number {
            font-size: 0.65em;
            padding: 2px 5px;
        }
        
        /* 7行のときはふりがなも少し小さく */
        .print-seating-grid.rows-7 .print-seat-furigana {
            font-size: 0.65em;
            padding-left: 10px;
        }
        
        /* 7行のときは名前のmin-heightを削除 */
        .print-seating-grid.rows-7 .print-seat-name {
            min-height: auto;
        }
        
        .print-seating-grid.rows-6 .print-seat {
            min-height: 80px;
            height: 80px;
        }
        
        .print-seat-number {
            position: absolute;
            top: 2px;
            left: 2px;
            font-size: 0.6em;
            color: #888;
            font-weight: normal;
        }
        
        .print-seat-number.has-student-number {
            font-weight: bold;
            background-color: rgba(255, 255, 255, 0.9);
            padding: 3px 6px;
            border-radius: 3px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            font-size: 0.75em;
        }
        
        .print-seat-name {
            font-weight: bold;
            width: 100%;
            white-space: normal; /* 改行を許可 */
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-height: 2.2em; /* 名前用の最小高さを確保 */
        }
        
        .print-seat-furigana {
            font-size: 0.7em;
            color: #666;
            width: 100%;
            white-space: normal;
            padding-left: 10px; /* 出席番号のスペースを確保 */
            box-sizing: border-box;
        }
        
        .print-seat.empty {
            border: 1px dashed #ddd;
            color: #999;
        }
        
        /* 文字サイズのプリセット */
        .print-seating-grid.font-auto .print-seat { font-size: var(--auto-font-size, 22px); }
        .print-seating-grid.font-large .print-seat { font-size: 30px; }
        .print-seating-grid.font-medium .print-seat { font-size: 24px; }
        .print-seating-grid.font-small .print-seat { font-size: 18px; }
        
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
                padding: 20mm 10mm 10mm 10mm;
                transform: none;
            }
            /* 印刷時はアスペクト比を無効化し、高さを固定 */
            .print-seat {
                aspect-ratio: auto;
            }
            
            /* 印刷時も行数に応じた高さを適用 */
            .print-seating-grid.rows-7 .print-seat {
                height: 70px !important;
                min-height: 70px !important;
                justify-content: flex-start !important;
                padding: 5px !important;
                gap: 5px !important;
                font-size: 16px !important;
            }
            
            .print-seating-grid.rows-7 .print-seat-furigana {
                font-size: 0.65em !important;
                padding-left: 10px !important;
            }
            
            .print-seating-grid.rows-7 .print-seat-name {
                min-height: auto !important;
            }
            
            .print-seating-grid.rows-6 .print-seat {
                height: 80px !important;
                min-height: 80px !important;
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
    document.getElementById('show-header').addEventListener('change', () => {
        document.getElementById('print-header').style.display = 
            document.getElementById('show-header').checked ? 'block' : 'none';
    });
    document.getElementById('print-title').addEventListener('input', (e) => {
        document.getElementById('print-title-display').textContent = e.target.value;
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
    
    // 印刷プレビューを生成する関数
    function generatePrintPreview() {
        // 全体のコンテナを取得
        const printClassroom = document.getElementById('print-classroom');
        printClassroom.innerHTML = '';
        
        // 現在の日付をフォーマット
        const now = new Date();
        document.getElementById('print-date').textContent = 
            `(${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日)`;
        
        // ★★★ 現在表示中の教員視点を取得（修正） ★★★
        const currentIsTeacherView = isCurrentlyTeacherView();
        console.log("現在の教員視点: ", currentIsTeacherView);
        
        // ★★★ 教員視点に応じたレイアウト構築 ★★★
        // 教員視点なら「座席→教卓」の順、通常なら「教卓→座席」の順
        let structure = [];
        
        if (currentIsTeacherView) {
            // 教員視点: 上から「座席→教卓」
            structure = ['grid', 'desk'];
        } else {
            // 通常視点: 上から「教卓→座席」
            structure = ['desk', 'grid'];
        }
        
        // 構造に従ってDOMを構築
        const printSeatingGrid = document.createElement('div');
        printSeatingGrid.id = 'print-seating-grid';
        printSeatingGrid.className = 'print-seating-grid';
        
        const teacherDesk = document.createElement('div');
        teacherDesk.className = 'print-teacher-desk';
        teacherDesk.textContent = '教卓';
        
        // ★★★ 教員視点時のみグリッドにteacher-viewクラスを追加 ★★★
        if (currentIsTeacherView) {
            printSeatingGrid.classList.add('teacher-view');
            console.log("座席グリッドにteacher-viewクラスを適用");
        }
        
        // 構造に従って要素を追加
        structure.forEach(item => {
            if (item === 'desk') {
                printClassroom.appendChild(teacherDesk);
            } else if (item === 'grid') {
                printClassroom.appendChild(printSeatingGrid);
            }
        });
        
        // 座席データを取得
        const { seats, assignments } = seatingData;
        
        // 最適化オプションの状態を取得
        const shouldOptimize = document.getElementById('optimize-layout').checked;
        
        // フォントサイズ設定を適用
        updateFontSizeClass();
        
        if (shouldOptimize) {
            // 使用されている座席の範囲を取得
            const usedSeats = getUsedSeatsRange(seats, assignments);
            if (!usedSeats) {
                // 使用されている座席がない場合
                printSeatingGrid.innerHTML = '<div class="no-seats-message">有効な座席がありません</div>';
                return;
            }
            
            // グリッドのサイズを設定
            const gridColumns = usedSeats.maxCol - usedSeats.minCol + 1;
            const gridRows = usedSeats.maxRow - usedSeats.minRow + 1;
            
            console.log("使用範囲:", usedSeats, "列数:", gridColumns, "行数:", gridRows);
            
            // 行数に応じたクラスをクリアしてから追加
            printSeatingGrid.classList.remove('rows-5', 'rows-6', 'rows-7');
            if (gridRows === 7) {
                printSeatingGrid.classList.add('rows-7');
            } else if (gridRows === 6) {
                printSeatingGrid.classList.add('rows-6');
            }
            
            // 横向きB5に最適化するため、列のサイズを調整
            const columnWidth = 100 / gridColumns;
            printSeatingGrid.style.gridTemplateColumns = `repeat(${gridColumns}, ${columnWidth}%)`;
            
            // 行の高さを行数に応じて調整
            let seatHeight;
            if (gridRows >= 7) {
                seatHeight = '70px'; // 7行の場合
            } else if (gridRows >= 6) {
                seatHeight = '80px'; // 6行の場合
            } else {
                seatHeight = '80px'; // 5行以下は標準サイズ
            }
            printSeatingGrid.style.gridAutoRows = `minmax(${seatHeight}, auto)`;
            
            // 座席を追加（左上から順番に - CSSで回転されるのでこの順序は常に同じでOK）
            for (let row = usedSeats.minRow; row <= usedSeats.maxRow; row++) {
                for (let col = usedSeats.minCol; col <= usedSeats.maxCol; col++) {
                    addPrintSeat(printSeatingGrid, row, col, usedSeats);
                }
            }
        } else {
            // 全ての座席を表示（最適化なし）
            printSeatingGrid.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
            
            // 座席を追加（左上から順番に - CSSで回転されるのでこの順序は常に同じでOK）
            for (let row = 0; row < ROWS; row++) {
                for (let col = 0; col < COLS; col++) {
                    addPrintSeat(printSeatingGrid, row, col);
                }
            }
        }
        
        // 自動フォントサイズの場合は計算して適用
        if (document.getElementById('font-size-option').value === 'auto') {
            calculateOptimalFontSize();
        }
    }
    
    // 印刷用の座席要素を追加する関数
    function addPrintSeat(container, row, col, usedSeats = null) {
        // 座席データの取得
        const seatData = seatingData.seats[row][col];
        const student = seatingData.assignments[row][col];
        
        // 最適化モードでかつ、座席範囲外の場合はスキップ
        if (usedSeats && (row < usedSeats.minRow || row > usedSeats.maxRow || 
                         col < usedSeats.minCol || col > usedSeats.maxCol)) {
            return;
        }
        
        // 座席番号を生成（A1, B2など）
        const seatNumber = `${String.fromCharCode(65 + col)}${row + 1}`;
        
        const seatDiv = document.createElement('div');
        seatDiv.className = 'print-seat';
        
        // 座席が無効の場合は薄く表示
        if (!seatData.enabled) {
            seatDiv.className += ' empty';
            seatDiv.innerHTML = `
                <div class="print-seat-number">${seatNumber}</div>
                <div class="print-seat-name">-</div>
            `;
        } else if (student) {
            // 生徒が割り当てられている場合
            let furiganaHtml = '';
            if (student.furigana) {
                furiganaHtml = `<div class="print-seat-furigana">${student.furigana}</div>`;
            }
            
            // 性別に応じた背景色と文字色を取得
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
            
            // 出席番号がある場合は番号を表示、ない場合は座席番号を表示
            let seatNumberHtml;
            if (student.number) {
                // 出席番号を表示（太字、白背景、名前と同じ文字色）
                seatNumberHtml = `<div class="print-seat-number has-student-number" style="color: ${textColor};">${student.number}</div>`;
            } else {
                // 通常の座席番号
                seatNumberHtml = `<div class="print-seat-number">${seatNumber}</div>`;
            }
            
            seatDiv.innerHTML = `
                ${seatNumberHtml}
                ${furiganaHtml}
                <div class="print-seat-name">${student.name}</div>
            `;
            
            // 背景色と文字色を適用
            seatDiv.style.backgroundColor = bgColor;
            seatDiv.style.color = textColor;
        } else {
            // 有効だが空席の場合
            seatDiv.innerHTML = `
                <div class="print-seat-number">${seatNumber}</div>
                <div class="print-seat-name">空席</div>
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
    
    // 最適なフォントサイズを計算して適用
    function calculateOptimalFontSize() {
        const printSeatingGrid = document.getElementById('print-seating-grid');
        const seats = printSeatingGrid.querySelectorAll('.print-seat');
        if (!seats.length) return;
        
        // グリッドの列数を取得
        const gridStyle = window.getComputedStyle(printSeatingGrid);
        const gridTemplateColumns = gridStyle.getPropertyValue('grid-template-columns');
        const columnCount = gridTemplateColumns.split(' ').length;
        
        // 行数も取得（概算）
        const rowCount = Math.ceil(seats.length / columnCount);
        
        // 列数に基づいて基本フォントサイズを決定（控えめに設定）
        let baseFontSize;
        
        if (columnCount <= 4) {
            baseFontSize = 32;
        } else if (columnCount === 5) {
            baseFontSize = 28;
        } else if (columnCount === 6) {
            baseFontSize = 24;
        } else if (columnCount === 7) {
            baseFontSize = 12; // 7列はかなり小さく
        } else {
            baseFontSize = 10; // 8列は非常に小さく
        }
        
        console.log("自動フォントサイズ計算:", {columnCount, rowCount, baseFontSize});
        
        // カスタムプロパティとして設定
        printSeatingGrid.style.setProperty('--auto-font-size', `${baseFontSize}px`);
        
        // 名前の長さに基づいて個別調整（案2：列数も考慮）
        seats.forEach(seat => {
            const nameElement = seat.querySelector('.print-seat-name');
            if (nameElement) {
                const nameLength = nameElement.textContent.length;
                
                // 6列以下かつ4文字以上 → 縮小（スペース含む短い名前にも対応）
                if (columnCount <= 6 && nameLength >= 4) {
                    if (nameLength >= 7) {
                        seat.style.setProperty('font-size', `${baseFontSize * 0.7}px`, 'important'); // 7文字以上
                    } else if (nameLength === 6) {
                        seat.style.setProperty('font-size', `${baseFontSize * 0.75}px`, 'important'); // 6文字
                    } else if (nameLength === 5) {
                        seat.style.setProperty('font-size', `${baseFontSize * 0.8}px`, 'important'); // 5文字
                    } else if (nameLength === 4) {
                        seat.style.setProperty('font-size', `${baseFontSize * 0.85}px`, 'important'); // 4文字
                    }
                } else if (columnCount === 7 && nameLength >= 4) {
                    // 7列の場合は4文字以上で縮小
                    if (nameLength > 7) {
                        seat.style.setProperty('font-size', `${baseFontSize * 0.8}px`, 'important');
                    } else if (nameLength > 5) {
                        seat.style.setProperty('font-size', `${baseFontSize * 0.85}px`, 'important');
                    } else if (nameLength >= 4) {
                        seat.style.setProperty('font-size', `${baseFontSize * 0.9}px`, 'important');
                    }
                }
                
                // ふりがなが長い場合の追加調整
                const furiganaElement = seat.querySelector('.print-seat-furigana');
                if (furiganaElement) {
                    const furiganaLength = furiganaElement.textContent.length;
                    console.log("ふりがなチェック:", furiganaElement.textContent, "長さ:", furiganaLength);
                    if (furiganaLength > 10) {
                        // ふりがなが長い場合は、さらに全体を小さく（70%に縮小）
                        const currentSize = parseFloat(seat.style.fontSize || baseFontSize);
                        const newSize = currentSize * 0.7;
                        seat.style.setProperty('font-size', `${newSize}px`, 'important');
                        
                        // 縮小するとパディングも小さくなるので、ふりがなのパディングを増やす
                        furiganaElement.style.setProperty('padding-left', '20px', 'important');
                        
                        console.log("ふりがな長い！縮小:", currentSize, "→", newSize, "+ パディング20px");
                    }
                }
            }
        });
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
