(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const stage = $("#stage");
  const slides = $$(".slide");
  const wipe = $("#wipe");
  const overview = $("#overview");
  const notes = $("#notes");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const motionOptions = window.ydMotionOptions ?? {};
  const bookCanvas = $("#book");
  const book = bookCanvas && window.startArchiveBook?.(bookCanvas, motionOptions.book);
  const sheets = new Map();
  const beatCount = index => Math.max(1, Number(slides[index].dataset.beats) || 1);
  const twoDigits = number => String(number).padStart(2,"0");
  let current = 0, beat = 0, switching = false, entryTimer = 0;
  let touchStart = null, lastWheel = 0, ignoreClickUntil = 0;

  for (const scene of slides.filter(slide => slide.dataset.motion === "sheets")) {
    if (!window.startArchiveSheets) break;
    const canvas = document.createElement("canvas");
    canvas.className = "motion-canvas sheets-canvas";
    canvas.setAttribute("aria-hidden", "true");
    scene.prepend(canvas);
    sheets.set(scene, window.startArchiveSheets(canvas, motionOptions.sheets));
  }

  function syncNotes() {
    const paragraph = $(".speaker-note", slides[current]);
    $("#notes-body").textContent = paragraph?.textContent.trim() || slides[current].dataset.title;
  }

  function sync() {
    const scene = slides[current];
    stage.dataset.slide = String(current + 1);
    scene.dataset.beat = String(beat);
    for (const element of $$("[data-in]", scene)) {
      const pending = Number(element.dataset.in) > beat;
      element.toggleAttribute("data-pending", pending);
      element.setAttribute("aria-hidden", String(pending));
    }
    for (const [index, tick] of $$("#timeline button").entries()) {
      if (index === current) {
        tick.setAttribute("aria-current", "step");
        tick.style.setProperty("--progress", `${((beat + 1) / beatCount(index)) * 100}%`);
      } else {
        tick.removeAttribute("aria-current");
      }
    }
    $$("#index-list button").forEach((button,index) => {
      if (current === index) button.setAttribute("aria-current","page"); else button.removeAttribute("aria-current");
    });
    $("#pager").value = `${twoDigits(current + 1)} / ${twoDigits(slides.length)}`;
    $("#chapter").textContent = scene.dataset.chapter || scene.dataset.title;
    $("#prev").disabled = current === 0 && beat === 0;
    $("#next").disabled = current === slides.length - 1 && beat === beatCount(current) - 1;
    $("#live").textContent = `第 ${current + 1} 页。${scene.dataset.title}。第 ${beat + 1} 步，共 ${beatCount(current)} 步。`;
    if (notes.open) syncNotes();

    // The related visual scene is active only while its slide is visible.
    const mode = scene.dataset.motion;
    if (book) {
      bookCanvas.hidden = mode !== "cover" && mode !== "close";
      bookCanvas.classList.toggle("closing-book", mode === "close");
      if (bookCanvas.hidden) book.set("sleep");
      else {
        book.resize();
        book.set(mode, beat);
      }
    }
    for (const [slide, motion] of sheets) {
      if (slide === scene) motion.set(beat);
      else motion.sleep();
    }
    document.dispatchEvent(new CustomEvent("yd:beat", {detail:{index:current, beat, slide:scene}}));
  }

  function show(index, nextBeat = 0) {
    current = index;
    beat = nextBeat;
    for (const [position, scene] of slides.entries()) {
      scene.hidden = position !== current;
      scene.classList.remove("is-entering");
    }
    clearTimeout(entryTimer);
    const scene = slides[current];
    // Let a user replay the entry without needing to leave the current slide.
    void scene.offsetWidth;
    sync();
    sheets.get(scene)?.resize();
    scene.classList.add("is-entering");
    entryTimer = setTimeout(() => scene.classList.remove("is-entering"), 1600);
  }

  function navigate(index, nextBeat = 0, animate = true) {
    if (switching || index < 0 || index >= slides.length) return;
    const effect = slides[index].dataset.transition || "leaf";
    if (!animate || reduced.matches || effect === "cut" || index === current) {
      show(index, nextBeat);
      return;
    }
    switching = true;
    wipe.dataset.effect = effect;
    wipe.dataset.direction = index > current ? "forward" : "back";
    wipe.hidden = false;
    setTimeout(() => show(index, nextBeat), 350);
    setTimeout(() => { wipe.hidden = true; switching = false; }, 750);
  }

  function step(direction) {
    if (switching) return;
    const target = beat + direction;
    if (target >= 0 && target < beatCount(current)) {
      beat = target;
      sync();
    } else if (direction > 0) navigate(current + 1);
    else if (current) navigate(current - 1, beatCount(current - 1) - 1);
  }

  function openDialog(dialog) {
    const other = dialog === overview ? notes : overview;
    if (other.open) other.close();
    if (dialog.open) {
      dialog.close();
      return;
    }
    if (dialog === notes) syncNotes();
    dialog.showModal();
  }

  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      $("#live").textContent = "浏览器未能切换全屏。";
    }
  }

  for (const [index, scene] of slides.entries()) {
    const tick = document.createElement("button");
    tick.type = "button";
    tick.title = scene.dataset.title;
    tick.setAttribute("aria-label", `第 ${index + 1} 页。${scene.dataset.title}`);
    tick.addEventListener("click", () => navigate(index));
    $("#timeline").append(tick);
    const item = document.createElement("button");
    item.type = "button";
    item.textContent = `${twoDigits(index + 1)}  ${scene.dataset.title}`;
    item.addEventListener("click", () => {
      overview.close();
      navigate(index);
    });
    $("#index-list").append(item);
  }

  $("#overview-btn").addEventListener("click", () => openDialog(overview));
  $("#notes-btn").addEventListener("click", () => openDialog(notes));
  $("#full-btn").addEventListener("click", fullscreen);
  $("#prev").addEventListener("click", () => step(-1));
  $("#next").addEventListener("click", () => step(1));
  document.addEventListener("fullscreenchange", () => {
    $("#full-btn").textContent = document.fullscreenElement ? "退出全屏" : "全屏";
    requestAnimationFrame(resize);
  });
  document.addEventListener("keydown", event => {
    if (overview.open || notes.open || event.altKey || event.ctrlKey || event.metaKey ||
        event.target.closest("input,textarea,select,[contenteditable]")) return;
    const key = event.key.toLowerCase();
    if ((key === " " || key === "enter") && event.target.closest("button,a")) return;
    const action = {
      arrowright: () => step(1), arrowleft: () => step(-1),
      " ": () => step(event.shiftKey ? -1 : 1), enter: () => step(1),
      arrowup: () => navigate(current - 1), arrowdown: () => navigate(current + 1),
      pageup: () => navigate(current - 1), pagedown: () => navigate(current + 1),
      home: () => navigate(0), end: () => navigate(slides.length - 1),
      n: () => openDialog(notes), escape: () => openDialog(overview),
      f: fullscreen, r: () => show(current,0)
    }[key];
    if (!action) return;
    event.preventDefault();
    if (!event.repeat && !switching) action();
  });
  stage.addEventListener("click", event => {
    if (performance.now() >= ignoreClickUntil &&
        !event.target.closest("button,a,input,select,textarea,[data-interactive]") &&
        !window.getSelection()?.toString()) step(1);
  });
  stage.addEventListener("wheel", event => {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (event.ctrlKey || Math.abs(delta) < 10 || event.target.closest("[data-interactive]")) return;
    event.preventDefault();
    const now = performance.now();
    if (now - lastWheel > 270) step(Math.sign(delta));
    lastWheel = now;
  }, {passive:false});
  stage.addEventListener("touchstart", event => {
    if (event.touches.length !== 1 || event.target.closest("button,a,input,[data-interactive]")) return;
    const touch = event.touches[0];
    touchStart = [touch.clientX,touch.clientY];
  }, {passive:true});
  stage.addEventListener("touchcancel", () => { touchStart = null; });
  stage.addEventListener("touchend", event => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart[0], dy = touch.clientY - touchStart[1];
    touchStart = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      ignoreClickUntil = performance.now() + 320;
      step(-Math.sign(dx));
    }
  }, {passive:true});

  function resize() {
    const portrait = innerWidth / innerHeight < .96;
    const width = portrait ? 960 : 1600, height = portrait ? 1540 : 900;
    const heightBudget = portrait ? Math.max(160,innerHeight - 64) : innerHeight;
    const root = document.documentElement;
    document.body.classList.toggle("portrait", portrait);
    root.style.setProperty("--width", `${width}px`);
    root.style.setProperty("--height", `${height}px`);
    root.style.setProperty("--scale", Math.min(innerWidth / width,heightBudget / height));
    if (book && !bookCanvas.hidden) book.resize();
    sheets.get(slides[current])?.resize();
  }
  window.addEventListener("resize", resize);
  resize();
  show(0);
})();
