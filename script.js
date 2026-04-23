// ============================================================
// 座席配置システム メインスクリプト
// Phase 1リファクタリング版:定数化・重複削除・バグ修正
// ============================================================

// ─── グリッドサイズの定数定義 ───────────────────────────────
// 列・行を変えたい時はここだけ書き換えればOK
const ROWS = 7;
const COLS = 8;

// ─── モードの定数定義 ────────────────────────────────────────
const MODE = {
    NORMAL: 'normal',
    SEAT: 'seat',
    GENDER_CLEAR: 'gender_clear',
    GENDER_MALE: 'gender_male',
    GENDER_FEMALE: 'gender_female'
};

// ─── ヘルパー:空のグリッドを生成 ─────────────────────────────
function createEmptySeats() {
    return Array(ROWS).fill().map(() => Array(COLS).fill().map(() => ({
        enabled: true,
        restrictions: [],
        properties: {}
    })));
}

function createEmptyAssignments() {
    return Array(ROWS).fill().map(() => Array(COLS).fill(null));
}

// ─── グローバル状態 ──────────────────────────────────────────
let currentMode = MODE.NORMAL;
let isSettingMode = false;
let isTeacherView = false;

let colorSettings = {
    enableGenderColors: false,
    defaultColor: '#e3f2fd',
    maleColor: '#f5d682',
    femaleColor: '#b4faaf',
    customColors: []
};

let seatingData = {
    seats: createEmptySeats(),
    assignments: createEmptyAssignments(),
    roster: []
};

