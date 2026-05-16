import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- GAME CONFIG ---
const CONFIG = {
        gravity: -35,
        jumpVelocity: 21,
        moveSpeed: 10,
        blockSize: 1,
        pathWidth: 3, // About 5 times the width of the character 0.6
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
        isGoal: false,
        isPaused: true,
        cameraDistance: 6
};

// --- SCENE SETUP ---
const container = document.getElementById('game-container');
const scene = new THREE.Scene();
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
camera.rotation.order = 'YXZ'; // Standard for FPS
camera.rotation.y = -Math.PI / 2; // Look towards +X (level direction)

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

// --- CONTROLS & MENU ---
const controls = new PointerLockControls(camera, document.body);

// --- BGM (defined early so event listeners can reference it) ---
class RealBGM {
        constructor() { this.audio = new Audio(); this.audio.loop = true; this.tracks = ['supermario.ogg','underground.ogg','castle.ogg']; }
        play(id) { this.stop(); this.audio.src = this.tracks[id]||this.tracks[0]; this.audio.play().catch(()=>{}); }
        stop() { this.audio.pause(); this.audio.currentTime = 0; }
}
const bgmPlayer = new RealBGM();

// --- MENU PREVIEW SCENE ---
const previewCanvas = document.getElementById('preview-canvas');
const previewRenderer = new THREE.WebGLRenderer({ canvas: previewCanvas, antialias: true });
previewRenderer.setSize(260, 360);
previewRenderer.setClearColor(0x1a2a5e, 1);
const previewScene = new THREE.Scene();
previewScene.add(new THREE.AmbientLight(0xffffff, 1.0));
const pvLight = new THREE.DirectionalLight(0xffffff, 1.2);
pvLight.position.set(2, 4, 5);
previewScene.add(pvLight);
const previewCamera = new THREE.PerspectiveCamera(50, 260/360, 0.1, 100);
previewCamera.position.set(0, 1.2, 4);
previewCamera.lookAt(0, 0.8, 0);
let previewMario = null;

let customColors = {
        hat: 0xff0000, shirt: 0xff0000, pants: 0x0000ff, shoes: 0x663300
};

// High Score Init
let highScore = localStorage.getItem('marioHighScore') || 0;
document.getElementById('high-score-display').innerText = `HIGH SCORE: ${highScore}`;

document.getElementById('return-menu-btn').addEventListener('click', () => {
        document.getElementById('game-clear').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        bgmPlayer.stop();
});

document.getElementById('start-btn').addEventListener('click', () => {
        // Read customizations
                                                          customColors.hat = parseInt(document.getElementById('color-hat').value.replace('#', '0x'));
        customColors.shirt = parseInt(document.getElementById('color-shirt').value.replace('#', '0x'));
        customColors.pants = parseInt(document.getElementById('color-pants').value.replace('#', '0x'));
        customColors.shoes = parseInt(document.getElementById('color-shoes').value.replace('#', '0x'));

                                                          updateMarioColors(); // Update material colors

                                                          player.rotation.y = Math.PI; // Reset rotation

                                                          // Read level
                                                          const lvl = parseInt(document.getElementById('level-select').value);

                                                          document.getElementById('main-menu').classList.add('hidden');
        controls.lock();

                                                          gameState.isGameOver = false;
        gameState.isGoal = false;
        gameState.lives = 3;
        gameState.score = 0;
        gameState.coins = 0;
        gameState.timeLeft = 400;

                                                          loadLevel(lvl);
});

document.getElementById('pause-screen').addEventListener('click', () => {
        controls.lock();
});

container.addEventListener('click', () => {
        if (gameState.isPaused && !gameState.isGameOver && document.getElementById('main-menu').classList.contains('hidden') && document.getElementById('game-clear').classList.contains('hidden')) {
                    controls.lock();
        }
});

controls.addEventListener('lock', () => {
        gameState.isPaused = false;
        document.getElementById('ui-layer').style.opacity = '1';
        document.getElementById('pause-screen').classList.add('hidden');
});

controls.addEventListener('unlock', () => {
        gameState.isPaused = true;
        if (!gameState.isGameOver && !gameState.isGoal) {
                    document.getElementById('pause-screen').classList.remove('hidden');
        }
});

// Live update for color pickers (Preview)
['hat', 'shirt', 'pants', 'shoes'].forEach(part => {
        document.getElementById(`color-${part}`).addEventListener('input', (e) => {
                    customColors[part] = parseInt(e.target.value.replace('#', '0x'));
                    updateMarioColors();
        });
});

