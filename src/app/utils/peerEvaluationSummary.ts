export type PeerEvaluationTier = "none" | "emerging" | "developing" | "distinct";

export type PeerEvaluationSummary = {
  title: string;
  description: string;
  keywords: { text: string; count: number }[];
  reviewCount: number;
  tier: PeerEvaluationTier;
  illustrationKey: string;
  dominantTheme?: string;
};

type PeerEvaluationRow = {
  good_keywords?: unknown;
  comment?: string | null;
};

type ThemeKey =
  | "communication"
  | "humor"
  | "care"
  | "punctuality"
  | "proactive"
  | "flexible"
  | "teamwork";

const THEME_PATTERNS: Record<ThemeKey, string[]> = {
  communication: ["소통이 잘돼요", "소통", "커뮤니케이션", "전달", "의견", "설명"],
  humor: ["유머감각이 있어요", "유머", "분위기메이커", "재미", "유쾌"],
  care: ["배려심이 깊어요", "배려", "친절", "도움", "존중"],
  punctuality: ["시간 약속을 잘 지켜요", "시간", "약속", "지각", "마감", "기한"],
  proactive: ["적극적이에요", "적극", "주도", "리더", "책임", "실행력"],
  flexible: ["유연하게 대처해요", "유연", "대처", "문제해결", "적응", "조율"],
  teamwork: ["함께해서 즐거워요", "협업", "팀워크", "함께", "시너지", "합"],
};