// ============================================================
// メイン:DOMContentLoaded(統一)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // ─── DOM要素の取得 ───────────────────────────────────────
    const seatingGrid = document.getElementById('seating-grid');
    const settingBtn = document.getElementById('seat-setting-btn');
    const settingAlert = document.getElementById('setting-mode-alert');
    const rosterModal = document.getElementById('roster-modal');
    const rosterBtn = document.getElementById('roster-btn');
    const messageModal = document.getElementById('message-modal');
    const messageBtn = document.getElementById('message-settings-btn');
    const teacherViewBtn = document.getElementById('teacher-view-btn');
    const genderSettingBtn = document.getElementById('gender-setting-btn');
    const genderSubbuttons = document.getElementById('gender-subbuttons');
    const clearGenderBtn = document.getElementById('clear-gender-btn');
    const maleSeatBtn = document.getElementById('male-seat-btn');
    const femaleSeatBtn = document.getElementById('female-seat-btn');

    // ─── 保存済みカラー設定の復元 ────────────────────────────
    const savedColorSettings = localStorage.getItem('colorSettings');
    if (savedColorSettings) {
        colorSettings = JSON.parse(savedColorSettings);
        document.getElementById('enable-gender-colors').checked = colorSettings.enableGenderColors;
    }

    // ─── 性別設定ボタン ───────────────────────────────────────
    genderSettingBtn.addEventListener('click', () => {
        const isActive = genderSettingBtn.classList.contains('active');

        // 他モードを解除
        settingBtn.classList.remove('active');
        currentMode = MODE.NORMAL;

        genderSettingBtn.classList.toggle('active');
        genderSubbuttons.style.display = !isActive ? 'flex' : 'none';

        [clearGenderBtn, maleSeatBtn, femaleSeatBtn].forEach(btn =>
            btn.classList.remove('active')
        );
        settingAlert.style.display = 'none';
    });

    // サブボタンの設定
    function setupSubButton(btn, mode) {
        btn.addEventListener('click', () => {
            if (currentMode === mode) {
                currentMode = MODE.NORMAL;
                btn.classList.remove('active');
                settingAlert.style.display = 'none';
            } else {
                currentMode = mode;
                [clearGenderBtn, maleSeatBtn, femaleSeatBtn].forEach(b =>
                    b.classList.remove('active')
                );
                btn.classList.add('active');
                settingAlert.style.display = 'block';
                settingAlert.textContent = getModeMessage(mode);
            }
        });
    }
    setupSubButton(clearGenderBtn, MODE.GENDER_CLEAR);
    setupSubButton(maleSeatBtn, MODE.GENDER_MALE);
    setupSubButton(femaleSeatBtn, MODE.GENDER_FEMALE);

    function getModeMessage(mode) {
        switch (mode) {
            case MODE.GENDER_CLEAR: return '性別指定解除モード: クリックで性別指定を解除します';
            case MODE.GENDER_MALE:  return '男子席設定モード: クリックで男子席に設定します';
            case MODE.GENDER_FEMALE: return '女子席設定モード: クリックで女子席に設定します';
            default: return '';
        }
    }

    // 座席設定ボタン(性別設定との排他)
    settingBtn.addEventListener('click', () => {
        // 性別モードを閉じる
        genderSettingBtn.classList.remove('active');
        genderSubbuttons.style.display = 'none';

        if (currentMode === MODE.SEAT) {
            currentMode = MODE.NORMAL;
            settingBtn.classList.remove('active');
            settingAlert.style.display = 'none';
        } else {
            currentMode = MODE.SEAT;
            settingBtn.classList.add('active');
            settingAlert.style.display = 'block';
            settingAlert.textContent = '座席設定モード: クリックで座席の利用可否を切り替えできます';
        }
    });

    // ─── 教員視点切り替え ────────────────────────────────────
    teacherViewBtn.addEventListener('click', () => {
        isTeacherView = !isTeacherView;
        teacherViewBtn.classList.toggle('active');
        initializeSeats();
    });

    // ─── 名簿ボタン(統一版:旧2箇所のリスナーを1つに) ──────
    rosterBtn.addEventListener('click', () => {
        const rosterTextarea = document.getElementById('roster-input');
        rosterTextarea.value = seatingData.roster.map(student => {
            const parts = [];
            if (student.number) parts.push(student.number);
            parts.push(student.name);
            if (student.gender) parts.push(student.gender);
            if (student.furigana) parts.push(student.furigana);
            return parts.join('\t');
        }).join('\n');
        rosterModal.style.display = 'flex';
    });

    document.getElementById('roster-cancel').addEventListener('click', () => {
        rosterModal.style.display = 'none';
    });

    document.getElementById('roster-save').addEventListener('click', () => {
        const rosterInput = document.getElementById('roster-input');
        seatingData.roster = processRoster(rosterInput.value);
        saveToLocalStorage();
        rosterModal.style.display = 'none';
    });

    // ─── 特殊演出設定モーダル ────────────────────────────────
    const effectSettingsBtn = document.getElementById('effect-settings-btn');
    effectSettingsBtn.addEventListener('click', () => {
        document.getElementById('effect-modal').style.display = 'flex';
        ['front-back', 'window', 'exchange', 'reunion', 'shuffle'].forEach(updateSliderDisplay);
        const lastOneEnabled = localStorage.getItem('lastOneChallengeEnabled');
        document.getElementById('last-one-challenge-enabled').checked =
            lastOneEnabled === 'true' || lastOneEnabled === null;
    });

    document.getElementById('effect-settings-cancel').addEventListener('click', () => {
        document.getElementById('effect-modal').style.display = 'none';
    });

    document.getElementById('effect-settings-save').addEventListener('click', () => {
        const types = {
            'front-back': 'frontBackEventProbability',
            'window': 'windowEventProbability',
            'exchange': 'exchangeEventProbability',
            'reunion': 'reunionEventProbability',
            'shuffle': 'shuffleEventProbability'
        };
        Object.entries(types).forEach(([type, storageKey]) => {
            const value = document.getElementById(`${type}-slider`).value;
            localStorage.setItem(storageKey, value);
        });
        const lastOneEnabled = document.getElementById('last-one-challenge-enabled').checked;
        localStorage.setItem('lastOneChallengeEnabled', lastOneEnabled);

        if (window.slotMachine && window.slotMachine.effectManager) {
            window.slotMachine.effectManager.loadProbabilities();
        }
        document.getElementById('effect-modal').style.display = 'none';
    });

    function updateSliderDisplay(type) {
        const slider = document.getElementById(`${type}-slider`);
        const valueDisplay = document.getElementById(`${type}-value`);
        if (!slider || !valueDisplay) return;

        const config = {
            'front-back': { default: 20, max: 100, storageKey: 'frontBackEventProbability' },
            'window':     { default: 20, max: 100, storageKey: 'windowEventProbability' },
            'exchange':   { default: 5,  max: 20,  storageKey: 'exchangeEventProbability' },
            'reunion':    { default: 5,  max: 20,  storageKey: 'reunionEventProbability' },
            'shuffle':    { default: 1,  max: 2,   storageKey: 'shuffleEventProbability' }
        };
        const savedValue = localStorage.getItem(config[type].storageKey);
        const value = savedValue !== null ? parseInt(savedValue) : config[type].default;
        slider.max = config[type].max;
        slider.value = value;
        valueDisplay.textContent = `${value}%`;

        slider.removeEventListener('input', sliderInputHandler);
        slider.addEventListener('input', sliderInputHandler);
    }
    function sliderInputHandler(e) {
        const type = e.target.id.replace('-slider', '');
        const valueDisplay = document.getElementById(`${type}-value`);
        if (valueDisplay) valueDisplay.textContent = `${e.target.value}%`;
    }
    ['front-back', 'window', 'exchange', 'reunion', 'shuffle'].forEach(updateSliderDisplay);

    // ─── サウンド設定モーダル(Phase 3で本体実装) ──────────
    const soundSettingsBtn = document.getElementById('sound-settings-btn');
    if (soundSettingsBtn) {
        soundSettingsBtn.addEventListener('click', () => {
            document.getElementById('sound-modal').style.display = 'flex';
            const enabled = localStorage.getItem('soundEnabled') !== 'false';
            const volume = parseInt(localStorage.getItem('soundVolume') || '50');
            document.getElementById('sound-enabled').checked = enabled;
            document.getElementById('sound-volume').value = volume;
            document.getElementById('sound-volume-value').textContent = `${volume}%`;
        });

        document.getElementById('sound-volume').addEventListener('input', (e) => {
            document.getElementById('sound-volume-value').textContent = `${e.target.value}%`;
        });

        document.getElementById('sound-settings-cancel').addEventListener('click', () => {
            document.getElementById('sound-modal').style.display = 'none';
        });
        document.getElementById('sound-settings-save').addEventListener('click', () => {
            localStorage.setItem('soundEnabled', document.getElementById('sound-enabled').checked);
            localStorage.setItem('soundVolume', document.getElementById('sound-volume').value);
            // SoundManagerに反映(存在すれば)
            if (window.soundManager) {
                window.soundManager.refresh();
            }
            document.getElementById('sound-modal').style.display = 'none';
        });
    }

    // ─── スロット開始 ────────────────────────────────────────
    document.getElementById('start-slot-btn').addEventListener('click', startSlot);
    document.addEventListener('nextSlot', startSlot);

    // ─── 座席決定イベント ─────────────────────────────────────
    document.addEventListener('seatDecided', async (event) => {
        const { name, col, row } = event.detail;
        const student = seatingData.roster.find(s => s.name === name);
        const seatData = seatingData.seats[row][col];

        // ★Phase 3:当選チャイム
        if (window.soundManager) window.soundManager.winChime();

        highlightSelectedSeat(row, col);

        const seatGender = seatData.properties.gender;
        const studentGender = student.gender;
        if (seatGender) {
            const isValidAssignment =
                (seatGender === 'male'   && studentGender === '男') ||
                (seatGender === 'female' && studentGender === '女');
            if (!isValidAssignment) {
                alert('この席は性別指定があるため、割り当てできません。もう一度抽選します。');
                startSlot();
                return;
            }
        }

        seatingData.assignments[row][col] = student;
        saveToLocalStorage();
        initializeSeats();

        if (isAllSeatsAssigned()) {
            handleCompletion();
            return;
        }

        if (!window.slotMachine.reunionEventInProgress) {
            const reunionResult = await checkReunionEvent(student, { row, col });
            if (reunionResult && reunionResult.success) {
                window.slotMachine.highlightReunionSeats([
                    reunionResult.newSeat,
                    reunionResult.partnerSeat
                ]);
            } else if (!reunionResult) {
                document.dispatchEvent(new Event('seatConfirmed'));
            }
        }
    });

    // ─── 座席交換イベント ─────────────────────────────────────
    document.addEventListener('seatExchanged', (event) => {
        const { student1, student2 } = event.detail;
        const student1Info = seatingData.roster.find(s => s.name === student1.name);
        const student2Info = seatingData.roster.find(s => s.name === student2.name);
        seatingData.assignments[student2.row][student2.col] = student1Info;
        seatingData.assignments[student1.row][student1.col] = student2Info;
        saveToLocalStorage();
        initializeSeats();
    });

    // ─── 設定保存・読み込み ───────────────────────────────────
    document.getElementById('save-config-btn').addEventListener('click', exportConfiguration);
    document.getElementById('load-config-btn').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) importConfiguration(file);
        };
        input.click();
    });

    // ─── カラー設定モーダル ───────────────────────────────────
    document.getElementById('color-settings-btn').addEventListener('click', () => {
        document.getElementById('color-modal').style.display = 'flex';
        loadColorSettings();
    });
    document.getElementById('color-settings-cancel').addEventListener('click', () => {
        document.getElementById('color-modal').style.display = 'none';
    });
    document.getElementById('add-color').addEventListener('click', () => {
        const customColors = document.getElementById('custom-colors');
        const colorSetDiv = document.createElement('div');
        colorSetDiv.className = 'custom-color-set';
        colorSetDiv.innerHTML = `
            <input type="text" placeholder="グループ名" class="color-name">
            <input type="color" class="color-value">
            <button class="remove-color">削除</button>
        `;
        colorSetDiv.querySelector('.remove-color').addEventListener('click', () => colorSetDiv.remove());
        customColors.appendChild(colorSetDiv);
    });
    document.getElementById('color-settings-save').addEventListener('click', () => {
        colorSettings.enableGenderColors = document.getElementById('enable-gender-colors').checked;
        colorSettings.defaultColor = document.getElementById('default-color').value;
        colorSettings.maleColor = document.getElementById('male-color').value;
        colorSettings.femaleColor = document.getElementById('female-color').value;
        colorSettings.customColors = [];
        document.querySelectorAll('.custom-color-set').forEach(set => {
            const name = set.querySelector('.color-name').value;
            const color = set.querySelector('.color-value').value;
            if (name) colorSettings.customColors.push({ name, color });
        });
        localStorage.setItem('colorSettings', JSON.stringify(colorSettings));
        document.getElementById('color-modal').style.display = 'none';
        initializeSeats();
    });

    // ─── メッセージ設定 ───────────────────────────────────────
    if (messageBtn) {
        messageBtn.addEventListener('click', () => { messageModal.style.display = 'flex'; });
    }
    document.getElementById('message-cancel').addEventListener('click', () => {
        messageModal.style.display = 'none';
    });
    document.getElementById('message-save').addEventListener('click', () => {
        const fortuneType = document.querySelector('input[name="fortune-type"]:checked').value;
        localStorage.setItem('fortuneType', fortuneType);
        messageModal.style.display = 'none';
    });
    const savedFortuneType = localStorage.getItem('fortuneType') || 'default';
    document.querySelector(`input[name="fortune-type"][value="${savedFortuneType}"]`).checked = true;
    const fileControls = document.querySelector('.fortune-file-controls');
    fileControls.style.display = savedFortuneType === 'custom' ? 'block' : 'none';

    // ─── 座席クリア ───────────────────────────────────────────
    document.getElementById('clear-btn').addEventListener('click', () => {
        if (window.confirm('座席の割り当てをすべてクリアしますか?')) {
            seatingData.assignments = createEmptyAssignments();
            saveToLocalStorage();
            initializeSeats();
        }
    });

    // ─── データ全削除 ─────────────────────────────────────────
    document.getElementById('clear-storage-btn').addEventListener('click', () => {
        if (confirm('全ての設定とデータを削除します。この操作は取り消せません。\n本当によろしいですか?')) {
            localStorage.clear();
            location.reload();
        }
    });

    // ─── 初期化 ───────────────────────────────────────────────
    loadFromLocalStorage();
    initializeSeats();
});

