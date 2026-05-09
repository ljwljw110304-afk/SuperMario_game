import * as THREE from 'three';

// --- GAME CONFIG ---
const CONFIG = {
    gravity: -35,
    jumpVelocity: 20,
    moveSpeed: 9,
    blockSize: 1,
    cameraDistance: 12,
};

// --- GAME STATE ---
const gameState = {
    score: 0,
    coins: 0,
    lives: 3,
    timeLeft: 400,
    isGameOver: false,
    isSuper: false,
    invincibility: 0,
    currentLevel: 0,
    isGoal: false
};

// --- SCENE SETUP ---
const container = document.getElementById('game-container');
const scene = new THREE.Scene();
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
camera.position.set(0, 7, CONFIG.cameraDistance);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 15, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// --- PROCEDURAL MODELS ---
const colors = {
    marioRed: 0xff0000, marioBlue: 0x0000ff, marioSkin: 0xffcc99, marioBrown: 0x663300,
    goombaBrown: 0x8b4513, goombaLight: 0xdeb887, brick: 0xB22222, ground: 0x8B4513,
    question: 0xFFD700, used: 0xcccccc, black: 0x000000, mushroomRed: 0xff0000, mushroomWhite: 0xffffff,
    pipe: 0x228B22, brickBlue: 0x3366ff, groundBlue: 0x2244aa, koopaGreen: 0x00ff00, koopaYellow: 0xffff00
};

function createMario() {
    const group = new THREE.Group();
    const matRed = new THREE.MeshStandardMaterial({ color: colors.marioRed });
    const matBlue = new THREE.MeshStandardMaterial({ color: colors.marioBlue });
    const matSkin = new THREE.MeshStandardMaterial({ color: colors.marioSkin });
    const matBrown = new THREE.MeshStandardMaterial({ color: colors.marioBrown });
    const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.4), matBlue);
    torso.position.y = 0.6; group.add(torso);
    const bGeo = new THREE.BoxGeometry(0.1, 0.1, 0.05);
    const bMat = new THREE.MeshStandardMaterial({color: 0xffff00});
    const b1 = new THREE.Mesh(bGeo, bMat); b1.position.set(-0.15, 0.7, 0.21); group.add(b1);
    const b2 = new THREE.Mesh(bGeo, bMat); b2.position.set(0.15, 0.7, 0.21); group.add(b2);
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.35, 0.42), matRed);
    shirt.position.y = 0.85; group.add(shirt);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), matSkin);
    head.position.y = 1.3; group.add(head);
    const eyeMat = new THREE.MeshStandardMaterial({color: 0x000000});
    const e1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.05), eyeMat); e1.position.set(-0.12, 1.4, 0.28); group.add(e1);
    const e2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.05), eyeMat); e2.position.set(0.12, 1.4, 0.28); group.add(e2);
    const hat = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.2, 0.58), matRed);
    hat.position.y = 1.6; group.add(hat);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.45), matRed);
    brim.position.set(0, 1.55, 0.25); group.add(brim);

    function createLimb(x, y, mat) {
        const p = new THREE.Group(); p.position.set(x, y, 0);
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), mat); m.position.y = -0.2; p.add(m);
        return p;
    }
    const leftArm = createLimb(-0.35, 0.95, matRed); group.add(leftArm);
    const rightArm = createLimb(0.35, 0.95, matRed); group.add(rightArm);
    const gl1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), matWhite); gl1.position.y = -0.45; leftArm.add(gl1);
    const gl2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), matWhite); gl2.position.y = -0.45; rightArm.add(gl2);
    const leftLeg = createLimb(-0.15, 0.4, matBlue); group.add(leftLeg);
    const rightLeg = createLimb(0.15, 0.4, matBlue); group.add(rightLeg);
    const sGeo = new THREE.BoxGeometry(0.3, 0.25, 0.4);
    const s1 = new THREE.Mesh(sGeo, matBrown); s1.position.set(0, -0.45, 0.05); leftLeg.add(s1);
    const s2 = new THREE.Mesh(sGeo, matBrown); s2.position.set(0, -0.45, 0.05); rightLeg.add(s2);

    group.userData = { leftArm, rightArm, leftLeg, rightLeg, walkTime: 0 };
    return group;
}