// --- PROCEDURAL MODELS ---
const colors = {
        marioSkin: 0xffcc99, marioBrown: 0x663300,
        goombaBrown: 0x8b4513, goombaLight: 0xdeb887, brick: 0xB22222, ground: 0x8B4513,
        question: 0xFFD700, used: 0xcccccc, black: 0x000000, mushroomRed: 0xff0000, mushroomWhite: 0xffffff,
        pipe: 0x228B22, brickBlue: 0x3366ff, groundBlue: 0x2244aa, koopaGreen: 0x00ff00, koopaYellow: 0xffff00
};

let marioMats = {
        hat:   new THREE.MeshStandardMaterial({ color: 0xff0000 }),
        shirt: new THREE.MeshStandardMaterial({ color: 0xff0000 }),
        pants: new THREE.MeshStandardMaterial({ color: 0x0000ff }),
        shoes: new THREE.MeshStandardMaterial({ color: 0x663300 })
};

// --- BUILD PREVIEW MARIO inline (marioMats is now ready) ---
(function() {
        const g = new THREE.Group();
        const skin  = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
        const black = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const white = new THREE.MeshStandardMaterial({ color: 0xffffff });

     const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.4), marioMats.pants);
        torso.position.y = 0.55; g.add(torso);
        const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.35, 0.42), marioMats.shirt);
        shirt.position.y = 0.85; g.add(shirt);

     const headG = new THREE.Group(); headG.position.y = 1.3; g.add(headG);
        headG.add(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), skin));
        const hat  = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.2, 0.57), marioMats.hat);
        hat.position.y = 0.35; headG.add(hat);
        const brim = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.4), marioMats.hat);
        brim.position.set(0, 0.25, -0.3); headG.add(brim);
        const re   = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.1), black);
        re.position.set( 0.15, 0.1, -0.3); headG.add(re);
        const le   = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.1), black);
        le.position.set(-0.15, 0.1, -0.3); headG.add(le);
        const mst  = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), black);
        mst.position.set(0, -0.1, -0.32); headG.add(mst);
        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.15), skin);
        nose.position.set(0, 0, -0.35); headG.add(nose);

     function limb(px, py, isArm) {
                 const p = new THREE.Group(); p.position.set(px, py, 0);
                 const seg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), isArm ? marioMats.shirt : marioMats.pants);
                 seg.position.y = -0.2; p.add(seg);
                 const end = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.3), isArm ? white : marioMats.shoes);
                 end.position.set(0, -0.4, -0.05); p.add(end);
                 return p;
     }
        g.add(limb(-0.35, 0.95, true));
        g.add(limb( 0.35, 0.95, true));
        g.add(limb(-0.15, 0.4, false));
        g.add(limb( 0.15, 0.4, false));

     previewMario = g;
        previewScene.add(previewMario);
        // Render once immediately so we don't wait for the first animate tick
     previewRenderer.render(previewScene, previewCamera);
})();

function updateMarioColors() {
        marioMats.hat.color.setHex(customColors.hat);      marioMats.hat.needsUpdate = true;
        marioMats.shirt.color.setHex(customColors.shirt);  marioMats.shirt.needsUpdate = true;
        marioMats.pants.color.setHex(customColors.pants);  marioMats.pants.needsUpdate = true;
        marioMats.shoes.color.setHex(customColors.shoes);  marioMats.shoes.needsUpdate = true;
}

