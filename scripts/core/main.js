(function () {
  const config = {
    links: {
      topbar: {
        farm: "",
        settings: "",
      },
      gamebar: {},
    },
    counter: {
      durationSeconds: 10,
      endpoint: "",
      requestTimeoutMs: 3000,
      tickMs: 50,
    },
    gamebar: {
      countersEndpoint: "",
      counters: {},
    },
    streak: {
      days: 0,
      endpoint: "",
    },
    progress: {
      screen: "",
      points: 0,
      goal: 100,
      title: "Поздравляем!",
      message: "Отличная тренировка!",
      ctaLabel: "Продолжить",
      endpoint: "",
      autoOpen: false,
      openOnTimerFinish: false,
    },
    animations: {
      farmDurationMs: 620,
      settingsDurationMs: 820,
      tickFadeMs: 520,
      tickStrokeMs: 220,
      finishFillMs: 1150,
      finishBubbleRevealMs: 1100,
      finishBubbleRevealDelayMs: 900,
      finishBlurInMs: 650,
      finishBlurInDelayMs: 1150,
      finishPulseMs: 2600,
      finishPulseDelayMs: 1800,
      finishArcStrokeWidthPx: 3,
      progressOpenMs: 320,
      progressCloseMs: 220,
      progressRingFillMs: 1200,
      progressCountMs: 1200,
    },
    ...(window.GAME_UI_CONFIG || {}),
    links: {
      ...{
        topbar: {
          farm: "",
          settings: "",
        },
        gamebar: {},
      },
      ...(window.GAME_UI_CONFIG?.links || {}),
      topbar: {
        farm: "",
        settings: "",
        ...(window.GAME_UI_CONFIG?.links?.topbar || {}),
      },
      gamebar: {
        ...(window.GAME_UI_CONFIG?.links?.gamebar || {}),
      },
    },
    counter: {
      durationSeconds: 10,
      endpoint: "",
      requestTimeoutMs: 3000,
      tickMs: 50,
      ...(window.GAME_UI_CONFIG?.counter || {}),
    },
    gamebar: {
      countersEndpoint: "",
      counters: {},
      ...(window.GAME_UI_CONFIG?.gamebar || {}),
      counters: {
        ...(window.GAME_UI_CONFIG?.gamebar?.counters || {}),
      },
    },
    streak: {
      days: 0,
      endpoint: "",
      ...(window.GAME_UI_CONFIG?.streak || {}),
    },
    progress: {
      screen: "",
      points: 0,
      goal: 100,
      title: "Поздравляем!",
      message: "Отличная тренировка!",
      ctaLabel: "Продолжить",
      endpoint: "",
      autoOpen: false,
      openOnTimerFinish: false,
      ...(window.GAME_UI_CONFIG?.progress || {}),
    },
    animations: {
      farmDurationMs: 620,
      settingsDurationMs: 820,
      tickFadeMs: 520,
      tickStrokeMs: 220,
      finishFillMs: 1150,
      finishBubbleRevealMs: 1100,
      finishBubbleRevealDelayMs: 900,
      finishBlurInMs: 650,
      finishBlurInDelayMs: 1150,
      finishPulseMs: 2600,
      finishPulseDelayMs: 1800,
      finishArcStrokeWidthPx: 3,
      progressOpenMs: 320,
      progressCloseMs: 220,
      progressRingFillMs: 1200,
      progressCountMs: 1200,
      ...(window.GAME_UI_CONFIG?.animations || {}),
    },
  };

  function durationMs(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? `${Math.round(n)}ms` : fallback;
  }

  function applyAnimationConfig() {
    const root = document.documentElement;
    root.style.setProperty("--anim-farm-duration", durationMs(config.animations.farmDurationMs, "620ms"));
    root.style.setProperty("--anim-settings-duration", durationMs(config.animations.settingsDurationMs, "820ms"));
    root.style.setProperty("--anim-tick-fade", durationMs(config.animations.tickFadeMs, "520ms"));
    root.style.setProperty("--anim-tick-stroke", durationMs(config.animations.tickStrokeMs, "220ms"));
    root.style.setProperty("--anim-finish-fill", durationMs(config.animations.finishFillMs, "1150ms"));
    root.style.setProperty("--anim-finish-bubble-reveal", durationMs(config.animations.finishBubbleRevealMs, "1100ms"));
    root.style.setProperty(
      "--anim-finish-bubble-reveal-delay",
      durationMs(config.animations.finishBubbleRevealDelayMs, "900ms"),
    );
    root.style.setProperty("--anim-finish-blur-in", durationMs(config.animations.finishBlurInMs, "650ms"));
    root.style.setProperty("--anim-finish-blur-in-delay", durationMs(config.animations.finishBlurInDelayMs, "1150ms"));
    root.style.setProperty("--anim-finish-pulse", durationMs(config.animations.finishPulseMs, "2600ms"));
    root.style.setProperty("--anim-finish-pulse-delay", durationMs(config.animations.finishPulseDelayMs, "1800ms"));
    root.style.setProperty(
      "--anim-finish-arc-stroke-width",
      `${Math.max(1, Number(config.animations.finishArcStrokeWidthPx) || 3)}px`,
    );
    root.style.setProperty("--anim-progress-open", durationMs(config.animations.progressOpenMs, "320ms"));
    root.style.setProperty("--anim-progress-close", durationMs(config.animations.progressCloseMs, "220ms"));
    root.style.setProperty("--anim-progress-ring-fill", durationMs(config.animations.progressRingFillMs, "1200ms"));
    root.style.setProperty("--anim-progress-count", durationMs(config.animations.progressCountMs, "1200ms"));
  }

  function navigateTo(url) {
    if (typeof url === "string" && url.trim()) {
      window.location.assign(url);
    }
  }

  function setupTopbarButton(selector, jumpClass) {
    const button = document.querySelector(selector);
    if (!button) return;
    const linkKey = button.dataset.linkKey;

    button.addEventListener("click", () => {
      button.classList.remove(jumpClass);
      void button.offsetWidth;
      button.classList.add(jumpClass);
      navigateTo(config.links.topbar[linkKey] || "");
    });

    button.addEventListener("animationend", () => {
      button.classList.remove(jumpClass);
    });
  }

  function toActiveIconSrc(src) {
    return src.replace(/(\.[a-z0-9]+)$/i, "-active$1");
  }

  function toDefaultIconSrc(src) {
    return src.replace(/-active(\.[a-z0-9]+)$/i, "$1");
  }

  function applyGamebarCounters(items, countersMap) {
    items.forEach((item) => {
      const counterNode = item.querySelector(".bottom-bar-item-counter");
      const key = item.dataset.gamebarKey;
      if (!counterNode || !key) return;
      if (Object.prototype.hasOwnProperty.call(countersMap, key)) {
        counterNode.textContent = String(countersMap[key]);
      }
    });
  }

  async function fetchJsonWithTimeout(url, timeoutMs) {
    if (!url) return null;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), Math.max(1, timeoutMs));
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) return null;
      return await response.json();
    } catch (_error) {
      return null;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function setupGamebar() {
    const gamebarItems = Array.from(document.querySelectorAll(".bottom-bar-item"));
    if (gamebarItems.length === 0) return;

    function syncGamebarIcons() {
      gamebarItems.forEach((item) => {
        const icon = item.querySelector(".bottom-bar-item-icon");
        if (!icon) return;
        const defaultSrc = toDefaultIconSrc(icon.getAttribute("src") || "");
        icon.setAttribute("src", item.classList.contains("is-active") ? toActiveIconSrc(defaultSrc) : defaultSrc);
      });
    }

    function activateGamebarItem(targetItem) {
      gamebarItems.forEach((item) => {
        item.classList.toggle("is-active", item === targetItem);
      });
      syncGamebarIcons();
      navigateTo(config.links.gamebar[targetItem.dataset.gamebarKey] || "");
    }

    gamebarItems.forEach((item) => {
      item.classList.remove("is-active");
    });

    applyGamebarCounters(gamebarItems, config.gamebar.counters);
    const remoteCounters = await fetchJsonWithTimeout(config.gamebar.countersEndpoint, config.counter.requestTimeoutMs);
    if (remoteCounters && typeof remoteCounters === "object") {
      applyGamebarCounters(gamebarItems, remoteCounters);
    }

    gamebarItems.forEach((item) => {
      item.addEventListener("click", () => activateGamebarItem(item));
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activateGamebarItem(item);
        }
      });
    });

    syncGamebarIcons();
  }

  async function setupStreak() {
    const streakNode = document.querySelector(".user-streak");
    const streakDots = Array.from(document.querySelectorAll(".user-streak-dot"));
    const streakCaptionNode = document.querySelector("#user-streak-caption");
    if (!streakNode || streakDots.length === 0) return;

    let streakDays = Math.max(0, Math.floor(Number(config.streak.days) || 0));
    const remoteStreak = await fetchJsonWithTimeout(config.streak.endpoint, config.counter.requestTimeoutMs);
    if (remoteStreak && typeof remoteStreak === "object") {
      const remoteDays = Number(remoteStreak.days);
      if (Number.isFinite(remoteDays) && remoteDays >= 0) {
        streakDays = Math.floor(remoteDays);
      }
    }

    const activeDots = Math.min(7, streakDays);
    streakDots.forEach((dotNode, index) => {
      dotNode.classList.toggle("is-active", index < activeDots);
    });
    if (streakCaptionNode) {
      streakCaptionNode.textContent = `Weekly streek ${activeDots}/7`;
    }
    streakNode.setAttribute("aria-label", `Weekly training streak: ${activeDots}/7`);
  }

  function resolveDurationFromDom(speedometerNode) {
    const domDuration = Number.parseFloat(speedometerNode?.dataset.duration || "");
    if (Number.isFinite(domDuration) && domDuration > 0) {
      return Math.max(1, Math.round(domDuration));
    }
    return Math.max(1, Math.round(Number(config.counter.durationSeconds) || 10));
  }

  function buildSpeedometerFinishRing(speedometerSvg) {
    const finishDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const finishGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    finishGradient.setAttribute("id", "speedometer-finish-gradient");
    finishGradient.setAttribute("x1", "50%");
    finishGradient.setAttribute("y1", "0%");
    finishGradient.setAttribute("x2", "50%");
    finishGradient.setAttribute("y2", "100%");

    const stopTop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stopTop.setAttribute("offset", "0%");
    stopTop.setAttribute("stop-color", "#e7ffe8");
    const stopMiddle = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stopMiddle.setAttribute("offset", "52%");
    stopMiddle.setAttribute("stop-color", "#bdf0be");
    const stopBottom = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stopBottom.setAttribute("offset", "100%");
    stopBottom.setAttribute("stop-color", "#7ccf7e");
    finishGradient.appendChild(stopTop);
    finishGradient.appendChild(stopMiddle);
    finishGradient.appendChild(stopBottom);

    const bubbleGradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
    bubbleGradient.setAttribute("id", "speedometer-bubble-gradient");
    bubbleGradient.setAttribute("cx", "50%");
    bubbleGradient.setAttribute("cy", "42%");
    bubbleGradient.setAttribute("r", "62%");

    const bubbleCore = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    bubbleCore.setAttribute("offset", "0%");
    bubbleCore.setAttribute("stop-color", "#f2fff3");
    bubbleCore.setAttribute("stop-opacity", "0.34");
    const bubbleMid = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    bubbleMid.setAttribute("offset", "58%");
    bubbleMid.setAttribute("stop-color", "#bdf0be");
    bubbleMid.setAttribute("stop-opacity", "0.18");
    const bubbleEdge = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    bubbleEdge.setAttribute("offset", "100%");
    bubbleEdge.setAttribute("stop-color", "#6abf78");
    bubbleEdge.setAttribute("stop-opacity", "0.06");
    bubbleGradient.appendChild(bubbleCore);
    bubbleGradient.appendChild(bubbleMid);
    bubbleGradient.appendChild(bubbleEdge);

    finishDefs.appendChild(finishGradient);
    finishDefs.appendChild(bubbleGradient);
    speedometerSvg.appendChild(finishDefs);

    const finishArc = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    finishArc.setAttribute("cx", "50");
    finishArc.setAttribute("cy", "50");
    finishArc.setAttribute("r", "43.5");
    finishArc.setAttribute("class", "speedometer-finish-arc");
    speedometerSvg.appendChild(finishArc);
  }

  async function setupSpeedometer() {
    const speedometerSvg = document.querySelector(".speedometer-svg");
    const ticksLayer = document.querySelector(".speedometer-ticks");
    const valueNode = document.querySelector("#speedometer-value");
    if (!speedometerSvg || !ticksLayer || !valueNode) return;

    const speedometerNode = document.querySelector(".speedometer");
    const totalTicks = 60;
    let totalDurationSeconds = resolveDurationFromDom(speedometerNode);

    const counterPayload = await fetchJsonWithTimeout(config.counter.endpoint, config.counter.requestTimeoutMs);
    if (counterPayload && typeof counterPayload === "object") {
      const remoteDuration = Number(counterPayload.durationSeconds);
      if (Number.isFinite(remoteDuration) && remoteDuration > 0) {
        totalDurationSeconds = Math.round(remoteDuration);
      }
    }

    const totalDurationMs = totalDurationSeconds * 1000;
    const radiusOuter = 47;
    const radiusInner = 40;
    const tickNodes = [];

    function polarToCartesian(radius, angleDeg) {
      const rad = (angleDeg - 90) * (Math.PI / 180);
      return {
        x: 50 + radius * Math.cos(rad),
        y: 50 + radius * Math.sin(rad),
      };
    }

    for (let i = 0; i < totalTicks; i += 1) {
      const angle = (360 / totalTicks) * i;
      const inner = polarToCartesian(radiusInner, angle);
      const outer = polarToCartesian(radiusOuter, angle);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", inner.x.toFixed(2));
      line.setAttribute("y1", inner.y.toFixed(2));
      line.setAttribute("x2", outer.x.toFixed(2));
      line.setAttribute("y2", outer.y.toFixed(2));
      line.setAttribute("class", "speedometer-tick");
      ticksLayer.appendChild(line);
      tickNodes.push(line);
    }

    buildSpeedometerFinishRing(speedometerSvg);

    let remainingMs = totalDurationMs;
    if (counterPayload && typeof counterPayload === "object") {
      const remoteRemaining = Number(counterPayload.remainingSeconds);
      if (Number.isFinite(remoteRemaining) && remoteRemaining >= 0) {
        remainingMs = Math.min(totalDurationMs, Math.round(remoteRemaining * 1000));
      }
    }

    let isFinished = false;

    function renderTimer() {
      if (speedometerNode) {
        speedometerNode.classList.toggle("is-finished", isFinished);
      }
      const activeTicks = Math.ceil((remainingMs / totalDurationMs) * totalTicks);
      for (let i = 0; i < totalTicks; i += 1) {
        tickNodes[i].classList.toggle("is-active", i < activeTicks);
      }
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      valueNode.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    renderTimer();
    const tickMs = Math.max(16, Math.round(Number(config.counter.tickMs) || 50));
    const timerId = setInterval(() => {
      if (remainingMs <= 0) {
        clearInterval(timerId);
        return;
      }

      remainingMs = Math.max(0, remainingMs - tickMs);
      if (remainingMs === 0) {
        isFinished = true;
        document.dispatchEvent(new CustomEvent("gameui:timerfinish"));
      }
      renderTimer();
    }, tickMs);
  }

  const PROGRESS_SCREEN_OPEN = "gameui:progressopen";

  function shouldOpenProgressScreen() {
    return config.progress.autoOpen === true || config.progress.screen === PROGRESS_SCREEN_OPEN;
  }

  function setupProgressPopup() {
    const popupNode = document.querySelector("#progress-popup");
    if (!popupNode) return;

    const panelNode = popupNode.querySelector(".progress-popup-panel");
    const pointsNode = popupNode.querySelector("#progress-popup-points");
    const titleNode = popupNode.querySelector("#progress-popup-title");
    const messageNode = popupNode.querySelector("#progress-popup-message");
    const ctaNode = popupNode.querySelector(".progress-popup-cta");
    const groveNode = popupNode.querySelector("#progress-popup-grove");
    const treesNode = popupNode.querySelector("#progress-popup-trees");
    const growPercentNode = popupNode.querySelector("#progress-popup-grow-percent");
    const growDurationMs = Math.max(0, Number(config.animations.progressRingFillMs) || 1200);
    const countDurationMs = Math.max(0, Number(config.animations.progressCountMs) || growDurationMs);
    const treeStaggerMs = 80;
    const treeGrowNodes = Array.from(popupNode.querySelectorAll(".progress-popup-tree-grow"));

    let lastFocusedNode = null;
    let isOpen = false;
    let lastGrowRatio = 0;
    let lastTargetPoints = 0;
    let growAnimationTimeoutId = 0;
    let treeGrowTimeoutIds = [];
    let pointsCountRafId = 0;

    function clearTreeGrowTimeouts() {
      treeGrowTimeoutIds.forEach((id) => window.clearTimeout(id));
      treeGrowTimeoutIds = [];
    }

    function stopPointsCount() {
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

    function animatePointsCount(targetPoints, durationMs) {
      if (!pointsNode) return;
      stopPointsCount();

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
        stopPointsCount();
      }

      pointsCountRafId = window.requestAnimationFrame(frame);
    }

    function treeTranslateY(growLevel) {
      const clamped = Math.max(0, Math.min(1, growLevel));
      return `${(1 - clamped) * 100}%`;
    }

    function setTreesGrowInstant(level) {
      const offset = treeTranslateY(level);
      treeGrowNodes.forEach((node) => {
        node.style.transition = "none";
        node.style.transform = `translateY(${offset})`;
      });
      if (treesNode) void treesNode.offsetWidth;
    }

    function applyGrowLevel(ratio, animate) {
      const level = Math.max(0, Math.min(1, ratio));
      const percent = Math.round(level * 100);

      if (groveNode) groveNode.setAttribute("aria-valuenow", String(percent));
      if (growPercentNode) growPercentNode.textContent = `${percent}%`;
      if (treeGrowNodes.length === 0) return;

      window.clearTimeout(growAnimationTimeoutId);
      clearTreeGrowTimeouts();
      groveNode?.classList.remove("is-growing", "is-bloom");

      if (animate) {
        setTreesGrowInstant(0);
        groveNode?.classList.add("is-growing");
        const targetOffset = treeTranslateY(level);
        const easing = "cubic-bezier(0.22, 1.02, 0.28, 1)";

        treeGrowNodes.forEach((node, index) => {
          const timeoutId = window.setTimeout(() => {
            node.style.transition = `transform ${growDurationMs}ms ${easing}`;
            node.style.transform = `translateY(${targetOffset})`;
          }, index * treeStaggerMs);
          treeGrowTimeoutIds.push(timeoutId);
        });

        const totalMs = growDurationMs + (treeGrowNodes.length - 1) * treeStaggerMs;
        growAnimationTimeoutId = window.setTimeout(() => {
          groveNode?.classList.remove("is-growing");
          if (level >= 1) groveNode?.classList.add("is-bloom");
        }, totalMs);
        return;
      }

      setTreesGrowInstant(level);
      if (level >= 1) groveNode?.classList.add("is-bloom");
    }

    function applyContent(payload, options) {
      const opts = options && typeof options === "object" ? options : {};
      const data = payload && typeof payload === "object" ? payload : {};
      const rawPoints = Number(data.points);
      const points = Number.isFinite(rawPoints) ? rawPoints : Number(config.progress.points) || 0;
      const rawGoal = Number(data.goal);
      const goal = Number.isFinite(rawGoal) && rawGoal > 0 ? rawGoal : Math.max(1, Number(config.progress.goal) || 100);
      const ratio = Math.max(0, Math.min(1, points / goal));
      const title = typeof data.title === "string" ? data.title : config.progress.title;
      const message = typeof data.message === "string" ? data.message : config.progress.message;
      const ctaLabel = typeof data.ctaLabel === "string" ? data.ctaLabel : config.progress.ctaLabel;

      lastGrowRatio = ratio;
      lastTargetPoints = points;

      if (titleNode && title) titleNode.textContent = title;
      if (messageNode && message) messageNode.textContent = message;
      if (ctaNode && ctaLabel) ctaNode.textContent = ctaLabel;

      if (opts.animate === true) {
        setPointsDisplay(0);
        applyGrowLevel(ratio, true);
        animatePointsCount(points, countDurationMs);
        return;
      }

      stopPointsCount();
      setPointsDisplay(points);
      applyGrowLevel(ratio, false);
    }

    function startGrowAndCountAnimations() {
      setPointsDisplay(0);
      setTreesGrowInstant(0);
      groveNode?.classList.remove("is-bloom");
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          applyGrowLevel(lastGrowRatio, true);
          animatePointsCount(lastTargetPoints, countDurationMs);
        });
      });
    }

    function open(payload) {
      applyContent(payload, { animate: false });
      if (isOpen) {
        startGrowAndCountAnimations();
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
        startGrowAndCountAnimations();
        if (ctaNode) ctaNode.focus();
      });
    }

    function close() {
      if (!isOpen) return;
      window.clearTimeout(growAnimationTimeoutId);
      clearTreeGrowTimeouts();
      stopPointsCount();
      groveNode?.classList.remove("is-growing", "is-bloom");
      popupNode.classList.add("is-closing");
      const onAnimationEnd = (event) => {
        if (event.target !== panelNode) return;
        panelNode.removeEventListener("animationend", onAnimationEnd);
        popupNode.hidden = true;
        popupNode.classList.remove("is-closing");
        popupNode.setAttribute("aria-hidden", "true");
        document.body.classList.remove("progress-popup-open");
        if (lastFocusedNode && typeof lastFocusedNode.focus === "function") {
          lastFocusedNode.focus();
        }
        isOpen = false;
        document.dispatchEvent(new CustomEvent("gameui:progressclose"));
      };
      if (panelNode) {
        panelNode.addEventListener("animationend", onAnimationEnd);
      } else {
        onAnimationEnd({ target: panelNode });
      }
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

    if (config.progress.openOnTimerFinish) {
      document.addEventListener("gameui:timerfinish", () => open());
    }

    window.GameUI = window.GameUI || {};
    window.GameUI.SCREEN_PROGRESS_OPEN = PROGRESS_SCREEN_OPEN;
    window.GameUI.showProgress = open;
    window.GameUI.hideProgress = close;
    window.GameUI.toggleProgress = toggle;

    if (config.progress.endpoint) {
      void fetchJsonWithTimeout(config.progress.endpoint, config.counter.requestTimeoutMs).then((payload) => {
        if (!payload || typeof payload !== "object") return;
        applyContent(payload);
        if (payload.autoOpen === true || payload.screen === PROGRESS_SCREEN_OPEN) open(payload);
      });
    }

    if (shouldOpenProgressScreen()) open();
  }

  applyAnimationConfig();
  setupTopbarButton(".top-bar-icon-farm", "is-jumping");
  setupTopbarButton(".top-bar-icon-settings", "is-jumping");
  void setupStreak();
  void setupGamebar();
  void setupSpeedometer();
  setupProgressPopup();
})();