function createGoomba() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.8), new THREE.MeshStandardMaterial({ color: colors.goombaBrown }));
    body.position.y = 0.45; group.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.6), new THREE.MeshStandardMaterial({ color: colors.goombaLight }));
    head.position.y = 0.15; group.add(head);
    const leftFoot = new THREE.Group(); leftFoot.position.set(-0.25, 0.1, 0);
    leftFoot.add(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.4), new THREE.MeshStandardMaterial({color: 0x000000})));
    group.add(leftFoot);
    const rightFoot = new THREE.Group(); rightFoot.position.set(0.25, 0.1, 0);
    rightFoot.add(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.4), new THREE.MeshStandardMaterial({color: 0x000000})));
    group.add(rightFoot);
    group.userData = { leftFoot, rightFoot, walkTime: 0, vx: -2.5, vy: 0, isDead: false, type: 'goomba' };
    return group;
}

function createKoopa() {
    const group = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), new THREE.MeshStandardMaterial({ color: colors.koopaGreen }));
    shell.position.y = 0.5; group.add(shell);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.5), new THREE.MeshStandardMaterial({ color: colors.koopaYellow }));
    head.position.set(0, 0.8, 0.2); group.add(head);
    const leftLeg = new THREE.Group(); leftLeg.position.set(-0.2, 0.2, 0);
    leftLeg.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), new THREE.MeshStandardMaterial({color: colors.koopaYellow})));
    group.add(leftLeg);
    const rightLeg = new THREE.Group(); rightLeg.position.set(0.2, 0.2, 0);
    rightLeg.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), new THREE.MeshStandardMaterial({color: colors.koopaYellow})));
    group.add(rightLeg);
    group.userData = { leftLeg, rightLeg, walkTime: 0, vx: -2, vy: 0, isDead: false, type: 'koopa' };
    return group;
}

function createMushroom() {
    const group = new THREE.Group();
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), new THREE.MeshStandardMaterial({ color: colors.mushroomRed }));
    cap.position.y = 0.4; group.add(cap);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3), new THREE.MeshStandardMaterial({ color: colors.mushroomWhite }));
    stem.position.y = 0.15; group.add(stem);
    group.userData = { vx: 3, vy: 0, type: 'mushroom' };
    return group;
}

// --- LEVEL DATA ---
const levels = [
    {
        name: "WORLD 1-1", sky: 0x5c94fc, groundColor: colors.ground, brickColor: colors.brick,
        map: [
            "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
            "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
            "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
            "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
            "EEEEEEEEEEEEEEEEEEQEEEEEEEEEEEEEEEQBQEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEQEEEEEEEEEEEEEEEEEEEEEQEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
            "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
            "EEEEEEEEEEEEEEEEBQBQBEEEEEEEEEEEEEEEEEEEEEEEEEEBBBBBBEEEEEEEEEEEEEEEEEEEEEEEEEBBBBBBEEEEEEEEEEBBBBBBBBEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEBBBBBBEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
            "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEBEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
            "EEEEEEEMEEEEEEEEEEEEEEEMEEEEEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEEEMEEEEEEEEMEEEPPPPEEEEEEEEEEEEEEPPPPEEEEEEEEEEEEEEMEEEEEEEEEMEEEEEEEEEEEEEEEEEEEEBEEBEEFEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
            "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEEEEEEEEEBEEEBEELEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
            "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEEEEEEEEBEEEEBEEAEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG"
        ]
    },
    {
        name: "WORLD 1-2", sky: 0x000000, groundColor: colors.groundBlue, brickColor: colors.brickBlue,
        map: [
            "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
            "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
            "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
            "EEEEEEEEEBBBBEEEEEEEEEEEEEEEEEEEEEQEEEEEEEEEEEEEBBBBBBEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEBBBBBBBBEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
            "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
            "EEEEEEEEEBBBBEEEEEEEEEEEEEEBBBBEEEEEEEEEEBBBBEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEBBBBBBBBEEEEEEEEEEEEEEEEEEEEKEEEEEEEEEEEEEEEEEEEBBBBBBBBEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEFEEE",
            "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEELEEE",
            "EEEEEEMEEEEEEEEEEEEMEEEEEEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEEEMEEEEEEEEMEEEPPPPEEEEEEEEEEEEEEPPPPEEEEEEEEEEEEEEMEEEEEEEEEMEEEEEEEEEEEMEEEEEEEEEEMEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEAEEE",
            "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
            "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEPPPPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGEEEEGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG"
        ]
    }
];