function createMario() {
        const group = new THREE.Group();
        const matSkin = new THREE.MeshStandardMaterial({ color: colors.marioSkin });
        const matBlack = new THREE.MeshStandardMaterial({ color: colors.black });
        const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });

    // Torso (Pants)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.4), marioMats.pants);
        torso.position.y = 0.55; group.add(torso);

    // Shirt
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.35, 0.42), marioMats.shirt);
        shirt.position.y = 0.85; shirt.name = 'shirt'; group.add(shirt);

    // Head
    const headGroup = new THREE.Group();
        headGroup.position.y = 1.3; headGroup.name = 'head'; group.add(headGroup);

    const face = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), matSkin);
        headGroup.add(face);

    // Hat
    const hat = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.2, 0.57), marioMats.hat);
        hat.position.y = 0.35; headGroup.add(hat);
        const brim = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.4), marioMats.hat);
        brim.position.set(0, 0.25, -0.3); headGroup.add(brim); // Looking -Z by default

    // Details (Eyes, Mustache)
    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.1), matBlack);
        rightEye.position.set(0.15, 0.1, -0.3); headGroup.add(rightEye);
        const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.1), matBlack);
        leftEye.position.set(-0.15, 0.1, -0.3); headGroup.add(leftEye);

    const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), matBlack);
        mustache.position.set(0, -0.1, -0.32); headGroup.add(mustache);

    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.15), matSkin);
        nose.position.set(0, 0, -0.35); headGroup.add(nose);

    // Limbs
    function createLimb(x, y, isArm) {
                const p = new THREE.Group(); p.position.set(x, y, 0);
                const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), isArm ? marioMats.shirt : marioMats.pants); 
            m.position.y = -0.2; p.add(m);
                // Hands/Shoes
            const end = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.3), isArm ? matWhite : marioMats.shoes);
                end.position.set(0, -0.4, -0.05); p.add(end);
                return p;
    }
        const leftArm = createLimb(-0.35, 0.95, true); group.add(leftArm);
        const rightArm = createLimb(0.35, 0.95, true); group.add(rightArm);
        const leftLeg = createLimb(-0.15, 0.4, false); group.add(leftLeg);
        const rightLeg = createLimb(0.15, 0.4, false); group.add(rightLeg);

    group.userData = { leftArm, rightArm, leftLeg, rightLeg, walkTime: 0 };
        return group;
}

// Circular Shadow for depth perception
const shadowGeo = new THREE.CircleGeometry(0.4, 32);
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 });
const shadow = new THREE.Mesh(shadowGeo, shadowMat);
shadow.rotation.x = -Math.PI / 2;
scene.add(shadow);

function createGoomba() {
        const g = new THREE.Group();
        const matBrown = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const matLight = new THREE.MeshStandardMaterial({ color: 0xdeb887 });
        const matDark  = new THREE.MeshStandardMaterial({ color: 0x4a2200 });
        const matBlack = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 0.75), matBrown);
        body.position.y = 0.5; g.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.75, 0.85), matBrown);
        head.position.y = 1.1; g.add(head);
        const face = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.05), matLight);
        face.position.set(0, 1.1, -0.43); g.add(face);
        const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.05), matWhite);
        eyeL.position.set(-0.2, 1.2, -0.46); g.add(eyeL);
        const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.05), matWhite);
        eyeR.position.set(0.2, 1.2, -0.46); g.add(eyeR);
        const pupL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), matBlack);
        pupL.position.set(-0.22, 1.18, -0.48); g.add(pupL);
        const pupR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), matBlack);
        pupR.position.set(0.18, 1.18, -0.48); g.add(pupR);
        const browL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.07, 0.05), matDark);
        browL.position.set(-0.2, 1.35, -0.46); browL.rotation.z = 0.4; g.add(browL);
        const browR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.07, 0.05), matDark);
        browR.position.set(0.2, 1.35, -0.46); browR.rotation.z = -0.4; g.add(browR);
        const toothL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.05), matWhite);
        toothL.position.set(-0.12, 0.96, -0.46); g.add(toothL);
        const toothR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.05), matWhite);
        toothR.position.set(0.12, 0.96, -0.46); g.add(toothR);

    const footL = new THREE.Group(); footL.position.set(-0.22, 0.13, 0);
        const fLmesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.5), matDark);
        footL.add(fLmesh); g.add(footL);
        const footR = new THREE.Group(); footR.position.set(0.22, 0.13, 0);
        const fRmesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.5), matDark);
        footR.add(fRmesh); g.add(footR);

    g.userData = { footL, footR, walkTime: 0, type: 'goomba', state: 'walking',
                                     velocity: new THREE.Vector3(-2.5, 0, 0), bBox: new THREE.Box3() };
        return g;
}