// ============================================================
// 座席初期化と表示
// ============================================================
function initializeSeats() {
    const seatingGrid = document.getElementById('seating-grid');
    const teacherDesk = document.querySelector('.teacher-desk');
    seatingGrid.innerHTML = '';
    teacherDesk.style.order = isTeacherView ? '1' : '0';

    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            const seat = document.createElement('div');
            seat.className = 'seat';

            let displayRow = i;
            let displayCol = j;
            let dataRow = i;
            let dataCol = j;

            if (isTeacherView) {
                displayRow = (ROWS - 1) - i;
                displayCol = (COLS - 1) - j;
                dataRow = displayRow;
                dataCol = displayCol;
            }

            const seatNumber = `${String.fromCharCode(65 + displayCol)}${displayRow + 1}`;
            seat.dataset.row = dataRow;
            seat.dataset.col = dataCol;

            const seatData = seatingData.seats[dataRow][dataCol];
            updateSeatAppearance(seat, seatNumber, seatData);

            seat.addEventListener('click', () => toggleSeat(seat));
            seatingGrid.appendChild(seat);
        }
    }
    initializeDragDrop();
}

// ─── 文字色の自動生成(HSLベース) ─────────────────────────────
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
}
function hslToRgb(h, s, l) {
    let r, g, b;
    function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }
    if (s === 0) {
        r = g = b = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return '#' + [r, g, b].map(x =>
        Math.round(x * 255).toString(16).padStart(2, '0')
    ).join('');
}
function getTextColor(backgroundColor) {
    const rgb = parseInt(backgroundColor.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    const [h, s, l] = rgbToHsl(r, g, b);
    const hueShift = l > 0.5 ? -0.04 : 0.04;
    return hslToRgb(
        (h + hueShift + 1) % 1,
        Math.min(s + 0.2, 1),
        l > 0.5 ? 0.3 : 0.8
    );
}

function highlightSelectedSeat(row, col) {
    const seat = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!seat) return;
    seat.scrollIntoView({ behavior: 'smooth', block: 'center' });
    seat.classList.add('selected-seat');
    setTimeout(() => seat.classList.remove('selected-seat'), 2000);
}