// --- OBJECT MANAGEMENT ---
let mapBlocks = [], enemies = [], items = [], flagpole = null;
let collisionGrid = {}; // Optimization: x,y keys for faster collision

function loadLevel(idx) {
    gameState.currentLevel = idx; gameState.isGoal = false;
    const level = levels[idx]; scene.background = new THREE.Color(level.sky);
    mapBlocks.forEach(b => scene.remove(b)); mapBlocks = [];
    enemies.forEach(e => scene.remove(e)); enemies = [];
    items.forEach(i => scene.remove(i)); items = [];
    collisionGrid = {};
    if (flagpole) { scene.remove(flagpole); flagpole = null; }

    const mats = { ground: new THREE.MeshStandardMaterial({ color: level.groundColor }), brick: new THREE.MeshStandardMaterial({ color: level.brickColor }), question: new THREE.MeshStandardMaterial({ color: colors.question }), used: new THREE.MeshStandardMaterial({ color: colors.used }), pipe: new THREE.MeshStandardMaterial({ color: colors.pipe }) };
    const rows = level.map.length; const cols = level.map[0].length;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const char = level.map[r][c]; if (char === 'E') continue;
            const x = c, y = rows - 1 - r;
            if (char === 'M') { const g = createGoomba(); g.position.set(x, y, 0); scene.add(g); enemies.push(g); }
            else if (char === 'K') { const k = createKoopa(); k.position.set(x, y, 0); scene.add(k); enemies.push(k); }
            else if (char === 'F') { flagpole = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 8), new THREE.MeshStandardMaterial({color: 0xcccccc})); p.position.y = 4; flagpole.add(p); const f = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 0.1), new THREE.MeshStandardMaterial({color: 0x00ff00})); f.position.set(0.5, 7.5, 0); flagpole.add(f); flagpole.position.set(x, y-7, 0); scene.add(flagpole); }
            else {
                let type = (char === 'G') ? 'ground' : (char === 'B' ? 'brick' : (char === 'Q' ? 'question' : 'pipe'));
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), mats[type]);
                mesh.position.set(x, y, 0); mesh.userData = { type, bBox: new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x,y,0), new THREE.Vector3(1,1,1)) };
                scene.add(mesh); mapBlocks.push(mesh);
                collisionGrid[`${x},${y}`] = mesh;
            }
        }
    }
    player.position.set(2, 5, 0); playerVelocity.set(0,0,0);
    document.querySelector('.world-display').innerText = `WORLD\n${level.name.split(' ')[1]}`;
}

// --- PLAYER ---
const player = createMario(); scene.add(player);
const playerVelocity = new THREE.Vector3(0, 0, 0);
let isGrounded = false, playerSize = new THREE.Vector3(0.6, 1.5, 0.6);

// --- INPUT ---
const keys = { ArrowLeft: false, ArrowRight: false, Space: false };
window.addEventListener('keydown', (e) => { if (gameState.isGoal) return; if (e.code === 'ArrowLeft') keys.ArrowLeft = true; if (e.code === 'ArrowRight') keys.ArrowRight = true; if (e.code === 'Space' && isGrounded && !gameState.isGameOver) { playerVelocity.y = CONFIG.jumpVelocity; isGrounded = false; } });
window.addEventListener('keyup', (e) => { if (e.code === 'ArrowLeft') keys.ArrowLeft = false; if (e.code === 'ArrowRight') keys.ArrowRight = false; });

// --- PHYSICS & COLLISION ---
function checkMapCollision(testBox) {
    // Optimization: Check only grid cells overlapping testBox
    const minX = Math.floor(testBox.min.x), maxX = Math.ceil(testBox.max.x);
    const minY = Math.floor(testBox.min.y), maxY = Math.ceil(testBox.max.y);
    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            const block = collisionGrid[`${x},${y}`];
            if (block && testBox.intersectsBox(block.userData.bBox)) return block;
        }
    }
    return null;
}

