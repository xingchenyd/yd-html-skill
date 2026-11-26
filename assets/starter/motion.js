/* Independent perspective-canvas props for scene-based presentations. */
(() => {
  "use strict";

  const clamp = (x) => Math.min(1, Math.max(0, x));
  const smooth = (x) => clamp(x) ** 2 * (3 - 2 * clamp(x));
  const mix = (a, b, x) => a + (b - a) * x;
  const pi = Math.PI;
  const bookWidth = 3.76;
  const paperWidth = 3.57;
  const bookDepth = 5.10;
  const paperDepth = 4.86;

  const defaultCover = {
    emblem: "✧",
    eyebrow: "F I E L D   N O T E S",
    title: ["The Archive"],
    subtitle: "A   C O L L E C T I O N   O F   O B S E R V A T I O N S",
    footer: "Vol. I",
  };

  const defaultPages = {
    left: { heading: "Field notes", rows: ["Context", "Observations", "Open questions"] },
    right: { heading: "Evidence", rows: ["Source", "Description", "Interpretation"] },
    under: { heading: "Method", rows: ["Define", "Collect", "Compare", "Verify"], checks: true },
  };

  const defaultMaterials = {
    cover: ["#40432d", "#272c20", "#111d18"],
    liner: ["#434938", "#2e3429", "#24281e"],
    left: ["#f9edd0", "#e1cda2", "#bea477"],
    right: ["#f1dfba", "#dfca9c", "#b69f75"],
    under: ["#f8e8c5", "#e8d5ab", "#c4ae84"],
    foil: ["#8e6d36", "#d9bc77", "#b9985a", "#ead29f", "#8f6e40"],
    binding: ["#2e342a", "#272c21", "#3c422f", "#5b5840"],
    edges: ["#dfc89b", "#ccb182", "#b9a277", "#745535"],
    ink: "#554b37",
    accent: "#8a5543",
    rule: "#967d55",
    halo: [167, 128, 64],
  };

  function surface(kind, content, materials, customImage) {
    const texture = document.createElement("canvas");
    texture.width = 610;
    texture.height = 860;
    const g = texture.getContext("2d");
    const w = texture.width;
    const h = texture.height;
    if (customImage) {
      g.drawImage(customImage, 0, 0, w, h);
      return texture;
    }
    const isCover = kind === "cover";
    const isLiner = kind === "liner";
    const isPaper = !isCover && !isLiner;
    let seed = 215730;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const stops = materials[kind];
    const base = g.createLinearGradient(0, 0, w, h);
    base.addColorStop(0, stops[0]);
    base.addColorStop(.56, stops[1]);
    base.addColorStop(1, stops[2]);
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    const img = g.getImageData(0, 0, w, h);
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        const i = 4 * (y * w + x);
        const grain = (random() - .5) * (isPaper ? 23 : 25);
        const ox = Math.min(x, w - x) / 62;
        const oy = Math.min(y, h - y) / 78;
        const wear = (1 - Math.min(1, ox, oy)) * (isPaper ? -18 : 19);
        const cloth = isPaper ? 0 : 6 * Math.sin(x * 2.18) * Math.sin(y * 3.12) + 3 * Math.sin(y * 2.41);
        for (let c = 0; c < 3; ++c) img.data[i + c] += grain + cloth + wear;
      }
    }
    g.putImageData(img, 0, 0);

    if (isCover) {
      const gold = g.createLinearGradient(120, 70, 470, 640);
      for (const [i, position] of [0, .42, .66, .85, 1].entries()) {
        gold.addColorStop(position, materials.foil[i]);
      }
      g.fillStyle = materials.cover[2];
      g.fillRect(0, 0, 45, h);
      g.strokeStyle = materials.binding[3];
      g.lineWidth = 1.2;
      g.strokeRect(8, 15, 35, h - 30);
      g.strokeStyle = gold;
      g.lineWidth = 2.7;
      g.strokeRect(60, 32, w - 94, h - 64);
      g.lineWidth = 1;
      g.strokeRect(68, 40, w - 110, h - 80);
      for (const [x, sx] of [[78, 1], [w - 50, -1]]) {
        for (const [y, sy] of [[50, 1], [h - 50, -1]]) {
          g.save();
          g.translate(x, y);
          g.scale(sx, sy);
          g.lineWidth = 1.6;
          g.beginPath();
          g.moveTo(0, 41);
          g.bezierCurveTo(11, 16, 16, 11, 41, 0);
          g.bezierCurveTo(19, 2, 6, 3, 0, 41);
          g.stroke();
          g.beginPath();
          g.arc(9, 9, 3, 0, pi * 2);
          g.stroke();
          g.restore();
        }
      }
      const center = 318;
      g.strokeStyle = gold;
      g.beginPath();
      g.arc(center, 230, 47, 0, pi * 2);
      g.stroke();
      g.beginPath();
      g.arc(center, 230, 39, 0, pi * 2);
      g.stroke();
      for (let i = 0; i < 16; ++i) {
        const a = i * pi / 8;
        g.beginPath();
        g.moveTo(center + 41 * Math.cos(a), 230 + 41 * Math.sin(a));
        g.lineTo(center + 46 * Math.cos(a), 230 + 46 * Math.sin(a));
        g.stroke();
      }
      g.textAlign = "center";
      g.fillStyle = gold;
      g.font = "34px Georgia, serif";
      g.fillText(content.emblem, center, 243, 64);
      g.font = "16px Georgia, serif";
      g.fillText(content.eyebrow, center, 344, 436);
      g.font = "52px Georgia, serif";
      g.shadowColor = "#111409";
      g.shadowOffsetY = 2;
      g.shadowBlur = 1;
      const titles = Array.isArray(content.title) ? content.title.slice(0, 3) : [content.title];
      for (const [row, title] of titles.entries()) {
        g.fillText(title, center, 445 + (row - (titles.length - 1) / 2) * 54, 436);
      }
      g.shadowColor = "transparent";
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(234, 517);
      g.lineTo(403, 517);
      g.stroke();
      g.font = "14px Georgia, serif";
      g.fillText(content.subtitle, center, 567, 436);
      g.font = "25px Georgia, serif";
      g.fillText(content.footer, center, 725, 436);
    }

    if (isPaper) {
      g.fillStyle = materials.ink;
      g.strokeStyle = materials.rule;
      g.lineWidth = 1.1;
      g.beginPath();
      g.moveTo(63, 109);
      g.lineTo(550, 109);
      g.moveTo(63, 749);
      g.lineTo(550, 749);
      g.stroke();
      g.font = "17px Georgia";
      g.fillText(content.eyebrow, 63, 92, 487);
      g.fillStyle = materials.accent;
      g.font = "45px Georgia";
      g.fillText(content.heading, 63, 180, 487);
      g.globalAlpha = .57;
      g.beginPath();
      g.moveTo(64, 224);
      g.lineTo(64, 718);
      g.moveTo(548, 224);
      g.lineTo(548, 718);
      for (let i = 0; i < 15; ++i) {
        g.moveTo(63, 232 + i * 34);
        g.lineTo(551, 232 + i * 34);
      }
      g.stroke();
      g.globalAlpha = .92;
      g.fillStyle = materials.ink;
      g.font = "22px Georgia";
      const rows = content.rows.slice(0, 13);
      const spacing = rows.length < 8 ? 68 : 34;
      for (const [i, line] of rows.entries()) {
        if (content.checks) g.strokeRect(81, 242 + spacing * i, 12, 11);
        g.fillText(line, 114, 258 + spacing * i, 417);
      }
      g.globalAlpha = .66;
      g.font = "17px Georgia";
      g.fillText(content.footer, 64, 781, 486);
    }
    return texture;
  }

  function pointsArea(points) {
    let twiceArea = 0;
    for (let i = 0; i < points.length; ++i) {
      const p = points[i];
      const q = points[(i + 1) % points.length];
      twiceArea += p.x * q.y - p.y * q.x;
    }
    return twiceArea * .5;
  }

  function triangle(g, tex, p, q, r, u, v, w) {
    const x1 = v[0] - u[0];
    const x2 = w[0] - u[0];
    const y1 = v[1] - u[1];
    const y2 = w[1] - u[1];
    const det = x1 * y2 - x2 * y1;
    const a = ((q.x - p.x) * y2 - (r.x - p.x) * y1) / det;
    const c = ((r.x - p.x) * x1 - (q.x - p.x) * x2) / det;
    const b = ((q.y - p.y) * y2 - (r.y - p.y) * y1) / det;
    const d = ((r.y - p.y) * x1 - (q.y - p.y) * x2) / det;
    const mx = (p.x + q.x + r.x) / 3;
    const my = (p.y + q.y + r.y) / 3;
    g.save();
    g.beginPath();
    for (const [i, item] of [p, q, r].entries()) {
      const size = Math.max(1, Math.hypot(item.x - mx, item.y - my));
      const x = item.x + .85 * (item.x - mx) / size;
      const y = item.y + .85 * (item.y - my) / size;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.clip();
    g.transform(a, b, c, d, p.x - a * u[0] - c * u[1], p.y - b * u[0] - d * u[1]);
    g.drawImage(tex, 0, 0);
    g.restore();
  }

  window.startArchiveBook = (canvas, options = {}) => {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return { set() {}, resize() {}, dispose() {} };
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const materials = { ...defaultMaterials, ...options.materials };
    const coverContent = { ...defaultCover, ...options.cover };
    const tex = {};
    for (const name of ["cover", "liner", "left", "right", "under"]) {
      const content = name === "cover"
        ? coverContent
        : { eyebrow: "T H E   A R C H I V E", footer: "", ...defaultPages[name], ...options.pages?.[name] };
      tex[name] = surface(name, content, materials, options.textures?.[name]);
    }
    const motion = { open: 0, turn: 0, yaw: -.48, tilt: -.08, light: 1 };
    const goal = { ...motion };
    let mode = "sleep";
    let raf = 0;
    let lastTime = 0;
    let aspectScale = 1;
    let screenWidth = 900;
    let screenHeight = 800;
    const faces = [];
    let project;

    function shadow(frame, openness, brightness) {
      ctx.save();
      const point = project([0, -.1, .15]);
      ctx.translate(mix(478, point.x, .33), mix(522, point.y, .57));
      ctx.scale(1, .34);
      const halo = ctx.createRadialGradient(0, 0, 65, 0, 0, 430);
      halo.addColorStop(0, `rgba(${materials.halo},0.22)`);
      halo.addColorStop(.55, `rgba(${materials.halo},0.10)`);
      halo.addColorStop(1, `rgba(${materials.halo},0)`);
      ctx.globalAlpha = brightness;
      ctx.fillStyle = halo;
      ctx.fillRect(-490, -490, 980, 980);
      const radius = mix(205, 327, openness);
      ctx.translate(17 + frame * .8, 42);
      ctx.scale(1, .77);
      const contact = ctx.createRadialGradient(0, 0, 8, 0, 0, radius);
      contact.addColorStop(0, "rgba(2,9,7,.79)");
      contact.addColorStop(.58, "rgba(3,10,8,.32)");
      contact.addColorStop(1, "rgba(4,11,8,0)");
      ctx.fillStyle = contact;
      ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
      ctx.restore();
    }

    function face(verts, contents, level, showBack = false) {
      const pts = verts.map(project);
      const area = pointsArea(pts);
      if (Math.abs(area) < .1 || (area < 0 && !showBack)) return;
      const depth = pts.reduce((total, p) => total + p.d, 0) / pts.length;
      faces.push({ pts, depth, level, contents });
    }

    function panel(a, y, width, depth, thick, top, lower, pageEdge, level) {
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const p = (u, v, t) => [ca * u * width - sa * t, y + sa * u * width + ca * t, depth * (v - .5)];
      const corners = (t) => [p(0, 0, t), p(1, 0, t), p(1, 1, t), p(0, 1, t)];
      const u = corners(thick);
      const l = corners(0);
      if (typeof top === "string" && tex[top]) {
        mapSurface(p, thick, top, false, false, 4, 3, level);
      } else {
        face(u, { color: top }, level);
      }
      if (typeof lower === "string" && tex[lower]) {
        mapSurface(p, 0, lower, true, true, 4, 3, level);
      } else {
        face([l[1], l[0], l[3], l[2]], { color: lower }, level);
      }
      for (let i = 0; i < 4; ++i) {
        const j = (i + 1) % 4;
        const rear = i === 3;
        const color = (pageEdge ? materials.edges : materials.binding)[i];
        face([u[j], u[i], l[i], l[j]], { color, pages: pageEdge && !rear, spine: rear && !pageEdge }, level);
      }
      return p;
    }

    function mapSurface(p, layer, material, reverse, flip, cols, rows, level, shade = 0) {
      const source = tex[material];
      for (let y = 0; y < rows; ++y) {
        for (let x = 0; x < cols; ++x) {
          const x0 = x / cols;
          const x1 = (x + 1) / cols;
          const y0 = y / rows;
          const y1 = (y + 1) / rows;
          const corners = [p(x0, y0, layer), p(x1, y0, layer), p(x1, y1, layer), p(x0, y1, layer)];
          const tx0 = (flip ? 1 - x0 : x0) * source.width;
          const tx1 = (flip ? 1 - x1 : x1) * source.width;
          const uv = [[tx0, y0 * source.height], [tx1, y0 * source.height], [tx1, y1 * source.height], [tx0, y1 * source.height]];
          if (reverse) {
            corners.reverse();
            uv.reverse();
          }
          const cover = material === "cover";
          face(corners, { tex: source, uv, shade: cover ? shade * .5 : shade, highlight: cover && layer > 0 ? .025 : 0 }, level);
        }
      }
    }

    function curledLeaf(turn, baseY, elapsed) {
      const theta = (.008 + turn * .985) * pi;
      const arch = Math.sin(theta) * .59;
      const p = (u, v) => {
        const angle = theta + arch * (.55 - u);
        const curl = u ** 4 * Math.sin(v * pi) * (.025 + .10 * Math.sin(theta));
        const flutter = Math.sin(elapsed * .94 + v * 2.4) * u ** 4 * .014;
        return [Math.cos(angle) * u * paperWidth, baseY + Math.sin(angle) * u * paperWidth + curl + flutter, paperDepth * (v - .5)];
      };
      mapSurface(p, 0, "right", false, false, 12, 4, 70, .08 * Math.sin(theta));
      mapSurface(p, 0, "left", true, true, 12, 4, 70, .10 * Math.sin(theta));
      const rim = [p(.992, 0), p(1, 0), p(1, .5), p(.992, .5)];
      face(rim, { color: "rgba(236,209,158,.67)" }, 71, true);
      face([p(.992, .5), p(1, .5), p(1, 1), p(.992, 1)], { color: "rgba(212,188,142,.72)" }, 71, true);
    }

    function drawFace({ pts, contents }) {
      if (contents.tex) {
        const [p, q, r, s] = pts;
        const [u, v, w, x] = contents.uv;
        triangle(ctx, contents.tex, p, q, r, u, v, w);
        triangle(ctx, contents.tex, p, r, s, u, w, x);
        if (!contents.shade && !contents.highlight) return;
      }
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (const item of pts.slice(1)) ctx.lineTo(item.x, item.y);
      ctx.closePath();
      ctx.fillStyle = contents.color || (contents.shade ? `rgba(34,29,15,${contents.shade})` : `rgba(240,203,123,${contents.highlight})`);
      ctx.fill();
      if (contents.pages || contents.spine) {
        ctx.save();
        ctx.clip();
        const [a, b, c, d] = pts;
        const count = contents.pages ? 34 : 6;
        for (let i = 0; i < count; ++i) {
          const t = (i + .6) / count;
          ctx.beginPath();
          if (contents.pages) {
            ctx.moveTo(mix(a.x, d.x, t), mix(a.y, d.y, t));
            ctx.lineTo(mix(b.x, c.x, t), mix(b.y, c.y, t));
            ctx.strokeStyle = i % 7 === 0 ? "#6d5839a1" : "#82633c73";
            ctx.lineWidth = i % 7 === 0 ? .88 : .58;
          } else {
            ctx.moveTo(mix(a.x, b.x, t), mix(a.y, b.y, t));
            ctx.lineTo(mix(d.x, c.x, t), mix(d.y, c.y, t));
            ctx.strokeStyle = materials.foil[2];
            ctx.lineWidth = 2;
          }
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    function draw(time) {
      raf = 0;
      if (mode === "sleep") return;
      const delta = lastTime ? Math.min(.048, (time - lastTime) / 1000) : .016;
      lastTime = time;
      const ease = reduceMotion.matches ? 1 : 1 - Math.exp(-delta * 3.25);
      for (const key of Object.keys(motion)) motion[key] = mix(motion[key], goal[key], ease);
      const t = reduceMotion.matches ? 0 : time / 1000;
      const wave = Math.sin(t * .59);
      const yaw = motion.yaw + wave * .036;
      const tip = motion.tilt + Math.sin(t * .48) * .021;
      const openness = motion.open;
      const theta = .97 * pi * openness;
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const cz = Math.cos(tip);
      const sz = Math.sin(tip);
      const cameraPitch = mix(.64, .88, openness);
      const cx = Math.cos(cameraPitch);
      const sx = Math.sin(cameraPitch);
      const centerX = mix(1.83, 0, smooth(openness * 1.25));
      const centerY = mix(.34, .83, openness);
      const focal = 1715 * mix(1.19, .93, openness);
      project = ([x, y, z]) => {
        x -= centerX;
        y -= centerY;
        const a = x * cy + z * sy;
        const b = z * cy - x * sy;
        const u = a * cz - y * sz;
        const v = a * sz + y * cz;
        const height = v * cx - b * sx;
        const depth = 17.2 - (v * sx + b * cx);
        return { x: 465 + focal * u / depth, y: 410 - focal * height / depth, d: depth };
      };
      ctx.setTransform(aspectScale, 0, 0, aspectScale, (screenWidth - 900 * aspectScale) * .5, (screenHeight - 800 * aspectScale) * .5);
      ctx.clearRect(-screenWidth / aspectScale, -screenHeight / aspectScale, screenWidth * 3 / aspectScale, screenHeight * 3 / aspectScale);
      shadow(wave, openness, motion.light);
      faces.length = 0;
      const cover = panel(0, .12, bookWidth, bookDepth, .11, "liner", materials.cover[2], false, 20);
      const remainingHeight = mix(.38, .25, openness) - motion.turn * .035;
      const paper = panel(0, .23, paperWidth, paperDepth, remainingHeight, "under", materials.edges[2], true, 30);
      const hingeY = .62;
      panel(theta, hingeY, bookWidth, bookDepth, .11, "cover", "liner", false, 40);

      const stackVisible = smooth((openness - .73) / .21);
      if (stackVisible > .06) {
        const leftBase = hingeY + .075 * stackVisible;
        const upper = (u, v) => [Math.cos(theta) * u * paperWidth, leftBase + Math.sin(theta) * u * paperWidth + .052 * Math.sin(pi * u), paperDepth * (v - .5)];
        mapSurface(upper, 0, "left", true, true, 8, 3, 51);
        const e = upper(1, 0);
        const f = upper(1, 1);
        const thickness = .070 * stackVisible;
        face([e, f, [f[0], f[1] - thickness, f[2]], [e[0], e[1] - thickness, e[2]]], { color: materials.edges[1], pages: true }, 50, true);
        face([f, upper(0, 1), [0, leftBase - thickness, f[2]], [f[0], f[1] - thickness, f[2]]], { color: materials.edges[2], pages: true }, 50, true);
      }

      if (openness > .61) {
        const turn = clamp(motion.turn);
        if (turn > .035 && turn < .968) {
          const seat = .23 + remainingHeight;
          const extent = paperWidth * Math.max(0, Math.cos(turn * pi) + .26);
          if (extent > .1) {
            face([[.025, seat + .006, -paperDepth * .47], [extent, seat + .006, -paperDepth * .41], [extent * .92, seat + .006, paperDepth * .45], [.025, seat + .006, paperDepth * .49]], { color: `rgba(45,34,17,${.20 * Math.sin(turn * pi)})` }, 55);
          }
          curledLeaf(turn, mix(seat + .012, hingeY + .152, turn), t);
        } else if (turn < .035) {
          const page = (u, v) => {
            const p = paper(u, v, remainingHeight + .007);
            p[1] += (.03 + .012 * Math.sin(t * 1.12)) * u ** 3 * Math.sin(pi * v);
            return p;
          };
          mapSurface(page, 0, "right", false, false, 8, 3, 52);
        }
      }

      face([cover(0, 0, .109), paper(0, 0, .36), paper(0, 1, .36), cover(0, 1, .109)], { color: materials.binding[0] }, 35, true);
      faces.sort((a, b) => a.level - b.level || b.depth - a.depth);
      for (const item of faces) drawFace(item);
      const settled = Object.keys(motion).every((key) => Math.abs(motion[key] - goal[key]) < .0001);
      if (!reduceMotion.matches || !settled) raf = requestAnimationFrame(draw);
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.65);
      screenWidth = Math.round(rect.width * pixelRatio);
      screenHeight = Math.round(rect.height * pixelRatio);
      if (canvas.width !== screenWidth) canvas.width = screenWidth;
      if (canvas.height !== screenHeight) canvas.height = screenHeight;
      aspectScale = Math.min(screenWidth / 900, screenHeight / 800);
      if (mode !== "sleep" && !raf) raf = requestAnimationFrame(draw);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    return {
      set(nextMode, beat = 0) {
        if (nextMode === "sleep") {
          mode = nextMode;
          cancelAnimationFrame(raf);
          raf = 0;
          lastTime = 0;
          return;
        }
        const opening = nextMode === "cover";
        const open = Number(opening ? beat > 0 : beat === 0);
        const turn = Number(opening && beat > 1);
        Object.assign(goal, {
          open,
          turn,
          yaw: open ? -.22 : opening ? -.53 : -.69,
          tilt: open ? -.038 : opening ? -.10 : -.062,
          light: opening ? 1 : .84,
        });
        // Enter on the scene's first pose. Subsequent beats animate the same object.
        if (mode !== nextMode || reduceMotion.matches) Object.assign(motion, goal);
        mode = nextMode;
        resize();
        if (!raf) raf = requestAnimationFrame(draw);
      },
      resize,
      dispose() {
        observer.disconnect();
        cancelAnimationFrame(raf);
        mode = "sleep";
        raf = 0;
      },
    };
  };
})();

(function () {
  "use strict";

  const width = 1150;
  const height = 850;
  const camera = 1050;
  const corner = 0.5;
  const strips = 8;
  const tau = 2 * Math.PI;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const mix = (first, second, amount) => first + (second - first) * amount;
  const ease = (value) => value * value * (3 - 2 * value);

  window.startArchiveSheets = function (canvas, options = {}) {
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return { set() {}, resize() {}, sleep() {} };

    canvas.setAttribute("aria-hidden", "true");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const count = clamp(Math.round(options.count ?? 13), 1, 24);
    const duration = clamp(options.duration ?? 1.16, 0.14, 8);
    const materials = {
      paper: [243, 233, 212],
      ink: [49, 69, 65],
      stamp: [148, 90, 60],
      shadow: [8, 16, 15],
      ...options.materials,
    };
    const rgba = (rgb, opacity) => `rgba(${rgb},${opacity})`;
    const papers = Array.from({ length: count }, (_, index) => ({
      index,
      phase: (index * 2.399963 + 0.3) % tau,
      scale: 0.83 + ((index * 23) % 47) / 130,
      delay: ((index * 13) % 17) * 0.013,
      warm: (index * 29) % 13,
      rows: 7 + index % 5,
    }));

    let beat = 0;
    let startedAt = 0;
    let frameId = 0;
    let active = false;
    let source = null;
    let poses = null;

    function pose(paper, state, seconds) {
      const { index, phase } = paper;
      const wave = seconds * 1.15 + phase;
      const floating = Math.sin(wave);
      const lateral = Math.cos(wave * 0.71);
      if (state === 0) {
        const progress = papers.length === 1 ? .5 : index / (papers.length - 1);
        return [
          235 + progress * 590 + Math.sin(phase) * 57 + lateral * 26,
          118 + progress * 405 + Math.cos(phase) * 70 + floating * 23,
          -255 + Math.sin(phase * 2) * 145 + floating * 31,
          -0.65 + 0.72 * Math.sin(phase + wave * 0.3),
          0.69 * Math.cos(phase + wave * 0.25),
          -0.52 + 0.75 * Math.sin(phase * 0.82) + lateral * 0.17,
          14 + 9 * floating,
          0.48 + index * 0.022,
        ];
      }
      if (state === 1) {
        const fan = (index - (papers.length - 1) / 2) * Math.min(1, 13 / papers.length);
        return [
          560 + fan * 33 + lateral * 10,
          414 + Math.abs(fan) ** 1.7 * 6 + floating * 10,
          -97 + index * 6 + floating * 7,
          -0.68 + Math.abs(fan) * 0.026 + floating * 0.043,
          fan * 0.048 + lateral * 0.057,
          fan * 0.126 + floating * 0.036,
          15 + 6 * floating,
          0.64 + 0.019 * index,
        ];
      }
      return [
        660 + Math.sin(phase) * 9 + index * 0.4,
        574 - index * 2.6 + Math.cos(phase) * 3,
        -102 + index * 4.1,
        -1.055 + Math.sin(phase) * 0.035 + floating * 0.01,
        -0.21 + lateral * 0.018,
        -0.30 + Math.sin(phase) * 0.062,
        3 + index * 0.20,
        0.93,
      ];
    }

    function project(poseValues, paper, u, v) {
      const [x, y, depth, pitch, yaw, roll, curl] = poseValues;
      const scaledWidth = 165 * paper.scale;
      const scaledHeight = 223 * paper.scale;
      const px = (u - corner) * scaledWidth;
      const py = (v - corner) * scaledHeight;
      const pz = curl * ((v - 0.43) ** 2 * 4 + 0.23 * u * v);

      const pitchY = py * Math.cos(pitch) - pz * Math.sin(pitch);
      const pitchZ = py * Math.sin(pitch) + pz * Math.cos(pitch);
      const yawX = px * Math.cos(yaw) + pitchZ * Math.sin(yaw);
      const yawZ = -px * Math.sin(yaw) + pitchZ * Math.cos(yaw);
      const rollX = yawX * Math.cos(roll) - pitchY * Math.sin(roll);
      const rollY = yawX * Math.sin(roll) + pitchY * Math.cos(roll);
      const perspective = camera / (camera - depth - yawZ);
      return {
        x: width / 2 + (x - width / 2 + rollX) * perspective,
        y: height / 2 + (y - height / 2 + rollY) * perspective,
        z: depth + yawZ,
      };
    }

    function path(points, close = true) {
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      for (let index = 1; index < points.length; index += 1) {
        context.lineTo(points[index].x, points[index].y);
      }
      if (close) context.closePath();
    }

    function drawPaper(paper, values, seconds) {
      const left = [];
      const right = [];
      const point = (u, v) => project(values, paper, u, v);
      for (let strip = 0; strip <= strips; strip += 1) {
        left.push(point(0, strip / strips));
        right.push(point(1, strip / strips));
      }
      const outline = [...left, ...[...right].reverse()];
      const [lightPitch, lightYaw, roll] = values.slice(3, 6);
      const front = Math.cos(lightPitch) * Math.cos(lightYaw) > 0;
      const light = 0.67 + 0.31 * Math.cos(lightPitch + 0.7)
        * Math.cos(lightYaw - 0.35 + 0.27 * Math.sin(seconds * 0.6));
      const keyX = 0.45 + Math.sin(seconds * 0.67 + paper.phase * 0.22) * 0.18;

      context.save();
      context.globalAlpha = values[7];

      const foot = point(0.5, 0.75);
      const shade = point(0.5, 0.24);
      context.shadowBlur = 11 * paper.scale;
      context.shadowOffsetX = 5;
      context.shadowOffsetY = 13;
      context.shadowColor = rgba(materials.shadow, 0.55);
      context.fillStyle = rgba(materials.paper, 1);
      path(outline);
      context.fill();
      context.shadowBlur = 0;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;

      const gradient = context.createLinearGradient(shade.x, shade.y, foot.x + 16, foot.y + 18);
      const brightness = Math.round(181 + 52 * light + paper.warm / 3);
      const cream = (shift) => {
        const colors = materials.paper.map((channel) => clamp(channel + brightness + shift - 243, 0, 254));
        return rgba(colors, 1);
      };
      gradient.addColorStop(0, cream(-19));
      gradient.addColorStop(keyX, cream(13));
      gradient.addColorStop(1, cream(-31));
      context.fillStyle = gradient;
      context.fill();

      for (let strip = 0; strip < strips; strip += 1) {
        const tone = Math.cos(strip * 0.44 - 1.7 + roll + lightPitch * 0.4);
        const shadeAmount = Math.abs(tone) * 0.065;
        context.fillStyle = tone < 0 ? `rgba(74, 65, 44, ${shadeAmount})` : `rgba(255, 255, 232, ${shadeAmount})`;
        path([left[strip], right[strip], right[strip + 1], left[strip + 1]]);
        context.fill();
      }

      context.lineCap = "round";
      context.lineJoin = "round";
      path(outline);
      context.strokeStyle = "rgba(77, 61, 41, 0.28)";
      context.lineWidth = 0.8;
      context.stroke();
      path([right[0], ...left], false);
      context.strokeStyle = "rgba(255, 249, 231, 0.68)";
      context.lineWidth = 0.66;
      context.stroke();

      if (options.decorate) {
        path(outline);
        context.clip();
        options.decorate(context, point, { index: paper.index, front });
        context.restore();
        return;
      }

      context.strokeStyle = rgba(materials.ink, front ? .39 : .09);
      context.lineWidth = 0.66;
      path([point(0.11, 0.16), point(0.89, 0.16)], false);
      context.stroke();
      context.fillStyle = rgba(materials.ink, front ? .53 : .08);
      path([point(0.12, 0.105), point(0.42, 0.105), point(0.42, 0.122), point(0.12, 0.122)]);
      context.fill();
      context.fillStyle = rgba(materials.stamp, front ? .32 : .08);
      path([point(0.75, 0.086), point(0.88, 0.086), point(0.88, 0.134), point(0.75, 0.134)]);
      context.fill();

      const rowEnd = 0.26 + paper.rows * 0.048;
      context.strokeStyle = rgba(materials.ink, front ? .26 : .07);
      for (let row = 0; row <= paper.rows; row += 1) {
        const v = 0.26 + row * 0.048;
        path([point(0.12, v), point(0.88, v)], false);
        context.stroke();
        if (row === paper.rows) break;
        context.fillStyle = rgba(materials.ink, front ? .31 : .06);
        const end = 0.28 + ((row * 13 + paper.index * 7) % 17) / 100;
        path([point(0.145, v + 0.019), point(end, v + 0.019), point(end, v + 0.027), point(0.145, v + 0.027)]);
        context.fill();
      }
      const columnLines = [0.12, 0.48, 0.62, 0.76, 0.88];
      for (const u of columnLines) {
        path(Array.from({ length: 7 }, (_, index) => point(u, mix(0.26, rowEnd, index / 6))), false);
        context.stroke();
      }
      path([point(0.12, 0.87), point(0.35, 0.87)], false);
      context.stroke();
      context.restore();
    }

    function draw(now) {
      const elapsed = Math.max(0, now - startedAt) / 1000;
      const motion = reducedMotion.matches ? 0 : now / 1000;
      const scale = Math.min(canvas.width / width, canvas.height / height);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.setTransform(scale, 0, 0, scale, (canvas.width - width * scale) / 2, (canvas.height - height * scale) / 2);

      poses = papers.map((paper, index) => {
        const target = pose(paper, beat, motion);
        if (!source || reducedMotion.matches) return target;
        const fraction = clamp((elapsed - paper.delay) / duration, 0, 1);
        const step = ease(fraction);
        const blended = target.map((value, field) => mix(source[index][field], value, step));
        const arc = Math.sin(Math.PI * step);
        blended[1] -= arc * (37 + paper.index % 5 * 13);
        blended[2] += arc * 76;
        blended[3] += arc * (paper.index % 3 ? -0.55 : 0.79);
        blended[5] += arc * (paper.index % 2 ? 0.49 : -0.59);
        blended[6] += arc * 15;
        return blended;
      });

      if (beat === 2) {
        const opacity = reducedMotion.matches ? 1 : ease(clamp((elapsed - 0.45) / 0.7, 0, 1));
        context.save();
        context.translate(660, 591);
        context.scale(1, 0.25);
        const shadow = context.createRadialGradient(0, 0, 5, 0, 0, 182);
        shadow.addColorStop(0, rgba(materials.shadow, 0.44 * opacity));
        shadow.addColorStop(1, rgba(materials.shadow, 0));
        context.fillStyle = shadow;
        context.fillRect(-185, -185, 370, 370);
        context.restore();
      }

      const order = papers.map((_, index) => index).sort((first, second) => poses[first][2] - poses[second][2]);
      for (const index of order) drawPaper(papers[index], poses[index], motion);
    }

    function tick(now) {
      frameId = 0;
      if (!active) return;
      draw(now);
      if (!reducedMotion.matches) frameId = requestAnimationFrame(tick);
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      const bitmapWidth = Math.round((rect.width || width) * dpr);
      const bitmapHeight = Math.round((rect.height || height) * dpr);
      if (bitmapWidth !== canvas.width || bitmapHeight !== canvas.height) {
        canvas.width = bitmapWidth;
        canvas.height = bitmapHeight;
      }
      if (active) draw(performance.now());
    }

    function set(nextBeat) {
      const target = clamp(Math.round(nextBeat) || 0, 0, 2);
      if (!active || beat !== target) {
        source = active ? poses : null;
        beat = target;
        startedAt = performance.now();
        if (!active && target === 0 && !reducedMotion.matches) {
          source = papers.map((paper) => {
            const origin = pose(paper, 0, startedAt / 1000);
            origin[0] -= 85 + paper.index * 7;
            origin[1] -= 65;
            origin[2] -= 210 - paper.index * 9;
            origin[3] -= 0.5;
            origin[5] -= 0.37;
            origin[7] *= 0.11;
            return origin;
          });
        }
      }
      active = true;
      if (!frameId) frameId = requestAnimationFrame(tick);
    }

    function sleep() {
      active = false;
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      poses = null;
      source = null;
    }

    resize();
    return { set, resize, sleep };
  };
}());
