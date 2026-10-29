/* =========================== CONFIG =========================== */
const PIN = "3010";
const NAME = "My Love";
const CONFIG = Object.freeze({
  DEBUG:false,
  DEBUG_MOMENT:"warp",
  WISHES:[
    "May this year bring you everything you dream of.",
    "May every ordinary day hold a little magic.",
    "May we keep finding our way back to each other."
  ]
});
const LETTER = [
  "Happy birthday, my love! I hope this day is filled with all the joy and happiness you deserve.",
  "Today is all about you, and I wanted to give you something that could only come from me.",
  "Thank you for being the person who makes ordinary days feel special. I’m grateful for you and everything you do for me every single day.",
  "Ever since you walked in my life, you’ve made everything so much better. I can’t imagine my life without you, and I’m so lucky to have you by my side.",
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
  "Your voice when I’m having a bad day."
];
const FINAL_MESSAGE = "Happy birthday, my love. Here’s to you, and to every beautiful year ahead.";
const MOTION = Object.freeze({
  gatherMs: 340,
  orbitMs: 920,
  settleMs: 400,
  settleStaggerMs: 60,
  confirmMs: 260,
  gateFadeMs: 600,
  typingMsPerCharacter: 16,
  revealMs: 1000,
  envelopeOpenMs: 760,
  warpDurationMs: 2100,
  warpStarCount: 320,
  skyStarCount: 130,
  headlineParticleCount: 2200,
  headlineMorphMs: 2800,
  headlineMobileCount: 420,
  headlineTabletCount: 760,
  headlineLowEndCount: 360,
  headlineSampleStep: 3,
  headlineRippleStart: 0.55,
  headlineFadeMs: 650,
  headlineFadeCleanupMs: 850,
  adaptiveFpsThreshold: 50,
  adaptiveQuality: 0.58,
  shootingStarMinMs: 5200,
  shootingStarMaxMs: 9000,
  shootingStarLifeFrames: 100,
  shootingStarHitRadius: 34,
  trailCount: 34,
  trailSpawnIntervalMs: 22,
  trailLifeFrames: 34,
  constellationBreakpoint: 1000,
  constellationDrawMs: 2200,
  starZoomMs: 900,
  fireworksDurationMs: 15000,
  fireworkRocketIntervalMs: 580,
  fireworkBurstCount: 42,
  lanternCount: 12,
  balloonCount: 7,
  finaleFadeMs: 1800,
  wishDurationMs: 5200,
  grainAlpha: 0.035,
  parallaxRatio: 0.06,
  parallaxLimitPx: 24,
  cardTiltDegrees: 10,
  confettiCount: 110
});
const EASING = Object.freeze({
  gather: "cubic-bezier(.4,0,.8,.3)",
  orbit: "cubic-bezier(.68,0,.32,1)",
  settle: "cubic-bezier(.22,1.35,.36,1)",
  reveal: "cubic-bezier(.2,.8,.2,1)"
});
/* =============================================================== */

const $ = id => document.getElementById(id);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let heroMorphStart = null;
let heroMorphRunning = false;

function wait(duration){
  return new Promise(resolve => setTimeout(resolve, duration));
}

/* Preserve the current PIN input, validation, orbit, and unlock flow. */
function initGate(){
  const gate = $("gate");
  if(!gate) return;

  const cells = [...document.querySelectorAll(".cell")];
  const diamond = $("diamond");
  const msg = $("msg");
  let entry = "", locked = false, orbitRunning = false;

  ["1","2","3","4","5","6","7","8","9","","0","⌫"].forEach(key=>{
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = key;
    if(!key) button.style.visibility = "hidden";
    else button.setAttribute("aria-label",key === "⌫" ? "Delete" : key);
    button.onclick = () => key === "⌫" ? back() : press(key);
    $("pad").appendChild(button);
  });

  document.addEventListener("keydown",event=>{
    if(/^\d$/.test(event.key)) press(event.key);
    else if(event.key === "Backspace") back();
  });

  function draw(){
    cells.forEach((cell,index)=>{
      cell.textContent = entry[index] || "";
      cell.classList.toggle("on",index < entry.length);
      cell.classList.toggle("cur",index === entry.length);
    });
  }

  function press(digit){
    if(locked || entry.length >= 4) return;
    entry += digit;
    msg.textContent = "";
    draw();
    const activeCell = cells[entry.length - 1];
    activeCell.animate([
      {transform:"scale(.92)",boxShadow:"0 0 0 rgba(255,77,109,0)"},
      {transform:"scale(1.08)",boxShadow:"0 0 20px rgba(255,77,109,.38)",offset:.55},
      {transform:"scale(1)",boxShadow:"0 0 0 rgba(255,77,109,0)"}
    ],{duration:260,easing:"cubic-bezier(.2,.8,.25,1)"});
    if(entry.length === 4) setTimeout(check,250);
  }

  function back(){
    if(!locked){
      entry = entry.slice(0,-1);
      draw();
    }
  }

  function check(){
    locked = true;
    if(entry === PIN){
      msg.textContent = "Unlocked";
      orbit(unlock);
    }else{
      diamond.classList.add("bad");
      msg.textContent = "That’s not it. Try again.";
      setTimeout(()=>{
        diamond.classList.remove("bad");
        entry = "";
        locked = false;
        draw();
      },500);
    }
  }

  async function orbit(done){
    if(orbitRunning) return;
    orbitRunning = true;
    diamond.classList.remove("bad");

    if(reducedMotion.matches){
      diamond.classList.add("reduced-success");
      await wait(180);
      done();
      return;
    }

    diamond.classList.add("is-orbiting");
    const diamondRect = diamond.getBoundingClientRect();
    const centerX = diamondRect.left + diamondRect.width / 2;
    const centerY = diamondRect.top + diamondRect.height / 2;
    const radius = cells[0].getBoundingClientRect().width + parseFloat(getComputedStyle(diamond).columnGap);
    const positions = cells.map(cell=>{
      const rect = cell.getBoundingClientRect();
      return {x:rect.left + rect.width / 2 - centerX,y:rect.top + rect.height / 2 - centerY};
    });

    const gather = cells.map((cell,index)=>cell.animate([
      {transform:"translate3d(0,0,0) scale(1)"},
      {transform:`translate3d(${-positions[index].x}px,${-positions[index].y}px,0) scale(.82)`}
    ],{duration:MOTION.gatherMs,easing:EASING.gather,fill:"forwards"}));
    await Promise.all(gather.map(animation=>animation.finished));

    const orbitAnimations = cells.map((cell,index)=>{
      const startAngle = Math.atan2(positions[index].y,positions[index].x);
      const orbitFrame = angle=>{
        const x = Math.cos(angle) * radius - positions[index].x;
        const y = Math.sin(angle) * radius - positions[index].y;
        return `translate3d(${x}px,${y}px,0)`;
      };
      const frames = [{
        offset:0,
        transform:`translate3d(${-positions[index].x}px,${-positions[index].y}px,0) scale(.82)`
      },{
        offset:.12,
        transform:`${orbitFrame(startAngle)} scale(1)`,
        easing:EASING.orbit
      }];
      for(let step=1;step<=5;step++){
        const angle = startAngle + Math.PI * 2 * 1.25 * step / 5;
        frames.push({
          offset:.12 + .88 * step / 5,
          transform:`${orbitFrame(angle)} scale(${step % 2 ? 1.06 : .96})`,
          easing:EASING.orbit
        });
      }
      return cell.animate(frames,{duration:MOTION.orbitMs,fill:"forwards"});
    });
    await Promise.all(orbitAnimations.map(animation=>animation.finished));

    diamond.classList.add("settling");
    const gap = parseFloat(getComputedStyle(diamond).columnGap);
    const unit = cells[0].getBoundingClientRect().width + gap;
    const settle = cells.map((cell,index)=>{
      const targetX = (index - 1.5) * unit;
      const x = targetX - positions[index].x;
      const y = -positions[index].y;
      const endAngle = Math.atan2(positions[index].y,positions[index].x) + Math.PI * 2 * 1.25;
      const orbitX = Math.cos(endAngle) * radius - positions[index].x;
      const orbitY = Math.sin(endAngle) * radius - positions[index].y;
      return cell.animate([
        {transform:`translate3d(${orbitX}px,${orbitY}px,0) scale(.96)`},
        {transform:`translate3d(${x * 1.035}px,${y * 1.035}px,0) scale(1.06)`,offset:.78},
        {transform:`translate3d(${x}px,${y}px,0) scale(1)`}
      ],{
        duration:MOTION.settleMs,
        delay:index * MOTION.settleStaggerMs,
        easing:EASING.settle,
        fill:"forwards"
      });
    });
    await Promise.all(settle.map(animation=>animation.finished));
    if(navigator.vibrate) navigator.vibrate(30);

    diamond.classList.add("confirm");
    await wait(MOTION.confirmMs);
    diamond.classList.add("fading");
    await wait(260);
    done();
  }

  function unlock(){
    gate.classList.add("out");
    triggerWarp(()=>heroMorphStart?.());
    setTimeout(()=>{
      gate.style.display = "none";
      document.body.classList.remove("gate-page");
      document.body.classList.add("gift-open");
      showHome();
      window.scrollTo(0,0);
    },MOTION.gateFadeMs);
  }

  draw();
}