function handleHeadBonk(block) {
    if (block.userData.type === 'brick' && gameState.isSuper) { scene.remove(block); delete collisionGrid[`${block.position.x},${block.position.y}`]; mapBlocks.splice(mapBlocks.indexOf(block), 1); gameState.score += 50; }
    else if (block.userData.type === 'question') { block.material = new THREE.MeshStandardMaterial({color: colors.used}); block.userData.type = 'used'; if (Math.random() > 0.7) { const m = createMushroom(); m.position.set(block.position.x, block.position.y + 1, 0); scene.add(m); items.push(m); } else { gameState.coins++; gameState.score += 200; } }
}

function updatePhysics(dt) {
    if (gameState.isGameOver || gameState.isGoal) return;
    playerVelocity.y += CONFIG.gravity * dt;
    if (keys.ArrowRight) playerVelocity.x = CONFIG.moveSpeed;
    else if (keys.ArrowLeft) playerVelocity.x = -CONFIG.moveSpeed;
    else playerVelocity.x = 0; // REMOVE INERTIA

    const nextPos = player.position.clone();
    nextPos.x += playerVelocity.x * dt;
    let tBox = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(nextPos.x, nextPos.y + playerSize.y/2, 0), playerSize);
    tBox.min.y += 0.2; tBox.max.y -= 0.2;
    if (checkMapCollision(tBox)) { nextPos.x = player.position.x; playerVelocity.x = 0; }

    nextPos.y += playerVelocity.y * dt;
    tBox.setFromCenterAndSize(new THREE.Vector3(nextPos.x, nextPos.y + playerSize.y/2, 0), playerSize);
    tBox.min.x += 0.1; tBox.max.x -= 0.1;
    const hit = checkMapCollision(tBox);
    isGrounded = false;
    if (hit) {
        if (playerVelocity.y < 0) { isGrounded = true; nextPos.y = hit.position.y + 0.5; playerVelocity.y = 0; }
        else if (playerVelocity.y > 0) { handleHeadBonk(hit); nextPos.y = hit.position.y - 0.5 - playerSize.y; playerVelocity.y = 0; }
    }
    player.position.copy(nextPos);
    if (flagpole) { const pBox = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(player.position.x, player.position.y + playerSize.y/2, 0), playerSize); const fBox = new THREE.Box3().setFromObject(flagpole); if (pBox.intersectsBox(fBox)) { gameState.isGoal = true; playerVelocity.set(0,0,0); setTimeout(() => { if (gameState.currentLevel + 1 < levels.length) loadLevel(gameState.currentLevel + 1); else alert("ALL LEVELS CLEARED!"); }, 2000); } }
    if (player.position.y < -5) { 
        gameState.lives--; 
        if (gameState.lives <= 0) { gameState.lives = 0; gameState.isGameOver = true; }
        else { player.position.set(2, 5, 0); playerVelocity.set(0,0,0); gameState.invincibility = 2; }
    }
}

function updateEnemies(dt) {
    enemies.forEach(e => {
        if (e.userData.isDead) return;
        e.userData.vy += CONFIG.gravity * dt; e.position.x += e.userData.vx * dt;
        let tBox = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(e.position.x, e.position.y + 0.3, 0), new THREE.Vector3(0.6, 0.4, 0.6));
        if (checkMapCollision(tBox)) { e.position.x -= e.userData.vx * dt; e.userData.vx *= -1; e.rotation.y = e.userData.vx > 0 ? Math.PI/2 : -Math.PI/2; }
        e.position.y += e.userData.vy * dt;
        tBox = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(e.position.x, e.position.y + 0.3, 0), new THREE.Vector3(0.6, 0.4, 0.6));
        const hit = checkMapCollision(tBox);
        if (hit && e.userData.vy < 0) { e.position.y = hit.position.y + 0.5; e.userData.vy = 0; }

        const pBox = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(player.position.x, player.position.y + playerSize.y/2, 0), playerSize);
        const eBox = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(e.position.x, e.position.y + 0.4, 0), new THREE.Vector3(0.7, 0.7, 0.7));
        if (pBox.intersectsBox(eBox)) {
            if (playerVelocity.y < 0 && player.position.y > e.position.y + 0.5) { e.userData.isDead = true; scene.remove(e); playerVelocity.y = 10; gameState.score += 100; }
            else if (gameState.invincibility <= 0) { 
                if (gameState.isSuper) { gameState.isSuper = false; player.scale.set(1,1,1); playerSize.set(0.6, 1.5, 0.6); gameState.invincibility = 2; } 
                else { 
                    gameState.lives--; 
                    if (gameState.lives <= 0) { gameState.lives = 0; gameState.isGameOver = true; } 
                    else { player.position.set(2, 5, 0); gameState.invincibility = 2; } 
                } 
            }
        }
        e.userData.walkTime += dt * 10;
        const s = Math.sin(e.userData.walkTime) * 0.5;
        if (e.userData.type === 'goomba') { e.userData.leftFoot.rotation.x = s; e.userData.rightFoot.rotation.x = -s; e.position.y += Math.abs(Math.sin(e.userData.walkTime*2))*0.05; }
        else { e.userData.leftLeg.rotation.x = s; e.userData.rightLeg.rotation.x = -s; }
    });
}

