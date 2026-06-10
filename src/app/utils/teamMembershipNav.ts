export const NAV_TEAM_MEMBERSHIP_REFRESH_EVENT = "cc-team-membership-refresh";

export function notifyTeamMembershipChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NAV_TEAM_MEMBERSHIP_REFRESH_EVENT));
}
