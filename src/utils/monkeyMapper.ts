export type ExpressionFeatures = {
  smileIntensity: number; // 0..1
  eyebrowsRaised: boolean;
  handRaised: boolean;
};

export type MonkeyMatch = {
  label: string;
  imagePath: string;
};

// ---- Runtime asset probing so filenames can be self-describing ----
// Specific filenames provided by the user
const categoryToCandidates: Record<string, string[]> = {
  pointing: ['pointing_up_smiling.png'],
  thinking: ['thinking_finger_in_mouth.png'],
  smiling: ['pointing_up_smiling.png'],
  confused: ['neutral_expression.png', 'shocked_mouth_open.png'],
  shocked: ['shocked_mouth_open.png'],
};

const existingAssetByCandidate = new Map<string, string>();
let initialized = false;

function preload(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

export async function initMonkeyAssets(): Promise<void> {
  if (initialized) return;
  const allCandidates = new Set<string>();
  Object.values(categoryToCandidates).forEach((arr) => arr.forEach((n) => allCandidates.add(n)));
  const checks: Promise<void>[] = [];
  allCandidates.forEach((name) => {
    const url = `/monkeys/${name}`;
    const p = preload(url).then((ok) => {
      if (ok) existingAssetByCandidate.set(name, url);
    });
    checks.push(p);
  });
  await Promise.all(checks);
  initialized = true;
}

function resolveByCategory(category: keyof typeof categoryToCandidates, fallback: string): string {
  const candidates = categoryToCandidates[category];
  for (const c of candidates) {
    const url = existingAssetByCandidate.get(c);
    if (url) return url;
  }
  return fallback;
}

function labelFromUrl(url: string): string {
  const base = url.split('/').pop() || '';
  const name = base.replace(/\.[a-zA-Z0-9]+$/, '').replace(/[_-]+/g, ' ');
  return name.replace(/\b\w/g, (m) => m.toUpperCase());
}

export function getMatchingMonkey(features: ExpressionFeatures): MonkeyMatch {
  const { smileIntensity, eyebrowsRaised, handRaised } = features;

  // Prefer user-provided assets if found, otherwise gracefully fall back
  const pointing = resolveByCategory('pointing', '/monkeys/pointing.png');
  const thinking = resolveByCategory('thinking', '/monkeys/thinking.png');
  const smiling = resolveByCategory('smiling', '/monkeys/smiling.png');
  const confused = resolveByCategory('confused', '/monkeys/confused.png');

  if (handRaised) {
    return { label: labelFromUrl(pointing) + ' 👉', imagePath: pointing };
  }
  if (eyebrowsRaised && smileIntensity < 0.3) {
    return { label: labelFromUrl(thinking) + ' 🤔', imagePath: thinking };
  }
  if (smileIntensity >= 0.3) {
    return { label: labelFromUrl(smiling) + ' 😄', imagePath: smiling };
  }
  return { label: labelFromUrl(confused) + ' 😕', imagePath: confused };
}

export function getDefaultMonkey(): MonkeyMatch {
  const confused = resolveByCategory('confused', '/monkeys/confused.png');
  return { label: labelFromUrl(confused), imagePath: confused };
}