function toggleSeat(seat) {
    if (currentMode === MODE.NORMAL) return;

    const row = parseInt(seat.dataset.row);
    const col = parseInt(seat.dataset.col);
    const seatData = seatingData.seats[row][col];
    const seatNumber = `${String.fromCharCode(65 + col)}${row + 1}`;

    switch (currentMode) {
        case MODE.SEAT:          seatData.enabled = !seatData.enabled; break;
        case MODE.GENDER_CLEAR:  seatData.properties.gender = null;    break;
        case MODE.GENDER_MALE:   seatData.properties.gender = 'male';  break;
        case MODE.GENDER_FEMALE: seatData.properties.gender = 'female'; break;
    }
    updateSeatAppearance(seat, seatNumber, seatData);
    saveToLocalStorage();
}

// ─── 座席表示の更新(重複ロジックを統合) ─────────────────────
function updateSeatAppearance(seat, seatNumber, seatData) {
    // リセット
    seat.className = 'seat';
    seat.style.backgroundColor = '';
    seat.style.color = '';
    seat.textContent = seatNumber;
    delete seat.dataset.length;

    // 1. 使用不可
    if (!seatData.enabled) {
        seat.classList.add('disabled');
        return;
    }

    // 2. 割り当て済みを最優先で表示
    const row = parseInt(seat.dataset.row);
    const col = parseInt(seat.dataset.col);
    const assignment = seatingData.assignments[row][col];
    if (assignment) {
        seat.textContent = assignment.name;
        seat.classList.add('assigned');
        const bgColor = getSeatColor(assignment);
        seat.style.backgroundColor = bgColor;
        seat.style.color = getTextColor(bgColor);
        if (assignment.name.length > 8) {
            seat.dataset.length = assignment.name.length > 10 ? 'very-long' : 'long';
        }
        return;
    }

    // 3. 未割り当てなら性別指定を表示
    const gender = seatData.properties.gender;
    if (gender === 'male') {
        seat.style.backgroundColor = '#FFE5CC';
        seat.textContent = `${seatNumber}\n男`;
    } else if (gender === 'female') {
        seat.style.backgroundColor = '#E8F5E9';
        seat.textContent = `${seatNumber}\n女`;
    }
}

// ============================================================
// 名簿処理
// ============================================================
function processRoster(rosterText) {
    return rosterText.split('\n')
        .map(line => {
            if (!line.trim()) return null;
            const parts = line.trim().split('\t');
            if (parts.length < 1) return null;

            let number, name, gender, furigana;

            if (parts.length === 1) {
                name = parts[0];
            } else if (parts.length === 2) {
                if (/^\d+$/.test(parts[0])) {
                    number = parts[0];
                    name = parts[1];
                } else {
                    name = parts[0];
                    gender = parts[1];
                }
            } else if (parts.length === 3) {
                if (/^\d+$/.test(parts[0])) {
                    number = parts[0];
                    name = parts[1];
                    gender = parts[2];
                } else {
                    name = parts[0];
                    gender = parts[1];
                    furigana = parts[2];
                }
            } else {
                number = parts[0];
                name = parts[1];
                gender = parts[2];
                furigana = parts[3];
            }

            return {
                number: number || null,
                name: name,
                gender: gender || null,
                furigana: furigana || null
            };
        })
        .filter(s => s !== null && s.name);
}

