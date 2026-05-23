const STORAGE_PREFIX = "cc-team-activity-seen";

function storageKey(courseId: string, userId: string) {
  return `${STORAGE_PREFIX}:${courseId}:${userId}`;
}

export type TeamActivitySeenMap = Record<string, string>;

export function readTeamActivitySeen(courseId: string, userId: string): TeamActivitySeenMap {
  try {
    const raw = localStorage.getItem(storageKey(courseId, userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as TeamActivitySeenMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeTeamActivitySeen(
  courseId: string,
  userId: string,
  map: TeamActivitySeenMap
): void {
  try {
    localStorage.setItem(storageKey(courseId, userId), JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

/** 활동 목록에서 가장 최근 항목의 지문 (tag+title+time) */
export function latestActivityFingerprint(
  activities: { tag: string; title: string; time: string }[]
): string {
  if (activities.length === 0) return "";
  const first = activities[0];
  return `${first.tag}|${first.title}|${first.time}`;
}

export function markTeamActivitiesSeen(
  courseId: string,
  userId: string,
  teamId: string,
  fingerprint: string
): void {
  const map = readTeamActivitySeen(courseId, userId);
  map[teamId] = fingerprint;
  writeTeamActivitySeen(courseId, userId, map);
}

export function hasUnreadTeamActivity(
  courseId: string,
  userId: string,
  teamId: string,
  activities: { tag: string; title: string; time: string }[]
): boolean {
  if (activities.length === 0) return false;
  const fp = latestActivityFingerprint(activities);
  const map = readTeamActivitySeen(courseId, userId);
  return map[teamId] !== fp;
}
