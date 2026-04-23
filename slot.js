// スロット関連のスタイル（拡大版）
const slotStyles = `
.slot-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.05);
    z-index: 1000;
}

.slot-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.35);
    backdrop-filter: blur(1px);
    padding: 60px;
    border-radius: 20px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

.slot-container.last-one-challenge {
    backdrop-filter: blur(1px);
    background: rgba(255, 255, 255, 0.35);
}

.slots {
    display: flex;
    gap: 40px;
    margin-bottom: 50px;
}

.slot {
    width: 250px;
    height: 120px;
    background: #f0f0f0;
    border: 3px solid #333;
    border-radius: 10px;
    overflow: hidden;
    position: relative;
}

.slot-content {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;  /* 名前のデフォルトサイズ */
    font-weight: bold;
    color: #333;
}

/* 列（2番目のスロット）を大きく */
.slot:nth-child(2) .slot-content {
    font-size: 54px;
}

/* 行（3番目のスロット）を大きく */
.slot:nth-child(3) .slot-content {
    font-size: 54px;
}

.message-space {
    min-height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: bold;
    color: #444;
    text-align: center;
    padding: 20px;
    line-height: 1.6;
    text-shadow: 0 0 8px white, 2px 2px 4px rgba(0,0,0,0.5);
}

.slot-buttons {
    display: flex;
    gap: 20px;
    justify-content: center;
}

.slot-button {
    padding: 20px 50px;
    font-size: 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s;
}

.next-button {
    background-color: #4CAF50;
    color: white;
}

.stop-button {
    background-color: #f44336;
    color: white;
}

.slot-button:hover {
    transform: translateY(-2px);
}
`;

// スペシャル演出のスタイル
const specialEffectStyles = `
    @keyframes flash {
        0%, 100% { background-color: rgba(255, 255, 255, 0.95); }
        50% { background-color: rgba(255, 215, 0, 0.95); }
    }

    @keyframes windowFlash {
        0%, 100% { background-color: rgba(255, 255, 255, 0.95); }
        50% { background-color: rgba(135, 206, 235, 0.95); }
    }

    @keyframes shake {
        0%, 100% { transform: translate(-50%, -50%); }
        25% { transform: translate(-52%, -50%); }
        75% { transform: translate(-48%, -50%); }
    }

    @keyframes scale {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
    }

    .special-effect-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1001;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .special-effect-overlay.front-back {
        animation: flash 0.5s ease-in-out 3;
    }

    .special-effect-overlay.window {
        animation: windowFlash 0.5s ease-in-out 3;
    }

    .special-effect-message {
        font-size: 90px;
        font-weight: bold;
        text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3);
        animation: scale 0.5s ease-in-out infinite;
    }

    .special-effect-message.front-back {
        color: #FF4081;
    }

    .special-effect-message.window {
        color: #4169E1;
    }

    .special-effect-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: shake 0.1s linear infinite;
        white-space: nowrap;
        min-width: max-content;
    }

    /* 交換イベント用のスタイルを追加 */
    @keyframes exchangeFlash {
        0%, 100% { background-color: rgba(255, 255, 255, 0.95); }
        50% { background-color: rgba(147, 112, 219, 0.3); }
    }

    @keyframes exchangeRotate {
        0% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(180deg) scale(1.2); }
        100% { transform: rotate(360deg) scale(1); }
    }

    .special-effect-overlay.exchange {
        animation: exchangeFlash 0.5s ease-in-out 3;
    }

    .special-effect-message.exchange {
        color: #dccdf7;
        font-size: 84px !important;
        text-shadow: 0 0 15px #8A2BE2, 0 0 25px #8A2BE2;
    }

    /* 交換用スロット */
    .exchange-slot-container {
        background: rgba(255, 255, 255, 0.35);
        backdrop-filter: blur(1px);
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
        text-align: center;
        margin-top: 20px;
    }

    .exchange-slot-title {
        font-size: 18px;
        color: #FF1493;
        margin-bottom: 15px;
    }
    
    /* 交換スロットの文字サイズは名前と同じ（優先度を上げる） */
    .exchange-slot-container .slot .slot-content {
        font-size: 36px !important;
    }
`;

// スタイルを適用
const styleSheet = document.createElement("style");
styleSheet.textContent = slotStyles;
document.head.appendChild(styleSheet);

// 特殊演出のスタイルを適用
const effectStyleSheet = document.createElement("style");
effectStyleSheet.textContent = specialEffectStyles;
document.head.appendChild(effectStyleSheet);


class SlotMachine {
    constructor() {
        this.setupDOM();
        this.isRunning = false;
        this.namePool = [];
        this.currentAnimations = [null, null, null];
        this.getAvailableRowsCallback = null;
        this.reunionEventInProgress = false;
        this.reunionProbability = parseInt(localStorage.getItem('reunionEventProbability')) || 5;
        
        // 交換イベント用の設定を追加
        this.exchangeProbability = parseInt(localStorage.getItem('exchangeEventProbability')) || 5;
        this.reunionProbability = parseInt(localStorage.getItem('reunionEventProbability')) || 5;
        this.isExchangeMode = false;
    }

