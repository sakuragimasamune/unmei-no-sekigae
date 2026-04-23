// 席替え占いのデフォルトメッセージと点数のデータ
const defaultFortuneSet = {
    name: "デフォルト占いセット",
    messages: [
        { score: 100, message: "大吉！この席はあなたのラッキーシート！テストの点数がグンと上がりそう！" },
        { score: 95, message: "絶好調！前よりも授業に集中できる特別な席です。新しい発見がありそう！" },
        { score: 90, message: "この席からクラスのムードメーカーに！みんなの成績アップに貢献できるかも！" },
        { score: 90, message: "先生の声がよく聞こえる最高の場所！どんな難問も解けちゃいそう！" },
        { score: 85, message: "黒板がよく見える席をゲット！図形の問題もバッチリ解けそう！" },
        { score: 85, message: "周りの人と相性バツグン！グループワークが楽しくなりそうな予感！" },
        { score: 85, message: "インスピレーションが湧きやすい席！創造的な答えが思い浮かびそう！" },
        { score: 80, message: "集中力アップの強運席！難しい問題も解けちゃうかも！" },
        { score: 80, message: "質問しやすい絶好のポジション！分からないことがすぐ解決！" },
        { score: 80, message: "メモを取るのが楽しくなる席！ノートが自然とキレイに！" },
        { score: 75, message: "クラスの人気者になれる席！楽しい学校生活になりそう！" },
        { score: 75, message: "新しい友達ができやすい席！素敵な出会いがありそう！" },
        { score: 75, message: "朝から元気になれる席！1日中テンションが高く維持できそう！" },
        { score: 70, message: "アイデアが湧き出る席！独創的な答えを見つけられるかも！" },
        { score: 70, message: "記憶力アップの予感！テスト前の暗記が捗りそう！" },
        { score: 70, message: "考える力が高まる席！難問も論理的に解けそう！" },
        { score: 65, message: "コミュニケーション運が高まる席！クラスの輪が広がりそう！" },
        { score: 65, message: "勉強運アップ！分からない問題も理解できるように！" },
        { score: 65, message: "先生との相性バッチリ！質問タイミングが掴めそう！" },
        { score: 60, message: "リラックスできる席！テスト本番でも実力発揮できそう！" },
        { score: 60, message: "プレゼン力が高まる席！発表が得意になりそう！" },
        { score: 60, message: "聞き上手になれる席！授業の理解度がグッと上がる！" },
        { score: 55, message: "直感が冴える席！なんとなく答えが分かるように！" },
        { score: 55, message: "読書運が高まる席！本の内容がスッと頭に入りそう！" },
        { score: 55, message: "計算力アップの席！数学の問題がスラスラ解けそう！" },
        { score: 50, message: "集中力が安定する席！長時間の学習も楽々！" },
        { score: 50, message: "スポーツの話題で盛り上がれる席！体育の時間が待ち遠しい！" },
        { score: 50, message: "音楽の才能が開花しそうな席！音楽の時間が楽しみに！" },
        { score: 45, message: "休み時間が楽しくなる席！新しい趣味が見つかるかも！" },
        { score: 45, message: "アート感性が磨かれる席！図工や美術が得意に！" },
        { score: 1, message: "ラッキー！実はこの席、隠れた才能が目覚める特別な場所かも...！" },
        // 新しい追加メッセージ
        { score: 99, message: "運命の席、発見！？" },
        { score: 96, message: "この席が、あなたのラッキースポットになるかも？" },
        { score: 95, message: "今日はこの席で、どんな奇跡が起こるかな？" },
        { score: 94, message: "教室の真ん中で、みんなの中心になろう！" },
        { score: 93, message: "集中力アップ！この席で成績も急上昇？" },
        { score: 93, message: "この席が、あなたの特別な場所になるかも？" },
        { score: 92, message: "前の席で、先生の熱意をダイレクトにキャッチ！" },
        { score: 92, message: "この席が、あなたの幸運の席になるかも？" },
        { score: 91, message: "この席で、最高の自分を表現しよう！" },
        { score: 90, message: "この席で、最高のパフォーマンスを発揮しよう！" },
        { score: 90, message: "この席から、希望の光が見えるかも？" },
        { score: 89, message: "気分一新！新しい席で、気持ちも新たに！" },
        { score: 89, message: "この席が、あなたの成長の場となるかも？" },
        { score: 89, message: "この席から、未来への扉が開くかも？" },
        { score: 89, message: "この席で、最高の時間を過ごそう！" },
        { score: 88, message: "新しい席で、新しい出会いがありますように！" },
        { score: 88, message: "新しい席で、いつもと違う自分を発見！" },
        { score: 88, message: "新しい席で、心機一転頑張ろう！" },
        { score: 88, message: "新しい席で、モチベーションアップ！" },
        { score: 88, message: "新しい席で、やる気スイッチオン！" },
        { score: 87, message: "この席から、新しい世界が広がるかも？" },
        { score: 87, message: "新しい席で、友情を深めよう！" },
        { score: 87, message: "新しい席で、可能性を広げよう！" },
        { score: 86, message: "この席で、新たな才能が開花するかも？" },
        { score: 86, message: "この席で、素敵な思い出を作ろう！" },
        { score: 85, message: "今日はこの席で、どんな出会いが待っているかな？" },
        { score: 85, message: "今日はこの席で、どんな成長があるかな？" },
        { score: 84, message: "隣の人と、お互いの夢を語り合おう！" },
        { score: 77, message: "隣の人と仲良くなれるチャンス！" },
        { score: 77, message: "今日はこの席で、どんな感動が待っているかな？" },
        { score: 76, message: "今日はこの席で、どんなひらめきがあるかな？" },
        { score: 76, message: "隣の人と、一緒に目標に向かって頑張ろう！" },
        { score: 75, message: "今日はこの席で、どんなドラマが生まれるかな？" },
        { score: 75, message: "新しい席で、視野を広げよう！" },
        { score: 74, message: "隣の人と、協力して課題に取り組もう！" },
        { score: 74, message: "隣の人と、笑顔で挨拶を交わそう！" },
        { score: 73, message: "窓際の席で、心地よい風を感じよう！" },
        { score: 73, message: "隣の人と、助け合って課題をクリアしよう！" },
        { score: 72, message: "隣の人と、楽しいおしゃべりで盛り上がろう！" },
        { score: 71, message: "困ったことがあったら、隣の人に相談してみよう！" },
        { score: 71, message: "たまには違う席で、新しい刺激を受けよう！" },
        { score: 67, message: "この席から、素晴らしい景色が見えるかも？" },
        { score: 64, message: "今日はこの席で、どんな発見があるかな？" },
        { score: 63, message: "今日はこの席で、どんな学びがあるかな？" },
        { score: 62, message: "たまには違う席で、リラックスして授業を受けよう！" },
        { score: 61, message: "この席から、教室全体を見渡してみよう！" },
        { score: 60, message: "たまには違う席で、新鮮な気持ちを味わおう！" },
        { score: 59, message: "たまには違う席で、気分転換も大切！" },
        { score: 58, message: "後ろの席から、みんなの様子を観察してみよう！" }
    ]
};

