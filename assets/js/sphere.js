/*  Fibonacci lattice on S² with its k-NN graph.
    One node at a time is highlighted with its neighborhood — the sparse
    attention window a token on the sphere actually sees. Drag to rotate.   */
(function () {
  "use strict";
  var canvas = document.getElementById("sphere");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");

  var N = 420, K = 6;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Lattice
  var golden = Math.PI * (3 - Math.sqrt(5));
  var P = new Float32Array(N * 3);
  for (var i = 0; i < N; i++) {
    var y = 1 - (2 * (i + 0.5)) / N;
    var r = Math.sqrt(1 - y * y);
    var t = golden * i;
    P[3 * i] = Math.cos(t) * r;
    P[3 * i + 1] = y;
    P[3 * i + 2] = Math.sin(t) * r;
  }

  // k-NN (brute force; N is small)
  var nbrs = new Array(N);
  var edgeSet = {};
  var edges = [];
  for (var a = 0; a < N; a++) {
    var d = [];
    for (var b = 0; b < N; b++) {
      if (a === b) continue;
      var dx = P[3 * a] - P[3 * b], dy = P[3 * a + 1] - P[3 * b + 1], dz = P[3 * a + 2] - P[3 * b + 2];
      d.push([dx * dx + dy * dy + dz * dz, b]);
    }
    d.sort(function (u, v) { return u[0] - v[0]; });
    nbrs[a] = [];
    for (var k = 0; k < K; k++) {
      var j = d[k][1];
      nbrs[a].push(j);
      var key = a < j ? a + "-" + j : j + "-" + a;
      if (!edgeSet[key]) { edgeSet[key] = 1; edges.push(a < j ? [a, j] : [j, a]); }
    }
  }

  // Colors from CSS tokens
  var col = {};
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    col.ink = cs.getPropertyValue("--text").trim() || "#1a1c21";
    col.accent = cs.getPropertyValue("--accent").trim() || "#1b5c91";
    col.mark = cs.getPropertyValue("--mark").trim() || "#c4511a";
  }
  readColors();
  document.addEventListener("themechange", function () { setTimeout(function () { readColors(); draw(); }, 0); });

  // Sizing
  var W = 0, H = 0, dpr = 1;
  function resize() {
    var rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  // Rotation state
  var yaw = 0.6, pitch = -0.38, vyaw = reduce ? 0 : 0.0032;
  var focus = 57, focusTimer = 0;
  var Q = new Float32Array(N * 3);

  function project() {
    var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    for (var i = 0; i < N; i++) {
      var x = P[3 * i], y = P[3 * i + 1], z = P[3 * i + 2];
      var x1 = cy * x + sy * z, z1 = -sy * x + cy * z;
      var y2 = cp * y - sp * z1, z2 = sp * y + cp * z1;
      Q[3 * i] = x1; Q[3 * i + 1] = y2; Q[3 * i + 2] = z2;
    }
  }

  function rgba(c, a) {
    ctx.globalAlpha = a;
    ctx.strokeStyle = c;
    ctx.fillStyle = c;
  }

  function draw() {
    if (!W) return;
    project();
    var R = Math.min(W, H) * 0.43, cx = W / 2, cyy = H / 2;
    ctx.clearRect(0, 0, W, H);

    // Outline
    rgba(col.ink, 0.12);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cyy, R, 0, Math.PI * 2); ctx.stroke();

    // Edges
    ctx.lineWidth = 0.8;
    for (var e = 0; e < edges.length; e++) {
      var a = edges[e][0], b = edges[e][1];
      var z = (Q[3 * a + 2] + Q[3 * b + 2]) / 2;
      var alpha = z > 0 ? 0.08 + 0.32 * z : 0.05 + 0.04 * (1 + z);
      rgba(col.ink, alpha);
      ctx.beginPath();
      ctx.moveTo(cx + R * Q[3 * a], cyy - R * Q[3 * a + 1]);
      ctx.lineTo(cx + R * Q[3 * b], cyy - R * Q[3 * b + 1]);
      ctx.stroke();
    }

    // Points
    for (var i = 0; i < N; i++) {
      var zi = Q[3 * i + 2];
      var front = zi > 0;
      rgba(col.accent, front ? 0.35 + 0.6 * zi : 0.12 + 0.1 * (1 + zi));
      ctx.beginPath();
      ctx.arc(cx + R * Q[3 * i], cyy - R * Q[3 * i + 1], front ? 1.4 + 1.4 * zi : 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Highlighted neighborhood
    var f = focus, fx = cx + R * Q[3 * f], fy = cyy - R * Q[3 * f + 1];
    ctx.lineWidth = 1.6;
    for (var n = 0; n < nbrs[f].length; n++) {
      var j = nbrs[f][n];
      var jx = cx + R * Q[3 * j], jy = cyy - R * Q[3 * j + 1];
      rgba(col.mark, 0.85);
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(jx, jy); ctx.stroke();
      ctx.beginPath(); ctx.arc(jx, jy, 2.8, 0, Math.PI * 2); ctx.fill();
    }
    rgba(col.mark, 0.18);
    ctx.beginPath(); ctx.arc(fx, fy, 9, 0, Math.PI * 2); ctx.fill();
    rgba(col.mark, 1);
    ctx.beginPath(); ctx.arc(fx, fy, 4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function pickFrontFocus() {
    // choose a node facing the viewer, away from the rim
    project();
    var best = -1, tries = 0;
    while (tries++ < 60) {
      var c = (Math.random() * N) | 0;
      if (Q[3 * c + 2] > 0.55) { best = c; break; }
    }
    if (best >= 0) focus = best;
  }

  // Animation loop
  var visible = true, dragging = false, last = 0, raf = 0;
  function frame(ts) {
    raf = 0;
    if (!visible) return;
    var dt = last ? Math.min(ts - last, 50) : 16;
    last = ts;
    if (!dragging) {
      yaw += vyaw * (dt / 16);
      if (!reduce) {
        focusTimer += dt;
        if (focusTimer > 2600) { focusTimer = 0; pickFrontFocus(); }
        if (Q[3 * focus + 2] < 0.05) pickFrontFocus();
      }
    }
    draw();
    if (!reduce || dragging) raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }

  // Drag
  var px = 0, py = 0;
  canvas.addEventListener("pointerdown", function (e) {
    dragging = true; px = e.clientX; py = e.clientY;
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    start();
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    yaw += (e.clientX - px) * 0.008;
    pitch = Math.max(-1.3, Math.min(1.3, pitch + (e.clientY - py) * 0.008));
    px = e.clientX; py = e.clientY;
    if (reduce) draw();
  });
  function endDrag() { dragging = false; if (reduce) draw(); }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (ents) {
      visible = ents[0].isIntersecting;
      if (visible) start();
    }).observe(canvas);
  }
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);

  resize();
  pickFrontFocus();
  draw();
  start();
})();