function createKoopa() {
        const g = new THREE.Group();
        const matShell  = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        const matShellL = new THREE.MeshStandardMaterial({ color: 0x32cd32 });
        const matSkin   = new THREE.MeshStandardMaterial({ color: 0xf5c842 });
        const matBlack  = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const matWhite  = new THREE.MeshStandardMaterial({ color: 0xeeeeee });

    // Shell body
    const shell = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), matShell);
        shell.position.y = 0.6; g.add(shell);
        // Shell Rim (white edge)
    const rim = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.15, 0.82), matWhite);
        rim.position.y = 0.35; g.add(rim);

    // Chest/Belly Ribs (Yellow plate)
    for(let i=0; i<3; i++) {
                const rib = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.05), matSkin);
                rib.position.set(0, 0.5 + i*0.15, -0.38); g.add(rib);
    }

    // Tail
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.3), matSkin);
        tail.position.set(0, 0.45, 0.45); tail.rotation.x = -0.3; g.add(tail);

    // Neck
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, 0.25), matSkin);
        neck.position.set(0, 1.0, -0.1); g.add(neck);

    // Head
    const head = new THREE.Group(); head.position.set(0, 1.3, -0.2); g.add(head);
        const headMain = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.5), matSkin);
        head.add(headMain);

    // Snout/Muzzle
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.2), matSkin);
        snout.position.set(0, -0.1, -0.3); head.add(snout);

    // Eyes
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.05), matWhite);
        eyeL.position.set(-0.12, 0.12, -0.26); head.add(eyeL);
        const pupL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.05), matBlack);
        pupL.position.set(-0.12, 0.12, -0.28); head.add(pupL);

    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.05), matWhite);
        eyeR.position.set( 0.12, 0.12, -0.26); head.add(eyeR);
        const pupR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.05), matBlack);
        pupR.position.set( 0.12, 0.12, -0.28); head.add(pupR);

    // Eyebrows
    const browL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.05), matBlack);
        browL.position.set(-0.12, 0.25, -0.26); head.add(browL);
        const browR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.05), matBlack);
        browR.position.set( 0.12, 0.25, -0.26); head.add(browR);

    // Legs
    const legL = new THREE.Group(); legL.position.set(-0.28, 0.3, 0); g.add(legL);
        const legLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), matSkin);
        legLMesh.position.y = -0.2; legL.add(legLMesh);
        const footL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.15, 0.4), matSkin);
        footL.position.set(0, -0.4, -0.05); legL.add(footL);

    const legR = new THREE.Group(); legR.position.set( 0.28, 0.3, 0); g.add(legR);
        const legRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), matSkin);
        legRMesh.position.y = -0.2; legR.add(legRMesh);
        const footR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.15, 0.4), matSkin);
        footR.position.set(0, -0.4, -0.05); legR.add(footR);

    g.userData = { legL, legR, head, walkTime: 0, type: 'koopa', state: 'walking',
                                     velocity: new THREE.Vector3(-2, 0, 0), bBox: new THREE.Box3() };
        return g;
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

function createFireball() {
        const geo = new THREE.SphereGeometry(0.25, 8, 8);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff0000 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData = { type: 'fireball', velocity: new THREE.Vector3(0,0,0) };
        return mesh;
}

function createBowser() {
        const g = new THREE.Group();
        const matGreen = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        const matSkin  = new THREE.MeshStandardMaterial({ color: 0xf5c842 });
        const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const matBlack = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const matRed   = new THREE.MeshStandardMaterial({ color: 0xff0000 });

    // Large Shell
    const shell = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.0, 2.5), matGreen);
        shell.position.y = 1.5; g.add(shell);
        // Spikes
    const spikeGeo = new THREE.ConeGeometry(0.2, 0.5, 8);
        for(let i=0; i<8; i++){
                    const s = new THREE.Mesh(spikeGeo, matWhite);
                    s.position.set(Math.sin(i)*1.0, 2.5, Math.cos(i)*1.0);
                    g.add(s);
        }

    // Large Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.5, 2.0), matSkin);
        body.position.y = 0.75; g.add(body);

    // Head
    const head = new THREE.Group(); head.position.set(0, 2.2, -1.0); g.add(head);
        head.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), matSkin));
        // Hair/Mane
    const hair = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 1.3), matRed);
        hair.position.y = 0.6; head.add(hair);
        // Snout
    const snout = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.8), matSkin);
        snout.position.set(0, -0.2, -0.8); head.add(snout);
        // Label "BOWSER"
    const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'red'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center';
        ctx.fillText('BOWSER', 128, 45);
        const textTex = new THREE.CanvasTexture(canvas);
        const label = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.5), new THREE.MeshBasicMaterial({ map: textTex, transparent: true }));
        label.position.y = 3.5; g.add(label);

    g.userData = { type: 'bowser', hp: 5, state: 'idle', timer: 0, velocity: new THREE.Vector3(0,0,0) };
        return g;
}

// --- LEVEL GENERATION ---
let levelData = [];
let worldGroup = new THREE.Group();
scene.add(worldGroup);