// 現在使用中の占いセット
let currentFortuneSet = { ...defaultFortuneSet };

// メッセージ編集UIを表示
function showMessageEditor() {
    const editor = document.querySelector('.fortune-message-editor');
    if (!editor) {
        console.warn('Fortune message editor not found');
        return;
    }
    editor.style.display = 'block';
    refreshMessageList();
}

// メッセージリストの更新
function refreshMessageList() {
    const messageList = document.querySelector('.message-list');
    if (!messageList) {
        console.warn('Message list element not found');
        return;
    }
    messageList.innerHTML = '';
    
    currentFortuneSet.messages.forEach((message, index) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-row';
        messageDiv.innerHTML = `
            <div class="message-content">
                <input type="number" class="score-input" value="${message.score}" min="1" max="100">
                <input type="text" class="message-input" value="${message.message}">
                <button class="edit-btn btn">更新</button>
                <button class="delete-btn btn">削除</button>
            </div>
        `;

        // 更新ボタンのイベントリスナー
        messageDiv.querySelector('.edit-btn').addEventListener('click', () => {
            const newScore = parseInt(messageDiv.querySelector('.score-input').value);
            const newMessage = messageDiv.querySelector('.message-input').value;
            
            if (newScore && newMessage) {
                currentFortuneSet.messages[index] = {
                    score: newScore,
                    message: newMessage
                };
                refreshMessageList();
                saveCustomFortune();
            }
        });

        // 削除ボタンのイベントリスナー
        messageDiv.querySelector('.delete-btn').addEventListener('click', () => {
            if (confirm('このメッセージを削除してもよろしいですか？')) {
                currentFortuneSet.messages.splice(index, 1);
                refreshMessageList();
                saveCustomFortune();
            }
        });

        messageList.appendChild(messageDiv);
    });
}

