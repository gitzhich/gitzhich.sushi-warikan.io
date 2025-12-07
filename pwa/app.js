// Data Structures
let plateTypes = [];

let participants = [
    // { id: 1, name: "太郎", plates: { plateId: count, ... } }
];



// DOM Elements
const plateTypesContainer = document.getElementById('plate-types-container');
const newPlateNameInput = document.getElementById('new-plate-name');
const newPlatePriceInput = document.getElementById('new-plate-price');
const addPlateBtn = document.getElementById('add-plate-btn');

const participantsList = document.getElementById('participants-list');
const newParticipantNameInput = document.getElementById('new-participant-name');
const addParticipantBtn = document.getElementById('add-participant-btn');

const plateCountsContainer = document.getElementById('plate-counts-container');
const payerSelect = document.getElementById('payer-select');

const calculateBtn = document.getElementById('calculate-btn');
const resultDisplay = document.getElementById('result-display');
const resultTableBody = document.querySelector('#result-table tbody');
const walicaOutput = document.getElementById('walica-output');
const copyBtn = document.getElementById('copy-btn');
const resetBtn = document.getElementById('reset-btn');

// Initialize
function init() {
    renderPlateTypes();
    updatePlateCountsSection(); // Initial render just to show placeholder

    // Event Listeners
    addPlateBtn.addEventListener('click', addPlateType);
    addParticipantBtn.addEventListener('click', addParticipant);
    calculateBtn.addEventListener('click', calculateAmounts);
    copyBtn.addEventListener('click', copyToClipboard);
    resetBtn.addEventListener('click', resetAll);
}

// 1. Plate Settings
function renderPlateTypes() {
    plateTypesContainer.innerHTML = '';
    plateTypes.forEach(plate => {
        const div = document.createElement('div');
        div.className = 'plate-item';
        div.innerHTML = `
            <span>${plate.name}: ${plate.price}円</span>
            <button class="delete-btn" onclick="deletePlateType(${plate.id})">×</button>
        `;
        plateTypesContainer.appendChild(div);
    });
    updatePlateCountsSection();
}

function addPlateType() {
    const name = newPlateNameInput.value.trim();
    const price = parseInt(newPlatePriceInput.value);

    if (!name || isNaN(price) || price < 0) {
        alert("有効な皿の名前と単価を入力してください");
        return;
    }

    const newId = plateTypes.length > 0 ? Math.max(...plateTypes.map(p => p.id)) + 1 : 1;
    plateTypes.push({ id: newId, name, price });

    newPlateNameInput.value = '';
    newPlatePriceInput.value = '';

    renderPlateTypes();
}

// Made global for onclick access
window.deletePlateType = function (id) {
    if (confirm("この皿設定を削除しますか？")) {
        plateTypes = plateTypes.filter(p => p.id !== id);
        renderPlateTypes();
    }
}

// 2. Participants
function renderParticipants() {
    participantsList.innerHTML = '';
    participants.forEach(p => {
        const div = document.createElement('div');
        div.className = 'participant-item';
        div.innerHTML = `
            <span>${p.name}</span>
            <button class="delete-btn" onclick="deleteParticipant(${p.id})">×</button>
        `;
        participantsList.appendChild(div);
    });

    updatePayerSelect();
    updatePlateCountsSection();
}

function addParticipant() {
    const name = newParticipantNameInput.value.trim();
    if (!name) return;

    const newId = participants.length > 0 ? Math.max(...participants.map(p => p.id)) + 1 : 1;
    // Initialize plates count for this participant
    const plates = {};
    plateTypes.forEach(pt => plates[pt.id] = 0);

    participants.push({ id: newId, name, plates });

    newParticipantNameInput.value = '';
    renderParticipants();
}

window.deleteParticipant = function (id) {
    if (confirm("この参加者を削除しますか？")) {
        participants = participants.filter(p => p.id !== id);
        renderParticipants();
    }
}

