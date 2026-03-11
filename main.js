const DEFAULT_CELL_SIZE = 30;
const COLOR_GRID_BORDER = '#222';
const COLOR_WALL_FILL = '#050505';
const COLOR_WALL_STROKE = '#003311';
const COLOR_FLOOR = '#ccc';
const COLOR_PRIMARY = '#2979ff';
const COLOR_KEY_STROKE = '#9d00ff';
const COLOR_KEY_TEXT = '#000';
const COLOR_DOOR_OPEN = '#4caf50';
const COLOR_DOOR_CLOSED = '#f44336';
const COLOR_ROBOT_TRAIL = 'rgba(41, 121, 255, 0.7)';
const COLOR_GHOST_TRAIL = 'rgba(40, 40, 40, 0.5)';
const COLOR_GHOST_FILL = 'rgba(100, 100, 100, 0.4)';
const COLOR_GHOST_STROKE = '#666';
const COLOR_ENTITY_TEXT = '#fff';

const RATIO_ENTITY_SPREAD = 0.2;
const RATIO_TRAIL_WIDTH = 0.12;
const RATIO_ROBOT_RADIUS = 0.35;
const RATIO_GHOST_RADIUS = 0.3;
const ROBOT_SHADOW_BLUR = 5;

class Visualizer {
    constructor() {
        this.canvas = document.getElementById('grid-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.inputData = document.getElementById('input-data');
        this.outputData = document.getElementById('output-data');
        this.visualizeBtn = document.getElementById('visualize-btn');
        this.prevBtn = document.getElementById('prev-step-btn');
        this.nextBtn = document.getElementById('next-step-btn');
        this.timeSlider = document.getElementById('time-slider');
        this.sliderMarkers = document.getElementById('slider-markers');
        
        this.grid = [];
        this.width = 0;
        this.height = 0;
        this.maxLoops = 0;
        this.moves = [];
        this.loopPositions = [];
        this.doorStates = [];
        this.currentTime = 0;
        this.cellSize = DEFAULT_CELL_SIZE;

        this.initEventListeners();
        this.loadFromHash();
    }

    initEventListeners() {
        this.visualizeBtn.addEventListener('click', () => this.visualize());
        this.prevBtn.addEventListener('click', () => this.step(-1));
        this.nextBtn.addEventListener('click', () => this.step(1));
        this.timeSlider.addEventListener('input', (e) => {
            this.currentTime = parseInt(e.target.value);
            this.draw();
        });
        window.addEventListener('resize', () => this.draw());
    }

    parseInput() {
        const inputLines = this.inputData.value.trim().split('\n');
        if (inputLines.length < 2) return false;
        
        const [w, h, m] = inputLines[0].trim().split(/\s+/).map(Number);

        const MAX_WIDTH = 30;
        const MAX_HEIGHT = 20;
        const MAX_LOOPS = 5;
        if (w < 1 || h < 1 || m < 1 || w > MAX_WIDTH || h > MAX_HEIGHT || m > MAX_LOOPS) {
            alert("Invalid grid.");
            return false;
        }

        this.width = w;
        this.height = h;
        this.maxLoops = m;

        const validGridChars = ['#', '.', 'S', 'E'];
        const validKeyChars = 'abcdefghijklmnopqrstuvwxyz';
        const validDoorChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        this.grid = inputLines.slice(1, 1 + h).map(line => {
            const chars = line.split('');
            return chars.map(char => {
                if (validGridChars.includes(char) || validKeyChars.includes(char) || validDoorChars.includes(char)) {
                    return char;
                }
                return '.';
            });
        });

        const outputLines = this.outputData.value.trim().split('\n');
        this.moves = outputLines.map(line => line.trim().split(/\s+/)).filter(m => m.length > 0);

        return this.grid.length === h && this.moves.length > 0;
    }

    calculateSimulation() {
        const startPos = this.findChar('S');
        const numLoops = this.moves.length;
        const totalTime = this.moves[0].length;

        this.loopPositions = Array.from({ length: numLoops }, () => []);
        this.doorStates = Array.from({ length: numLoops }, () => ({}));

        const validMoves = ['U', 'D', 'L', 'R', 'W'];

        for (let l = 0; l < numLoops; l++) {
            let cx = startPos.x;
            let cy = startPos.y;
            this.loopPositions[l].push({ x: cx, y: cy });
            for (let t = 0; t < totalTime; t++) {
                const move = this.moves[l][t];
                if (!validMoves.includes(move)) {
                    console.warn(`Invalid move character: ${move}`);
                    continue;
                }
                if (move === 'U') cy--;
                else if (move === 'D') cy++;
                else if (move === 'L') cx--;
                else if (move === 'R') cx++;
                this.loopPositions[l].push({ x: cx, y: cy });
            }
        }

        for (let l = 0; l < numLoops; l++) {
            for (let prevL = 0; prevL < l; prevL++) {
                for (let t = 0; t <= totalTime; t++) {
                    const pos = this.loopPositions[prevL][t];
                    if (pos.y >= 0 && pos.y < this.height && pos.x >= 0 && pos.x < this.width) {
                        const char = this.grid[pos.y][pos.x];
                        if (char >= 'a' && char <= 'z' && char !== 's' && char !== 'e') {
                            const doorChar = char.toUpperCase();
                            this.doorStates[l][doorChar] = true;
                        }
                    }
                }
            }
        }
    }

    findChar(char) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === char) return { x, y };
            }
        }
        return { x: 0, y: 0 };
    }

    getStepsPerLoop() {
        return this.moves[0].length + 1;
    }

    visualize() {
        if (!this.parseInput()) {
            alert("Invalid Input Format");
            return;
        }
        this.calculateSimulation();

        const numLoops = this.moves.length;
        const stepsPerLoop = this.getStepsPerLoop();
        const totalSimSteps = numLoops * stepsPerLoop - 1;

        this.sliderMarkers.innerHTML = '';
        for (let l = 0; l <= numLoops; l++) {
            const pos = (l * stepsPerLoop / (totalSimSteps + 1)) * 100;

            const marker = document.createElement('div');
            marker.className = 'marker';
            marker.style.left = `${pos}%`;

            if (l < numLoops) {
                const label = document.createElement('div');
                label.className = 'marker-label';
                label.textContent = `Loop ${l}`;
                label.style.left = `${pos + (stepsPerLoop / (totalSimSteps + 1) * 50)}%`;
                this.sliderMarkers.appendChild(label);
            }

            this.sliderMarkers.appendChild(marker);
        }

        this.currentTime = totalSimSteps;
        this.timeSlider.max = totalSimSteps;
        this.timeSlider.value = this.currentTime;
        this.draw();
        this.saveToHash();
    }

    draw() {
        if (!this.moves || this.moves.length === 0) return;

        const container = document.querySelector('.visualizer-section');
        const availableWidth = container.clientWidth - 40;
        const availableHeight = container.clientHeight - 40;
        this.cellSize = Math.min(availableWidth / this.width, availableHeight / this.height);

        this.canvas.width = this.width * this.cellSize;
        this.canvas.height = this.height * this.cellSize;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const turnsPerLoop = this.moves[0].length;
        const stepsPerLoop = this.getStepsPerLoop();
        const activeLoopIdx = Math.min(this.moves.length - 1, Math.floor(this.currentTime / stepsPerLoop));
        const localTime = Math.min(turnsPerLoop, this.currentTime % stepsPerLoop);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const char = this.grid[y][x];
                this.drawCell(x, y, char, activeLoopIdx);
            }
        }

        for (let l = 0; l <= activeLoopIdx; l++) {
            const isRobot = (l === activeLoopIdx);
            this.drawTrail(l, isRobot, localTime);
        }

        for (let l = 0; l < activeLoopIdx; l++) {
            const pos = this.loopPositions[l][localTime];
            this.drawEntity(pos.x, pos.y, 'ghost', l);
        }

        const robotPos = this.loopPositions[activeLoopIdx][localTime];
        this.drawEntity(robotPos.x, robotPos.y, 'robot', activeLoopIdx);
        this.timeSlider.value = this.currentTime;
    }

    getEntityOffset(loopIdx) {
        const stepsPerLoop = this.getStepsPerLoop();
        const activeLoopIdx = Math.min(this.moves.length - 1, Math.floor(this.currentTime / stepsPerLoop));
        if (activeLoopIdx === 0) return { dx: 0, dy: 0 };
        const s = this.cellSize;
        const spread = s * RATIO_ENTITY_SPREAD;
        const offset = (loopIdx - (activeLoopIdx / 2)) * (spread / activeLoopIdx);
        return { dx: offset, dy: offset };
    }

    drawTrail(loopIdx, isRobot, localTime) {
        const positions = this.loopPositions[loopIdx];
        const s = this.cellSize;
        const { dx, dy } = this.getEntityOffset(loopIdx);

        this.ctx.beginPath();
        this.ctx.lineWidth = s * RATIO_TRAIL_WIDTH;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = isRobot ? COLOR_ROBOT_TRAIL : COLOR_GHOST_TRAIL;

        for (let t = 0; t <= localTime; t++) {
            const pos = positions[t];
            const px = pos.x * s + s / 2 + dx;
            const py = pos.y * s + s / 2 + dy;
            if (t === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.stroke();
    }

    drawCell(x, y, char, loopIdx) {
        const px = x * this.cellSize;
        const py = y * this.cellSize;
        const s = this.cellSize;

        this.ctx.strokeStyle = COLOR_GRID_BORDER;
        this.ctx.strokeRect(px, py, s, s);

        if (char === '#') {
            this.ctx.fillStyle = COLOR_WALL_FILL;
            this.ctx.fillRect(px, py, s, s);
            this.ctx.strokeStyle = COLOR_WALL_STROKE;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(px, py, s, s);
        } else if (char === '.') {
            this.ctx.fillStyle = COLOR_FLOOR;
            this.ctx.fillRect(px, py, s, s);
        } else if (char === 'S') {
            this.ctx.fillStyle = COLOR_FLOOR;
            this.ctx.fillRect(px, py, s, s);
            this.ctx.strokeStyle = COLOR_PRIMARY;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(px + s * 0.2, py + s * 0.2, s * 0.6, s * 0.6);
            this.ctx.fillStyle = COLOR_PRIMARY;
            this.ctx.font = `bold ${s*0.4}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('S', px + s/2, py + s*0.65);
            this.ctx.textAlign = 'start';
        } else if (char === 'E') {
            this.ctx.fillStyle = COLOR_FLOOR;
            this.ctx.fillRect(px, py, s, s);
            this.ctx.strokeStyle = COLOR_PRIMARY;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(px + s * 0.2, py + s * 0.2, s * 0.6, s * 0.6);
            this.ctx.fillStyle = COLOR_PRIMARY;
            this.ctx.font = `bold ${s*0.4}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('E', px + s/2, py + s*0.65);
            this.ctx.textAlign = 'start';
        } else if (char >= 'a' && char <= 'z' && char !== 's' && char !== 'e') {
            this.ctx.fillStyle = COLOR_FLOOR;
            this.ctx.fillRect(px, py, s, s);
            this.ctx.strokeStyle = COLOR_KEY_STROKE;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(px + s * 0.25, py + s * 0.25, s * 0.5, s * 0.5);
            this.ctx.fillStyle = COLOR_KEY_TEXT;
            this.ctx.font = `bold ${s*0.35}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(char, px + s / 2, py + s * 0.6);
            this.ctx.textAlign = 'start';
        } else if (char >= 'A' && char <= 'Z') {
            this.ctx.fillStyle = COLOR_FLOOR;
            this.ctx.fillRect(px, py, s, s);
            const isOpen = this.doorStates[loopIdx] && this.doorStates[loopIdx][char];
            if (isOpen) {
                this.ctx.strokeStyle = COLOR_DOOR_OPEN;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(px + s * 0.25, py + s * 0.25, s * 0.5, s * 0.5);
                this.ctx.fillStyle = COLOR_DOOR_OPEN;
                this.ctx.font = `bold ${s*0.35}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(char, px + s / 2, py + s * 0.6);
                this.ctx.textAlign = 'start';
            } else {
                this.ctx.strokeStyle = COLOR_DOOR_CLOSED;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(px + s * 0.25, py + s * 0.25, s * 0.5, s * 0.5);
                this.ctx.beginPath();
                this.ctx.moveTo(px + s * 0.3, py + s * 0.3);
                this.ctx.lineTo(px + s * 0.7, py + s * 0.7);
                this.ctx.moveTo(px + s * 0.7, py + s * 0.3);
                this.ctx.lineTo(px + s * 0.3, py + s * 0.7);
                this.ctx.stroke();
                this.ctx.fillStyle = COLOR_DOOR_CLOSED;
                this.ctx.font = `bold ${s*0.35}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(char, px + s / 2, py + s * 0.6);
                this.ctx.textAlign = 'start';
            }
        }
    }

    drawEntity(x, y, type, idx) {
        const px = x * this.cellSize;
        const py = y * this.cellSize;
        const s = this.cellSize;
        const { dx, dy } = this.getEntityOffset(idx);
        const centerX = px + s / 2 + dx;
        const centerY = py + s / 2 + dy;

        if (type === 'robot') {
            this.ctx.fillStyle = COLOR_PRIMARY;
            this.ctx.shadowBlur = ROBOT_SHADOW_BLUR;
            this.ctx.shadowColor = COLOR_PRIMARY;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, s * RATIO_ROBOT_RADIUS, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = COLOR_ENTITY_TEXT;
            this.ctx.font = `bold ${s*0.3}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(idx, centerX, centerY + s*0.1);
            this.ctx.textAlign = 'start';
        } else {
            this.ctx.fillStyle = COLOR_GHOST_FILL;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, s * RATIO_GHOST_RADIUS, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = COLOR_GHOST_STROKE;
            this.ctx.stroke();
            this.ctx.fillStyle = COLOR_ENTITY_TEXT;
            this.ctx.font = `${s*0.3}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(idx, centerX, centerY + s*0.1);
            this.ctx.textAlign = 'start';
        }
    }

    step(delta) {
        if (!this.moves || this.moves.length === 0) return;
        const stepsPerLoop = this.getStepsPerLoop();
        const totalSimSteps = this.moves.length * stepsPerLoop - 1;
        this.currentTime = Math.max(0, Math.min(totalSimSteps, this.currentTime + delta));
        this.draw();
    }

    saveToHash() {
        const data = {
            input: this.inputData.value,
            output: this.outputData.value
        };
        try {
            const jsonStr = JSON.stringify(data);
            const encodedData = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g,
                function toSolidBytes(match, p1) {
                    return String.fromCharCode('0x' + p1);
                }));
            window.location.hash = encodedData;
        } catch (e) {
            console.error("Failed to save to hash", e);
        }
    }

    loadFromHash() {
        if (window.location.hash) {
            try {
                const hash = window.location.hash.substring(1);
                if (!/^[A-Za-z0-9+/=]+$/.test(hash)) {
                    throw new Error("Invalid hash characters");
                }
                const jsonStr = decodeURIComponent(
                    Array.prototype.map.call(atob(hash),
                    c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                ).join(''));
                const data = JSON.parse(jsonStr);
                if (typeof data.input !== 'string' || typeof data.output !== 'string') {
                    throw new Error("Invalid data format");
                }
                const maxLength = 10000;
                this.inputData.value = data.input.substring(0, maxLength);
                this.outputData.value = data.output.substring(0, maxLength);
                this.visualize();
            } catch (e) {
                console.error("Failed to load from hash", e);
                window.location.hash = '';
            }
        }
    }
}

window.onload = () => new Visualizer();
