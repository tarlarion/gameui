(function () {
  const PROGRESS_SCREEN_OPEN = "gameui:progressopen";
  const TILE_FACE_MIN = 88;
  /** Iso step width as a multiple of tile face — keeps ~12% air gap between blocks */
  const TILE_STEP_MULTIPLIER = 1.42;
  const TILE_STAGGER_MS = 85;
  const JUMP_MS = 680;
  const LAYOUT_PAD = { top: 88, bottom: 168, left: 20, right: 20 };

  function getTileExtents(tileFace) {
    return {
      left: tileFace * 0.78,
      right: tileFace * 0.78,
      top: tileFace * 1.2,
      bottom: tileFace * 1.05,
    };
  }

  function offsetSnakePositions(positions, offsetX, offsetY) {
    return positions.map((p) => ({ x: p.x + offsetX, y: p.y + offsetY }));
  }

  const SNAKE_GRID = [
    { row: 5, col: 0 },
    { row: 5, col: 1 },
    { row: 5, col: 2 },
    { row: 5, col: 3 },
    { row: 4, col: 3 },
    { row: 3, col: 3 },
    { row: 2, col: 3 },
    { row: 2, col: 4 },
    { row: 2, col: 5 },
    { row: 1, col: 5 },
    { row: 0, col: 5 },
    { row: 0, col: 4 },
    { row: 0, col: 3 },
    { row: 0, col: 2 },
  ];

  function getConfig() {
    return window.GAME_UI_CONFIG || {};
  }

  function resolveVariant(payload) {
    if (payload && typeof payload.variant === "string") return payload.variant;
    return getConfig().progress?.variant || "grove";
  }

  function resolveTargetLevel(points, goal, payloadLevel) {
    const levelFromPayload = Math.floor(Number(payloadLevel));
    if (Number.isFinite(levelFromPayload) && levelFromPayload > 0) return levelFromPayload;
    const safeGoal = Math.max(1, Number(goal) || 1);
    const ratio = Math.max(0, Math.min(1, points / safeGoal));
    return Math.max(1, Math.round(ratio * SNAKE_GRID.length));
  }

  function gridToIso(col, row, originX, originY, stepScale) {
    const tileFace = TILE_FACE_MIN * stepScale;
    const stepW = tileFace * TILE_STEP_MULTIPLIER;
    const stepH = stepW / 2;
    return {
      x: originX + (col - row) * stepW,
      y: originY + (col + row) * stepH,
    };
  }

  function getRawSnakePositions(stepScale, originX, originY) {
    return SNAKE_GRID.map(({ col, row }) => gridToIso(col, row, originX, originY, stepScale));
  }

  function computeBoardLayout(boardRect) {
    const availW = boardRect.width - LAYOUT_PAD.left - LAYOUT_PAD.right;
    const availH = boardRect.height - LAYOUT_PAD.top - LAYOUT_PAD.bottom;

    const unitPositions = getRawSnakePositions(1, 0, 0);
    const xs = unitPositions.map((p) => p.x);
    const ys = unitPositions.map((p) => p.y);
    const spanW = Math.max(...xs) - Math.min(...xs);
    const spanH = Math.max(...ys) - Math.min(...ys);

    const unitFootprint = getTileExtents(TILE_FACE_MIN);
    const footprintW = unitFootprint.left + unitFootprint.right;
    const footprintH = unitFootprint.top + unitFootprint.bottom;

    const fitScale = Math.min(
      availW / Math.max(spanW + footprintW, 1),
      availH / Math.max(spanH + footprintH, 1),
    );
    const stepScale = Math.min(Math.max(fitScale, 0.42), 1.55);

    const tileFace = TILE_FACE_MIN * stepScale;
    const extent = getTileExtents(tileFace);
    const raw = getRawSnakePositions(stepScale, 0, 0);

    const minCenterX = Math.min(...raw.map((p) => p.x));
    const maxCenterX = Math.max(...raw.map((p) => p.x));
    const minCenterY = Math.min(...raw.map((p) => p.y));
    const maxCenterY = Math.max(...raw.map((p) => p.y));

    const contentW = maxCenterX - minCenterX + extent.left + extent.right;
    const contentH = maxCenterY - minCenterY + extent.top + extent.bottom;

    const offsetX = LAYOUT_PAD.left + Math.max(0, (availW - contentW) / 2) - minCenterX + extent.left;
    const offsetY = LAYOUT_PAD.top + Math.max(0, (availH - contentH) / 2) - minCenterY + extent.top;

    return {
      stepScale,
      tileFace,
      positions: offsetSnakePositions(raw, offsetX, offsetY),
    };
  }

  function setupProgressTilesPopup(groveApi) {
    const popupNode = document.querySelector("#progress-popup-tiles");
    if (!popupNode) return null;

    const sceneNode = popupNode.querySelector("#progress-tiles-scene");
    const boardNode = popupNode.querySelector("#progress-tiles-board");
    const treellyNode = popupNode.querySelector("#progress-tiles-treelly");
    const pointsNode = popupNode.querySelector("#progress-tiles-points");
    const titleNode = popupNode.querySelector("#progress-tiles-title");
    const messageNode = popupNode.querySelector("#progress-tiles-message");
    const ctaNode = popupNode.querySelector(".progress-popup-cta");

    const progressConfig = () => getConfig().progress || {};
    const animConfig = () => getConfig().animations || {};

    let lastFocusedNode = null;
    let isOpen = false;
    let tileNodes = [];
    let tilePositions = [];
    let tileTimeouts = [];
    let jumpTimeoutId = 0;
    let pointsCountRafId = 0;
    let lastTargetLevel = 1;
    let lastTargetPoints = 0;
    let lastStepScale = 1;

    function applyTileScale(stepScale) {
      lastStepScale = stepScale;
      const scaleValue = String(stepScale);
      const tileFace = `${TILE_FACE_MIN * stepScale}px`;
      if (boardNode) {
        boardNode.style.setProperty("--tile-scale", scaleValue);
        boardNode.style.setProperty("--tile-face", tileFace);
      }
      if (sceneNode) {
        sceneNode.style.setProperty("--tile-scale", scaleValue);
        sceneNode.style.setProperty("--tile-face", tileFace);
      }
    }

    function onViewportChange() {
      if (!isOpen) return;
      buildBoard();
      applyTileStates(Math.max(1, Math.min(SNAKE_GRID.length, lastTargetLevel)));
      const cappedLevel = Math.max(1, Math.min(SNAKE_GRID.length, lastTargetLevel));
      placeTreellyAt(Math.max(0, cappedLevel - 1), sceneNode?.classList.contains("is-complete"));
    }

    function stopTileTimeouts() {
      tileTimeouts.forEach((id) => window.clearTimeout(id));
      tileTimeouts = [];
      window.clearTimeout(jumpTimeoutId);
      jumpTimeoutId = 0;
      if (pointsCountRafId) {
        window.cancelAnimationFrame(pointsCountRafId);
        pointsCountRafId = 0;
      }
      pointsNode?.classList.remove("is-counting");
    }

    function setPointsDisplay(value) {
      if (!pointsNode) return;
      const rounded = Math.round(value);
      pointsNode.textContent = String(rounded);
      pointsNode.dataset.displayValue = String(rounded);
    }

    function animatePointsCount(targetPoints) {
      if (!pointsNode) return;
      const durationMs = Math.max(0, Number(animConfig().progressCountMs) || 1200);
      const from = Number(pointsNode.dataset.displayValue || 0);
      const to = Math.round(targetPoints);
      if (from === to || durationMs <= 0) {
        setPointsDisplay(to);
        return;
      }

      const start = performance.now();
      pointsNode.classList.add("is-counting");

      function frame(now) {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - (1 - t) ** 3;
        setPointsDisplay(from + (to - from) * eased);
        if (t < 1) {
          pointsCountRafId = window.requestAnimationFrame(frame);
          return;
        }
        setPointsDisplay(to);
        pointsNode?.classList.remove("is-counting");
        pointsCountRafId = 0;
      }

      pointsCountRafId = window.requestAnimationFrame(frame);
    }

    function buildBoard() {
      if (!boardNode || !sceneNode) return;
      boardNode.innerHTML = "";
      tileNodes = [];
      tilePositions = [];

      const boardRect = boardNode.getBoundingClientRect();
      const layout = computeBoardLayout(boardRect);
      applyTileScale(layout.stepScale);
      tilePositions = layout.positions;

      SNAKE_GRID.forEach((cell, index) => {
        const level = index + 1;
        const pos = layout.positions[index];

        const tileNode = document.createElement("div");
        tileNode.className = "progress-tiles-tile";
        tileNode.style.left = `${pos.x}px`;
        tileNode.style.top = `${pos.y}px`;
        tileNode.dataset.level = String(level);
        tileNode.innerHTML = `
          <span class="progress-tiles-tile-shadow" aria-hidden="true"></span>
          <span class="progress-tiles-tile-top" aria-hidden="true"></span>
          <span class="progress-tiles-tile-cap" aria-hidden="true"></span>
          <span class="progress-tiles-tile-lock" aria-hidden="true">🔒</span>
          <span class="progress-tiles-tile-label">${level}</span>
        `;
        boardNode.appendChild(tileNode);
        tileNodes.push(tileNode);
      });
    }

    function setBgTreesProgress(_ratio) {
      /* sky scene — no background trees */
    }

    function applyTileStates(targetLevel) {
      tileNodes.forEach((tileNode, index) => {
        const level = index + 1;
        tileNode.classList.remove("is-arrived", "is-reached", "is-current", "is-from", "is-to", "is-locked");
        if (level > targetLevel) tileNode.classList.add("is-locked");
        if (level < targetLevel) tileNode.classList.add("is-reached");
        if (level === targetLevel) tileNode.classList.add("is-current");
        if (level === targetLevel - 1) tileNode.classList.add("is-from");
        if (level === targetLevel) tileNode.classList.add("is-to");
      });
    }

    function resetTilesForEntrance() {
      tileNodes.forEach((tileNode) => {
        tileNode.classList.remove("is-arrived", "is-reached", "is-current", "is-from", "is-to", "is-jump-target");
        tileNode.classList.add("is-entering");
      });
      if (treellyNode) {
        treellyNode.hidden = true;
        treellyNode.classList.remove("is-jumping");
      }
      sceneNode?.classList.remove("is-complete");
    }

    function animateTilesEntrance(onComplete) {
      resetTilesForEntrance();
      let completed = 0;
      const total = tileNodes.length;

      tileNodes.forEach((tileNode, index) => {
        const delay = index * TILE_STAGGER_MS;
        const timeoutId = window.setTimeout(() => {
          tileNode.classList.remove("is-entering");
          tileNode.classList.add("is-arrived");
          completed += 1;
          if (completed === total && typeof onComplete === "function") onComplete();
        }, delay);
        tileTimeouts.push(timeoutId);
      });
    }

    function placeTreellyAt(index, visible) {
      if (!treellyNode || !tilePositions[index]) return;
      const pos = tilePositions[index];
      const lift = TILE_FACE_MIN * lastStepScale * 0.77;
      treellyNode.style.left = `${pos.x}px`;
      treellyNode.style.top = `${pos.y - lift}px`;
      treellyNode.hidden = !visible;
    }

    function animateTreellyJump(fromIndex, toIndex) {
      if (!treellyNode || fromIndex < 0 || toIndex < 0 || !tilePositions[fromIndex] || !tilePositions[toIndex]) {
        sceneNode?.classList.add("is-complete");
        return;
      }

      const from = tilePositions[fromIndex];
      const to = tilePositions[toIndex];
      const lift = TILE_FACE_MIN * lastStepScale * 0.77;
      const jumpLift = TILE_FACE_MIN * lastStepScale * 0.64;
      treellyNode.hidden = false;
      treellyNode.classList.remove("is-jumping");
      treellyNode.style.left = `${from.x}px`;
      treellyNode.style.top = `${from.y - lift}px`;
      void treellyNode.offsetWidth;

      treellyNode.style.setProperty("--jump-dx", `${to.x - from.x}px`);
      treellyNode.style.setProperty("--jump-dy", `${to.y - from.y}px`);
      treellyNode.style.setProperty("--jump-lift", `${jumpLift}px`);
      treellyNode.classList.add("is-jumping");

      jumpTimeoutId = window.setTimeout(() => {
        treellyNode.classList.remove("is-jumping");
        treellyNode.style.left = `${to.x}px`;
        treellyNode.style.top = `${to.y - lift}px`;
        sceneNode?.classList.add("is-complete");
      }, JUMP_MS);
    }

    function startSceneAnimation(targetLevel, points, goal) {
      stopTileTimeouts();
      buildBoard();
      setBgTreesProgress(0);
      sceneNode?.classList.remove("is-building", "is-complete");
      void sceneNode?.offsetWidth;
      sceneNode?.classList.add("is-building");

      const cappedLevel = Math.max(1, Math.min(SNAKE_GRID.length, targetLevel));
      const ratio = Math.max(0, Math.min(1, points / Math.max(1, goal)));

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setBgTreesProgress(ratio);
        });
        animateTilesEntrance(() => {
          applyTileStates(cappedLevel);
          const fromIndex = Math.max(0, cappedLevel - 2);
          const toIndex = Math.max(0, cappedLevel - 1);
          if (fromIndex === toIndex) {
            placeTreellyAt(toIndex, true);
            sceneNode?.classList.add("is-complete");
            return;
          }
          placeTreellyAt(fromIndex, true);
          window.setTimeout(() => animateTreellyJump(fromIndex, toIndex), 180);
        });
      });
    }

    function applyContent(payload, options) {
      const opts = options && typeof options === "object" ? options : {};
      const data = payload && typeof payload === "object" ? payload : {};
      const cfg = progressConfig();
      const points = Number.isFinite(Number(data.points)) ? Number(data.points) : Number(cfg.points) || 0;
      const goal = Number.isFinite(Number(data.goal)) && Number(data.goal) > 0 ? Number(data.goal) : Math.max(1, Number(cfg.goal) || 100);
      const targetLevel = resolveTargetLevel(points, goal, data.level);

      lastTargetLevel = targetLevel;
      lastTargetPoints = points;

      if (titleNode) titleNode.textContent = typeof data.title === "string" ? data.title : cfg.title || "";
      if (messageNode) messageNode.textContent = typeof data.message === "string" ? data.message : cfg.message || "";
      if (ctaNode) ctaNode.textContent = typeof data.ctaLabel === "string" ? data.ctaLabel : cfg.ctaLabel || "Продолжить";

      if (opts.animate === true) {
        setPointsDisplay(0);
        startSceneAnimation(targetLevel, points, goal);
        animatePointsCount(points);
        return;
      }

      stopTileTimeouts();
      buildBoard();
      setBgTreesProgress(Math.max(0, Math.min(1, points / goal)));
      applyTileStates(Math.max(1, Math.min(SNAKE_GRID.length, targetLevel)));
      tileNodes.forEach((node) => node.classList.add("is-arrived"));
      placeTreellyAt(Math.max(0, Math.min(SNAKE_GRID.length, targetLevel) - 1), true);
      setPointsDisplay(points);
      sceneNode?.classList.add("is-complete");
    }

    function open(payload) {
      applyContent(payload, { animate: false });
      if (isOpen) {
        startSceneAnimation(lastTargetLevel, lastTargetPoints, progressConfig().goal || 100);
        animatePointsCount(lastTargetPoints);
        return;
      }

      popupNode.classList.remove("is-closing");
      popupNode.hidden = false;
      popupNode.setAttribute("aria-hidden", "false");
      lastFocusedNode = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      document.body.classList.add("progress-popup-open");
      isOpen = true;
      document.dispatchEvent(new CustomEvent("gameui:progressopen"));

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          startSceneAnimation(lastTargetLevel, lastTargetPoints, progressConfig().goal || 100);
          animatePointsCount(lastTargetPoints);
          if (ctaNode) ctaNode.focus();
        });
      });
    }

    function close() {
      if (!isOpen) return;
      stopTileTimeouts();
      popupNode.classList.add("is-closing");
      const onAnimationEnd = (event) => {
        if (event.target !== popupNode) return;
        popupNode.removeEventListener("animationend", onAnimationEnd);
        popupNode.hidden = true;
        popupNode.classList.remove("is-closing");
        popupNode.setAttribute("aria-hidden", "true");
        document.body.classList.remove("progress-popup-open");
        if (lastFocusedNode && typeof lastFocusedNode.focus === "function") lastFocusedNode.focus();
        isOpen = false;
        document.dispatchEvent(new CustomEvent("gameui:progressclose"));
      };
      popupNode.addEventListener("animationend", onAnimationEnd);
    }

    function toggle(payload) {
      if (isOpen) close();
      else open(payload);
    }

    popupNode.querySelectorAll("[data-progress-action='close']").forEach((node) => {
      node.addEventListener("click", () => close());
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        close();
      }
    });

    window.addEventListener("resize", onViewportChange);

    return { open, close, toggle, applyContent };
  }

  function shouldOpenProgressScreen() {
    const cfg = getConfig().progress || {};
    return cfg.autoOpen === true || cfg.screen === PROGRESS_SCREEN_OPEN;
  }

  function initProgressTilesRouter() {
    const groveApi = {
      open: window.GameUI?.showProgress,
      close: window.GameUI?.hideProgress,
      toggle: window.GameUI?.toggleProgress,
    };

    const tilesApi = setupProgressTilesPopup(groveApi);
    if (!tilesApi) return;

    function pickApi(payload) {
      return resolveVariant(payload) === "tiles" ? tilesApi : groveApi;
    }

    window.GameUI = window.GameUI || {};
    window.GameUI.SCREEN_PROGRESS_OPEN = PROGRESS_SCREEN_OPEN;
    window.GameUI.showProgress = (payload) => pickApi(payload).open(payload);
    window.GameUI.hideProgress = (payload) => pickApi(payload).close(payload);
    window.GameUI.toggleProgress = (payload) => pickApi(payload).toggle(payload);
    window.GameUI.showProgressTiles = tilesApi.open;
    window.GameUI.hideProgressTiles = tilesApi.close;

    const cfg = getConfig().progress || {};
    if (cfg.openOnTimerFinish && cfg.variant === "tiles") {
      document.addEventListener("gameui:timerfinish", () => tilesApi.open());
    }

    if (cfg.endpoint && cfg.variant === "tiles") {
      const timeoutMs = Math.max(1, Number(getConfig().counter?.requestTimeoutMs) || 3000);
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
      fetch(cfg.endpoint, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null)
        .finally(() => window.clearTimeout(timeoutId))
        .then((payload) => {
          if (!payload || typeof payload !== "object") return;
          tilesApi.applyContent(payload);
          if (payload.autoOpen === true || payload.screen === PROGRESS_SCREEN_OPEN || shouldOpenProgressScreen()) {
            tilesApi.open(payload);
          }
        });
    } else if (shouldOpenProgressScreen() && cfg.variant === "tiles") {
      tilesApi.open();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProgressTilesRouter);
  } else {
    initProgressTilesRouter();
  }
})();