/* Create paragraph nodes from CONFIG using textContent only. */
function buildLetter(){
  const content = $("letter-content");
  const measure = $("letter-measure");
  const paragraphs = [];
  LETTER.forEach(text=>{
    const paragraph = document.createElement("p");
    content.appendChild(paragraph);
    const measureParagraph = document.createElement("p");
    measureParagraph.textContent = text;
    measure.appendChild(measureParagraph);
    paragraphs.push({text,node:paragraph,textNode:document.createTextNode("")});
    paragraph.appendChild(paragraphs[paragraphs.length - 1].textNode);
  });

  const updateReservation = ()=>{
    const card = document.querySelector(".letter-card");
    if(card && measure){
      const mobileReserve = innerWidth <= 520 ? Math.max(1080,1789-innerWidth*1.33) : 780;
      card.style.minHeight = `${Math.ceil(Math.max(measure.getBoundingClientRect().height+128,mobileReserve))}px`;
    }
  };
  updateReservation();
  if(document.fonts?.ready) document.fonts.ready.then(updateReservation);
  addEventListener("resize",updateReservation,{passive:true});
  return paragraphs;
}

function initHome(){
  const home = $("home");
  if(!home) return;

  $("who").textContent = NAME;
  $("hero-title").setAttribute("aria-label",`Happy Birthday, ${NAME}`);
  initHeadingLetters(document.querySelectorAll("#home .section-heading h2"));
  document.title = `Happy birthday, ${NAME}`;
  const letterParagraphs = buildLetter();
  const skipButton = $("skip-typing");
  let typingStarted = false, typingDone = false, typingTimer = 0;
  const letterContent = $("letter-content");

  function finishTyping(){
    if(typingDone) return;
    typingDone = true;
    clearTimeout(typingTimer);
    letterParagraphs.forEach(({text,textNode})=>{textNode.data = text;});
    letterContent.classList.remove("typing");
    if(document.activeElement === skipButton){
      $("letter-heading").focus({preventScroll:true});
    }
    skipButton.disabled = true;
    skipButton.tabIndex = -1;
    skipButton.setAttribute("aria-hidden","true");
    skipButton.classList.add("is-complete");
  }

  function startTyping(){
    if(typingStarted || typingDone) return;
    typingStarted = true;
    if(reducedMotion.matches){
      finishTyping();
      return;
    }

    let paragraphIndex = 0, charIndex = 0;
    letterContent.classList.add("typing");
    const typeNext = ()=>{
      if(typingDone) return;
      if(paragraphIndex >= letterParagraphs.length){
        typingDone = true;
        letterContent.classList.remove("typing");
        skipButton.disabled = true;
        skipButton.tabIndex = -1;
        skipButton.setAttribute("aria-hidden","true");
        skipButton.classList.add("is-complete");
        return;
      }
      const paragraph = letterParagraphs[paragraphIndex];
      paragraph.textNode.appendData(paragraph.text.charAt(charIndex));
      charIndex++;
      if(charIndex >= paragraph.text.length){
        paragraphIndex++;
        charIndex = 0;
      }
      typingTimer = setTimeout(typeNext,MOTION.typingMsPerCharacter);
    };
    typeNext();
  }

  skipButton.addEventListener("click",finishTyping);
  if(reducedMotion.matches) finishTyping();

  const reasonGrid = $("reason-grid");
  REASONS.forEach((reason,index)=>{
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reason-card reveal";
    button.dataset.constellationStar = String(index);
    button.setAttribute("aria-pressed","false");
    button.setAttribute("aria-label",`Reason ${index + 1}. Tap to reveal.`);
    button.style.setProperty("--card-delay",`${index * 100}ms`);

    const inner = document.createElement("span");
    inner.className = "reason-card-inner";
    const front = document.createElement("span");
    front.className = "reason-face";
    const number = document.createElement("span");
    number.className = "reason-number";
    number.textContent = `♥ ${index + 1}`;
    const hint = document.createElement("span");
    hint.className = "reason-hint";
    hint.textContent = "A little thing I love";
    front.append(number,hint);

    const back = document.createElement("span");
    back.className = "reason-back";
    back.textContent = reason;
    inner.append(front,back);
    button.appendChild(inner);
    button.addEventListener("click",()=>{
      const pressed = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed",String(pressed));
      button.setAttribute("aria-label",pressed ? `Reason ${index + 1}: ${reason}. Tap to hide.` : `Reason ${index + 1}. Tap to reveal.`);
      button.classList.remove("star-zoom");
      void button.offsetWidth;
      button.classList.add("star-zoom");
      setTimeout(()=>button.classList.remove("star-zoom"),MOTION.starZoomMs);
    });
    reasonGrid.appendChild(button);
  });

  initReveals(startTyping);
  initCake();
  initFxCanvas();
  initPointerGlow();
  initMagneticButtons();
  initScrollEffects();
  initRouteFallback();
  initShootingStarWish();
  initConstellationLayout();
  initEnvelopeReveal();
  heroMorphStart = startHeroMorph;

  if(new URLSearchParams(location.search).has("unlocked")){
    $("gate").style.display = "none";
    document.body.classList.remove("gate-page");
    document.body.classList.add("gift-open");
    showHome();
    startHeroMorph();
  }
}

function showHome(){
  const home = $("home");
  if(!home) return;
  document.body.classList.add("gift-open");
  home.classList.add("show");
  requestAnimationFrame(()=>home.classList.add("is-entering"));
  setTimeout(()=>home.classList.remove("is-entering"),MOTION.revealMs);
  startFxLoop();
}

function initReveals(onLetterReveal){
  const targets = [...document.querySelectorAll("#home .reveal")];
  if(reducedMotion.matches || !("IntersectionObserver" in window)){
    targets.forEach(target=>target.classList.add("is-visible"));
    document.querySelector(".letter-card")?.classList.add("envelope-open");
    onLetterReveal();
    return;
  }

  const observer = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      const target = entry.target;
      target.classList.add("is-visible");
      observer.unobserve(target);
      if(target.classList.contains("letter-card")){
        target.classList.add("envelope-open");
        setTimeout(onLetterReveal,MOTION.envelopeOpenMs);
      }
    });
  },{threshold:.12,rootMargin:"0px 0px -7% 0px"});
  targets.forEach(target=>observer.observe(target));
}

function initCake(){
  const candles = [...document.querySelectorAll(".candle")];
  const button = $("candle-button");
  const message = $("final-message");
  let isOut = false, working = false;

  button.addEventListener("click",async()=>{
    if(working) return;
    working = true;
    if(!isOut){
      for(const candle of candles){
        candle.classList.add("is-out");
        await wait(reducedMotion.matches ? 0 : 360);
      }
      isOut = true;
      button.textContent = "Light them again";
      revealFinalMessage();
      startFinale();
      if(!reducedMotion.matches) addConfetti(innerWidth/2,innerHeight*.62,86);
    }else{
      candles.forEach(candle=>candle.classList.remove("is-out"));
      stopFinale();
      message.classList.remove("is-visible");
      message.replaceChildren();
      message.removeAttribute("aria-label");
      isOut = false;
      button.textContent = "Blow out the candles";
    }
    working = false;
  });
}

