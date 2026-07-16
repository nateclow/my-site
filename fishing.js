// --- FISH DATABASE (10 Fish, 3 Rarities) ---
const FISH_CATALOG = [
    // Common (50% overall chance)
    { name: "Pond Minnow", rarity: "Common", prob: 0.14 },
    { name: "Speckled Trout", rarity: "Common", prob: 0.14 },
    { name: "Muddy Carp", rarity: "Common", prob: 0.14 },
    { name: "Sunfish", rarity: "Common", prob: 0.14 },
    { name: "Reed Perch", rarity: "Common", prob: 0.14 },
  
    { name: "Whiskered Catfish", rarity: "Rare", prob: 0.07 },
    { name: "Silver Pike", rarity: "Rare", prob: 0.07 },
    { name: "Ghost Koi", rarity: "Rare", prob: 0.07 },
    
    { name: "Golden Sturgeon", rarity: "Legendary", prob: 0.05 },
    { name: "Moonlit Leviathan", rarity: "Legendary", prob: 0.03 },
    { name: "Fin Whale". rarity: "Legendary", prob: 0.01}
];

// --- GAME STATE ---
let state = "IDLE"; // IDLE, CASTING, WAITING, BITING
let castTimer = null;
let biteTimer = null;
let catches = [];

// --- CANVAS SETUP ---
const canvas = document.getElementById('pondCanvas');
const ctx = canvas.getContext('2d');
let width, height;

function resizeCanvas() {
    width = canvas.parentElement.clientWidth;
    height = canvas.parentElement.clientHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- ANIMATION VARIABLES ---
let ripples = [];
let swimmingFish = [];
let bobber = { x: 0, y: 0, targetX: 0, targetY: 0, active: false };

// Initialize background swimming fish silhouettes
for (let i = 0; i < 8; i++) {
    swimmingFish.push({
        x: Math.random() * 800,
        y: 200 + Math.random() * 300,
        speed: 0.5 + Math.random() * 1,
        size: 15 + Math.random() * 20
    });
}

// --- DOM ELEMENTS ---
const btnCast = document.getElementById('btn-cast');
const btnReel = document.getElementById('btn-reel');
const statusEl = document.getElementById('status');
const inventoryList = document.getElementById('inventory-list');
const catchCountEl = document.getElementById('catch-count');

// --- EVENT LISTENERS ---
btnCast.addEventListener('click', castLine);
btnReel.addEventListener('click', reelIn);
canvas.addEventListener('click', () => {
    if (state === "IDLE") castLine();
    else if (state === "BITING" || state === "WAITING") reelIn();
});

// --- GAME LOGIC ---
function castLine() {
    if (state !== "IDLE") return;
    
    state = "CASTING";
    statusEl.innerText = "Casting...";
    btnCast.disabled = true;
    btnReel.disabled = false;

    // Set bobber target out in the pond
    bobber.targetX = width * 0.4 + Math.random() * (width * 0.4);
    bobber.targetY = height * 0.5 + Math.random() * (height * 0.3);
    bobber.x = width * 0.18; // Starts at rod tip
    bobber.y = height * 0.45;
    bobber.active = true;

    // Animate cast delay
    setTimeout(() => {
        state = "WAITING";
        statusEl.innerText = ". . . Waiting for a bite . . .";
        
        // Add ripple where bobber lands
        ripples.push({ x: bobber.targetX, y: bobber.targetY, radius: 5, maxRadius: 40, alpha: 1 });

        // Random bite time between 2 and 6 seconds
        const waitTime = 2000 + Math.random() * 4000;
        castTimer = setTimeout(triggerBite, waitTime);
    }, 600);
}

function triggerBite() {
    if (state !== "WAITING") return;
    state = "BITING";
    statusEl.innerText = "❗ FISH ON! REEL IT IN! ❗";
    
    // Frantic ripples
    for(let i=0; i<3; i++) {
        setTimeout(() => {
            if(bobber.active) {
                ripples.push({ x: bobber.targetX, y: bobber.targetY, radius: 2, maxRadius: 30, alpha: 1 });
            }
        }, i * 300);
    }

    // You have 2.5 seconds to reel it in before it escapes
    biteTimer = setTimeout(() => {
        if (state === "BITING") {
            statusEl.innerText = "The fish got away...";
            resetRod();
        }
    }, 2500);
}

function reelIn() {
    if (state === "CASTING") return;
    
    clearTimeout(castTimer);
    clearTimeout(biteTimer);

    if (state === "BITING") {
        const caughtFish = selectFish();
        catches.push(caughtFish);
        updateInventory(caughtFish);
        statusEl.innerText = `Caught a ${caughtFish.name} (${caughtFish.rarity})!`;
    } else if (state === "WAITING") {
        statusEl.innerText = "Reeled in too early!";
    }

    resetRod();
}

function resetRod() {
    state = "IDLE";
    bobber.active = false;
    btnCast.disabled = false;
    btnReel.disabled = true;
}

function selectFish() {
    const rand = Math.random();
    let cumulative = 0;
    for (let fish of FISH_CATALOG) {
        cumulative += fish.prob;
        if (rand <= cumulative) return fish;
    }
    return FISH_CATALOG[0]; // Fallback
}

function updateInventory(fish) {
    catchCountEl.innerText = catches.length;
    const item = document.createElement('div');
    item.className = `fish-item rarity-${fish.rarity}`;
    item.innerHTML = `<span>${fish.name}</span> <small>[${fish.rarity}]</small>`;
    inventoryList.prepend(item);
}

// --- RENDER LOOP (The Black & White Line Art) ---
function draw() {
    ctx.clearRect(0, 0, width, height);
    
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    drawPond();
    drawSwimmingFish();
    drawRipples();
    drawFisherman();
    drawRodAndLine();

    requestAnimationFrame(draw);
}

function drawPond() {
    // Horizon / Bank Line
    ctx.beginPath();
    ctx.moveTo(0, height * 0.4);
    ctx.bezierCurveTo(width * 0.3, height * 0.45, width * 0.7, height * 0.35, width, height * 0.4);
    ctx.stroke();

    // Decorative Water Lines
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        let y = height * 0.4 + (i * height * 0.12);
        ctx.moveTo(width * 0.2, y);
        ctx.bezierCurveTo(width * 0.4, y + 5, width * 0.6, y - 5, width * 0.8, y);
        ctx.stroke();
    }
    ctx.lineWidth = 2;
}