function loadLevel(id) {
        gameState.currentLevel = id;
        worldGroup.clear();
        levelData = [];
        enemies = [];
        items = [];
        fireballs = [];

    // Level specific colors
    if (id === 1) { // Underground
            renderer.setClearColor(0x000000);
                scene.fog = new THREE.Fog(0x000000, 10, 50);
                bgmPlayer.play(1);
    } else if (id === 2) { // Castle
            renderer.setClearColor(0x220000);
                scene.fog = new THREE.Fog(0x220000, 10, 60);
                bgmPlayer.play(2);
    } else { // Plain
            renderer.setClearColor(0x5c94fc);
                scene.fog = new THREE.Fog(0x5c94fc, 20, 100);
                bgmPlayer.play(0);
    }

    const levelWidth = 100;
        const pathWidth = CONFIG.pathWidth;

    // Ground
    const groundGeo = new THREE.BoxGeometry(levelWidth + 20, 2, pathWidth + 4);
        const groundMat = new THREE.MeshStandardMaterial({ color: (id===1)?colors.groundBlue:colors.ground });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.set(levelWidth/2, -1, 0);
        ground.receiveShadow = true;
        worldGroup.add(ground);

    // Obstacles
    const blocks = [];
        if (id === 1) { // Lvl 1: Underground
            blocks.push({ x: 5, y: 3, type: 'brick' }, { x: 6, y: 3, type: 'question' }, { x: 7, y: 3, type: 'brick' });
                    blocks.push({ x: 12, y: 4, type: 'brick' }, { x: 13, y: 4, type: 'brick' });
                    blocks.push({ x: 18, y: 2, type: 'pipe', h: 2 });
                    blocks.push({ x: 25, y: 5, type: 'question' });
                    blocks.push({ x: 30, y: 3, type: 'brick' }, { x: 31, y: 3, type: 'brick' }, { x: 32, y: 3, type: 'brick' });
                    blocks.push({ x: 40, y: 2, type: 'pipe', h: 3 });
                    blocks.push({ x: 50, y: 4, type: 'question', item: 'mushroom' });
                    blocks.push({ x: 60, y: 3, type: 'brick' }, { x: 65, y: 5, type: 'brick' });
                    blocks.push({ x: 75, y: 2, type: 'pipe', h: 2 });
        } else if (id === 2) { // Lvl 2: Castle
            for(let i=0; i<5; i++) blocks.push({ x: 10 + i*5, y: 3, type: 'brick' });
                    blocks.push({ x: 12, y: 6, type: 'question' });
                    blocks.push({ x: 25, y: 4, type: 'pipe', h: 4 });
                    blocks.push({ x: 40, y: 3, type: 'brick' }, { x: 41, y: 3, type: 'question', item: 'mushroom' }, { x: 42, y: 3, type: 'brick' });
                    blocks.push({ x: 55, y: 2, type: 'pipe', h: 2 });
                    blocks.push({ x: 70, y: 5, type: 'brick' }, { x: 71, y: 5, type: 'brick' });
        } else if (id === 3) { // Lvl 3: BOSS (Bowser)
            // Arena layout
            for(let i=0; i<10; i++) {
                            blocks.push({ x: 80 + i, y: 4, type: 'brick' }); // Platform for Bowser
            }
                    blocks.push({ x: 40, y: 3, type: 'question', item: 'mushroom' });

            // Add Bowser
            const bowser = createBowser();
                    bowser.position.set(85, 0, 0);
                    worldGroup.add(bowser);
                    enemies.push(bowser);
        } else { // Lvl 0: Plain
            blocks.push({ x: 8, y: 3, type: 'question' });
                    blocks.push({ x: 15, y: 4, type: 'brick' }, { x: 16, y: 4, type: 'question', item: 'mushroom' }, { x: 17, y: 4, type: 'brick' });
                    blocks.push({ x: 25, y: 2, type: 'pipe', h: 2 });
                    blocks.push({ x: 35, y: 3, type: 'brick' }, { x: 36, y: 3, type: 'brick' });
                    blocks.push({ x: 45, y: 2, type: 'pipe', h: 3 });
                    blocks.push({ x: 55, y: 5, type: 'brick' }, { x: 56, y: 5, type: 'brick' });
                    blocks.push({ x: 70, y: 2, type: 'pipe', h: 2 });
        }

    blocks.forEach(b => {
                let mesh;
                if (b.type === 'pipe') {
                                mesh = createPipe(b.h || 2);
                                mesh.position.set(b.x, (b.h || 2)/2, 0);
                } else {
                                mesh = createBlock(b.type, b.item);
                                mesh.position.set(b.x, b.y, 0);
                }
                mesh.userData.gridX = b.x;
                mesh.userData.gridY = b.y;
                worldGroup.add(mesh);
                levelData.push(mesh);
    });

    // Flagpole
    const flagX = (id === 3) ? 95 : 90;
        const flag = createFlagpole();
        flag.position.set(flagX, 0, 0);
        worldGroup.add(flag);
        levelData.push(flag);

    // Initial Enemies (except Bowser who was added above)
    if (id !== 3) {
                spawnEnemy('goomba', 15, 1);
                spawnEnemy('goomba', 35, 1);
                spawnEnemy('koopa', 50, 1);
                spawnEnemy('goomba', 65, 1);
                spawnEnemy('koopa', 80, 1);
    }

    // Player Init
    player.position.set(0, 1, 0);
        playerVelocity.set(0, 0, 0);
        gameState.isGoal = false;
        scene.add(player);
}

