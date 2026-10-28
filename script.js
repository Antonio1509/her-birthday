/* ===== EDIT THESE ===== */
const PIN = "1509";
const NAME = "My love";
const LETTER = [
  "Happy birthday, my love! I hope this day is filled with all the joy and happiness you deserve.",
  "Today is all about you, and I wanted to give you something that could only come from me.",
  "Thank you for being the person who makes ordinary days feel special. I’m grateful for you and everything you do for me every single day.",
  "Ever since you walked in my life, you've made everything so much better. I can’t imagine my life without you, and I’m so lucky to have you by my side.",
  "Loving you is the easiest thing I’ve ever done, and I want to spend every birthday with you, making memories and celebrating the amazing person you are.",
  "You deserve all the love and happiness in the world, and I hope this year brings you everything you’ve been wishing for.",
  "To many more laughs, gaming till late night, and talks about our future together. I love you more than words can express.",
  "Happy birthday, my love. Here’s to you, to us, and to a lifetime of happiness together."
];
const REASONS = [
  "The way you love and take care of me.",
  "How you make every moment feel meaningful.",
  "Your kindness, even when no one notices it.",
  "How easy it is to be myself with you.",
  "Your voice when I'm having a bad day.",
];
/* ====================== */

const $ = id => document.getElementById(id);
const cells = [...document.querySelectorAll(".cell")];
const diamond = $("diamond"), msg = $("msg");
let entry = "", locked = false;

// keypad
["1","2","3","4","5","6","7","8","9","","0","⌫"].forEach(k=>{
  const b = document.createElement("button");
  b.type="button"; b.textContent=k;
  if(!k) b.style.visibility="hidden";
  else b.setAttribute("aria-label", k==="⌫" ? "Delete" : k);
  b.onclick = () => k==="⌫" ? back() : press(k);
  $("pad").appendChild(b);
});
document.addEventListener("keydown", e=>{
  if(/^\d$/.test(e.key)) press(e.key);
  else if(e.key==="Backspace") back();
});

function draw(){
  cells.forEach((c,i)=>{
    c.textContent = entry[i] || "";
    c.classList.toggle("on", i < entry.length);
    c.classList.toggle("cur", i === entry.length);
  });
}
function press(d){
  if(locked || entry.length>=4) return;
  entry += d; msg.textContent=""; draw();
  if(entry.length===4) setTimeout(check, 250);
}
function back(){ if(!locked){ entry = entry.slice(0,-1); draw(); } }
function check(){
  locked = true;
  if(entry === PIN){
    diamond.classList.add("ok");
    msg.textContent = "Unlocked";
    setTimeout(unlock, 1000);
  } else {
    diamond.classList.add("bad");
    msg.textContent = "That’s not it. Try again.";
    setTimeout(()=>{ diamond.classList.remove("bad"); entry=""; locked=false; draw(); }, 500);
  }
}
function unlock(){
  $("gate").classList.add("out");
  setTimeout(()=>{
    $("gate").style.display="none";
    $("home").classList.add("show");
    window.scrollTo(0,0);
    confetti();
  }, 600);
}

// fill content
document.title = "Happy birthday, " + NAME;
$("who").textContent = NAME;
$("letter").innerHTML = LETTER.map(p=>"<p>"+p.replace(/</g,"&lt;")+"</p>").join("");
$("reasons").innerHTML = REASONS.map(r=>"<li>"+r.replace(/</g,"&lt;")+"</li>").join("");
if(new URLSearchParams(location.search).has("unlocked")){
  $("gate").style.display = "none";
  $("home").classList.add("show");
}
draw();

// confetti
const cv = $("fx"), ctx = cv.getContext("2d");
let bits = [], running = false;
function size(){ cv.width = innerWidth; cv.height = innerHeight; }
addEventListener("resize", size); size();
function confetti(){
  if(matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  const cols = ["#ff4d6d","#f2c46d","#f6eef2","#ff8fa3"];
  for(let i=0;i<140;i++) bits.push({
    x:innerWidth/2, y:innerHeight*0.6,
    vx:(Math.random()-.5)*14, vy:-Math.random()*16-4,
    s:Math.random()*7+4, r:Math.random()*6, vr:(Math.random()-.5)*.3,
    c:cols[i%cols.length], life:0
  });
  if(!running){ running=true; requestAnimationFrame(tick); }
}
function tick(){
  ctx.clearRect(0,0,cv.width,cv.height);
  bits.forEach(b=>{
    b.vy+=.35; b.vx*=.99; b.x+=b.vx; b.y+=b.vy; b.r+=b.vr; b.life++;
    ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(b.r);
    ctx.fillStyle=b.c; ctx.fillRect(-b.s/2,-b.s/4,b.s,b.s/2); ctx.restore();
  });
  bits = bits.filter(b=>b.y<cv.height+20 && b.life<260);
  if(bits.length) requestAnimationFrame(tick); else { running=false; ctx.clearRect(0,0,cv.width,cv.height); }
}