// ============================================================
// 抽選用ヘルパー
// ============================================================
function getAvailableStudents() {
    const assignedNames = seatingData.assignments.flat()
        .filter(a => a !== null)
        .map(a => a.name);
    return seatingData.roster.filter(s => !assignedNames.includes(s.name));
}

function getAvailableColumnsForStudent(selectedStudent = null) {
    const availableCols = [];
    for (let j = 0; j < COLS; j++) {
        let hasAvailableSeat = false;
        for (let i = 0; i < ROWS; i++) {
            const seat = seatingData.seats[i][j];
            const seatGender = seat.properties.gender;
            if (seat.enabled && !seatingData.assignments[i][j]) {
                if (!selectedStudent || !seatGender ||
                    (seatGender === 'male'   && selectedStudent.gender === '男') ||
                    (seatGender === 'female' && selectedStudent.gender === '女')) {
                    hasAvailableSeat = true;
                    break;
                }
            }
        }
        if (hasAvailableSeat) availableCols.push(String.fromCharCode(65 + j));
    }
    return availableCols;
}

function getAvailableRows(colLetter, selectedStudent) {
    const col = colLetter.charCodeAt(0) - 65;
    const availableRows = [];
    for (let row = 0; row < ROWS; row++) {
        const seat = seatingData.seats[row][col];
        if (seat.enabled && !seatingData.assignments[row][col]) {
            const seatGender = seat.properties.gender;
            const studentGender = selectedStudent?.gender;
            if (!seatGender ||
                (seatGender === 'male'   && studentGender === '男') ||
                (seatGender === 'female' && studentGender === '女')) {
                availableRows.push((row + 1).toString());
            }
        }
    }
    return availableRows;
}

function isStudentAssigned(studentName) {
    return seatingData.assignments.flat().some(
        a => a && a.name === studentName
    );
}

function startSlot() {
    const availableStudents = getAvailableStudents();
    if (availableStudents.length === 0) {
        handleCompletion();
        return;
    }
    const selectedStudent = availableStudents[Math.floor(Math.random() * availableStudents.length)];
    const availableColumns = getAvailableColumnsForStudent(selectedStudent);

    if (availableColumns.length === 0) {
        alert(`${selectedStudent.name}さんが座れる席がありません!`);
        return;
    }
    window.slotMachine.start(
        [selectedStudent.name],
        availableColumns,
        () => (colLetter) => getAvailableRows(colLetter, selectedStudent)
    );
}

// ============================================================
// カラー設定の読み込みと取得
// ============================================================
function loadColorSettings() {
    const saved = localStorage.getItem('colorSettings');
    if (saved) colorSettings = JSON.parse(saved);

    document.getElementById('enable-gender-colors').checked = colorSettings.enableGenderColors;
    document.getElementById('default-color').value = colorSettings.defaultColor;
    document.getElementById('male-color').value = colorSettings.maleColor;
    document.getElementById('female-color').value = colorSettings.femaleColor;

    const customColors = document.getElementById('custom-colors');
    customColors.innerHTML = '';
    colorSettings.customColors.forEach(({ name, color }) => {
        const div = document.createElement('div');
        div.className = 'custom-color-set';
        div.innerHTML = `
            <input type="text" value="${name}" class="color-name">
            <input type="color" value="${color}" class="color-value">
            <button class="remove-color">削除</button>
        `;
        div.querySelector('.remove-color').addEventListener('click', () => div.remove());
        customColors.appendChild(div);
    });
}

function getSeatColor(student) {
    if (!student) return colorSettings.defaultColor;
    if (colorSettings.enableGenderColors && student.gender) {
        if (student.gender === '男') return colorSettings.maleColor;
        if (student.gender === '女') return colorSettings.femaleColor;
    }
    const customColor = colorSettings.customColors.find(c =>
        student.name.includes(c.name) || (student.group === c.name)
    );
    return customColor ? customColor.color : colorSettings.defaultColor;
}

// ============================================================
// 隣接ペア検出
// ============================================================
function detectAdjacentPairs(assignments) {
    const pairs = [];
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS - 1; col++) {
            const s1 = assignments[row][col];
            const s2 = assignments[row][col + 1];
            if (s1 && s2) {
                pairs.push({
                    student1: s1.name, student2: s2.name,
                    type: 'horizontal', date: new Date().toISOString()
                });
            }
        }
    }
    for (let row = 0; row < ROWS - 1; row++) {
        for (let col = 0; col < COLS; col++) {
            const s1 = assignments[row][col];
            const s2 = assignments[row + 1][col];
            if (s1 && s2) {
                pairs.push({
                    student1: s1.name, student2: s2.name,
                    type: 'vertical', date: new Date().toISOString()
                });
            }
        }
    }
    return pairs;
}