    setupDOM() {
        // オーバーレイとコンテナの作成
        this.overlay = document.createElement('div');
        this.overlay.className = 'slot-overlay';
        
        const container = document.createElement('div');
        container.className = 'slot-container';
        this.container = container; // コンテナへの参照を保持
        
        // スロット部分の作成
        const slotsDiv = document.createElement('div');
        slotsDiv.className = 'slots';
        
        // 3つのスロットを作成
        this.slots = ['name', 'column', 'row'].map(type => {
            const slot = document.createElement('div');
            slot.className = 'slot';
            const content = document.createElement('div');
            content.className = 'slot-content';
            slot.appendChild(content);
            slotsDiv.appendChild(slot);
            return slot;
        });
        
        // メッセージスペースの作成
        this.messageSpace = document.createElement('div');
        this.messageSpace.className = 'message-space';
        
        // ボタンの作成
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'slot-buttons';
        
        this.nextButton = document.createElement('button');
        this.nextButton.className = 'slot-button next-button';
        this.nextButton.textContent = '次の生徒へ';
        this.nextButton.style.display = 'none';
        
        this.stopButton = document.createElement('button');
        this.stopButton.className = 'slot-button stop-button';
        this.stopButton.textContent = '抽選を中止';
        
        buttonsDiv.appendChild(this.nextButton);
        buttonsDiv.appendChild(this.stopButton);
        
        // 要素を組み立て
        container.appendChild(slotsDiv);
        container.appendChild(this.messageSpace);
        container.appendChild(buttonsDiv);
        this.overlay.appendChild(container);
        document.body.appendChild(this.overlay);

        // イベントリスナーの設定
        this.stopButton.addEventListener('click', () => this.stop());
        this.nextButton.addEventListener('click', () => this.next());
    }
    
    // 座席を光らせる関数（複数の座席を同時にハイライト可能）
    highlightSeats(seats) {
        // seatsは配列: [{row, col}, {row, col}, ...]
        const seatElements = seats.map(seat => {
            return document.querySelector(`[data-row="${seat.row}"][data-col="${seat.col}"]`);
        }).filter(el => el !== null);
        
        // selected-seatクラスを追加
        seatElements.forEach(el => {
            el.classList.add('selected-seat');
        });
        
        // 1.5秒後にクラスを削除
        setTimeout(() => {
            seatElements.forEach(el => {
                el.classList.remove('selected-seat');
            });
        }, 1500);
    }
    
    // 運命の再会専用のハイライトエフェクト（ピンクのハート拍動）
    highlightReunionSeats(seats) {
        console.log('🎀 運命の再会ハイライト開始:', seats);
        
        // seatsは配列: [{row, col}, {row, col}, ...]
        const seatElements = seats.map(seat => {
            const el = document.querySelector(`[data-row="${seat.row}"][data-col="${seat.col}"]`);
            console.log(`座席 [${seat.row},${seat.col}]:`, el);
            return el;
        }).filter(el => el !== null);
        
        console.log('💓 見つかった座席要素:', seatElements.length, seatElements);
        
        // reunion-heartbeatクラスを追加
        seatElements.forEach(el => {
            console.log('💕 クラス追加:', el);
            el.classList.add('reunion-heartbeat');
            console.log('💕 クラス確認:', el.classList.contains('reunion-heartbeat'));
        });
        
        // 6秒後にクラスを削除（長めに）
        setTimeout(() => {
            seatElements.forEach(el => {
                el.classList.remove('reunion-heartbeat');
            });
        }, 6000);
    }

    show() {
        this.overlay.style.display = 'flex';
    }

    hide() {
        this.overlay.style.display = 'none';
        this.container.classList.remove('last-one-challenge');
    }

