const BOARD_SIZE = 8;
let board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
let selectedShapes = [null, null, null];
let activeSlot = null;

// Variabel untuk menyimpan memori Replay
let lastSolution = null;
let lastBoardState = null;
let lastSelectedShapes = null;

// Daftar Super Lengkap Bentuk (Total 53 Blok)
const SHAPES = [
    { m: [[1]] }, { m: [[1,1]] }, { m: [[1],[1]] },
    { m: [[1,1,1]] }, { m: [[1],[1],[1]] },
    { m: [[1,1,1,1]] }, { m: [[1],[1],[1],[1]] },
    { m: [[1,1,1,1,1]] }, { m: [[1],[1],[1],[1],[1]] },
    { m: [[1,1],[1,1]] }, { m: [[1,1,1],[1,1,1],[1,1,1]] },
    { m: [[1,1],[1,1],[1,1]] }, { m: [[1,1,1],[1,1,1]] },
    { m: [[1,0,0],[0,1,0],[0,0,1]] }, { m: [[0,0,1],[0,1,0],[1,0,0]] },
    { m: [[0,1],[1,0]] }, { m: [[1,0],[0,1]] },
    { m: [[1,0,0],[0,1,0]] }, { m: [[0,0,1],[0,1,0]] },
    { m: [[0,1,0],[1,0,0]] }, { m: [[0,1,0],[0,0,1]] },
    { m: [[0,1,1],[1,1,0]] }, { m: [[1,0],[1,1],[0,1]] },
    { m: [[1,1,0],[0,1,1]] }, { m: [[0,1],[1,1],[1,0]] },
    { m: [[1,0,0],[1,1,0],[0,1,1]] }, { m: [[0,0,1],[0,1,1],[1,1,0]] },
    { m: [[0,1,1],[1,1,0],[1,0,0]] }, { m: [[1,1,0],[0,1,1],[0,0,1]] },
    { m: [[1,0],[1,1]] }, { m: [[0,1],[1,1]] },
    { m: [[1,1],[1,0]] }, { m: [[1,1],[0,1]] },
    { m: [[1,0,0],[1,0,0],[1,1,1]] }, { m: [[0,0,1],[0,0,1],[1,1,1]] },
    { m: [[1,1,1],[1,0,0],[1,0,0]] }, { m: [[1,1,1],[0,0,1],[0,0,1]] },
    { m: [[1,0],[1,0],[1,1]] }, { m: [[0,1],[0,1],[1,1]] },
    { m: [[1,1],[1,0],[1,0]] }, { m: [[1,1],[0,1],[0,1]] },
    { m: [[1,1,1],[1,0,0]] }, { m: [[1,1,1],[0,0,1]] },
    { m: [[1,0,0],[1,1,1]] }, { m: [[0,0,1],[1,1,1]] },
    { m: [[1,1,1],[0,1,0]] }, { m: [[0,1,0],[1,1,1]] },
    { m: [[1,0],[1,1],[1,0]] }, { m: [[0,1],[1,1],[0,1]] },
    { m: [[1,1,1],[0,1,0],[0,1,0]] }, { m: [[0,1,0],[0,1,0],[1,1,1]] },
    { m: [[1,0,0],[1,1,1],[1,0,0]] }, { m: [[0,0,1],[1,1,1],[0,0,1]] }
];

// Inisialisasi Papan
const boardEl = document.getElementById('game-board');
for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.onclick = () => {
            board[r][c] = board[r][c] ? 0 : 1;
            renderBoard();
            // Sembunyikan tombol replay jika user mengubah papan secara manual
            document.getElementById('replay-btn').style.display = 'none'; 
        };
        cell.id = `c-${r}-${c}`;
        boardEl.appendChild(cell);
    }
}

function renderBoard() {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const el = document.getElementById(`c-${r}-${c}`);
            el.className = 'cell' + (board[r][c] === 1 ? ' active' : '');
        }
    }
}

function openPicker(slot) {
    activeSlot = slot;
    const gallery = document.getElementById('shape-gallery');
    gallery.innerHTML = '';
    SHAPES.forEach((s) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = drawMini(s.m);
        item.onclick = () => {
            selectedShapes[activeSlot] = s;
            document.getElementById(`preview-${activeSlot}`).innerHTML = drawMini(s.m);
            closePicker();
            document.getElementById('replay-btn').style.display = 'none';
        };
        gallery.appendChild(item);
    });
    document.getElementById('picker-modal').style.display = 'flex';
}

function closePicker() { document.getElementById('picker-modal').style.display = 'none'; }

function drawMini(m) {
    let html = `<div class="mini-grid" style="grid-template-columns: repeat(${m[0].length}, 1fr)">`;
    m.forEach(row => row.forEach(v => {
        html += `<div class="m-cell ${v ? 'on' : ''}"></div>`;
    }));
    return html + '</div>';
}