function removeStudentFromCurrentSeat(studentName) {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (seatingData.assignments[row][col]?.name === studentName) {
                seatingData.assignments[row][col] = null;
                return;
            }
        }
    }
}

// ============================================================
// 運命の再会イベント
// ============================================================
async function checkReunionEvent(newStudent, newSeat) {
    if (window.slotMachine.reunionEventInProgress) return false;

    const reunionProbability = parseInt(localStorage.getItem('reunionEventProbability')) || 5;
    if (Math.random() * 100 >= reunionProbability) return false;

    window.slotMachine.reunionEventInProgress = true;

    try {
        const config = JSON.parse(localStorage.getItem('seatingConfig') || '{"history":{"pairs":[]}}');
        const pastPairs = config.history.pairs.filter(p =>
            p.student1 === newStudent.name || p.student2 === newStudent.name
        );
        if (pastPairs.length === 0) {
            window.slotMachine.reunionEventInProgress = false;
            return false;
        }
        const viablePairs = pastPairs.filter(p => {
            const partnerName = p.student1 === newStudent.name ? p.student2 : p.student1;
            return !isStudentAssigned(partnerName);
        });
        if (viablePairs.length === 0) {
            window.slotMachine.reunionEventInProgress = false;
            return false;
        }
        const selectedPair = viablePairs[Math.floor(Math.random() * viablePairs.length)];
        return await executeReunionEvent(newStudent, selectedPair, newSeat);
    } catch (error) {
        console.error('再会イベント処理中にエラー:', error);
        window.slotMachine.reunionEventInProgress = false;
        return false;
    }
}

function checkAdjacentSeat(row, col, partner) {
    if (col < 0 || col >= COLS) return null;
    if (row < 0 || row >= ROWS) return null;
    const seat = seatingData.seats[row][col];
    if (!seat || !seat.enabled) return null;

    const seatGender = seat.properties.gender;
    const partnerGender = partner?.gender;
    if (seatGender) {
        if ((seatGender === 'male'   && partnerGender !== '男') ||
            (seatGender === 'female' && partnerGender !== '女')) {
            return null;
        }
    }
    return { row, col, student: seatingData.assignments[row][col] };
}

async function executeReunionEvent(newStudent, selectedPair, newSeat) {
    const partnerName = selectedPair.student1 === newStudent.name ?
        selectedPair.student2 : selectedPair.student1;
    const partner = seatingData.roster.find(s => s.name === partnerName);
    if (!partner) return false;

    let targetSeat = null;
    let overriddenStudent = null;
    let direction = 'right';

    const rightSeat = checkAdjacentSeat(newSeat.row, newSeat.col + 1, partner);
    if (rightSeat) {
        if (!rightSeat.student) {
            targetSeat = { row: newSeat.row, col: newSeat.col + 1 };
        } else {
            targetSeat = { row: newSeat.row, col: newSeat.col + 1 };
            overriddenStudent = rightSeat.student;
            const leftSeat = checkAdjacentSeat(newSeat.row, newSeat.col - 1, partner);
            if (leftSeat && !leftSeat.student) {
                targetSeat = { row: newSeat.row, col: newSeat.col - 1 };
                overriddenStudent = null;
                direction = 'left';
            }
        }
    } else {
        const leftSeat = checkAdjacentSeat(newSeat.row, newSeat.col - 1, partner);
        if (leftSeat) {
            targetSeat = { row: newSeat.row, col: newSeat.col - 1 };
            direction = 'left';
            if (leftSeat.student) overriddenStudent = leftSeat.student;
        }
    }
    if (!targetSeat) return false;

    // アニメーション用スタイル(初回のみ追加)
    const styleId = 'reunion-animation-style';
    if (!document.getElementById(styleId)) {
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = `
            @keyframes fadeInScale {
                from { opacity: 0; transform: scale(0.5); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes glowPulse {
                0%, 100% { text-shadow: 0 0 10px rgba(255, 20, 147, 0.5); }
                50% { text-shadow: 0 0 20px rgba(255, 20, 147, 0.8); }
            }
        `;
        document.head.appendChild(styleElement);
    }

    const overlay = document.createElement('div');
    overlay.className = 'special-effect-overlay reunion';
    const container = document.createElement('div');
    container.className = 'special-effect-container';

    const messageDiv = document.createElement('div');
    messageDiv.className = 'special-effect-message reunion';
    messageDiv.textContent = '運命の再会!!';

    const pairDiv = document.createElement('div');
    pairDiv.className = 'reunion-pair';
    pairDiv.style.animation = 'glowPulse 2s infinite';
    pairDiv.innerHTML = `${newStudent.name} ♥ ${partnerName}`;

    container.appendChild(messageDiv);
    container.appendChild(pairDiv);

    if (overriddenStudent) {
        const fateDiv = document.createElement('div');
        fateDiv.className = 'fate-override-message';
        fateDiv.innerHTML = `運命の力により${overriddenStudent.name}さんの席が空きます!`;
        Object.assign(fateDiv.style, {
            color: '#FF1493',
            fontSize: '3.5em',
            marginTop: '30px',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            padding: '15px',
            animation: 'fadeInScale 0.5s ease-out, glowPulse 2s infinite',
            lineHeight: '1.4',
            whiteSpace: 'pre-line'
        });
        container.appendChild(fateDiv);
    }

    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // ★Phase 3:再会のキュン音
    if (window.soundManager) window.soundManager.reunionChime();

    // テンポ調整:旧4秒/3秒 → 新3秒/2秒(運命線でテンポ取り戻す)
    await new Promise(r => setTimeout(r, overriddenStudent ? 3000 : 2000));

    // ★Phase 3:運命の糸を出す音と演出
    if (window.soundManager) window.soundManager.fateLine();
    const fateLine = document.createElement('div');
    fateLine.className = 'fate-line';
    // 視覚的に目立つ太さと中央配置
    Object.assign(fateLine.style, {
        position: 'absolute',
        bottom: '20%',
        left: '10%',
        right: '10%',
        height: '6px',
        width: '80%'
    });
    container.appendChild(fateLine);
    await new Promise(r => setTimeout(r, 1200));
    overlay.remove();

    removeStudentFromCurrentSeat(partner.name);
    if (overriddenStudent) removeStudentFromCurrentSeat(overriddenStudent.name);
    seatingData.assignments[targetSeat.row][targetSeat.col] = partner;
    initializeSeats();

    const messageSpace = document.querySelector('.message-space');
    if (messageSpace) {
        let message = `
            <div style="color: #FF1493; font-weight: bold;">
                前に隣同士だった${newStudent.name}さんと${partnerName}さんが<br>
                運命の力で${direction === 'right' ? '右' : '左'}隣同士に!
            </div>
        `;
        if (overriddenStudent) {
            message += `
                <div style="color: #9932CC; margin-top: 10px; animation: glowPulse 2s infinite">
                    ${overriddenStudent.name}さんは運命の力で席を失い、<br>
                    新しい席が決まるのを待っています!
                </div>
            `;
        }
        messageSpace.innerHTML = message;
    }
    const nextButton = document.querySelector('.next-button');
    if (nextButton) {
        nextButton.disabled = false;
        nextButton.style.opacity = '1';
        nextButton.style.cursor = 'pointer';
    }

    return {
        success: true,
        newStudent, partner, newSeat,
        partnerSeat: targetSeat,
        overriddenStudent
    };
}