    // スロットのアニメーション
    animateSlot(slotIndex, items, duration) {
        const slot = this.slots[slotIndex].querySelector('.slot-content');
        const startTime = Date.now();
        const baseSpeed = 50;
        const variance = Math.random() * 10 - 5;
        
        return new Promise(resolve => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / (duration + variance);

                if (progress < 1) {
                    const currentIndex = Math.floor((progress * items.length * 10)) % items.length;
                    slot.textContent = items[currentIndex];
                    this.currentAnimations[slotIndex] = requestAnimationFrame(animate);
                } else {
                    // ランダムな結果を選択
                    const randomIndex = Math.floor(Math.random() * items.length);
                    slot.textContent = items[randomIndex];
                    this.currentAnimations[slotIndex] = null;
                    resolve(items[randomIndex]);
                }
            };
            
            this.currentAnimations[slotIndex] = requestAnimationFrame(animate);
        });
    }
    
    
    async startExchange(name, row, col) {
       // まず演出開始
       this.messageSpace.style.opacity = '1';
       this.messageSpace.innerHTML = "運命の力が働き始めています...";
       await new Promise(resolve => setTimeout(resolve, 1000));

       // 交換可能な生徒をチェック
       const assignedStudents = [];
       const currentSeatGender = seatingData.seats[row][col]?.properties?.gender;

       for (let r = 0; r < seatingData.assignments.length; r++) {
           for (let c = 0; c < seatingData.assignments[r].length; c++) {
               const student = seatingData.assignments[r][c];
               if (!student || student.name === name) continue;

               const targetSeatGender = seatingData.seats[r][c]?.properties?.gender;
               
               const canExchange = 
                   (!currentSeatGender && !targetSeatGender) ||
                   (currentSeatGender && currentSeatGender === targetSeatGender) ||
                   (!currentSeatGender && !targetSeatGender);
                   
               if (canExchange) {
                   assignedStudents.push({ student, row: r, col: c });
               }
           }
       }

       if (assignedStudents.length === 0) {
           this.messageSpace.innerHTML = "しかし、今回は交換できる相手が見つかりませんでした...";
           await new Promise(resolve => setTimeout(resolve, 2000));
           return null;
       }

       // でか文字演出
       await this.playExchangeEffect();

       // 交換スロット作成
       const exchangeSlotContainer = document.createElement('div');
       exchangeSlotContainer.className = 'exchange-slot-container';

       const title = document.createElement('div');
       title.className = 'exchange-slot-title';
       title.textContent = '交換相手を決定中...';
       exchangeSlotContainer.appendChild(title);

       const slot = document.createElement('div');
       slot.className = 'slot';
       const content = document.createElement('div');
       content.className = 'slot-content';
       slot.appendChild(content);
       exchangeSlotContainer.appendChild(slot);

       const existingExchangeSlot = this.overlay.querySelector('.exchange-slot-container');
       if (existingExchangeSlot) {
           existingExchangeSlot.remove();
       }
       this.overlay.querySelector('.slot-container').appendChild(exchangeSlotContainer);

       const names = assignedStudents.map(a => a.student.name);

       const animate = () => new Promise(resolve => {
           let startTime = Date.now();
           const duration = 2000;
           let animationId;

           const updateSlot = () => {
               const elapsed = Date.now() - startTime;
               const progress = elapsed / duration;

               if (progress < 1) {
                   const index = Math.floor((elapsed / 50) % names.length);
                   content.textContent = names[index];
                   animationId = requestAnimationFrame(updateSlot);
               } else {
                   cancelAnimationFrame(animationId);
                   const finalName = names[Math.floor(Math.random() * names.length)];
                   content.textContent = finalName;
                   resolve(finalName);
               }
           };

           animationId = requestAnimationFrame(updateSlot);
       });

       const exchangeStudentName = await animate();
       return assignedStudents.find(a => a.student.name === exchangeStudentName);
    }


    async start(names, availableColumns, getAvailableRowsCallback) {
        if (!this.effectManager) {
            this.effectManager = new SpecialEffectManager();
        }
        
        this.reunionEventInProgress = false;

        // ラストワンチャレンジのチェック
        const lastOneChallengeEnabled = localStorage.getItem('lastOneChallengeEnabled');
        const shouldEnableLastOne = lastOneChallengeEnabled === 'true' || lastOneChallengeEnabled === null;
        
        if (shouldEnableLastOne && names.length === 1 && this.isLastStudent()) {
            await this.playLastOneChallenge(names[0]);
            return;
        }

        if (!names.length || !availableColumns.length) {
            handleCompletion();
            return;
        }

        this.getAvailableRowsCallback = getAvailableRowsCallback;
        this.show();
        this.nextButton.style.display = 'none';
        this.isRunning = true;

        // 1. 内部的に全ての抽選を行う
        const selectedName = names[Math.floor(Math.random() * names.length)];
        const selectedCol = availableColumns[Math.floor(Math.random() * availableColumns.length)];
        const availableRows = getAvailableRowsCallback()(selectedCol);
        
        if (!availableRows.length) {
            alert('選択された列に利用可能な行がありません。もう一度試してください。');
            this.stop();
            return;
        }
        const selectedRow = availableRows[Math.floor(Math.random() * availableRows.length)];

        // 2. 特殊演出の判定
        const effectiveRows = this.effectManager.findEffectiveRows(seatingData.seats);
        const selectedRowNum = parseInt(selectedRow);
        const isFrontBack = selectedRowNum === effectiveRows.first || 
                           selectedRowNum === effectiveRows.last;
        const isWindow = selectedCol === 'A';
        
        const shouldShowFrontBack = isFrontBack && this.effectManager.shouldTriggerFrontBackEffect();
        const shouldShowWindow = isWindow && this.effectManager.shouldTriggerWindowEffect();

        // 3. スロット開始
        const nameSlot = this.animateSlot(0, names, 1000, selectedName);
        const colSlot = this.animateSlot(1, availableColumns, 2000, selectedCol);
        const rowSlot = this.animateSlot(2, availableRows, 3000, selectedRow);

        // 4. 名前のスロットが止まるのを待つ
        const finalName = await nameSlot.promise;

        // 5. 特殊演出の表示(名前が決まった後)
        if (shouldShowFrontBack || shouldShowWindow) {
            colSlot.controller.pause();
            rowSlot.controller.pause();
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (shouldShowFrontBack) {
                await this.effectManager.playSpecialEffect('front-back', '特別席確定！！');
            } else if (shouldShowWindow) {
                await this.effectManager.playSpecialEffect('window', '窓際席確定！！');
            }
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
            colSlot.controller.resume();
            rowSlot.controller.resume();
        }

        // 6. 残りのスロットが止まるのを待つ
        const finalCol = await colSlot.promise;
        const finalRow = await rowSlot.promise;

        this.isRunning = false;
        this.nextButton.style.display = 'inline-block';
        // ここでボタンを無効化
        this.nextButton.disabled = true;
        this.nextButton.style.opacity = '0.5';
        this.nextButton.style.cursor = 'not-allowed';

        // 7. 座席確定イベントを発火
        const seatDecidedEvent = new CustomEvent('seatDecided', { 
            detail: { 
                name: finalName,
                col: finalCol.charCodeAt(0) - 65,
                row: parseInt(finalRow) - 1
            } 
        });
        document.dispatchEvent(seatDecidedEvent);
        
        // 座席を光らせる！
        this.highlightSeats([{
            row: parseInt(finalRow) - 1,
            col: finalCol.charCodeAt(0) - 65
        }]);

        // 全ての席が埋まった場合の処理を変更
        if (isAllSeatsAssigned()) {
            // モーダルを表示するためのイベントを発火
            const completionEvent = new CustomEvent('seatingCompleted');
            document.dispatchEvent(completionEvent);
            this.stop();
            return;
        }

        // シャッフルイベントのチェック
        if (window.shuffleEvent.shouldTrigger()) {
            await window.shuffleEvent.playShuffleEffect();
            window.shuffleEvent.shuffleSeats();
            // ★Phase 3:シャッフル後の余韻
            await window.shuffleEvent.playShuffleAftermath();
        }

        // ここに運命の再会チェックを追加
        if (this.shouldTriggerReunion() && !this.reunionEventInProgress) {
            this.reunionEventInProgress = true;
            const reunionResult = await checkReunionEvent(
                { name: finalName },
                { row: parseInt(finalRow) - 1, col: finalCol.charCodeAt(0) - 65 }
            );
            
            console.log('🎀 reunionResult:', reunionResult);
            console.log('🎀 reunionResult.success:', reunionResult?.success);
            
            if (reunionResult && reunionResult.success) {
                console.log('🎀 運命の再会ハイライト実行開始！');
                
                // 運命の再会イベントが発生した場合、交換イベントはスキップ
                
                // 運命の再会専用のハイライトエフェクト（拍動する光）
                this.highlightReunionSeats([
                    reunionResult.newSeat,
                    reunionResult.partnerSeat
                ]);
                
                // 再会イベント成功時は、ここで保存して終了
                saveToLocalStorage();
                return;
            } else {
                console.log('🎀 reunionResultがfalseまたはsuccess=false');
            }
        }


        // 通常の占いメッセージを表示
        const fortuneMessage = displayFortune(finalName, `${finalCol}${finalRow}`);
        this.messageSpace.innerHTML = fortuneMessage.replace(/\n/g, '<br>');

        // ドラマチックな間を作る(3秒)
        await new Promise(resolve => setTimeout(resolve, 3000));

        // メッセージをフェードアウト
        this.messageSpace.style.transition = 'opacity 0.5s';
        this.messageSpace.style.opacity = '0';
        await new Promise(resolve => setTimeout(resolve, 500));

        if (this.shouldTriggerExchange()) {
            const exchangeResult = await this.startExchange(
                finalName,
                parseInt(finalRow) - 1,
                finalCol.charCodeAt(0) - 65
            );
            
            if (exchangeResult) {
                // 交換イベントを発火
                const exchangeEvent = new CustomEvent('seatExchanged', {
                    detail: {
                        student1: {
                            row: parseInt(finalRow) - 1,
                            col: finalCol.charCodeAt(0) - 65,
                            name: finalName
                        },
                        student2: {
                            row: exchangeResult.row,
                            col: exchangeResult.col,
                            name: exchangeResult.student.name
                        }
                    }
                });
                
                document.dispatchEvent(exchangeEvent);
                
                // 交換された2つの座席を光らせる！
                this.highlightSeats([
                    {
                        row: parseInt(finalRow) - 1,
                        col: finalCol.charCodeAt(0) - 65
                    },
                    {
                        row: exchangeResult.row,
                        col: exchangeResult.col
                    }
                ]);
                
                saveToLocalStorage();
                
                // メッセージの更新
                this.messageSpace.style.opacity = '0';
                this.messageSpace.innerHTML = `
                    ${finalName}さんと${exchangeResult.student.name}さんの座席が入れ替わりました！<br>
                    運命の交換イベント成功！
                `;
                
                setTimeout(() => {
                    this.messageSpace.style.transition = 'opacity 0.5s';
                    this.messageSpace.style.opacity = '1';
                    this.nextButton.disabled = false;
                    this.nextButton.style.opacity = '1';
                    this.nextButton.style.cursor = 'pointer';
                }, 100);
            }
        } else {
            // 交換がない場合は通常メッセージを再表示
            this.messageSpace.style.opacity = '1';
            this.messageSpace.innerHTML = fortuneMessage.replace(/\n/g, '<br>');
            
            // 通常の結果表示後にボタンを有効化
            this.nextButton.disabled = false;
            this.nextButton.style.opacity = '1';
            this.nextButton.style.cursor = 'pointer';
        }
    }



    stop() {
        if (this.isRunning) {
            this.currentAnimations.forEach((animId, index) => {
                if (animId) {
                    cancelAnimationFrame(animId);
                    this.currentAnimations[index] = null;
                }
            });
        }
        this.hide();
    }

    next() {
        // 交換スロットがあれば削除
        const exchangeSlot = this.overlay.querySelector('.exchange-slot-container');
        if (exchangeSlot) {
            exchangeSlot.remove();
        }
        
        this.reunionEventInProgress = false;
        this.hide();
        this.messageSpace.textContent = '';
        this.nextButton.style.display = 'none';
        
        // ラストワンチャレンジのクラスもリセット
        this.container.classList.remove('last-one-challenge');
        
        const event = new CustomEvent('nextSlot');
        document.dispatchEvent(event);
    }
    
    async playExchangeEffect() {
        // ★Phase 3:交換のシュッ音
        if (window.soundManager) window.soundManager.exchangeSwoosh();

        const overlay = document.createElement('div');
        overlay.className = 'special-effect-overlay exchange';

        const container = document.createElement('div');
        container.className = 'special-effect-container';

        const messageDiv = document.createElement('div');
        messageDiv.className = 'special-effect-message exchange';
        messageDiv.textContent = '運命の席替え発動！！';

        container.appendChild(messageDiv);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // 3秒後に演出を終了
        await new Promise(resolve => setTimeout(resolve, 3000));
        overlay.remove();
    }

    // 交換イベントが発生するかチェック
    shouldTriggerExchange() {
        const probability = localStorage.getItem('exchangeEventProbability');
        this.exchangeProbability = probability !== null ? parseInt(probability) : 5;
        return Math.random() * 100 < this.exchangeProbability;
    }
    
    // 再会イベントが発生するかチェック
    shouldTriggerReunion() {
        // 保存された確率を使用
        const prob = parseInt(localStorage.getItem('reunionEventProbability')) || 5;
        return Math.random() * 100 < prob;
    }

    // ラストワンかどうかをチェック
    isLastStudent() {
        const assignedCount = seatingData.assignments.flat().filter(a => a !== null).length;
        const enabledSeats = seatingData.seats.flat().filter(seat => seat.enabled).length;
        return assignedCount === enabledSeats - 1; // 最後の一人
    }

    // 既に決まっている座席を取得
    getOccupiedSeats() {
        const occupied = [];
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (seatingData.assignments[row][col]) {
                    occupied.push({ row, col });
                }
            }
        }
        return occupied;
    }

    // 空席を取得
    getEmptySeats() {
        const empty = [];
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const seat = seatingData.seats[row][col];
                if (seat.enabled && !seatingData.assignments[row][col]) {
                    empty.push({ row, col });
                }
            }
        }
        return empty;
    }

    // ラストワンチャレンジのメイン処理 ★Phase 3:カウントダウン演出+音響
    async playLastOneChallenge(lastStudentName) {
        this.show();
        this.container.classList.add('last-one-challenge');

        // ─── 1. ファンファーレ+導入 ──────────────────
        if (window.soundManager) window.soundManager.lastOneFanfare();

        const overlay = document.createElement('div');
        overlay.className = 'special-effect-overlay last-one';
        const container = document.createElement('div');
        container.className = 'special-effect-container';
        const messageDiv = document.createElement('div');
        messageDiv.className = 'special-effect-message last-one';
        messageDiv.innerHTML = 'ラストワン<br>チャレンジ！';
        container.appendChild(messageDiv);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        await new Promise(resolve => setTimeout(resolve, 2500));

        // ─── 2. カウントダウン演出 ──────────────────
        for (let n = 3; n >= 1; n--) {
            messageDiv.innerHTML = `<span style="font-size:140px;">${n}</span>`;
            if (window.soundManager) window.soundManager.countdownBeep(false);
            await new Promise(resolve => setTimeout(resolve, 700));
        }
        messageDiv.innerHTML = `<span style="font-size:140px;">GO!!</span>`;
        if (window.soundManager) window.soundManager.countdownBeep(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        overlay.remove();

        // ─── 3. メッセージ表示 ──────────────────────
        this.messageSpace.innerHTML = `
            <div style="font-size: 40px; color: #FFD700; font-weight: bold;">
                ${lastStudentName}さんは最後の一人！<br>
                座席ルーレットで運命の席を奪い取れ！
            </div>
        `;

        await new Promise(resolve => setTimeout(resolve, 1500));

        // ─── 4. ルーレット開始 ──────────────────────
        const occupiedSeats = this.getOccupiedSeats();
        const selectedSeat = await this.rouletteSeatHighlight(occupiedSeats);

        // ─── 5. 結果適用と確定音 ─────────────────────
        if (window.soundManager) window.soundManager.rouletteFinal();

        const sacrificedStudent = seatingData.assignments[selectedSeat.row][selectedSeat.col];
        const emptySeats = this.getEmptySeats();
        const emptySeat = emptySeats[0];

        const lastStudent = seatingData.roster.find(s => s.name === lastStudentName);
        seatingData.assignments[emptySeat.row][emptySeat.col] = sacrificedStudent;
        seatingData.assignments[selectedSeat.row][selectedSeat.col] = lastStudent;

        const colLetter = String.fromCharCode(65 + selectedSeat.col);
        const rowNum = selectedSeat.row + 1;
        const emptyColLetter = String.fromCharCode(65 + emptySeat.col);
        const emptyRowNum = emptySeat.row + 1;

        this.messageSpace.innerHTML = `
            <div style="font-size: 40px; color: #FFD700; font-weight: bold; line-height: 1.8;">
                🎊 ${lastStudentName}さんが${colLetter}${rowNum}の席を奪取！ 🎊<br>
                <span style="color: #FF6B6B;">${sacrificedStudent.name}さんは${emptyColLetter}${emptyRowNum}へ移動...</span><br><br>
                <span style="font-size: 36px;">運命は残酷だ...！</span>
            </div>
        `;

        saveToLocalStorage();
        initializeSeats();

        this.container.classList.remove('last-one-challenge');

        this.nextButton.style.display = 'inline-block';
        this.nextButton.disabled = false;
        this.nextButton.style.opacity = '1';
        this.nextButton.style.cursor = 'pointer';
    }

    // 座席ルーレットのハイライト（揺らぎあり）
    async rouletteSeatHighlight(occupiedSeats) {
        return new Promise(resolve => {
            let currentIndex = 0;
            let speed = 50; // 初期スピード（ミリ秒）
            const maxSpeed = 500; // 最終スピード
            let cycleCount = 0;
            const minCycles = 3; // 最低3周
            
            // ランダムな最終停止位置を事前決定
            const totalCycles = minCycles + Math.floor(Math.random() * 2); // 3〜4周
            const finalIndex = Math.floor(Math.random() * occupiedSeats.length);
            const totalStops = totalCycles * occupiedSeats.length + finalIndex;
            let stopCount = 0;

            const highlight = () => {
                // 前のハイライトを削除
                document.querySelectorAll('.seat.roulette-active').forEach(seat => {
                    seat.classList.remove('roulette-active');
                });

                // 現在の座席をハイライト
                const seat = occupiedSeats[currentIndex];
                const seatElement = document.querySelector(
                    `[data-row="${seat.row}"][data-col="${seat.col}"]`
                );
                
                if (seatElement) {
                    seatElement.classList.add('roulette-active');
                    // ★Phase 3:ルーレット移動音
                    if (window.soundManager) window.soundManager.slotTick();

                    // スクロールして表示
                    seatElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }

                stopCount++;
                currentIndex = (currentIndex + 1) % occupiedSeats.length;
                
                // 1周したらカウント
                if (currentIndex === 0) {
                    cycleCount++;
                }

                // 停止判定
                if (stopCount >= totalStops) {
                    // 最終停止
                    const finalSeat = occupiedSeats[finalIndex];
                    const finalElement = document.querySelector(
                        `[data-row="${finalSeat.row}"][data-col="${finalSeat.col}"]`
                    );
                    
                    if (finalElement) {
                        finalElement.classList.remove('roulette-active');
                        finalElement.classList.add('roulette-final');
                    }
                    
                    setTimeout(() => {
                        resolve(finalSeat);
                    }, 1500);
                    return;
                }

                // スピードを徐々に遅くする（揺らぎを追加）
                const progress = stopCount / totalStops;
                if (progress > 0.6) {
                    // 後半は揺らぎを大きく
                    const baseSpeed = 50 + (maxSpeed - 50) * Math.pow(progress, 2);
                    const fluctuation = (Math.random() - 0.5) * 100; // ±50msの揺らぎ
                    speed = Math.max(50, baseSpeed + fluctuation);
                } else {
                    speed = 50 + (maxSpeed - 50) * Math.pow(progress, 3);
                }

                setTimeout(highlight, speed);
            };

            highlight();
        });
    }
}

