export const makeLocalEmail = (staticId: string): string =>
  `${staticId.trim().toLowerCase()}@washington.local`;