function revealFinalMessage(){
  const message = $("final-message");
  message.setAttribute("aria-label",FINAL_MESSAGE);
  if(reducedMotion.matches){
    message.textContent = FINAL_MESSAGE;
    message.classList.add("is-visible");
    return;
  }
  const fragment = document.createDocumentFragment();
  [...FINAL_MESSAGE].forEach((character,index)=>{
    const span = document.createElement("span");
    span.textContent = character === " " ? "\u00a0" : character;
    span.setAttribute("aria-hidden","true");
    span.style.setProperty("--char-index",String(index));
    fragment.appendChild(span);
  });
  message.replaceChildren(fragment);
  requestAnimationFrame(()=>message.classList.add("is-visible"));
}

function initHeadingLetters(headings){
  headings.forEach(heading=>{
    const text=heading.textContent;
    const words=text.trim().split(/\s+/);
    let letterIndex = 0;
    const fragment = document.createDocumentFragment();
    heading.setAttribute("aria-label",text);
    words.forEach((word,wordIndex)=>{
      const wordSpan=document.createElement("span");
      wordSpan.className="heading-word";
      [...word].forEach(character=>{
        const span=document.createElement("span");
        span.className="heading-letter";
        span.setAttribute("aria-hidden","true");
        span.textContent=character;
        span.style.setProperty("--letter-index",String(letterIndex++));
        wordSpan.appendChild(span);
      });
      fragment.appendChild(wordSpan);
      if(wordIndex<words.length-1) fragment.appendChild(document.createTextNode(" "));
    });
    heading.replaceChildren(fragment);
  });
}

function initEnvelopeReveal(){
  document.querySelector(".letter-card")?.classList.toggle("envelope-open",reducedMotion.matches);
}

function initConstellationLayout(){
  const grid = $("reason-grid");
  if(!grid) return;
  const update = ()=>grid.classList.toggle("constellation-layout",innerWidth >= 1000);
  update();
  addEventListener("resize",update,{passive:true});
}

function initPointerGlow(){
  if(reducedMotion.matches || !matchMedia("(pointer:fine)").matches) return;
  let frame = 0, pointerX = innerWidth/2, pointerY = innerHeight*.2;
  addEventListener("pointermove",event=>{
    pointerX = event.clientX;
    pointerY = event.clientY;
    if(frame) return;
    frame = requestAnimationFrame(()=>{
      document.documentElement.style.setProperty("--pointer-x",`${pointerX}px`);
      document.documentElement.style.setProperty("--pointer-y",`${pointerY}px`);
      frame = 0;
    });
  },{passive:true});
}

function initMagneticButtons(){
  if(reducedMotion.matches || !matchMedia("(pointer:fine)").matches) return;
  document.querySelectorAll(".primary-button,.memories-link,.floating-nav a").forEach(button=>{
    button.addEventListener("pointermove",event=>{
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width/2) * .08;
      const y = (event.clientY - rect.top - rect.height/2) * .08;
      button.style.setProperty("--mag-x",`${x.toFixed(1)}px`);
      button.style.setProperty("--mag-y",`${y.toFixed(1)}px`);
      button.classList.add("magnetic");
    },{passive:true});
    button.addEventListener("pointerleave",()=>{
      button.style.setProperty("--mag-x","0px");
      button.style.setProperty("--mag-y","0px");
    });
  });
}

function initShootingStarWish(){
  document.addEventListener("pointerdown",event=>claimShootingStar(event.clientX,event.clientY),{passive:true});
  $("shooting-star-target")?.addEventListener("click",()=>{
    if(shootingStar) claimShootingStar(shootingStar.x,shootingStar.y);
  });
}

function claimShootingStar(x,y){
  if(reducedMotion.matches || !shootingStar || shootingStar.claimed) return;
  const star=shootingStar,dx=x-star.x,dy=y-star.y;
  if(dx*dx+dy*dy>MOTION.shootingStarHitRadius*MOTION.shootingStarHitRadius) return;
  star.claimed=true;
  shootingStar=null;
  const target=$("shooting-star-target");
  if(target) target.hidden=true;
  addSparkBurst(x,y,28);
  const toast=$("wish-toast");
  if(toast){
    toast.textContent=CONFIG.WISHES[Math.floor(Math.random()*CONFIG.WISHES.length)];
    const toastWidth=Math.min(430,innerWidth-40);
    toast.style.left=`${Math.max(toastWidth/2+12,Math.min(innerWidth-toastWidth/2-12,x))}px`;
    toast.style.top=`${Math.max(50,y-24)}px`;
    toast.classList.add("is-visible");
    clearTimeout(wishToastTimer);
    wishToastTimer=setTimeout(()=>toast.classList.remove("is-visible"),MOTION.wishDurationMs);
  }
}

function initScrollEffects(){
  const progress = $("scroll-progress-bar");
  let frame = 0;
  const update = ()=>{
    frame = 0;
    const maxScroll = document.documentElement.scrollHeight - innerHeight;
    const progressValue = maxScroll > 0 ? Math.max(0,Math.min(1,scrollY/maxScroll)) : 0;
    if(progress) progress.style.transform = `scaleX(${progressValue})`;
    document.documentElement.style.setProperty("--scroll-warmth",`${(.035+progressValue*.11).toFixed(3)}`);
  };
  addEventListener("scroll",()=>{
    if(!frame) frame = requestAnimationFrame(update);
  },{passive:true});
  addEventListener("resize",update,{passive:true});
  update();
}

function initRouteFallback(){
  if("onpageswap" in window && "onpagereveal" in window) return;
  document.addEventListener("click",event=>{
    const link = event.target.closest("a[href]");
    if(!link || event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = new URL(link.href,location.href);
    if(target.origin !== location.origin || target.pathname === location.pathname) return;
    event.preventDefault();
    document.body.classList.add("route-leaving");
    setTimeout(()=>location.assign(target.href),reducedMotion.matches ? 0 : 340);
  });
}

function initMemories(){
  const page = document.querySelector(".memories-page");
  if(!page) return;
  document.body.classList.add("gift-open");
  initHeadingLetters(document.querySelectorAll(".memories-header h1"));
  initFxCanvas();

  document.querySelectorAll(".memory-photo").forEach(image=>{
    const loaded = ()=>image.classList.add("is-loaded");
    if(image.complete && image.naturalWidth > 0) loaded();
    else{
      image.addEventListener("load",loaded,{once:true});
      image.addEventListener("error",()=>image.classList.add("has-error"),{once:true});
    }
  });

  const revealTargets = [...document.querySelectorAll(".memories-header,.memory-card,.memories-footer")];
  if(reducedMotion.matches || !("IntersectionObserver" in window)){
    revealTargets.forEach(target=>target.classList.add("is-visible"));
  }else{
    const observer = new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },{threshold:.14,rootMargin:"0px 0px -5% 0px"});
    revealTargets.forEach(target=>observer.observe(target));
  }

  initMemoryTilt();
  initParallax();
  initMemoryLightLeak();
  initShootingStarWish();
  initScrollEffects();
  initRouteFallback();
  initMagneticButtons();
}

function initMemoryLightLeak(){
  document.querySelectorAll(".memory-card").forEach(card=>{
    card.addEventListener("pointerdown",()=>card.classList.add("light-leak"));
    const clear = ()=>card.classList.remove("light-leak");
    card.addEventListener("pointerup",clear);
    card.addEventListener("pointerleave",clear);
    card.addEventListener("pointercancel",clear);
  });
}