// Algoritma Solver & Animasi
document.getElementById('solve-btn').onclick = () => {
    if (selectedShapes.includes(null)) return alert("Pilih 3 blok!");
    document.getElementById('message').innerText = "Sedang menganalisa jutaan kemungkinan...";
    document.getElementById('replay-btn').style.display = 'none';
    
    setTimeout(async () => {
        const solution = startSolving(board, selectedShapes);
        if (solution) {
            // Simpan memori untuk keperluan replay
            lastBoardState = board.map(row => [...row]);
            lastSelectedShapes = [...selectedShapes];
            lastSolution = solution;
            
            await playAnimation(solution);
            document.getElementById('replay-btn').style.display = 'inline-block';
        } else {
            document.getElementById('message').innerText = "💀 GAME OVER MUTLAK: Tidak ada kombinasi yang muat!";
        }
    }, 50);
};

// Fungsi Tombol Replay
document.getElementById('replay-btn').onclick = async () => {
    if (!lastSolution || !lastBoardState || !lastSelectedShapes) return;
    
    // 1. Kembalikan kondisi papan ke awal sebelum dipecahkan
    board = lastBoardState.map(row => [...row]);
    renderBoard();
    
    // 2. Kembalikan gambar preview blok di bawah
    selectedShapes = [...lastSelectedShapes];
    for(let i = 0; i < 3; i++) {
        document.getElementById(`preview-${i}`).innerHTML = drawMini(selectedShapes[i].m);
    }
    
    // 3. Putar ulang animasinya
    await playAnimation(lastSolution);
};

function startSolving(currentBoard, shapes) {
    const orders = [[0,1,2], [0,2,1], [1,0,2], [1,2,0], [2,0,1], [2,1,0]];
    for (let order of orders) {
        let res = [];
        if (backtrack(currentBoard.map(row => [...row]), order, 0, res)) return res;
    }
    return null;
}

function backtrack(b, order, stepIdx, res) {
    if (stepIdx === 3) return true; 
    const shape = selectedShapes[order[stepIdx]].m;
    
    for (let r = 0; r <= BOARD_SIZE - shape.length; r++) {
        for (let c = 0; c <= BOARD_SIZE - shape[0].length; c++) {
            if (canFit(b, shape, r, c)) {
                let nextB = b.map(row => [...row]); 
                place(nextB, shape, r, c); 
                clearLines(nextB); 
                
                res.push({ r, c, shape, id: order[stepIdx] });
                
                if (backtrack(nextB, order, stepIdx + 1, res)) return true;
                res.pop(); 
            }
        }
    }
    return false;
}

function canFit(b, m, sr, sc) {
    for (let r = 0; r < m.length; r++)
        for (let c = 0; c < m[0].length; c++)
            if (m[r][c] && b[sr + r][sc + c]) return false;
    return true;
}

function place(b, m, sr, sc) {
    for (let r = 0; r < m.length; r++)
        for (let c = 0; c < m[0].length; c++)
            if (m[r][c]) b[sr + r][sc + c] = 1;
}

function clearLines(b) {
    let rows = [], cols = [];
    for (let i = 0; i < 8; i++) {
        if (b[i].every(v => v === 1)) rows.push(i);
        if (b.every(row => row[i] === 1)) cols.push(i);
    }
    rows.forEach(r => b[r].fill(0));
    cols.forEach(c => b.forEach(row => row[c] = 0));
    return rows.length > 0 || cols.length > 0;
}

async function playAnimation(sol) {
    document.getElementById('solve-btn').disabled = true;
    document.getElementById('replay-btn').disabled = true;
    let tempBoard = board.map(row => [...row]);

    for (let i = 0; i < sol.length; i++) {
        const step = sol[i];
        document.getElementById('message').innerText = `Meletakkan Blok ke-${i+1}...`;

        place(tempBoard, step.shape, step.r, step.c);

        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const el = document.getElementById(`c-${r}-${c}`);
                el.className = 'cell' + (tempBoard[r][c] ? ' active' : '');
            }
        }
        
        step.shape.forEach((row, dr) => row.forEach((v, dc) => {
            if (v) document.getElementById(`c-${step.r+dr}-${step.c+dc}`).classList.add('s'+step.id);
        }));

        await new Promise(res => setTimeout(res, 1000)); 

        let adaYangHancur = clearLines(tempBoard);
        if (adaYangHancur) {
            document.getElementById('message').innerText = "BOOM! Baris/Kolom hancur!";
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    const el = document.getElementById(`c-${r}-${c}`);
                    el.className = 'cell' + (tempBoard[r][c] ? ' active' : '');
                }
            }
            await new Promise(res => setTimeout(res, 800)); 
        }
    }

    document.getElementById('message').innerText = "Selesai! Papan siap untuk putaran berikutnya.";
    document.getElementById('solve-btn').disabled = false;
    document.getElementById('replay-btn').disabled = false;
    
    board = tempBoard; 
    selectedShapes = [null, null, null];
    for(let i=0; i<3; i++) document.getElementById(`preview-${i}`).innerHTML = '';
}

document.getElementById('reset-btn').onclick = () => {
    board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
    selectedShapes = [null, null, null];
    for(let i=0; i<3; i++) document.getElementById(`preview-${i}`).innerHTML = '';
    renderBoard();
    document.getElementById('message').innerText = "";
    document.getElementById('replay-btn').style.display = 'none';
};