function updateItems(dt) {
    items.forEach(i => {
        i.userData.vy += CONFIG.gravity * dt; i.position.x += i.userData.vx * dt;
        let tBox = new THREE.Box3().setFromObject(i); if (checkMapCollision(tBox)) i.userData.vx *= -1;
        i.position.y += i.userData.vy * dt; const hit = checkMapCollision(new THREE.Box3().setFromObject(i)); if (hit && i.userData.vy < 0) { i.position.y = hit.position.y + 0.5; i.userData.vy = 0; }
        const pBox = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(player.position.x, player.position.y + playerSize.y/2, 0), playerSize);
        if (pBox.intersectsBox(new THREE.Box3().setFromObject(i))) { gameState.isSuper = true; player.scale.set(1.5, 1.5, 1.5); playerSize.set(0.9, 2.25, 0.9); scene.remove(i); items.splice(items.indexOf(i), 1); }
    });
}

function animate() {
    requestAnimationFrame(animate); const dt = Math.min(clock.getDelta(), 0.1);
    updatePhysics(dt); updateEnemies(dt); updateItems(dt);
    if (!gameState.isGameOver && !gameState.isGoal) {
        gameState.timeLeft -= dt;
        if (gameState.timeLeft <= 0) {
            gameState.timeLeft = 0;
            gameState.lives--;
            if (gameState.lives <= 0) {
                gameState.lives = 0;
                gameState.isGameOver = true;
            } else {
                player.position.set(2, 5, 0);
                gameState.timeLeft = 400;
            }
        }
    }
    document.getElementById('score').innerText = gameState.score.toString().padStart(6, '0');
    document.getElementById('coins').innerText = 'x' + gameState.coins.toString().padStart(2, '0');
    document.getElementById('lives').innerText = gameState.lives;
    document.getElementById('time').innerText = Math.max(0, Math.ceil(gameState.timeLeft));
    if (gameState.invincibility > 0) { gameState.invincibility -= dt; player.visible = Math.floor(Date.now()/100)%2===0; } else player.visible = true;
    if (!gameState.isGoal) {
        if (keys.ArrowRight) player.rotation.y = Math.PI / 2; else if (keys.ArrowLeft) player.rotation.y = -Math.PI / 2;
        const data = player.userData;
        if (!isGrounded) { data.leftArm.rotation.x = -0.5; data.rightArm.rotation.x = 0.5; }
        else if (Math.abs(playerVelocity.x) > 0.5) { data.walkTime += dt * 15; const s = Math.sin(data.walkTime) * 0.7; data.leftArm.rotation.x = s; data.rightArm.rotation.x = -s; data.leftLeg.rotation.x = -s; data.rightLeg.rotation.x = s; }
        else { data.leftArm.rotation.x = data.rightArm.rotation.x = data.leftLeg.rotation.x = data.rightLeg.rotation.x = 0; }
    }
    camera.position.x = player.position.x + 4; dirLight.position.x = camera.position.x + 5;
    renderer.render(scene, camera);
}
const clock = new THREE.Clock(); loadLevel(0); animate();
window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