// ============================================================
// 完了処理(Phase 1 修正:Array(7).fill(...Array(7))を定数化)
// ============================================================
function isAllSeatsAssigned() {
    const enabledSeats = seatingData.seats.flat().filter(s => s.enabled).length;
    const assignedSeats = seatingData.assignments.flat().filter(a => a !== null).length;
    return enabledSeats === assignedSeats;
}

function handleCompletion() {
    // ★Phase 3:全員配置完了のファンファーレ
    if (window.soundManager) window.soundManager.completionFanfare();

    const modal = document.getElementById('completion-modal');
    modal.style.display = 'flex';

    document.getElementById('save-and-continue').onclick = () => {
        exportConfiguration();
        modal.style.display = 'none';
    };
    document.getElementById('save-and-new').onclick = () => {
        exportConfiguration();
        // ★ Phase 1 バグ修正:7×7→ROWS×COLS
        seatingData.assignments = createEmptyAssignments();
        saveToLocalStorage();
        initializeSeats();
        modal.style.display = 'none';
    };
    document.getElementById('just-continue').onclick = () => {
        modal.style.display = 'none';
    };
}

// ============================================================
// ドラッグ&ドロップ(Phase 1 改善:性別チェック追加)
// ============================================================
function initializeDragDrop() {
    const seats = document.querySelectorAll('.seat');
    seats.forEach(seat => {
        seat.setAttribute('draggable', 'true');

        seat.addEventListener('dragstart', (e) => {
            if (!seat.classList.contains('assigned')) return;
            e.dataTransfer.setData('text/plain', `${seat.dataset.row},${seat.dataset.col}`);
            seat.classList.add('dragging');
        });
        seat.addEventListener('dragend', () => seat.classList.remove('dragging'));
        seat.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!seat.classList.contains('assigned')) return;
            seat.classList.add('drag-over');
        });
        seat.addEventListener('dragleave', () => seat.classList.remove('drag-over'));
        seat.addEventListener('drop', (e) => {
            e.preventDefault();
            seat.classList.remove('drag-over');
            if (!seat.classList.contains('assigned')) return;

            const [fromRow, fromCol] = e.dataTransfer.getData('text').split(',').map(Number);
            const toRow = parseInt(seat.dataset.row);
            const toCol = parseInt(seat.dataset.col);
            if (fromRow === toRow && fromCol === toCol) return;

            // ★ Phase 1 改善:性別制限のチェック
            const fromStudent = seatingData.assignments[fromRow][fromCol];
            const toStudent = seatingData.assignments[toRow][toCol];
            const fromSeatGender = seatingData.seats[fromRow][fromCol].properties.gender;
            const toSeatGender = seatingData.seats[toRow][toCol].properties.gender;

            if (!isGenderMatch(toSeatGender, fromStudent?.gender) ||
                !isGenderMatch(fromSeatGender, toStudent?.gender)) {
                alert('性別指定された席があるため、この交換はできません。');
                return;
            }

            const temp = seatingData.assignments[fromRow][fromCol];
            seatingData.assignments[fromRow][fromCol] = seatingData.assignments[toRow][toCol];
            seatingData.assignments[toRow][toCol] = temp;

            saveToLocalStorage();
            initializeSeats();
            playExchangeAnimation(fromRow, fromCol, toRow, toCol);
        });
    });
}