function createBlock(type, item) {
        const geo = new THREE.BoxGeometry(1, 1, 1);
        let mat;
        if (type === 'question') mat = new THREE.MeshStandardMaterial({ color: colors.question });
        else if (type === 'brick') mat = new THREE.MeshStandardMaterial({ color: (gameState.currentLevel===1)?colors.brickBlue:colors.brick });
        else mat = new THREE.MeshStandardMaterial({ color: colors.used });

    const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { type, item, originalY: 0 };
        return mesh;
}

function createPipe(h) {
        const g = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: colors.pipe });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, h), mat);
        body.position.y = 0;
        g.add(body);
        const top = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.5), mat);
        top.position.y = h/2 - 0.25;
        g.add(top);
        g.userData = { type: 'pipe' };
        return g;
}

function createFlagpole() {
        const g = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 8), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
        pole.position.y = 4;
        g.add(pole);
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.25), new THREE.MeshStandardMaterial({ color: 0xFFD700 }));
        ball.position.y = 8;
        g.add(ball);
        const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1), new THREE.MeshStandardMaterial({ color: 0x00ff00, side: THREE.DoubleSide }));
        flag.position.set(0.75, 7, 0);
        g.add(flag);
        g.userData = { type: 'flagpole' };
        return g;
}

// --- ENEMIES & ITEMS ---
let enemies = [];
let items = [];
let fireballs = [];

function spawnEnemy(type, x, y) {
        let e;
        if (type === 'goomba') e = createGoomba();
        else if (type === 'koopa') e = createKoopa();
        e.position.set(x, y, 0);
        worldGroup.add(e);
        enemies.push(e);
}

function spawnItem(type, x, y) {
        let it;
        if (type === 'mushroom') it = createMushroom();
        it.position.set(x, y + 1, 0);
        worldGroup.add(it);
        items.push(it);
}

// --- PLAYER ---
const player = createMario();
const playerVelocity = new THREE.Vector3();
let canJump = false;

// --- COLLISION ---
function checkCollision(pos, boxSize) {
        const half = boxSize / 2;
        const pBox = new THREE.Box3().setFromCenterAndSize(pos, new THREE.Vector3(boxSize, boxSize, boxSize));

    for (const obj of levelData) {
                const oBox = new THREE.Box3().setFromObject(obj);
                if (pBox.intersectsBox(oBox)) {
                                // Very simple block-based resolution
                    return obj;
                }
    }
        return null;
}