// カスタム占いセットの保存
function saveCustomFortune() {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_FORTUNE, JSON.stringify(currentFortuneSet));
    updateFortuneInfo();
}

// LocalStorageのキー定数
const STORAGE_KEYS = {
    FORTUNE_TYPE: 'fortuneType',
    CUSTOM_FORTUNE: 'customFortune'
};

// ファイルアップロードのハンドラ
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const fortuneSet = JSON.parse(text);
        
        // バリデーション
        if (!isValidFortuneSet(fortuneSet)) {
            throw new Error('Invalid fortune set format');
        }

        currentFortuneSet = fortuneSet;
        localStorage.setItem(STORAGE_KEYS.CUSTOM_FORTUNE, JSON.stringify(fortuneSet));
        updateFortuneInfo();
    } catch (error) {
        alert('占いセットの読み込みに失敗しました。ファイル形式を確認してください。');
        console.error('ファイル読み込みエラー:', error);
        e.target.value = '';
    }
}

// 占いセットのバリデーション
function isValidFortuneSet(fortuneSet) {
    if (!fortuneSet.name || !Array.isArray(fortuneSet.messages)) {
        return false;
    }

    return fortuneSet.messages.every(message => 
        typeof message === 'object' &&
        typeof message.score === 'number' &&
        typeof message.message === 'string' &&
        message.score >= 0 &&
        message.score <= 100
    );
}

// 情報の更新
function updateFortuneInfo() {
    const fortuneNameElement = document.getElementById('current-fortune-name');
    const messageCountElement = document.getElementById('message-count');
    const scoreRangeElement = document.getElementById('score-range');

    if (currentFortuneSet && currentFortuneSet.messages) {
        fortuneNameElement.textContent = currentFortuneSet.name || 'デフォルト';
        messageCountElement.textContent = currentFortuneSet.messages.length;
        
        if (currentFortuneSet.messages.length > 0) {
            const scores = currentFortuneSet.messages.map(m => m.score);
            const minScore = Math.min(...scores);
            const maxScore = Math.max(...scores);
            scoreRangeElement.textContent = `${minScore}-${maxScore}`;
        } else {
            scoreRangeElement.textContent = '0-0';
        }
    }
}