const EMERGING_TEMPLATES: Array<{
  title: string;
  description: string;
  illustrationKey: string;
}> = [
  {
    title: "함께하면 든든한 동료",
    description: "작은 피드백에도 꾸준히 좋은 인상을 남기며 팀 분위기를 안정적으로 이끕니다.",
    illustrationKey: "teamSpark",
  },
  {
    title: "팀에 긍정 에너지를 더하는 사람",
    description: "협업 과정에서 편안한 커뮤니케이션을 만들고 팀원들이 의견을 나누기 쉽게 돕습니다.",
    illustrationKey: "teamSpark",
  },
  {
    title: "믿고 함께할 수 있는 팀 메이트",
    description: "주어진 역할을 성실히 수행하며 팀 프로젝트 흐름을 자연스럽게 받쳐주는 강점이 보입니다.",
    illustrationKey: "teamSpark",
  },
  {
    title: "성장 잠재력이 큰 협업형 인재",
    description: "좋은 평가가 꾸준히 쌓이며 앞으로 더 선명한 캐릭터가 기대되는 팀원입니다.",
    illustrationKey: "teamSpark",
  },
  {
    title: "팀워크 감각이 좋은 실무형 동료",
    description: "협업 포인트를 빠르게 파악하고 팀의 진행 리듬에 안정적으로 맞춰 기여합니다.",
    illustrationKey: "teamSpark",
  },
  {
    title: "프로젝트에 따뜻함을 더하는 사람",
    description: "팀원 간 신뢰를 만드는 태도로 협업 만족도를 높이는 강점이 꾸준히 드러납니다.",
    illustrationKey: "teamSpark",
  },
];

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function aggregatePositivePeerKeywords(
  rows: PeerEvaluationRow[],
  limit = 12
): { text: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const good = asArray<string>(row.good_keywords);
    for (const kw of good) {
      const normalized = kw.trim();
      if (!normalized) continue;
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function scoreThemes(rows: PeerEvaluationRow[]): Map<ThemeKey, number> {
  const scores = new Map<ThemeKey, number>();
  for (const key of Object.keys(THEME_PATTERNS) as ThemeKey[]) scores.set(key, 0);

  for (const row of rows) {
    const good = asArray<string>(row.good_keywords).map((kw) => kw.trim()).filter(Boolean);
    const comment = row.comment?.trim() ?? "";

    for (const kw of good) {
      for (const [theme, patterns] of Object.entries(THEME_PATTERNS) as Array<[ThemeKey, string[]]>) {
        if (patterns.some((pattern) => kw.includes(pattern))) {
          scores.set(theme, (scores.get(theme) ?? 0) + 2);
        }
      }
    }

    if (comment) {
      for (const [theme, patterns] of Object.entries(THEME_PATTERNS) as Array<[ThemeKey, string[]]>) {
        if (patterns.some((pattern) => comment.includes(pattern))) {
          scores.set(theme, (scores.get(theme) ?? 0) + 1);
        }
      }
    }
  }

  return scores;
}

function templateForDeveloping(theme: ThemeKey) {
  const byTheme: Record<ThemeKey, { title: string; description: string; illustrationKey: string }> = {
    communication: {
      title: "소통으로 팀을 잇는 사람",
      description: "팀원들과의 명확한 커뮤니케이션으로 협업 흐름을 안정적으로 이어갑니다.",
      illustrationKey: "leaderFlag",
    },
    humor: {
      title: "분위기를 밝히는 협업 메이커",
      description: "유쾌한 에너지로 팀의 긴장을 풀어 주며 협업 몰입도를 높입니다.",
      illustrationKey: "humorStar",
    },
    care: {
      title: "배려가 돋보이는 팀 플레이어",
      description: "팀원의 상황을 세심하게 살피며 협업 만족도를 높이는 강점이 분명합니다.",
      illustrationKey: "careHeart",
    },
    punctuality: {
      title: "약속과 마감을 지키는 신뢰형 동료",
      description: "시간 관리와 일정 준수에 강점이 있어 프로젝트 진행 안정성을 높여줍니다.",
      illustrationKey: "clockShield",
    },
    proactive: {
      title: "주도적으로 움직이는 실행형 멤버",
      description: "필요한 일을 먼저 찾아 추진하며 팀의 추진력을 만들어 냅니다.",
      illustrationKey: "leaderFlag",
    },
    flexible: {
      title: "상황 대응이 유연한 문제해결형 인재",
      description: "변수와 이슈를 빠르게 정리해 팀이 흔들리지 않도록 돕는 역량이 강합니다.",
      illustrationKey: "flexWave",
    },
    teamwork: {
      title: "함께할수록 빛나는 팀워크형 동료",
      description: "협업 과정에서 시너지를 만들며 팀의 성과 경험을 좋게 만듭니다.",
      illustrationKey: "teamJoy",
    },
  };
  return byTheme[theme];
}

function templateForDistinct(primary: ThemeKey, secondary: ThemeKey | undefined, reviewCount: number) {
  if (primary === "communication" && secondary === "proactive") {
    return {
      title: "모두와 소통하는 리더",
      description:
        reviewCount >= 7
          ? "소통을 중심으로 팀의 방향을 정리하고 실행까지 연결하며, 실제 협업 성과를 만드는 핵심 리더로 평가됩니다."
          : "소통을 중심으로 팀의 흐름을 이끌고 구성원의 역량이 자연스럽게 발휘되도록 돕습니다.",
      illustrationKey: "leaderFlag",
    };
  }

  const base = templateForDeveloping(primary);
  const richSuffix =
    reviewCount >= 7
      ? "여러 팀원의 평가에서 같은 강점이 반복적으로 확인되어, 이 사람만의 협업 캐릭터가 분명하게 드러납니다."
      : "다수 평가에서 같은 강점이 반복적으로 확인되어 캐릭터가 뚜렷하게 형성되고 있습니다.";

  return {
    title: base.title.replace("사람", "핵심 인재").replace("동료", "핵심 동료"),
    description: `${base.description} ${richSuffix}`,
    illustrationKey: base.illustrationKey,
  };
}

export function buildPeerEvaluationSummary(
  rows: PeerEvaluationRow[],
  userId: string
): PeerEvaluationSummary {
  const reviewCount = rows.length;
  const keywords = aggregatePositivePeerKeywords(rows, 12);
  const keywordMentions = keywords.reduce((sum, item) => sum + item.count, 0);
  const commentedCount = rows.filter((row) => Boolean(row.comment?.trim())).length;
  const signalCount = keywordMentions + commentedCount;

  if (reviewCount === 0 || signalCount === 0) {
    return {
      title: "",
      description: "",
      keywords: [],
      reviewCount: 0,
      tier: "none",
      illustrationKey: "teamSpark",
    };
  }

  const themeScores = scoreThemes(rows);
  const rankedThemes = [...themeScores.entries()].sort((a, b) => b[1] - a[1]);
  const primaryTheme = rankedThemes[0]?.[0] ?? "teamwork";
  const primaryScore = rankedThemes[0]?.[1] ?? 0;
  const secondaryTheme = rankedThemes[1]?.[1] ? rankedThemes[1][0] : undefined;
  const totalThemeScore = rankedThemes.reduce((sum, [, score]) => sum + score, 0);
  const primaryShare = totalThemeScore > 0 ? primaryScore / totalThemeScore : 0;

  const tier: PeerEvaluationTier =
    reviewCount >= 5 || keywordMentions >= 8 || primaryShare >= 0.4
      ? "distinct"
      : reviewCount >= 3 || keywordMentions >= 4
        ? "developing"
        : "emerging";

  if (tier === "emerging") {
    const hash = hashString(`${userId}:${reviewCount}:${keywordMentions}`);
    const picked = EMERGING_TEMPLATES[hash % EMERGING_TEMPLATES.length];
    return {
      ...picked,
      reviewCount,
      tier,
      keywords,
      dominantTheme: primaryTheme,
    };
  }

  const picked =
    tier === "developing"
      ? templateForDeveloping(primaryTheme)
      : templateForDistinct(primaryTheme, secondaryTheme, reviewCount);

  return {
    ...picked,
    reviewCount,
    tier,
    keywords,
    dominantTheme: primaryTheme,
  };
}