function handleEnemyCollisions() {
        const pBox = new THREE.Box3().setFromObject(player);

    enemies.forEach((enemy, idx) => {
                if (enemy.userData.state === 'dead') return;

                            const eBox = new THREE.Box3().setFromObject(enemy);
                if (pBox.intersectsBox(eBox)) {
                                // Check if jumping on top
                    const pBottom = player.position.y;
                                const eTop = enemy.position.y + 0.5;

                    if (playerVelocity.y < 0 && pBottom > eTop - 0.2) {
                                        // Kill enemy
                                    if (enemy.userData.type === 'bowser') {
                                                            enemy.userData.hp--;
                                                            playerVelocity.y = 15; // Bounce
                                            if (enemy.userData.hp <= 0) {
                                                                        enemy.userData.state = 'dead';
                                                                        scene.remove(enemy);
                                                                        gameState.score += 5000;
                                            }
                                    } else {
                                                            enemy.userData.state = 'dead';
                                                            playerVelocity.y = 12; // Bounce
                                            gameState.score += 100;
                                                            // Goomba squish or Koopa shell logic simplified:
                                            scene.remove(enemy);
                                    }
                    } else {
                                        // Mario hit
                                    if (gameState.invincibility <= 0) {
                                                            if (gameState.isSuper) {
                                                                                        gameState.isSuper = false;
                                                                                        player.scale.set(1, 1, 1);
                                                                                        gameState.invincibility = 120;
                                                            } else {
                                                                                        gameState.lives--;
                                                                                        if (gameState.lives <= 0) {
                                                                                                                        gameOver();
                                                                                            } else {
                                                                                                                        // Reset position
                                                                                            player.position.set(Math.max(0, player.position.x - 5), 1, 0);
                                                                                                                        gameState.invincibility = 120;
                                                                                            }
                                                            }
                                    }
                    }
                }
    });
}

function updateEnemies(dt) {
        enemies.forEach(enemy => {
                    if (enemy.userData.state === 'dead') return;

                                if (enemy.userData.type === 'bowser') {
                                                // Bowser logic
                        enemy.userData.timer += dt;
                                                if (enemy.userData.timer > 2) {
                                                                    const rand = Math.random();
                                                                    if (rand < 0.5) {
                                                                                            // Jump
                                                                        enemy.userData.velocity.y = 15;
                                                                    } else {
                                                                                            // Fire
                                                                        const fb = createFireball();
                                                                                            fb.position.copy(enemy.position).add(new THREE.Vector3(-1, 2, 0));
                                                                                            fb.userData.velocity.set(-8, (Math.random()-0.5)*4, 0);
                                                                                            worldGroup.add(fb);
                                                                                            fireballs.push(fb);
                                                                    }
                                                                    enemy.userData.timer = 0;
                                                }

                        // Bowser Physics
                        enemy.userData.velocity.y += CONFIG.gravity * dt;
                                                enemy.position.y += enemy.userData.velocity.y * dt;
                                                if (enemy.position.y < 0) {
                                                                    enemy.position.y = 0;
                                                                    enemy.userData.velocity.y = 0;
                                                }
                                                // Move back and forth
                        enemy.position.x += Math.sin(Date.now()*0.002) * 0.05;

                                } else {
                                                // Standard enemy logic
                        enemy.position.addScaledVector(enemy.userData.velocity, dt);

                        // Simple edge turn
                        if (enemy.position.x < 0 || enemy.position.x > 100) enemy.userData.velocity.x *= -1;

                        // Animation
                        enemy.userData.walkTime += dt * 10;
                                                if (enemy.userData.type === 'goomba') {
                                                                    enemy.userData.footL.rotation.x = Math.sin(enemy.userData.walkTime) * 0.5;
                                                                    enemy.userData.footR.rotation.x = Math.cos(enemy.userData.walkTime) * 0.5;
                                                } else {
                                                                    enemy.userData.legL.rotation.x = Math.sin(enemy.userData.walkTime) * 0.5;
                                                                    enemy.userData.legR.rotation.x = Math.cos(enemy.userData.walkTime) * 0.5;
                                                }
                                }
        });

    // Fireballs
    fireballs.forEach((fb, idx) => {
                fb.position.addScaledVector(fb.userData.velocity, dt);
                if (fb.position.x < player.position.x - 20) {
                                scene.remove(fb);
                                fireballs.splice(idx, 1);
                }
                // Collision with player
                              if (fb.position.distanceTo(player.position) < 1.0) {
                                               if (gameState.invincibility <= 0) {
                                                                    gameState.lives--;
                                                                    gameState.invincibility = 120;
                                                                    scene.remove(fb);
                                                                    fireballs.splice(idx, 1);
                                               }
                              }
    });
}

function updateItems(dt) {
        items.forEach((item, idx) => {
                    item.position.x += item.userData.vx * dt;
                    item.userData.vy += CONFIG.gravity * dt;
                    item.position.y += item.userData.vy * dt;

                              if (item.position.y < 1) {
                                              item.position.y = 1;
                                              item.userData.vy = 0;
                              }

                              // Mario collection
                              if (item.position.distanceTo(player.position) < 0.8) {
                                              if (item.userData.type === 'mushroom') {
                                                                  gameState.isSuper = true;
                                                                  player.scale.set(1.5, 1.5, 1.5);
                                                                  gameState.score += 1000;
                                              }
                                              scene.remove(item);
                                              items.splice(idx, 1);
                              }
        });
}