// メッセージ設定モーダルの制御
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('message-modal');
    const fileInput = document.getElementById('fortune-file');
    const fileControls = document.querySelector('.fortune-file-controls');

    // 初期設定の読み込み
    const savedType = localStorage.getItem(STORAGE_KEYS.FORTUNE_TYPE) || 'default';
    const fortuneTypeRadios = document.getElementsByName('fortune-type');
    
    // 保存された占いタイプを設定
    document.querySelector(`input[name="fortune-type"][value="${savedType}"]`).checked = true;
    fileControls.style.display = savedType === 'custom' ? 'block' : 'none';

    // イベントリスナーの設定
    fortuneTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const type = e.target.value;
            fileControls.style.display = type === 'custom' ? 'block' : 'none';
            
            if (type === 'default') {
                currentFortuneSet = { ...defaultFortuneSet };
                updateFortuneInfo();
            }
            localStorage.setItem(STORAGE_KEYS.FORTUNE_TYPE, type);
        });
    });

    // ファイル読み込み
    fileInput.addEventListener('change', handleFileUpload);

    // 現在の占いセットをダウンロード
    document.getElementById('download-current').addEventListener('click', () => {
        const dataStr = JSON.stringify(currentFortuneSet, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentFortuneSet.name || 'fortune-set'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // 新規作成
    document.getElementById('create-new').addEventListener('click', () => {
        const name = prompt('新しい占いセットの名前を入力してください：');
        if (!name) return;

        currentFortuneSet = {
            name: name,
            messages: []
        };
        
        // メッセージ編集UIを表示
        showMessageEditor();
        localStorage.setItem(STORAGE_KEYS.CUSTOM_FORTUNE, JSON.stringify(currentFortuneSet));
        updateFortuneInfo();
    });

    // 新規メッセージ追加ボタンのイベントリスナー
    document.getElementById('add-message').addEventListener('click', () => {
        const newMessage = {
            score: 50,  // デフォルト値
            message: ""
        };
        
        currentFortuneSet.messages.push(newMessage);
        refreshMessageList();
        
        // 新しく追加したメッセージの入力欄にフォーカス
        const inputs = document.querySelectorAll('.message-input');
        inputs[inputs.length - 1].focus();
    });

    // メッセージ一覧を編集モードで表示するボタン
    document.getElementById('edit-messages').addEventListener('click', () => {
        showMessageEditor();
    });

    // 保存ボタン
    document.getElementById('message-save').addEventListener('click', () => {
        const fortuneType = document.querySelector('input[name="fortune-type"]:checked').value;
        localStorage.setItem(STORAGE_KEYS.FORTUNE_TYPE, fortuneType);
        if (fortuneType === 'custom') {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_FORTUNE, JSON.stringify(currentFortuneSet));
        }
        modal.style.display = 'none';
        document.querySelector('.fortune-message-editor').style.display = 'none';
    });

    // キャンセルボタン
    document.getElementById('message-cancel').addEventListener('click', () => {
        const savedType = localStorage.getItem(STORAGE_KEYS.FORTUNE_TYPE) || 'default';
        document.querySelector(`input[name="fortune-type"][value="${savedType}"]`).checked = true;
        fileControls.style.display = savedType === 'custom' ? 'block' : 'none';
        
        if (savedType === 'custom') {
            const savedCustomFortune = localStorage.getItem(STORAGE_KEYS.CUSTOM_FORTUNE);
            if (savedCustomFortune) {
                currentFortuneSet = JSON.parse(savedCustomFortune);
            }
        } else {
            currentFortuneSet = { ...defaultFortuneSet };
        }
        updateFortuneInfo();
        modal.style.display = 'none';
        document.querySelector('.fortune-message-editor').style.display = 'none';
    });

    // カスタム占いセットが選択されているときの初期ロード
    if (savedType === 'custom') {
        const savedCustomFortune = localStorage.getItem(STORAGE_KEYS.CUSTOM_FORTUNE);
        if (savedCustomFortune) {
            try {
                currentFortuneSet = JSON.parse(savedCustomFortune);
            } catch (error) {
                console.error('保存された占いセットの読み込みに失敗:', error);
                currentFortuneSet = { ...defaultFortuneSet };
            }
        }
    }

    // 初期表示時の更新
    updateFortuneInfo();
});

// ランダムに占い結果を取得する関数
window.getRandomFortune = function() {
    const messages = currentFortuneSet.messages;
    if (!messages || messages.length === 0) return defaultFortuneSet.messages[0];
    return messages[Math.floor(Math.random() * messages.length)];
};

// 占い結果を表示する関数
window.displayFortune = function(studentName, seatPosition) {
    const fortune = window.getRandomFortune();
    return `${studentName}さんは${seatPosition}に決定！\n★ 席替え占い ${fortune.score}点 ★\n${fortune.message}`;
};