// 特殊演出の機能を管理するクラス
class SpecialEffectManager {
    constructor() {
        this.loadProbabilities();
    }

    loadProbabilities() {
        // ローカルストレージから確率を読み込む
        const frontBack = localStorage.getItem('frontBackEventProbability');
        const window = localStorage.getItem('windowEventProbability');
        
        // デフォルト値は20%
        this.frontBackProbability = frontBack !== null ? parseInt(frontBack) : 20;
        this.windowProbability = window !== null ? parseInt(window) : 20;

        console.log('Special effect probabilities loaded:', {
            frontBack: this.frontBackProbability,
            window: this.windowProbability
        });
    }

    shouldTriggerFrontBackEffect() {
        // 確実に最新の設定を使用
        this.loadProbabilities();
        
        if (this.frontBackProbability <= 0) return false;
        const random = Math.random() * 100;
        
        console.log('Front/Back effect check:', {
            probability: this.frontBackProbability,
            randomValue: random,
            willTrigger: random < this.frontBackProbability
        });
        
        return random < this.frontBackProbability;
    }

    shouldTriggerWindowEffect() {
        // 確実に最新の設定を使用
        this.loadProbabilities();
        
        if (this.windowProbability <= 0) return false;
        const random = Math.random() * 100;
        
        console.log('Window effect check:', {
            probability: this.windowProbability,
            randomValue: random,
            willTrigger: random < this.windowProbability
        });
        
        return random < this.windowProbability;
    }

