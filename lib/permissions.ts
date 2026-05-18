export const SUPERADMIN_PERMS = {
  canManageSites:  "Ver y editar sitios",
  canCreateSites:  "Crear sitios",
  canDeleteSites:  "Eliminar sitios",
  canManageAdmins: "Gestionar superadmins",
  canManageAI:     "Gestionar IA global",
} as const;

export const SITEADMIN_PERMS = {
  canManageAppointments: "Citas",
  canManageStaff:        "Personal",
  canManageServices:     "Servicios",
  canManageProducts:     "Productos",
  canCustomize:          "Personalizar sitio",
  canManageContent:      "Contenido",
  canManageAds:          "Publicidades",
  canManageUsers:        "Usuarios",
  canManageAI:           "IA del sitio",
  canManageAdmins:       "Gestionar admins del sitio",
} as const;

export type SuperAdminPermKey = keyof typeof SUPERADMIN_PERMS;
export type SiteAdminPermKey  = keyof typeof SITEADMIN_PERMS;

const ALL_SUPER = Object.fromEntries(
  Object.keys(SUPERADMIN_PERMS).map((k) => [k, true])
) as Record<SuperAdminPermKey, boolean>;

const ALL_SITE = Object.fromEntries(
  Object.keys(SITEADMIN_PERMS).map((k) => [k, true])
) as Record<SiteAdminPermKey, boolean>;

export function parseSuperPerms(
  json: string | null | undefined,
  isMaster: boolean
): Record<SuperAdminPermKey, boolean> {
  if (isMaster) return { ...ALL_SUPER };
  try {
    return { ...ALL_SUPER, canManageAdmins: false, canDeleteSites: false, ...JSON.parse(json || "{}") };
  } catch {
    return { ...ALL_SUPER, canManageAdmins: false, canDeleteSites: false };
  }
}

export function parseSitePerms(
  json: string | null | undefined,
  isOwner: boolean
): Record<SiteAdminPermKey, boolean> {
  if (isOwner) return { ...ALL_SITE };
  try {
    return { ...ALL_SITE, canManageAdmins: false, ...JSON.parse(json || "{}") };
  } catch {
    return { ...ALL_SITE, canManageAdmins: false };
  }
}