function initMemoryTilt(){
  if(reducedMotion.matches || !matchMedia("(pointer:fine)").matches) return;
  document.querySelectorAll(".memory-card").forEach(card=>{
    const inner = card.querySelector(".polaroid-inner");
    let rect;
    card.addEventListener("pointerenter",()=>{rect = card.getBoundingClientRect();});
    card.addEventListener("pointermove",event=>{
      if(!rect) rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      inner.style.setProperty("--tilt-x",`${(-y * MOTION.cardTiltDegrees * 2).toFixed(2)}deg`);
      inner.style.setProperty("--tilt-y",`${(x * MOTION.cardTiltDegrees * 2).toFixed(2)}deg`);
    },{passive:true});
    card.addEventListener("pointerleave",()=>{
      rect = null;
      inner.style.setProperty("--tilt-x","0deg");
      inner.style.setProperty("--tilt-y","0deg");
    });
  });
}

function initParallax(){
  if(reducedMotion.matches) return;
  const cards = [...document.querySelectorAll(".memory-card")];
  const visible = new Set();
  const observer = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    });
  });
  cards.forEach(card=>observer.observe(card));

  let frame = 0;
  const update = ()=>{
    frame = 0;
    const viewportCenter = innerHeight/2;
    const updates = [];
    visible.forEach(card=>{
      const rect = card.getBoundingClientRect();
      const distance = rect.top + rect.height/2 - viewportCenter;
      const offset = Math.max(-MOTION.parallaxLimitPx,Math.min(MOTION.parallaxLimitPx,distance * MOTION.parallaxRatio));
      updates.push([card.querySelector(".memory-photo"),offset]);
    });
    updates.forEach(([image,offset])=>{
      if(image) image.style.setProperty("--parallax-y",`${offset.toFixed(2)}px`);
    });
  };
  const requestUpdate = ()=>{
    if(!frame) frame = requestAnimationFrame(update);
  };
  addEventListener("scroll",requestUpdate,{passive:true});
  addEventListener("resize",requestUpdate,{passive:true});
  requestUpdate();
}

let fxCanvas,fxContext,fxRatio=1,fxFrame=0,lastFxTime=0,quality=1;
let heroFxCanvas,heroFxContext,heroRockets=[],heroHeartBursts=[],heroFireworkPatterns=[];
let heroPatternIndex=0,heroPatternPointIndex=0,heroPatternNextLaunchAt=0,heroPatternWaitUntil=0,heroPatternSize="";
let qualityStartedAt=0,qualityFrames=0,fxInitialized=false,grainPattern=null;
let ambientParticles=[],warpStars=[],heroParticles=[],dustParticles=[],confettiPieces=[];
let fireworkRockets=[],fireworkBursts=[],lanterns=[],balloons=[],shootingStar=null;
let warpStartedAt=0,warpCallback=null,heroMorphStartedAt=0,shootNextAt=0;
let finaleStartedAt=0,finaleUntil=0,finaleRunning=false,wishToastTimer=0;
let finaleGeneration=0;
let constellationStartedAt=0,lastDustAt=0;
const FX_COLORS={rose:"#ff4d6d",gold:"#f2c46d",cream:"#f6eef2"};

function initFxCanvas(){
  if(fxInitialized) return;
  fxCanvas=$("fx-canvas");
  fxContext=fxCanvas?.getContext("2d",{alpha:true,desynchronized:true});
  heroFxCanvas=$("hero-fireworks");
  heroFxContext=heroFxCanvas?.getContext("2d",{alpha:true,desynchronized:true});
  if(!fxCanvas || !fxContext) return;
  fxInitialized=true;
  configureFxCanvas();
  configureHeroFireworksCanvas();
  makeAmbientParticles();
  makeGrainPattern();
  addEventListener("resize",configureFxCanvas,{passive:true});
  addEventListener("resize",configureHeroFireworksCanvas,{passive:true});
  document.addEventListener("pointermove",trackDust,{passive:true});
  if(document.body.classList.contains("gift-open")) startFxLoop();
}

function configureFxCanvas(){
  if(!fxCanvas || !fxContext) return;
  fxRatio=Math.min(devicePixelRatio||1,2);
  fxCanvas.width=Math.round(innerWidth*fxRatio);
  fxCanvas.height=Math.round(innerHeight*fxRatio);
  fxCanvas.style.width=`${innerWidth}px`;
  fxCanvas.style.height=`${innerHeight}px`;
  fxContext.setTransform(fxRatio,0,0,fxRatio,0,0);
  if(!ambientParticles.length) makeAmbientParticles();
}

function configureHeroFireworksCanvas(){
  if(!heroFxCanvas || !heroFxContext) return;
  const hero=heroFxCanvas.parentElement;
  if(!hero) return;
  const rect=hero.getBoundingClientRect();
  if(!rect.width || !rect.height) return;
  const ratio=Math.min(devicePixelRatio||1,2);
  const width=Math.round(rect.width*ratio),height=Math.round(rect.height*ratio);
  if(heroFxCanvas.width!==width || heroFxCanvas.height!==height){
    heroFxCanvas.width=width;
    heroFxCanvas.height=height;
  }
  heroFxContext.setTransform(ratio,0,0,ratio,0,0);
}

function makeGrainPattern(){
  const tile=document.createElement("canvas");
  tile.width=64;tile.height=64;
  const context=tile.getContext("2d");
  if(!context) return;
  const image=context.createImageData(tile.width,tile.height);
  for(let index=0;index<image.data.length;index+=4){
    const value=100+Math.random()*155;
    image.data[index]=value;
    image.data[index+1]=value;
    image.data[index+2]=value;
    image.data[index+3]=255;
  }
  context.putImageData(image,0,0);
  grainPattern=fxContext.createPattern(tile,"repeat");
}

function makeAmbientParticles(){
  const count=Math.max(36,Math.round(MOTION.skyStarCount*quality));
  ambientParticles=Array.from({length:count},()=>({
    x:Math.random()*innerWidth,y:Math.random()*innerHeight,
    radius:.45+Math.random()*1.25,phase:Math.random()*Math.PI*2,
    rise:.035+Math.random()*.09,drift:(Math.random()-.5)*.045,
    hue:Math.random()<.72?"gold":"rose"
  }));
}

function startFxLoop(){
  if(!fxContext || document.hidden || reducedMotion.matches || fxFrame) return;
  lastFxTime=0;
  qualityStartedAt=performance.now();
  qualityFrames=0;
  fxFrame=requestAnimationFrame(drawFx);
}

function triggerWarp(done){
  if(reducedMotion.matches){
    done?.();
    return;
  }
  if(!fxContext) initFxCanvas();
  if(!fxContext){done?.();return;}
  document.body.classList.add("warping");
  shootNextAt=performance.now()+MOTION.shootingStarMinMs;
  warpStars=Array.from({length:Math.round(MOTION.warpStarCount*quality)},()=>({
    angle:Math.random()*Math.PI*2,depth:.18+Math.random()*.82,
    length:8+Math.random()*55,size:.5+Math.random()*1.4
  }));
  warpStartedAt=performance.now();
  warpCallback=done||null;
  startFxLoop();
}