    // 使用可能な座席の前後列を判定
    findEffectiveRows(seats) {
        const usableRows = [];
        for (let row = 0; row < seats.length; row++) {
            for (let col = 0; col < seats[row].length; col++) {
                if (seats[row][col].enabled) {
                    usableRows.push(row + 1);
                    break;
                }
            }
        }
        return {
            first: Math.min(...usableRows),
            last: Math.max(...usableRows)
        };
    }

    async playSpecialEffect(type, message) {
        // ★Phase 3:タイプ別の効果音
        if (window.soundManager) {
            if (type === 'front-back') {
                window.soundManager.frontBackChord();
            } else if (type === 'window') {
                window.soundManager.windowSparkle();
            }
        }

        const overlay = document.createElement('div');
        overlay.className = `special-effect-overlay ${type}`;

        const container = document.createElement('div');
        container.className = 'special-effect-container';

        const messageDiv = document.createElement('div');
        messageDiv.className = `special-effect-message ${type}`;
        messageDiv.textContent = message;

        container.appendChild(messageDiv);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        await new Promise(resolve => setTimeout(resolve, 3000));
        overlay.remove();
    }
}

// スロットのアニメーション(一時停止機能付き) ★Phase 3:音響追加
SlotMachine.prototype.animateSlot = function(slotIndex, items, duration, fixedResult = null) {
    const slot = this.slots[slotIndex].querySelector('.slot-content');
    let startTime = Date.now();
    let pauseStartTime = null;
    let totalPausedTime = 0;
    let isPaused = false;
    let lastDisplayedItem = null;
    const targetItem = fixedResult !== null ? fixedResult : items[Math.floor(Math.random() * items.length)];

    const controller = {
        pause: () => {
            if (!isPaused) {
                isPaused = true;
                pauseStartTime = Date.now();
            }
        },
        resume: () => {
            if (isPaused) {
                isPaused = false;
                totalPausedTime += Date.now() - pauseStartTime;
                pauseStartTime = null;
            }
        }
    };

    return {
        promise: new Promise(resolve => {
            const animate = () => {
                if (isPaused) {
                    this.currentAnimations[slotIndex] = requestAnimationFrame(animate);
                    return;
                }

                const currentTime = Date.now();
                const elapsed = currentTime - startTime - totalPausedTime;
                const progress = elapsed / duration;

                if (progress < 1) {
                    const speed = Math.max(30, 150 * (1 - progress));
                    const currentIndex = Math.floor((elapsed / speed) % items.length);
                    const item = items[currentIndex];
                    if (item !== lastDisplayedItem) {
                        slot.textContent = item;
                        lastDisplayedItem = item;
                        // ★Phase 3:回転中のティック音(間引きはSoundManager側)
                        if (window.soundManager) window.soundManager.slotTick();
                    }
                    this.currentAnimations[slotIndex] = requestAnimationFrame(animate);
                } else {
                    slot.textContent = targetItem;
                    this.currentAnimations[slotIndex] = null;
                    // ★Phase 3:停止時の確定音
                    if (window.soundManager) window.soundManager.slotStop();
                    resolve(targetItem);
                }
            };

            this.currentAnimations[slotIndex] = requestAnimationFrame(animate);
        }),
        controller
    };
};