// 3. Plate Counts Input
function updatePlateCountsSection() {
    plateCountsContainer.innerHTML = '';

    if (participants.length === 0 || plateTypes.length === 0) {
        plateCountsContainer.innerHTML = '<p class="placeholder-text">皿設定と参加者を登録すると入力欄が表示されます</p>';
        return;
    }

    participants.forEach(participant => {
        const card = document.createElement('div');
        card.className = 'participant-plates-card';

        const nameHeader = document.createElement('h3');
        nameHeader.textContent = participant.name;
        card.appendChild(nameHeader);

        plateTypes.forEach(plate => {
            const row = document.createElement('div');
            row.className = 'plate-count-row';

            const count = participant.plates[plate.id] || 0; // default 0

            row.innerHTML = `
                <span class="plate-label">${plate.name}</span>
                <span class="plate-price">(@${plate.price}円)</span>
                
                <div class="plate-input-group">
                    <button class="count-btn" onclick="updatePlateCount(${participant.id}, ${plate.id}, ${count - 1})">－</button>
                    <input type="number" 
                           class="plate-input" 
                           min="0" 
                           value="${count}" 
                           onchange="updatePlateCount(${participant.id}, ${plate.id}, this.value)">
                    <button class="count-btn" onclick="updatePlateCount(${participant.id}, ${plate.id}, ${count + 1})">＋</button>
                </div>
                <span>枚</span>
            `;
            card.appendChild(row);
        });

        plateCountsContainer.appendChild(card);
    });
}

window.updatePlateCount = function (participantId, plateId, value) {
    const participant = participants.find(p => p.id === participantId);
    if (participant) {
        let newValue = parseInt(value);
        if (isNaN(newValue) || newValue < 0) newValue = 0;

        participant.plates[plateId] = newValue;

        // Re-render only this section to update the input value visually if it came from buttons
        updatePlateCountsSection();
    }
}

// 4. Payer Select
function updatePayerSelect() {
    const currentVal = payerSelect.value;
    payerSelect.innerHTML = '<option value="">選択してください</option>';

    participants.forEach(p => {
        const option = document.createElement('option');
        option.value = p.name;
        option.textContent = p.name;
        payerSelect.appendChild(option);
    });

    if (participants.some(p => p.name === currentVal)) {
        payerSelect.value = currentVal;
    }
}

// 5. Calculation
function calculateAmounts() {
    const payerName = payerSelect.value;
    if (!payerName) {
        alert("支払者を選択してください");
        return;
    }

    resultDisplay.classList.remove('hidden');
    resultTableBody.innerHTML = '';

    let walicaText = "";

    participants.forEach(p => {
        let total = 0;
        for (const [plateId, count] of Object.entries(p.plates)) {
            const plate = plateTypes.find(pt => pt.id == plateId);
            if (plate) {
                total += count * plate.price;
            }
        }

        // Render Result Table Row
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${p.name}</td><td>${total.toLocaleString()}円</td>`;
        resultTableBody.appendChild(tr);

        // Prepare Walica Text (If not the payer)
        if (p.name !== payerName && total > 0) {
            walicaText += `${payerName}が${p.name}の分${total}円支払い\n`;
        }
    });

    if (walicaText === "") {
        walicaText = "計算結果なし（全員0円または支払者が自分のみ）";
    }

    walicaOutput.value = walicaText;

    // Scroll to result
    resultDisplay.scrollIntoView({ behavior: 'smooth' });
}

function copyToClipboard() {
    walicaOutput.select();
    document.execCommand('copy');
    alert("コピーしました！");
}

function resetAll() {
    if (confirm("全てのデータをリセットしますか？")) {
        // Reset Logic
        plateTypes = [];
        participants = [];


        newPlateNameInput.value = '';
        newPlatePriceInput.value = '';
        newParticipantNameInput.value = '';
        payerSelect.value = '';

        resultDisplay.classList.add('hidden');

        renderPlateTypes();
        renderParticipants();
    }
}

// Init call
init();