function startHeroMorph(){
  if(heroMorphRunning) return;
  if(reducedMotion.matches){
    document.body.classList.add("hero-revealed");
    return;
  }
  const title=$("hero-title");
  if(!title || !fxContext){document.body.classList.add("hero-revealed");return;}
  heroMorphRunning=true;
  document.body.classList.add("hero-morphing");
  shootNextAt=performance.now()+MOTION.shootingStarMinMs;
  heroMorphStartedAt=performance.now();
  heroParticles=[];
  const lines=[...title.querySelectorAll(".hero-line")].slice(0,2);
  const viewportCap=innerWidth<520?MOTION.headlineMobileCount:innerWidth<900?MOTION.headlineTabletCount:MOTION.headlineParticleCount;
  const deviceCap=(navigator.deviceMemory&&navigator.deviceMemory<=4)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)?MOTION.headlineLowEndCount:viewportCap;
  const cap=Math.max(200,Math.round(Math.min(viewportCap,deviceCap)*quality));
  let samples=[];
  lines.forEach(line=>{
    const text=line.childNodes[0]?.textContent?.trim()||line.textContent.trim();
    if(!text) return;
    const rect=line.getBoundingClientRect();
    const style=getComputedStyle(line);
    const transformY=style.transform==="none"||typeof DOMMatrixReadOnly==="undefined"?0:new DOMMatrixReadOnly(style.transform).m42;
    const sampleCanvas=document.createElement("canvas");
    const sampleContext=sampleCanvas.getContext("2d",{willReadFrequently:true});
    if(!sampleContext) return;
    sampleContext.font=style.font;
    const textWidth=sampleContext.measureText(text).width;
    sampleCanvas.width=Math.max(1,Math.ceil(textWidth));
    sampleCanvas.height=Math.max(1,Math.ceil(rect.height));
    const pixelScaleX=rect.width/sampleCanvas.width;
    sampleContext.font=style.font;
    sampleContext.textBaseline="top";
    sampleContext.fillStyle="#fff";
    sampleContext.fillText(text,0,0);
    const pixels=sampleContext.getImageData(0,0,sampleCanvas.width,sampleCanvas.height).data;
    const step=Math.max(MOTION.headlineSampleStep,Math.sqrt((sampleCanvas.width*sampleCanvas.height)/cap)*.65);
    for(let y=0;y<sampleCanvas.height;y+=step){
      for(let x=0;x<sampleCanvas.width;x+=step){
        if(pixels[(Math.floor(y)*sampleCanvas.width+Math.floor(x))*4+3]>100){
          samples.push({x:rect.left+x*pixelScaleX,y:rect.top-transformY+y});
        }
      }
    }
  });
  if(!samples.length){
    heroMorphRunning=false;
    document.body.classList.remove("hero-morphing");
    document.body.classList.add("hero-revealed");
    return;
  }
  if(samples.length>cap){
    const stride=samples.length/cap;
    samples=Array.from({length:cap},(_,index)=>samples[Math.floor(index*stride)]);
  }
  heroParticles=samples.map(target=>({
    x:Math.random()*innerWidth,y:Math.random()*innerHeight,
    tx:target.x,ty:target.y,vx:0,vy:0,radius:.65+Math.random()*.65,
    phase:Math.random()*Math.PI*2
  }));
  startFxLoop();
  setTimeout(()=>{
    document.body.classList.remove("hero-morphing");
    document.body.classList.add("hero-revealed");
    heroMorphRunning=false;
    heroParticles.forEach(particle=>particle.fadeAt=performance.now());
    setTimeout(()=>{heroParticles=[];},MOTION.headlineFadeCleanupMs);
  },MOTION.headlineMorphMs);
}

function drawFx(timestamp){
  fxFrame=0;
  if(document.hidden || reducedMotion.matches || !fxContext) return;
  const delta=lastFxTime?Math.min((timestamp-lastFxTime)/16.67,2):1;
  lastFxTime=timestamp;
  qualityFrames++;
  if(quality===1 && timestamp-qualityStartedAt>1000){
    const fps=qualityFrames/((timestamp-qualityStartedAt)/1000);
    if(fps<MOTION.adaptiveFpsThreshold){
      quality=MOTION.adaptiveQuality;
      ambientParticles.length=Math.min(ambientParticles.length,Math.round(MOTION.skyStarCount*quality));
      heroParticles.length=Math.min(heroParticles.length,Math.round(heroParticles.length*quality));
      dustParticles.length=Math.min(dustParticles.length,Math.round(MOTION.trailCount*quality));
      document.documentElement.style.setProperty("--fx-entry-blur","6px");
    }
  }
  fxContext.clearRect(0,0,innerWidth,innerHeight);
  if(warpStars.length) drawWarp(timestamp);
  drawAmbient(delta);
  drawHeroParticles(timestamp);
  drawHeroFireworks(timestamp,delta);
  drawDust(delta);
  drawConstellation(timestamp);
  drawShootingStar(timestamp);
  drawConfetti(delta);
  drawFinale(timestamp,delta);
  if(document.body.classList.contains("memories-body")) drawFilmGrain();
  if(document.body.classList.contains("gift-open") && !shootingStar && timestamp>=shootNextAt){
    spawnShootingStar(timestamp);
  }
  fxFrame=requestAnimationFrame(drawFx);
}

function drawWarp(timestamp){
  const ctx=fxContext;
  const progress=Math.min(1,(timestamp-warpStartedAt)/MOTION.warpDurationMs);
  const cx=innerWidth/2,cy=innerHeight/2,maxRadius=Math.hypot(innerWidth,innerHeight)*.72;
  ctx.save();
  ctx.globalCompositeOperation="lighter";
  warpStars.forEach(star=>{
    const travel=progress*maxRadius*(.35+star.depth*1.65);
    const x=cx+Math.cos(star.angle)*travel;
    const y=cy+Math.sin(star.angle)*travel;
    const tail=Math.min(star.length*star.depth,travel*.65);
    const alpha=Math.sin(progress*Math.PI)*(.2+star.depth*.58);
    ctx.strokeStyle=`rgba(242,196,109,${alpha})`;
    ctx.lineWidth=star.size;
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(star.angle)*(travel-tail),cy+Math.sin(star.angle)*(travel-tail));
    ctx.lineTo(x,y);
    ctx.stroke();
  });
  ctx.restore();
  if(progress>=1){
    warpStars=[];
    document.body.classList.remove("warping");
    const callback=warpCallback;
    warpCallback=null;
    callback?.();
  }
}

function drawAmbient(delta){
  const ctx=fxContext;
  ambientParticles.forEach(star=>{
    star.phase+=.018*delta;
    star.x+=star.drift*delta;
    star.y-=star.rise*delta;
    if(star.y<-3){star.y=innerHeight+3;star.x=Math.random()*innerWidth;}
    const alpha=.18+(.32*(Math.sin(star.phase)+1)/2);
    ctx.fillStyle=star.hue==="gold"?`rgba(242,196,109,${alpha})`:`rgba(255,77,109,${alpha*.72})`;
    ctx.beginPath();
    ctx.arc(star.x,star.y,star.radius,0,Math.PI*2);
    ctx.fill();
  });
}

function drawHeroParticles(timestamp){
  if(!heroParticles.length) return;
  const ctx=fxContext,elapsed=timestamp-heroMorphStartedAt;
  ctx.save();
  ctx.globalCompositeOperation="lighter";
  heroParticles.forEach(particle=>{
    const dx=particle.tx-particle.x,dy=particle.ty-particle.y;
    particle.vx=(particle.vx+dx*.012)*.84;
    particle.vy=(particle.vy+dy*.012)*.84;
    particle.x+=particle.vx;particle.y+=particle.vy;
    const pointerX=lastPointerX,pointerY=lastPointerY;
    if(pointerX!==null){
      const px=particle.x-pointerX,py=particle.y-pointerY,dist=Math.hypot(px,py);
      if(dist<72&&dist>0){
        const push=(72-dist)*.035;
        particle.vx+=px/dist*push;particle.vy+=py/dist*push;
      }
    }
    const ripple=elapsed>MOTION.headlineMorphMs*MOTION.headlineRippleStart?Math.sin(timestamp*.004+particle.phase)*.6:0;
    const fadeAt=particle.fadeAt||Infinity;
    const alpha=Math.max(0,Math.min(1,(timestamp-fadeAt)/MOTION.headlineFadeMs<0?1:1-(timestamp-fadeAt)/MOTION.headlineFadeMs));
    ctx.globalAlpha=alpha;
    ctx.fillStyle=FX_COLORS.gold;
    ctx.beginPath();
    ctx.arc(particle.x,particle.y+ripple,particle.radius,0,Math.PI*2);
    ctx.fill();
  });
  ctx.restore();
}