// グローバルインスタンスを作成

class ShuffleEvent {
    constructor() {
        this.probability = parseInt(localStorage.getItem('shuffleEventProbability')) || 1;
    }

    shouldTrigger() {
        // 毎回確率を最新化
        this.probability = parseInt(localStorage.getItem('shuffleEventProbability')) || 1;
        console.log('Current shuffle probability:', this.probability);
        return Math.random() * 100 < this.probability;
    }

    // Fisher-Yatesシャッフルアルゴリズム
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 生徒が以前の席に配置されていないかチェックする関数
    isStudentInOriginalSeat(student, row, col, originalAssignments) {
        for (let i = 0; i < originalAssignments.length; i++) {
            for (let j = 0; j < originalAssignments[i].length; j++) {
                const originalStudent = originalAssignments[i][j];
                if (originalStudent && originalStudent.name === student.name) {
                    return i === row && j === col;
                }
            }
        }
        return false;
    }

    // 性別制限に適合しているかチェック
    isGenderCompatible(student, seatGender) {
        if (!seatGender) return true;
        return (seatGender === 'male' && student.gender === '男') ||
               (seatGender === 'female' && student.gender === '女');
    }

    // 利用可能な席を探す
    findAvailableSeats(seatSettings, student, originalAssignments) {
        const availableSeats = [];
        for (let row = 0; row < seatSettings.length; row++) {
            for (let col = 0; col < seatSettings[row].length; col++) {
                const seat = seatSettings[row][col];
                if (!seat.enabled) continue;

                const seatGender = seat.properties.gender;
                if (this.isGenderCompatible(student, seatGender) &&
                    !this.isStudentInOriginalSeat(student, row, col, originalAssignments)) {
                    availableSeats.push({ row, col });
                }
            }
        }
        return availableSeats;
    }