// 性別マッチ判定の補助関数
function isGenderMatch(seatGender, studentGender) {
    if (!seatGender) return true;
    if (!studentGender) return false;
    if (seatGender === 'male'   && studentGender === '男') return true;
    if (seatGender === 'female' && studentGender === '女') return true;
    return false;
}

function playExchangeAnimation(fromRow, fromCol, toRow, toCol) {
    const fromSeat = document.querySelector(`[data-row="${fromRow}"][data-col="${fromCol}"]`);
    const toSeat = document.querySelector(`[data-row="${toRow}"][data-col="${toCol}"]`);
    if (!fromSeat || !toSeat) return;
    fromSeat.classList.add('exchanging');
    toSeat.classList.add('exchanging');
    setTimeout(() => {
        fromSeat.classList.remove('exchanging');
        toSeat.classList.remove('exchanging');
    }, 500);
}

// ============================================================
// LocalStorage 保存・読み込み
// ============================================================
function saveToLocalStorage() {
    const dataToSave = {
        seats: seatingData.seats,
        assignments: seatingData.assignments,
        roster: seatingData.roster,
        isTeacherView: isTeacherView
    };
    localStorage.setItem('seatingData', JSON.stringify(dataToSave));

    if (isAllSeatsAssigned()) {
        const currentPairs = detectAdjacentPairs(seatingData.assignments);
        const savedConfig = localStorage.getItem('seatingConfig');
        let config = savedConfig ? JSON.parse(savedConfig) : { history: { pairs: [] } };
        if (!config.history) config.history = { pairs: [] };
        config.history.pairs = config.history.pairs.concat(currentPairs);
        localStorage.setItem('seatingConfig', JSON.stringify(config));
    }
}

// ─── 旧データの自動マイグレーション(7列→8列) ────────────────
function migrateSeatRow(row) {
    const upgraded = row.map(seat => {
        if (typeof seat === 'boolean') {
            return { enabled: seat, restrictions: [], properties: { gender: null } };
        }
        if (!seat.properties) {
            return {
                enabled: seat.enabled !== undefined ? seat.enabled : true,
                restrictions: seat.restrictions || [],
                properties: { gender: null }
            };
        }
        return seat;
    });
    while (upgraded.length < COLS) {
        upgraded.push({ enabled: true, restrictions: [], properties: {} });
    }
    return upgraded;
}

function migrateAssignmentRow(row) {
    const out = [...row];
    while (out.length < COLS) out.push(null);
    return out;
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('seatingData');
    if (!savedData) return;

    const data = JSON.parse(savedData);
    const seats = (data.seats || createEmptySeats()).map(migrateSeatRow);
    const assignments = (data.assignments || createEmptyAssignments()).map(migrateAssignmentRow);

    seatingData = {
        seats: seats,
        assignments: assignments,
        roster: data.roster || []
    };
    isTeacherView = data.isTeacherView || false;
    if (isTeacherView) {
        document.getElementById('teacher-view-btn').classList.add('active');
    }
}

// ============================================================
// 設定エクスポート/インポート
// ============================================================
function exportConfiguration() {
    const config = {
        version: "1.1",
        lastUpdated: new Date().toISOString(),
        settings: {
            roster: seatingData.roster,
            seats: seatingData.seats,
            currentAssignments: seatingData.assignments,
            colors: colorSettings,
            effects: {
                frontBack: localStorage.getItem('frontBackEventProbability'),
                window:    localStorage.getItem('windowEventProbability'),
                exchange:  localStorage.getItem('exchangeEventProbability'),
                reunion:   localStorage.getItem('reunionEventProbability'),
                shuffle:   localStorage.getItem('shuffleEventProbability')
            },
            fortuneType: localStorage.getItem('fortuneType'),
            customFortune: localStorage.getItem('customFortune')
        },
        history: JSON.parse(localStorage.getItem('seatingConfig') || '{"history":{"pairs":[]}}').history
    };

    const fileName = `seat-config-${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importConfiguration(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const config = JSON.parse(e.target.result);
            if (!confirm("現在の設定を上書きしますか?\n(現在の座席配置も含めて全ての設定が更新されます)")) return;

            seatingData.roster = config.settings.roster;
            seatingData.seats = config.settings.seats.map(migrateSeatRow);
            seatingData.assignments = config.settings.currentAssignments.map(migrateAssignmentRow);
            colorSettings = config.settings.colors;

            const eff = config.settings.effects;
            localStorage.setItem('frontBackEventProbability', eff.frontBack);
            localStorage.setItem('windowEventProbability',    eff.window);
            localStorage.setItem('exchangeEventProbability',  eff.exchange);
            localStorage.setItem('reunionEventProbability',   eff.reunion);
            localStorage.setItem('shuffleEventProbability',   eff.shuffle);
            localStorage.setItem('fortuneType', config.settings.fortuneType);

            if (config.settings.customFortune) {
                localStorage.setItem('customFortune', config.settings.customFortune);
                if (config.settings.fortuneType === 'custom') {
                    currentFortuneSet = JSON.parse(config.settings.customFortune);
                }
            }
            if (config.history) {
                localStorage.setItem('seatingConfig', JSON.stringify({ history: config.history }));
            }
            initializeSeats();
            alert("設定を読み込みました");
        } catch (error) {
            alert("設定ファイルの読み込みに失敗しました: " + error.message);
        }
    };
    reader.readAsText(file);
}
