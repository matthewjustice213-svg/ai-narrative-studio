export type StudioLayout = {
  projectPanelWidth: number;
  rightPanelWidth: number;
  inspectorHeight: number;
  writersHeight: number;
};

export const defaultStudioLayout: StudioLayout = {
  projectPanelWidth: 284,
  rightPanelWidth: 430,
  inspectorHeight: 340,
  writersHeight: 300
};

const layoutLimits = {
  projectPanelWidth: { min: 220, max: 420 },
  rightPanelWidth: { min: 320, max: 620 },
  inspectorHeight: { min: 180, max: 620 },
  writersHeight: { min: 180, max: 620 }
};

const storageKey = "bb-studio-layout-v1";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function clampStudioLayout(current: StudioLayout, patch: Partial<StudioLayout>): StudioLayout {
  return {
    projectPanelWidth: clamp(
      patch.projectPanelWidth ?? current.projectPanelWidth,
      layoutLimits.projectPanelWidth.min,
      layoutLimits.projectPanelWidth.max
    ),
    rightPanelWidth: clamp(
      patch.rightPanelWidth ?? current.rightPanelWidth,
      layoutLimits.rightPanelWidth.min,
      layoutLimits.rightPanelWidth.max
    ),
    inspectorHeight: clamp(
      patch.inspectorHeight ?? current.inspectorHeight,
      layoutLimits.inspectorHeight.min,
      layoutLimits.inspectorHeight.max
    ),
    writersHeight: clamp(
      patch.writersHeight ?? current.writersHeight,
      layoutLimits.writersHeight.min,
      layoutLimits.writersHeight.max
    )
  };
}

export function readStoredStudioLayout(): StudioLayout {
  if (!globalThis.localStorage) return defaultStudioLayout;

  try {
    const stored = globalThis.localStorage.getItem(storageKey);
    if (!stored) return defaultStudioLayout;
    return clampStudioLayout(defaultStudioLayout, JSON.parse(stored) as Partial<StudioLayout>);
  } catch {
    return defaultStudioLayout;
  }
}

export function writeStoredStudioLayout(layout: StudioLayout) {
  if (!globalThis.localStorage) return;
  globalThis.localStorage.setItem(storageKey, JSON.stringify(layout));
}
