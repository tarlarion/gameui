(() => {
  const GAME_UI_CONFIG = {
    links: {
      topbar: {
        farm: "/farm",
        settings: "/settings",
      },
      gamebar: {
        home: "/home",
        tasks: "/tasks",
        shop: "/shop",
        guild: "/guild",
        profile: "/profile",
      },
    },
    counter: {
      durationSeconds: 10,
      endpoint: "",
      requestTimeoutMs: 3000,
    },
    gamebar: {
      countersEndpoint: "",
      counters: {
        home: 12,
        tasks: 4,
        shop: 8,
        guild: 2,
        profile: 16,
      },
    },
    streak: {
      days: 7,
      endpoint: "",
    },
    progress: {
      screen: "gameui:progressopen",
      variant: "grove",
      points: 87,
      goal: 100,
      title: "Поздравляем!",
      message: "Отличная тренировка!",
      ctaLabel: "Продолжить",
      endpoint: "",
      autoOpen: true,
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
  };

  window.GAME_UI_CONFIG = GAME_UI_CONFIG;
})();