    shuffleSeats() {
        // 元の配置を保存
        const originalAssignments = JSON.parse(JSON.stringify(seatingData.assignments));
        
        // 全生徒のリストを作成
        const allStudents = [];
        for (let i = 0; i < originalAssignments.length; i++) {
            for (let j = 0; j < originalAssignments[i].length; j++) {
                const student = originalAssignments[i][j];
                if (student) {
                    allStudents.push(student);
                }
            }
        }

        // 生徒をランダムに並び替え
        this.shuffle(allStudents);

        // 新しい配置を初期化(★ Phase 3バグ修正:7×7→ROWS×COLS)
        const newAssignments = Array(ROWS).fill().map(() => Array(COLS).fill(null));
        const assignedStudents = new Set();

        // 各生徒に対して新しい席を割り当て
        for (const student of allStudents) {
            if (assignedStudents.has(student.name)) continue;

            // 利用可能な席を探す
            const availableSeats = this.findAvailableSeats(
                seatingData.seats,
                student,
                originalAssignments
            );

            if (availableSeats.length > 0) {
                // ランダムに席を選択
                const randomSeatIndex = Math.floor(Math.random() * availableSeats.length);
                const { row, col } = availableSeats[randomSeatIndex];
                
                // 席を割り当て
                newAssignments[row][col] = student;
                assignedStudents.add(student.name);
            }
        }

        // アニメーション用のクラスを追加
        document.querySelectorAll('.seat').forEach(seat => {
            seat.classList.add('shuffling');
        });

        // 新しい配置を適用
        seatingData.assignments = newAssignments;
        
        // 保存して表示を更新
        saveToLocalStorage();
        
        // アニメーション完了後に表示を更新
        setTimeout(() => {
            document.querySelectorAll('.seat').forEach(seat => {
                seat.classList.remove('shuffling');
            });
            initializeSeats();
        }, 1000);
    }

