export type StudioProjectKind = "comic" | "website" | "game" | "music" | "merch";
export type StudioMigrationState = "needs-import" | "metadata-imported" | "connected";

export type StudioProject = {
  id: string;
  name: string;
  kind: StudioProjectKind;
  isolationKey: string;
  migrationState: StudioMigrationState;
  note: string;
};

/**
 * OGB Studio's project rooms are intentionally isolated.
 * A project-scoped tool must receive exactly one isolationKey and must not
 * search, retrieve, or mutate data belonging to any other project room.
 */
export const STUDIO_PROJECTS: StudioProject[] = [
  {
    id: "mostly-empty-somewhat-divine",
    name: "Mostly Empty, Somewhat Divine",
    kind: "comic",
    isolationKey: "comic:mostly-empty-somewhat-divine",
    migrationState: "metadata-imported",
    note: "Trusted 2026-09-25 Studio package indexed. Private binary asset storage is the remaining import step.",
  },
  {
    id: "bubba-license-to-purr",
    name: "Bubba: License to Purr",
    kind: "comic",
    isolationKey: "comic:bubba-license-to-purr",
    migrationState: "needs-import",
    note: "Import book canon, character sheets, approved pages, and issue metadata.",
  },
  {
    id: "ogb-1999",
    name: "OGB 1999",
    kind: "comic",
    isolationKey: "comic:ogb-1999",
    migrationState: "needs-import",
    note: "Import approved likeness locks, scripts, page state, and publishing assets.",
  },
  {
    id: "kam-ba-lam",
    name: "Kam-Ba-Lam",
    kind: "comic",
    isolationKey: "comic:kam-ba-lam",
    migrationState: "needs-import",
    note: "Import locked cast references, approved story direction, and finished pages.",
  },
  {
    id: "spartaneo-site",
    name: "Spartaneo Website",
    kind: "website",
    isolationKey: "site:spartaneo",
    migrationState: "connected",
    note: "GitHub-backed site project. Production writes remain approval-gated.",
  },
];

export const STUDIO_RULES = {
  codexRequired: false,
  productionWritesRequireApproval: true,
  rejectedArtCanBecomeReference: false,
  crossProjectRetrievalAllowed: false,
  chargesRequireExplicitApproval: true,
} as const;