function drawHeroFireworks(timestamp,delta){
  if(!heroFxCanvas || !heroFxContext) return;
  const ctx=heroFxContext;
  const hero=heroFxCanvas.parentElement;
  const copy=document.querySelector(".hero-copy");
  if(!hero || !copy || reducedMotion.matches ||
     !document.body.classList.contains("hero-revealed")){
    ctx.clearRect(0,0,heroFxCanvas.width,heroFxCanvas.height);
    heroRockets=[];
    heroHeartBursts=[];
    heroFireworkPatterns=[];
    heroPatternSize="";
    heroPatternIndex=0;
    heroPatternPointIndex=0;
    heroPatternNextLaunchAt=0;
    heroPatternWaitUntil=0;
    return;
  }

  const rect=hero.getBoundingClientRect();
  const copyRect=copy.getBoundingClientRect();
  if(rect.bottom<=0 || rect.top>=innerHeight){
    ctx.clearRect(0,0,heroFxCanvas.width,heroFxCanvas.height);
    heroRockets=[];
    heroHeartBursts=[];
    heroFireworkPatterns=[];
    heroPatternSize="";
    heroPatternIndex=0;
    heroPatternPointIndex=0;
    heroPatternNextLaunchAt=0;
    heroPatternWaitUntil=0;
    return;
  }
  configureHeroFireworksCanvas();
  ctx.clearRect(0,0,rect.width,rect.height);

  const mobile=innerWidth<900;
  const zoneWidth=mobile?Math.max(120,Math.min(rect.width-28,copyRect.width)):Math.min(
    rect.width-Math.max(rect.width*.62,copyRect.right-rect.left+24),
    360
  );
  const zoneLeft=mobile?(rect.width-zoneWidth)/2:
    Math.min(rect.width-120,Math.max(rect.width*.62,copyRect.right-rect.left+24));
  const sceneHeight=mobile?Math.min(170,Math.max(120,copyRect.top-rect.top-16)):rect.height;
  const sceneOffsetY=mobile?Math.max(0,copyRect.top-rect.top-sceneHeight-8):0;
  const patternSize=`${Math.round(zoneLeft)}x${Math.round(zoneWidth)}x${Math.round(sceneHeight)}x${mobile}`;
  if(patternSize!==heroPatternSize){
    heroPatternSize=patternSize;
    heroFireworkPatterns=makeHeroFireworkPatterns(zoneLeft,zoneWidth,sceneHeight,mobile);
    heroRockets=[];
    heroHeartBursts=[];
    heroPatternIndex=0;
    heroPatternPointIndex=0;
    heroPatternNextLaunchAt=timestamp+700;
    heroPatternWaitUntil=0;
  }
  if(heroPatternIndex>=heroFireworkPatterns.length){
    heroPatternIndex=0;
    heroPatternPointIndex=0;
    heroPatternNextLaunchAt=timestamp+2000;
  }
  const pattern=heroFireworkPatterns[heroPatternIndex];
  if(pattern && heroPatternPointIndex<pattern.points.length && timestamp>=heroPatternNextLaunchAt){
    const target=pattern.points[heroPatternPointIndex++];
    const startX=target.x+(Math.random()-.5)*14;
    const startY=mobile?sceneOffsetY+sceneHeight:rect.height-68;
    const targetY=target.y+sceneOffsetY;
    const flightFrames=Math.max(24,Math.ceil((startY-targetY)/11));
    heroRockets.push({
      x:startX,y:startY,startX,startY,targetX:target.x,targetY,
      vx:(target.x-startX)/flightFrames,vy:(targetY-startY)/flightFrames,
      life:0,flightFrames,color:pattern.color
    });
    heroPatternNextLaunchAt=timestamp+72;
    if(heroPatternPointIndex===pattern.points.length) heroPatternWaitUntil=timestamp+850;
  }else if(pattern && heroPatternPointIndex===pattern.points.length &&
           heroRockets.length===0 && timestamp>=heroPatternWaitUntil){
    heroPatternIndex++;
    heroPatternPointIndex=0;
    heroPatternNextLaunchAt=timestamp+220;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(zoneLeft,sceneOffsetY,zoneWidth,sceneHeight);
  ctx.clip();
  ctx.globalCompositeOperation="lighter";
  heroRockets.forEach(rocket=>{
    rocket.x+=rocket.vx*delta;
    rocket.y+=rocket.vy*delta;
    rocket.life+=delta;
    ctx.globalAlpha=.78;
    ctx.strokeStyle=rocket.color;
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(rocket.x-rocket.vx*4,rocket.y-rocket.vy*4);
    ctx.lineTo(rocket.x,rocket.y);
    ctx.stroke();
    ctx.fillStyle=FX_COLORS.cream;
    ctx.beginPath();
    ctx.arc(rocket.x,rocket.y,2.4,0,Math.PI*2);
    ctx.fill();
    if(rocket.life>=rocket.flightFrames){
      heroHeartBursts.push({
        x:rocket.targetX,y:rocket.targetY,vx:0,vy:0,size:2.1+Math.random()*.8,
        life:0,maxLife:600+Math.random()*45,color:rocket.color
      });
      for(let index=0;index<4;index++){
        const angle=Math.random()*Math.PI*2,speed=.45+Math.random()*1.35;
        heroHeartBursts.push({
          x:rocket.targetX,y:rocket.targetY,vx:Math.cos(angle)*speed,
          vy:Math.sin(angle)*speed,size:.8+Math.random()*1.2,
          life:0,maxLife:38+Math.random()*24,
          color:index%2?FX_COLORS.gold:FX_COLORS.cream
        });
      }
    }
  });
  heroRockets=heroRockets.filter(rocket=>rocket.life<rocket.flightFrames);
  heroHeartBursts=heroHeartBursts.filter(particle=>particle.life<particle.maxLife);
  heroHeartBursts.forEach(particle=>{
    particle.x+=particle.vx*delta;
    particle.y+=particle.vy*delta;
    particle.life+=delta;
    ctx.globalAlpha=Math.max(0,1-particle.life/particle.maxLife);
    ctx.fillStyle=particle.color;
    ctx.beginPath();
    ctx.arc(particle.x,particle.y,particle.size*(particle.vx||particle.vy?1:1.25),0,Math.PI*2);
    ctx.fill();
  });
  ctx.restore();
}

function makeHeroFireworkPatterns(zoneLeft,zoneWidth,height,mobile=false){
  const sceneWidth=Math.min(zoneWidth*.94,mobile?460:360);
  const centerX=zoneLeft+zoneWidth/2;
  const centerY=mobile?height*.48:height*.44;
  const halfLetterWidth=sceneWidth*.095;
  const letterHeight=sceneWidth*.36;
  const heartWidth=sceneWidth*.34;
  const heartHeight=sceneWidth*.32;
  const heartPoints=Array.from({length:36},(_,index)=>{
    const t=index/36*Math.PI*2;
    const x=16*Math.pow(Math.sin(t),3);
    const y=-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t));
    return {
      x:centerX+x/16*heartWidth/2,
      y:centerY+(y-6)/22*heartHeight
    };
  });
  const sampleLine=(vertices,stepsPerSegment)=>{
    const points=[];
    for(let index=0;index<vertices.length-1;index++){
      const start=vertices[index],end=vertices[index+1];
      for(let step=0;step<stepsPerSegment;step++){
        const progress=step/stepsPerSegment;
        points.push({
          x:start.x+(end.x-start.x)*progress,
          y:start.y+(end.y-start.y)*progress
        });
      }
    }
    points.push(vertices[vertices.length-1]);
    return points;
  };
  const mCenterX=centerX-sceneWidth*.35;
  const mPoints=sampleLine([
    {x:mCenterX-halfLetterWidth,y:centerY+letterHeight/2},
    {x:mCenterX-halfLetterWidth,y:centerY-letterHeight/2},
    {x:mCenterX,y:centerY},
    {x:mCenterX+halfLetterWidth,y:centerY-letterHeight/2},
    {x:mCenterX+halfLetterWidth,y:centerY+letterHeight/2}
  ],7);
  const cCenterX=centerX+sceneWidth*.35;
  const cArc=Array.from({length:37},(_,index)=>{
    const angle=-Math.PI/2-index/36*Math.PI;
    return {
      x:cCenterX+Math.cos(angle)*halfLetterWidth,
      y:centerY+Math.sin(angle)*letterHeight/2
    };
  });
  const cEndX=cCenterX+halfLetterWidth*1.45;
  const cEndSteps=Math.max(12,Math.ceil(halfLetterWidth*.45/(Math.PI*letterHeight/108)));
  const cPoints=[
    ...sampleLine([
      {x:cEndX,y:centerY-letterHeight/2},
      cArc[0]
    ],cEndSteps),
    ...cArc.slice(1),
    ...sampleLine([
      cArc[cArc.length-1],
      {x:cEndX,y:centerY+letterHeight/2}
    ],cEndSteps).slice(1)
  ];
  return [
    {points:heartPoints,color:FX_COLORS.rose},
    {points:mPoints,color:"#ff8faa"},
    {points:cPoints,color:"#ff8faa"}
  ];
}

