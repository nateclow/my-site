
const FISH_CATALOG = [
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
    { name: "Fin Whale", rarity: "Legendary", prob: 0.01}
];


let state = "IDLE"; 
let castTimer = null;
let biteTimer = null;
let catches = [];

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


let ripples = [];
let swimmingFish = [];
let bobber = { x: 0, y: 0, targetX: 0, targetY: 0, active: false };


for (let i = 0; i < 8; i++) {
    swimmingFish.push({
        x: Math.random() * 800,
        y: 200 + Math.random() * 300,
        speed: 0.5 + Math.random() * 1,
        size: 15 + Math.random() * 20
    });
}


const btnCast = document.getElementById('btn-cast');
const btnReel = document.getElementById('btn-reel');
const statusEl = document.getElementById('status');
const inventoryList = document.getElementById('inventory-list');
const catchCountEl = document.getElementById('catch-count');


btnCast.addEventListener('click', castLine);
btnReel.addEventListener('click', reelIn);
canvas.addEventListener('click', () => {
    if (state === "IDLE") castLine();
    else if (state === "BITING" || state === "WAITING") reelIn();
});


function castLine() {
    if (state !== "IDLE") return;
    
    state = "CASTING";
    statusEl.innerText = "Casting...";
    btnCast.disabled = true;
    btnReel.disabled = false;


    bobber.targetX = width * 0.4 + Math.random() * (width * 0.4);
    bobber.targetY = height * 0.5 + Math.random() * (height * 0.3);
    bobber.x = width * 0.18; 
    bobber.y = height * 0.45;
    bobber.active = true;


    setTimeout(() => {
        state = "WAITING";
        statusEl.innerText = ". . . Waiting for a bite . . .";
        
        
        ripples.push({ x: bobber.targetX, y: bobber.targetY, radius: 5, maxRadius: 40, alpha: 1 });

        const waitTime = 2000 + Math.random() * 4000;
        castTimer = setTimeout(triggerBite, waitTime);
    }, 600);
}

function triggerBite() {
    if (state !== "WAITING") return;
    state = "BITING";
    statusEl.innerText = "❗ FISH ON! REEL IT IN! ❗";
    

    for(let i=0; i<3; i++) {
        setTimeout(() => {
            if(bobber.active) {
                ripples.push({ x: bobber.targetX, y: bobber.targetY, radius: 2, maxRadius: 30, alpha: 1 });
            }
        }, i * 300);
    }

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
    return FISH_CATALOG[0];
}

function updateInventory(fish) {
    catchCountEl.innerText = catches.length;
    const item = document.createElement('div');
    item.className = `fish-item rarity-${fish.rarity}`;
    item.innerHTML = `<span>${fish.name}</span> <small>[${fish.rarity}]</small>`;
    inventoryList.prepend(item);
}


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
    
    ctx.beginPath();
    ctx.moveTo(0, height * 0.4);
    ctx.bezierCurveTo(width * 0.3, height * 0.45, width * 0.7, height * 0.35, width, height * 0.4);
    ctx.stroke();

    
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
        if (fish.x > width + 50) fish.x = -50; 

        
        if (fish.y > height * 0.45) {
            ctx.save();
            ctx.translate(fish.x, fish.y);
            
      
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


    ctx.beginPath();
    ctx.moveTo(0, baseY + 20);
    ctx.lineTo(baseX + 30, baseY + 20);
    ctx.lineTo(baseX + 20, height);
    ctx.stroke();


    ctx.beginPath();
    ctx.moveTo(baseX, baseY - 40); 
    ctx.lineTo(baseX, baseY);      
    ctx.lineTo(baseX + 20, baseY); 
    ctx.lineTo(baseX + 20, baseY + 25); 
    ctx.stroke();

   
    ctx.beginPath();
    ctx.arc(baseX, baseY - 50, 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-18 + baseX, baseY - 55);
    ctx.lineTo(18 + baseX, baseY - 55); 
    ctx.moveTo(-10 + baseX, baseY - 55);
    ctx.lineTo(-5 + baseX, baseY - 68); 
    ctx.lineTo(5 + baseX, baseY - 68);
    ctx.lineTo(10 + baseX, baseY - 55);
    ctx.stroke();

    
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

  
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rodHoldX - 10, rodHoldY + 10);
    ctx.lineTo(rodTipX, rodTipY);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rodHoldX, rodHoldY + 3, 5, 0, Math.PI * 2);
    ctx.stroke();
  
    ctx.beginPath();
    ctx.moveTo(rodHoldX, rodHoldY + 3);
    ctx.lineTo(rodHoldX + 6, rodHoldY + 8);
    ctx.stroke();


    if (bobber.active) {
        
        if (state === "CASTING") {
            bobber.x += (bobber.targetX - bobber.x) * 0.1;
            bobber.y += (bobber.targetY - bobber.y) * 0.1;
        } else {
            bobber.x = bobber.targetX;
            
            bobber.y = bobber.targetY + Math.sin(Date.now() * 0.005) * 3;
        }


        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rodTipX, rodTipY);
        ctx.quadraticCurveTo((rodTipX + bobber.x) / 2, rodTipY + 20, bobber.x, bobber.y);
        ctx.stroke();

    
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bobber.x, bobber.y, 6, 0, Math.PI, true);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(bobber.x, bobber.y, 6, 0, Math.PI, false);
        ctx.fillStyle = '#ffffff';
        ctx.fill(); 
        ctx.stroke();

     
        if (state === "BITING") {
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 20px Inter, sans-serif';
            ctx.fillText('!', bobber.x - 5, bobber.y - 15);
        }
    }
}


draw();