function drawSwimmingFish() {
    ctx.lineWidth = 1.5;
    swimmingFish.forEach(fish => {
        fish.x += fish.speed;
        if (fish.x > width + 50) fish.x = -50; // Loop around

        // Only draw if below the water line
        if (fish.y > height * 0.45) {
            ctx.save();
            ctx.translate(fish.x, fish.y);
            
            // Draw simple minimalist fish outline
            ctx.beginPath();
            ctx.ellipse(0, 0, fish.size, fish.size * 0.4, 0, 0, Math.PI * 2);
            ctx.moveTo(-fish.size, 0);
            ctx.lineTo(-fish.size - 10, -8);
            ctx.lineTo(-fish.size - 10, 8);
            ctx.closePath();
            ctx.stroke();
            
            ctx.restore();
        }
    });
    ctx.lineWidth = 2;
}

function drawRipples() {
    ctx.lineWidth = 1;
    for (let i = ripples.length - 1; i >= 0; i--) {
        let r = ripples[i];
        r.radius += 0.5;
        r.alpha -= 0.015;

        if (r.alpha <= 0) {
            ripples.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = r.alpha;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    ctx.lineWidth = 2;
}

function drawFisherman() {
    const baseX = width * 0.12;
    const baseY = height * 0.42;

    // Little Dock / Bank overhang
    ctx.beginPath();
    ctx.moveTo(0, baseY + 20);
    ctx.lineTo(baseX + 30, baseY + 20);
    ctx.lineTo(baseX + 20, height);
    ctx.stroke();

    // Body (Sitting stick figure)
    ctx.beginPath();
    ctx.moveTo(baseX, baseY - 40); // Torso top
    ctx.lineTo(baseX, baseY);      // Hips
    ctx.lineTo(baseX + 20, baseY); // Upper legs
    ctx.lineTo(baseX + 20, baseY + 25); // Lower legs
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.arc(baseX, baseY - 50, 10, 0, Math.PI * 2);
    ctx.stroke();

    // The Hat (Cute bucket/triangle fisherman hat)
    ctx.beginPath();
    ctx.moveTo(-18 + baseX, baseY - 55);
    ctx.lineTo(18 + baseX, baseY - 55); // Hat brim
    ctx.moveTo(-10 + baseX, baseY - 55);
    ctx.lineTo(-5 + baseX, baseY - 68); // Crown
    ctx.lineTo(5 + baseX, baseY - 68);
    ctx.lineTo(10 + baseX, baseY - 55);
    ctx.stroke();

    // Arms holding the rod
    ctx.beginPath();
    ctx.moveTo(baseX, baseY - 35);
    ctx.lineTo(baseX + 15, baseY - 25);
    ctx.lineTo(baseX + 25, baseY - 30);
    ctx.stroke();
}

function drawRodAndLine() {
    const rodHoldX = width * 0.12 + 15;
    const rodHoldY = height * 0.42 - 25;
    const rodTipX = width * 0.22;
    const rodTipY = height * 0.42 - 80;

    // Fishing Rod
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rodHoldX - 10, rodHoldY + 10);
    ctx.lineTo(rodTipX, rodTipY);
    ctx.stroke();

    // Fishing Reel (Little circle on the rod)
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rodHoldX, rodHoldY + 3, 5, 0, Math.PI * 2);
    ctx.stroke();
    // Reel handle
    ctx.beginPath();
    ctx.moveTo(rodHoldX, rodHoldY + 3);
    ctx.lineTo(rodHoldX + 6, rodHoldY + 8);
    ctx.stroke();

    // Fishing Line & Bobber
    if (bobber.active) {
        // Smoothly animate bobber toward target during cast
        if (state === "CASTING") {
            bobber.x += (bobber.targetX - bobber.x) * 0.1;
            bobber.y += (bobber.targetY - bobber.y) * 0.1;
        } else {
            bobber.x = bobber.targetX;
            // Add a little floating bob motion
            bobber.y = bobber.targetY + Math.sin(Date.now() * 0.005) * 3;
        }

        // Draw Line
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rodTipX, rodTipY);
        ctx.quadraticCurveTo((rodTipX + bobber.x) / 2, rodTipY + 20, bobber.x, bobber.y);
        ctx.stroke();

        // Draw Bobber (half black, half white circle)
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bobber.x, bobber.y, 6, 0, Math.PI, true);
        ctx.fill(); // Top half filled black
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(bobber.x, bobber.y, 6, 0, Math.PI, false);
        ctx.fillStyle = '#ffffff';
        ctx.fill(); // Bottom half white
        ctx.stroke();

        // Draw Exclamation Mark if Biting!
        if (state === "BITING") {
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 20px Inter, sans-serif';
            ctx.fillText('!', bobber.x - 5, bobber.y - 15);
        }
    }
}

// Start Animation Loop
draw();