let lastPointerX=null,lastPointerY=null;
function trackDust(event){
  if(reducedMotion.matches) return;
  const touchAllowed=event.pointerType!=="touch"||event.buttons>0;
  const mouseAllowed=event.pointerType!=="mouse"||matchMedia("(pointer:fine)").matches;
  if(!touchAllowed||!mouseAllowed) return;
  lastPointerX=event.clientX;lastPointerY=event.clientY;
  const now=performance.now();
  if(now-lastDustAt<MOTION.trailSpawnIntervalMs) return;
  lastDustAt=now;
  dustParticles.push({x:event.clientX,y:event.clientY,vx:(Math.random()-.5)*.5,vy:-.3-Math.random()*.6,life:0,size:1+Math.random()*1.5});
  if(dustParticles.length>MOTION.trailCount*quality) dustParticles.shift();
  startFxLoop();
}

function drawDust(delta){
  const ctx=fxContext;
  dustParticles=dustParticles.filter(particle=>particle.life<MOTION.trailLifeFrames);
  dustParticles.forEach(particle=>{
    particle.x+=particle.vx*delta;particle.y+=particle.vy*delta;particle.life+=delta;
    ctx.globalAlpha=Math.max(0,1-particle.life/MOTION.trailLifeFrames)*.65;
    ctx.fillStyle=FX_COLORS.gold;
    ctx.beginPath();ctx.arc(particle.x,particle.y,particle.size,0,Math.PI*2);ctx.fill();
  });
  ctx.globalAlpha=1;
}

function drawConstellation(timestamp){
  if(innerWidth<MOTION.constellationBreakpoint || !document.body.classList.contains("gift-open")) return;
  const section=$("reasons"),grid=$("reason-grid");
  if(!section||!grid) return;
  const rect=section.getBoundingClientRect();
  if(rect.bottom<0||rect.top>innerHeight) return;
  if(!constellationStartedAt) constellationStartedAt=timestamp;
  const buttons=[...grid.querySelectorAll(".reason-card")];
  if(buttons.length!==5) return;
  const points=buttons.map(button=>{
    const r=button.getBoundingClientRect();
    return {x:r.left+r.width/2,y:r.top-12};
  });
  const progress=Math.min(1,(timestamp-constellationStartedAt)/MOTION.constellationDrawMs);
  const ctx=fxContext;
  ctx.save();
  ctx.globalCompositeOperation="lighter";
  ctx.strokeStyle="rgba(242,196,109,.42)";
  ctx.lineWidth=1.2;
  const dashLength=rect.width*3+rect.height;
  ctx.setLineDash([dashLength,dashLength]);
  ctx.lineDashOffset=dashLength*(1-progress);
  ctx.beginPath();
  ctx.moveTo(points[0].x,points[0].y);
  ctx.bezierCurveTo(points[0].x+60,points[0].y-100,points[1].x-60,points[1].y-100,points[1].x,points[1].y);
  for(let index=1;index<points.length;index++) ctx.lineTo(points[index].x,points[index].y);
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
  points.forEach((point,index)=>{
    if(progress<index/5) return;
    const glow=.55+.35*Math.sin(timestamp*.004+index);
    ctx.fillStyle=`rgba(242,196,109,${glow})`;
    ctx.beginPath();ctx.arc(point.x,point.y,2.4+glow*1.6,0,Math.PI*2);ctx.fill();
  });
  ctx.restore();
}

function spawnShootingStar(timestamp){
  shootingStar={x:Math.random()*innerWidth*.7+innerWidth*.15,y:Math.random()*innerHeight*.32+50,vx:7+Math.random()*4,vy:3+Math.random()*2,life:0,claimed:false};
  const target=$("shooting-star-target");
  if(target){
    target.hidden=false;
    target.style.left=`${shootingStar.x}px`;
    target.style.top=`${shootingStar.y}px`;
  }
  shootNextAt=timestamp+MOTION.shootingStarMinMs+Math.random()*(MOTION.shootingStarMaxMs-MOTION.shootingStarMinMs);
}

function drawShootingStar(timestamp){
  if(!shootingStar) return;
  const star=shootingStar;
  star.x+=star.vx;star.y+=star.vy;star.life++;
  const target=$("shooting-star-target");
  if(target){
    target.style.left=`${star.x}px`;
    target.style.top=`${star.y}px`;
  }
  const ctx=fxContext;
  ctx.save();ctx.globalCompositeOperation="lighter";
  ctx.strokeStyle="rgba(255,242,207,.88)";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(star.x-star.vx*8,star.y-star.vy*8);ctx.lineTo(star.x,star.y);ctx.stroke();
  ctx.fillStyle=FX_COLORS.gold;ctx.beginPath();ctx.arc(star.x,star.y,3.2,0,Math.PI*2);ctx.fill();
  ctx.restore();
  if(star.life>MOTION.shootingStarLifeFrames){
    shootingStar=null;
    if(target) target.hidden=true;
  }
}

function addConfetti(x,y,count=MOTION.confettiCount){
  if(reducedMotion.matches) return;
  const colors=[FX_COLORS.rose,FX_COLORS.gold,FX_COLORS.cream,"#ff9aac"];
  const total=Math.round(count*quality);
  for(let index=0;index<total;index++){
    confettiPieces.push({x,y,vx:(Math.random()-.5)*11,vy:-Math.random()*11-3,size:4+Math.random()*7,rotation:Math.random()*Math.PI*2,spin:(Math.random()-.5)*.25,gravity:.16+Math.random()*.13,life:0,color:colors[index%colors.length],shape:index%3===0?"heart":"rect"});
  }
  startFxLoop();
}

function addSparkBurst(x,y,count){
  for(let index=0;index<count;index++){
    const angle=Math.random()*Math.PI*2,speed=1+Math.random()*4;
    fireworkBursts.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,size:1+Math.random()*2,life:0,maxLife:34,color:index%2?FX_COLORS.gold:FX_COLORS.rose,shape:"spark"});
  }
  startFxLoop();
}

function drawHeart(context,x,y,size){
  context.beginPath();
  context.moveTo(x,y+size*.35);
  context.bezierCurveTo(x-size*.85,y-size*.2,x-size*.45,y-size*.85,x,y-size*.3);
  context.bezierCurveTo(x+size*.45,y-size*.85,x+size*.85,y-size*.2,x,y+size*.35);
  context.fill();
}

function drawConfetti(delta){
  const ctx=fxContext;
  confettiPieces=confettiPieces.filter(piece=>piece.life<180&&piece.y<innerHeight+30);
  confettiPieces.forEach(piece=>{
    piece.vy+=piece.gravity*delta;piece.x+=piece.vx*delta;piece.y+=piece.vy*delta;piece.rotation+=piece.spin*delta;piece.life+=delta;
    ctx.save();ctx.translate(piece.x,piece.y);ctx.rotate(piece.rotation);ctx.globalAlpha=Math.max(0,1-piece.life/180);ctx.fillStyle=piece.color;
    if(piece.shape==="heart") drawHeart(ctx,0,0,piece.size);else ctx.fillRect(-piece.size/2,-piece.size/4,piece.size,piece.size/2);
    ctx.restore();
  });
}