// --- INPUT ---
const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

// --- MAIN LOOP ---
const clock = new THREE.Clock();

function animate() {
        requestAnimationFrame(animate);
        const dt = Math.min(clock.getDelta(), 0.1);

    // Preview scene animation (Menu)
    if (previewMario) {
                previewMario.rotation.y += 0.01;
                previewRenderer.render(previewScene, previewCamera);
    }

    if (gameState.isPaused || gameState.isGameOver || gameState.isGoal) return;

    // Movement
    const moveDir = new THREE.Vector3();
        if (keys['KeyA'] || keys['ArrowLeft']) moveDir.x = -1;
        if (keys['KeyD'] || keys['ArrowRight']) moveDir.x = 1;

    playerVelocity.x = moveDir.x * CONFIG.moveSpeed;

    // Gravity
    if (!canJump) playerVelocity.y += CONFIG.gravity * dt;

    // Jump
    if ((keys['KeyW'] || keys['Space'] || keys['ArrowUp']) && canJump) {
                playerVelocity.y = CONFIG.jumpVelocity;
                canJump = false;
    }

    player.position.x += playerVelocity.x * dt;
        player.position.y += playerVelocity.y * dt;

    // Floor collision (simplistic)
    if (player.position.y <= 1) {
                player.position.y = 1;
                playerVelocity.y = 0;
                canJump = true;
    }

    // Block collision
    const hit = checkCollision(player.position, 0.8);
        if (hit) {
                    if (playerVelocity.y > 0 && player.position.y < hit.position.y) {
                                    // Hit head
                        playerVelocity.y = 0;
                                    player.position.y = hit.position.y - 1;
                                    if (hit.userData.type === 'question') {
                                                        hit.userData.type = 'used';
                                                        hit.material.color.setHex(colors.used);
                                                        gameState.coins++;
                                                        gameState.score += 200;
                                                        if (hit.userData.item) spawnItem(hit.userData.item, hit.position.x, hit.position.y);
                                    }
                    } else if (playerVelocity.y < 0 && player.position.y > hit.position.y) {
                                    // Land on
                        player.position.y = hit.position.y + 1;
                                    playerVelocity.y = 0;
                                    canJump = true;
                    } else {
                                    // Side hit
                        player.position.x -= playerVelocity.x * dt;
                    }
        }

    // Flagpole collision
    if (player.position.x >= 90) {
                victory();
    }

    // Fall off
    if (player.position.y < -5) {
                gameOver();
    }

    // Update systems
    handleEnemyCollisions();
        updateEnemies(dt);
        updateItems(dt);

    if (gameState.invincibility > 0) {
                gameState.invincibility--;
                player.visible = (gameState.invincibility % 10 < 5);
    } else {
                player.visible = true;
    }

    // Camera follow
    camera.position.x = player.position.x;
        camera.position.y = player.position.y + 2;
        camera.position.z = gameState.cameraDistance;
        camera.lookAt(player.position.x, player.position.y + 1, 0);

    // Shadow follow
    shadow.position.set(player.position.x, 0.01, 0);

    gameState.timeLeft -= dt;
        if (gameState.timeLeft <= 0) gameOver();

    updateUI();
        renderer.render(scene, camera);
}

function updateUI() {
        document.getElementById('score').innerText = Math.floor(gameState.score).toString().padStart(6, '0');
        document.getElementById('coins').innerText = gameState.coins.toString().padStart(2, '0');
        document.getElementById('lives').innerText = gameState.lives;
        document.getElementById('world').innerText = '1-' + gameState.currentLevel;
        document.getElementById('time').innerText = Math.floor(gameState.timeLeft).toString().padStart(3, '0');
}

function victory() {
        gameState.isGoal = true;
        controls.unlock();
        document.getElementById('game-clear').classList.remove('hidden');
        bgmPlayer.stop();
        if (gameState.score > highScore) {
                    highScore = Math.floor(gameState.score);
                    localStorage.setItem('marioHighScore', highScore);
                    document.getElementById('high-score-display').innerText = `HIGH SCORE: ${highScore}`;
        }
}

function gameOver() {
        gameState.isGameOver = true;
        controls.unlock();
        alert('GAME OVER! Score: ' + Math.floor(gameState.score));
        bgmPlayer.stop();
        location.reload();
}

animate();
