const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const powerText = document.getElementById('powerText');
const bossText = document.getElementById('bossText');
const statusText = document.getElementById('statusText');

const lanes = [120, 220, 320, 420];
const bosses = [
  { name: '铁桶巨霸', hp: 220, speed: 0.45, color: '#6d4c41' },
  { name: '机甲暴走王', hp: 300, speed: 0.55, color: '#8d6e63' },
  { name: '双头攻城 Boss', hp: 380, speed: 0.58, color: '#5d4037' },
  { name: '终极黑夜魔王', hp: 520, speed: 0.65, color: '#3e2723' },
];

const state = {
  running: false,
  won: false,
  hero: null,
  projectiles: [],
  currentBossIndex: -1,
  boss: null,
  lastShot: 0,
  message: '点击“开始战斗”观看结局',
};

function createHero() {
  return {
    x: 150,
    y: lanes[1],
    width: 120,
    height: 120,
    fireRate: 190,
    burstCount: 3,
    projectileDamage: 26,
  };
}

function createBoss(index) {
  const template = bosses[index];
  return {
    ...template,
    maxHp: template.hp,
    x: canvas.width + 120,
    y: lanes[index % lanes.length],
    width: 150 + index * 18,
    height: 150 + index * 18,
    pulse: 0,
  };
}

function resetGame() {
  state.running = false;
  state.won = false;
  state.hero = createHero();
  state.projectiles = [];
  state.currentBossIndex = -1;
  state.boss = null;
  state.lastShot = 0;
  state.message = '点击“开始战斗”观看结局';
  powerText.textContent = '超强三连发';
  bossText.textContent = '等待登场';
  statusText.textContent = state.message;
}

function startGame() {
  resetGame();
  state.running = true;
  spawnNextBoss();
  state.message = '儿子豌豆火力全开，准备迎战巨型 boss！';
  statusText.textContent = state.message;
}

function spawnNextBoss() {
  state.currentBossIndex += 1;
  if (state.currentBossIndex >= bosses.length) {
    state.running = false;
    state.won = true;
    state.boss = null;
    bossText.textContent = '全部击败';
    statusText.textContent = '大获全胜！儿子豌豆守住了花园，成为最后赢家！';
    return;
  }

  state.boss = createBoss(state.currentBossIndex);
  bossText.textContent = state.boss.name;
  statusText.textContent = `${state.boss.name} 登场！但是儿子豌豆的火力更强！`;
}

function fireBurst(now) {
  if (!state.boss) return;
  if (now - state.lastShot < state.hero.fireRate) return;

  state.lastShot = now;
  const offsets = [-16, 0, 16];
  offsets.forEach((offset, i) => {
    state.projectiles.push({
      x: state.hero.x + 40,
      y: state.hero.y + offset,
      r: 14 - i,
      speed: 6.8 + i * 0.25,
      damage: state.hero.projectileDamage,
      label: '儿子',
    });
  });
}

function update(now) {
  if (!state.hero) return;

  if (state.running && state.boss) {
    fireBurst(now);
    state.boss.x -= state.boss.speed;
    state.boss.pulse += 0.08;

    state.projectiles.forEach((shot) => {
      shot.x += shot.speed;
      const dx = shot.x - state.boss.x;
      const dy = shot.y - state.boss.y;
      const hitRange = state.boss.width * 0.36;
      if (Math.hypot(dx, dy) < hitRange) {
        state.boss.hp -= shot.damage;
        shot.hit = true;
      }
    });

    state.projectiles = state.projectiles.filter((shot) => !shot.hit && shot.x < canvas.width + 30);

    if (state.boss.hp <= 0) {
      statusText.textContent = `${state.boss.name} 被儿子豌豆打败啦！`; 
      spawnNextBoss();
    } else if (state.boss.x < 250) {
      state.boss.x = 250;
      statusText.textContent = 'Boss 被火力压制，完全冲不过来！';
    }
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#9ad96b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < lanes.length; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, lanes[i] - 45, canvas.width, 90);
  }

  for (let x = 0; x < canvas.width; x += 80) {
    ctx.strokeStyle = 'rgba(79, 116, 43, 0.24)';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
}

function drawHero() {
  const { x, y } = state.hero;
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#3fa34d';
  ctx.beginPath();
  ctx.ellipse(0, 8, 50, 42, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffddb0';
  ctx.beginPath();
  ctx.arc(-6, 0, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(-14, -4, 4, 0, Math.PI * 2);
  ctx.arc(2, -4, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(-6, 8, 10, 0, Math.PI);
  ctx.stroke();

  ctx.fillStyle = '#2f8f48';
  ctx.fillRect(-66, 28, 24, 10);
  ctx.fillRect(-52, 38, 12, 34);
  ctx.fillRect(10, 34, 12, 38);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('儿子', -24, 6);
  ctx.restore();
}

function drawProjectiles() {
  state.projectiles.forEach((shot) => {
    ctx.fillStyle = '#58d64f';
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, shot.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(shot.label, shot.x - 10, shot.y + 4);
  });
}

function drawBoss() {
  if (!state.boss) return;
  const { x, y, width, height, color, hp, maxHp, pulse } = state.boss;
  const wobble = Math.sin(pulse) * 4;

  ctx.save();
  ctx.translate(x, y + wobble);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-width / 2, -height / 2, width, height, 28);
  ctx.fill();

  ctx.fillStyle = '#d7ccc8';
  ctx.fillRect(-width / 2 + 20, -height / 2 + 28, width - 40, 26);

  ctx.fillStyle = '#ffeb3b';
  ctx.beginPath();
  ctx.arc(-22, -18, 12, 0, Math.PI * 2);
  ctx.arc(24, -18, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2c2c2c';
  ctx.beginPath();
  ctx.arc(-22, -18, 5, 0, Math.PI * 2);
  ctx.arc(24, -18, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#111';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-28, 20);
  ctx.quadraticCurveTo(0, 38, 28, 20);
  ctx.stroke();

  ctx.restore();

  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(x - 90, y - height / 2 - 28, 180, 14);
  ctx.fillStyle = '#ef5350';
  ctx.fillRect(x - 90, y - height / 2 - 28, 180 * Math.max(hp, 0) / maxHp, 14);
}

function drawVictoryBanner() {
  if (!state.won) return;
  ctx.fillStyle = 'rgba(255, 248, 225, 0.92)';
  ctx.fillRect(170, 180, 620, 170);
  ctx.strokeStyle = '#ff9f43';
  ctx.lineWidth = 6;
  ctx.strokeRect(170, 180, 620, 170);

  ctx.fillStyle = '#2f8f48';
  ctx.font = 'bold 52px sans-serif';
  ctx.fillText('儿子豌豆胜利！', 280, 250);
  ctx.fillStyle = '#5f4321';
  ctx.font = '28px sans-serif';
  ctx.fillText('所有巨型 Boss 都被击退，花园安全啦！', 212, 305);
}

function drawStatusRibbon() {
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.fillRect(24, 18, 420, 52);
  ctx.fillStyle = '#355f1f';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(state.running ? '战斗进行中' : state.won ? '胜利结局' : '等待开始', 42, 52);
}

function loop(timestamp) {
  update(timestamp);
  drawBackground();
  drawHero();
  drawProjectiles();
  drawBoss();
  drawStatusRibbon();
  drawVictoryBanner();
  requestAnimationFrame(loop);
}

startBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', resetGame);

resetGame();
requestAnimationFrame(loop);