function startFinale(){
  if(reducedMotion.matches) return;
  finaleGeneration++;
  finaleRunning=true;
  finaleStartedAt=performance.now();
  finaleUntil=finaleStartedAt+MOTION.fireworksDurationMs;
  document.body.classList.add("finale-active");
  lanterns=Array.from({length:Math.round(MOTION.lanternCount*quality)},()=>({
    x:Math.random()*innerWidth,y:innerHeight+Math.random()*innerHeight*.7,
    speed:.25+Math.random()*.55,size:9+Math.random()*12,
    phase:Math.random()*Math.PI*2,color:Math.random()<.5?FX_COLORS.gold:FX_COLORS.rose
  }));
  balloons=Array.from({length:Math.round(MOTION.balloonCount*quality)},()=>({
    x:Math.random()*innerWidth,y:innerHeight+Math.random()*innerHeight*.65,
    speed:.32+Math.random()*.42,size:10+Math.random()*10,
    phase:Math.random()*Math.PI*2,color:Math.random()<.5?FX_COLORS.rose:FX_COLORS.gold
  }));
  nextRocketAt=0;
  startFxLoop();
}

function stopFinale(){
  finaleGeneration++;
  finaleRunning=false;fireworkRockets=[];fireworkBursts=[];lanterns=[];balloons=[];
  document.body.classList.remove("finale-active");
}

let nextRocketAt=0;
function drawFinale(timestamp,delta){
  const ctx=fxContext;
  if(finaleRunning&&timestamp<finaleUntil&&timestamp>=nextRocketAt){
    spawnFireworkRocket();
    nextRocketAt=timestamp+MOTION.fireworkRocketIntervalMs*(.65+Math.random()*.7);
  }
  if(finaleRunning&&timestamp>=finaleUntil){
    finaleRunning=false;
    const generation=finaleGeneration;
    setTimeout(()=>{
      if(generation===finaleGeneration&&!finaleRunning) document.body.classList.remove("finale-active");
    },MOTION.finaleFadeMs);
  }
  if(!finaleRunning&&!fireworkRockets.length&&!fireworkBursts.length&&!lanterns.length&&!balloons.length) return;
  ctx.save();ctx.globalCompositeOperation="lighter";
  fireworkRockets=fireworkRockets.filter(rocket=>!rocket.done);
  fireworkRockets.forEach(rocket=>{
    rocket.x+=rocket.vx*delta;rocket.y+=rocket.vy*delta;rocket.life+=delta;
    ctx.strokeStyle=rocket.color;ctx.globalAlpha=.7;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(rocket.x-rocket.vx*4,rocket.y-rocket.vy*4);ctx.lineTo(rocket.x,rocket.y);ctx.stroke();
    if(rocket.life>rocket.maxLife||rocket.y<=rocket.targetY){
      rocket.done=true;
      makeFireworkBurst(rocket.x,rocket.y,rocket.heart);
    }
  });
  fireworkBursts=fireworkBursts.filter(particle=>particle.life<particle.maxLife);
  fireworkBursts.forEach(particle=>{
    particle.vy+=.075*delta;particle.x+=particle.vx*delta;particle.y+=particle.vy*delta;particle.life+=delta;
    ctx.globalAlpha=Math.max(0,1-particle.life/particle.maxLife);ctx.fillStyle=particle.color;
    ctx.beginPath();ctx.arc(particle.x,particle.y,particle.size,0,Math.PI*2);ctx.fill();
  });
  lanterns=lanterns.filter(lantern=>lantern.y>-45);
  lanterns.forEach(lantern=>{
    lantern.phase+=.018*delta;lantern.y-=lantern.speed*delta;lantern.x+=Math.sin(lantern.phase)*.22*delta;
    ctx.globalAlpha=.45;ctx.fillStyle=lantern.color;ctx.beginPath();ctx.ellipse(lantern.x,lantern.y,lantern.size*.55,lantern.size,.0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.75;ctx.strokeStyle="rgba(255,241,199,.55)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(lantern.x,lantern.y+lantern.size);ctx.lineTo(lantern.x,lantern.y+lantern.size*1.8);ctx.stroke();
  });
  balloons=balloons.filter(balloon=>balloon.y>-45);
  balloons.forEach(balloon=>{
    balloon.phase+=.014*delta;balloon.y-=balloon.speed*delta;balloon.x+=Math.sin(balloon.phase)*.34*delta;
    ctx.globalAlpha=.32;ctx.fillStyle=balloon.color;ctx.beginPath();ctx.ellipse(balloon.x,balloon.y,balloon.size*.74,balloon.size,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.65;ctx.strokeStyle="rgba(255,241,199,.48)";ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(balloon.x,balloon.y+balloon.size);ctx.lineTo(balloon.x+Math.sin(balloon.phase)*4,balloon.y+balloon.size*2.7);ctx.stroke();
  });
  ctx.restore();
}

function spawnFireworkRocket(){
  const x=innerWidth*.14+Math.random()*innerWidth*.72;
  fireworkRockets.push({x,y:innerHeight+8,vx:(Math.random()-.5)*1.8,vy:-7-Math.random()*4,targetY:innerHeight*(.14+Math.random()*.3),life:0,maxLife:95,color:Math.random()<.5?FX_COLORS.gold:FX_COLORS.rose,heart:Math.random()<.28,done:false});
}

function makeFireworkBurst(x,y,heart){
  const count=Math.round(MOTION.fireworkBurstCount*quality);
  for(let index=0;index<count;index++){
    let angle,speed;
    if(heart){
      const t=index/count*Math.PI*2;
      const hx=16*Math.pow(Math.sin(t),3),hy=-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t));
      const length=Math.hypot(hx,hy)||1;
      angle=Math.atan2(hy,hx);speed=(1.1+Math.random()*1.8)*length/17;
    }else{
      angle=Math.random()*Math.PI*2;speed=1+Math.random()*3.8;
    }
    fireworkBursts.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,size:1+Math.random()*2.2,life:0,maxLife:40+Math.random()*24,color:index%3?FX_COLORS.gold:FX_COLORS.rose,shape:"spark"});
  }
}

function drawFilmGrain(){
  if(!grainPattern) return;
  const ctx=fxContext;
  ctx.save();ctx.globalAlpha=MOTION.grainAlpha;ctx.globalCompositeOperation="soft-light";
  ctx.fillStyle=grainPattern;ctx.fillRect(0,0,innerWidth,innerHeight);ctx.restore();
}

function initVisibilityMotion(){
  const syncVisibility=()=>{
    document.body.classList.toggle("tab-hidden",document.hidden);
    if(document.hidden){
      if(fxFrame) cancelAnimationFrame(fxFrame);
      fxFrame=0;
    }else if(document.body.classList.contains("gift-open")) startFxLoop();
  };
  document.addEventListener("visibilitychange",syncVisibility);
  syncVisibility();
}

if(CONFIG.DEBUG){
  window.birthdayDebug=Object.freeze({
    warp:()=>triggerWarp(startHeroMorph),
    headline:startHeroMorph,
    finale:startFinale,
    shootingStar:()=>spawnShootingStar(performance.now()),
    wish:()=>{
      spawnShootingStar(performance.now());
      document.dispatchEvent(new PointerEvent("pointerdown",{clientX:shootingStar.x,clientY:shootingStar.y}));
    },
    constellation:()=>document.querySelector("#reasons")?.scrollIntoView({behavior:"smooth"}),
    letter:()=>document.querySelector(".letter-card")?.scrollIntoView({behavior:"smooth"}),
    memories:()=>document.querySelector(".memory-card")?.scrollIntoView({behavior:"smooth"}),
    cake:()=>document.querySelector("#cake")?.scrollIntoView({behavior:"smooth"})
  });
  if(CONFIG.DEBUG_MOMENT && window.birthdayDebug[CONFIG.DEBUG_MOMENT]&&new URLSearchParams(location.search).has("unlocked")){
    setTimeout(window.birthdayDebug[CONFIG.DEBUG_MOMENT],0);
  }
}

initGate();
initHome();
initMemories();
initVisibilityMotion();