    async playShuffleEffect() {
        // ★Phase 3:不吉な低音ゴング
        if (window.soundManager) window.soundManager.hellGong();

        const overlay = document.createElement('div');
        overlay.className = 'special-effect-overlay hell';

        const container = document.createElement('div');
        container.className = 'special-effect-container hell';

        const messageDiv = document.createElement('div');
        messageDiv.className = 'special-effect-message hell';
        messageDiv.textContent = '地獄の席替え発動！！';

        container.appendChild(messageDiv);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        await new Promise(resolve => setTimeout(resolve, 3000));
        overlay.remove();
    }

    /** ★Phase 3:シャッフル後の余韻演出(モノローグ画面) */
    async playShuffleAftermath() {
        if (window.soundManager) window.soundManager.hellAftermath();

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; inset: 0;
            background: rgba(0, 0, 0, 0.92);
            z-index: 1002;
            display: flex; justify-content: center; align-items: center;
            opacity: 0;
            transition: opacity 0.8s ease;
        `;
        const message = document.createElement('div');
        message.style.cssText = `
            color: #ddd; font-size: 56px; font-weight: bold;
            text-align: center; line-height: 1.6;
            text-shadow: 0 0 20px rgba(139, 0, 0, 0.8);
            letter-spacing: 0.1em;
        `;
        message.innerHTML = '運命が、<br>変わってしまった……';
        overlay.appendChild(message);
        document.body.appendChild(overlay);

        // フェードイン
        await new Promise(r => setTimeout(r, 50));
        overlay.style.opacity = '1';
        // 表示
        await new Promise(r => setTimeout(r, 2800));
        // フェードアウト
        overlay.style.opacity = '0';
        await new Promise(r => setTimeout(r, 800));
        overlay.remove();
    }
}

// グローバルインスタンスを作成
window.shuffleEvent = new ShuffleEvent();
window.slotMachine = new SlotMachine();
window.slotMachine.effectManager = new SpecialEffectManager();
