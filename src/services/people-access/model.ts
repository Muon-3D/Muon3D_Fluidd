/**
 * People and access (Control v3, PEOPLE-ACCESS.md): which groups a person
 * sees on a printer's People and access page, the fixed role table, and
 * where each item lives (the printer's Settings or Account) with the links
 * between them.
 *
 * Control decides nothing about who may do what. The printer (Moonraker's
 * `muon_access`) and the console enforce; this only chooses what to show,
 * from what they report. Owner-only groups are hidden from members, never
 * greyed out.
 */
import type { AccessRole } from '@/services/muon-access/api'

/** Who is looking at the page. */
export type AccessViewer = 'owner' | 'operator' | 'viewer'

export interface RoleRow {
  id: 'watch' | 'print' | 'control' | 'printer' | 'people';
  label: string;
  owner: boolean;
  operator: boolean;
  viewer: boolean;
}

/**
 * The fixed role table (J1, R1, R2): five rows, the same on every Muon
 * printer. It replaces the Relaxed/Standard/Strict preset and the 13-row
 * capability list in the UI.
 */
export const ROLE_TABLE: readonly RoleRow[] = [
  { id: 'watch', label: 'Watch the camera and status', owner: true, operator: true, viewer: true },
  { id: 'print', label: 'Print, pause and cancel; upload files', owner: true, operator: true, viewer: false },
  { id: 'control', label: 'Heat, move, quick commands and console', owner: true, operator: true, viewer: false },
  { id: 'printer', label: 'Wi-Fi, hotspot, updates, rename', owner: true, operator: false, viewer: false },
  { id: 'people', label: 'People, devices and developer mode', owner: true, operator: false, viewer: false }
]

export const ROLE_WORDS: Record<AccessViewer, string> = { owner: 'Owner', operator: 'Operator', viewer: 'Viewer' }

/** The table's rows a role has, as the role table words them. */
export function roleRows (role: AccessViewer): RoleRow[] {
  return ROLE_TABLE.filter(row => row[role])
}

/** "Print, pause, cancel, heat, move, watch": what a role can do, in a line. */
export function roleSummary (role: AccessViewer): string {
  if (role === 'viewer') return 'Watch the camera and status'
  if (role === 'operator') return 'Print, pause, cancel, upload, heat, move, macros, console and watch'
  return 'Everything, including Wi-Fi, updates, people and developer mode'
}

/** What the printer said about this browser (`muon_access` get), if it answered. */
export interface PrinterSays {
  /** `get().owner`. */
  owner?: { kind: string, email?: string };
  /** `get().you.level`: `admin` also covers the panel, local callers and paired clients, not only the owner. */
  level?: string;
  /** `get().you.role`. */
  role?: AccessRole;
}

/** What the console says about this account and this printer, if it is in the account. */
export interface CloudSays {
  /** A share to this account, not a printer it linked. */
  shared?: boolean;
  role?: AccessRole;
}

const sameEmail = (a?: string | null, b?: string | null) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * Who is looking, from the real permission sources. Being allowed to manage
 * access (`capabilities().protection`) is not being the owner: an admin-level
 * caller, the panel, a local caller or a paired client can be allowed too.
 *
 * - The printer: the owner is an admin-level caller whose signed-in account is
 *   the printer's owner; on a printer with no owner, an admin-level caller.
 * - Else the console: a printer this account linked is its owner's.
 * - Else the role the printer gave (`you.role`), else the share's role.
 *
 * An unknown share role is shown as Viewer, the role with least on screen,
 * never as more than a source said. Null when no source knows.
 */
export function accessViewer (printer: PrinterSays | null | undefined, cloud: CloudSays | null | undefined, accountEmail?: string | null): AccessViewer | null {
  if (printer?.level === 'admin') {
    if (printer.owner?.kind === 'none') return 'owner'
    if (printer.owner?.kind === 'account' && sameEmail(printer.owner.email, accountEmail)) return 'owner'
  }
  if (cloud && !cloud.shared) return 'owner'
  if (printer?.role === 'operator' || printer?.role === 'viewer') return printer.role
  if (cloud) return cloud.role === 'operator' ? 'operator' : 'viewer'
  return null
}

/** The page's groups, top to bottom. */
export type PrinterGroup =
  'you' | 'people' | 'peopleReadOnly' | 'waiting' | 'links' | 'devices' | 'yourDevices' |
  'entry' | 'askAtPrinter' | 'roles' | 'canDo' | 'needToPrint' | 'olderTools' | 'developer' | 'unlink' | 'leave'

/** Groups only the owner ever sees. A member gets one lock line instead (hide, don't grey). */
export const OWNER_ONLY_GROUPS: readonly PrinterGroup[] = ['people', 'waiting', 'links', 'devices', 'entry', 'askAtPrinter', 'roles', 'olderTools', 'developer', 'unlink']

export interface GroupFacts {
  /** This printer is in the signed-in account (the console's people, invites, links, Unlink and Leave apply). */
  cloud: boolean;
  /**
   * The printer itself lets this browser manage its access now
   * (`capabilities().protection === 'allowed'`). A refused or failed answer is
   * false: its controls stay hidden, never shown to fail.
   */
  canManage: boolean;
  /** Join requests and pending email invites for this printer. */
  waiting: number;
  /** Live invite links for this printer. */
  links: number;
  /** The printer has Moonraker's authorization component (the API key). */
  olderTools: boolean;
  /**
   * The printer doesn't let this browser change who can get in, but lets it
   * ask the printer's own screen (`protection: 'ask'`), as from away.
   */
  canAsk: boolean;
}

/**
 * The groups a person sees, in order (frames Overview, A and B). The
 * console's groups need the printer in the owner's account; the printer's own
 * rules need the printer to say this browser may manage them. Empty "Waiting
 * for you" and "Invite links" groups are hidden, not shown empty.
 */
export function printerGroups (viewer: AccessViewer, facts: GroupFacts): PrinterGroup[] {
  const groups: PrinterGroup[] = ['you']
  if (viewer === 'owner') {
    if (facts.cloud) groups.push('people')
    if (facts.cloud && facts.waiting > 0) groups.push('waiting')
    if (facts.cloud && facts.links > 0) groups.push('links')
    groups.push('devices')
    if (facts.canManage) {
      groups.push('entry', 'roles')
      if (facts.olderTools) groups.push('olderTools')
      groups.push('developer')
    } else if (facts.canAsk) {
      groups.push('askAtPrinter')
    }
    if (facts.cloud) groups.push('unlink')
    return groups
  }
  if (viewer === 'operator') {
    groups.push('peopleReadOnly', 'canDo', 'yourDevices')
  } else {
    // Viewers don't see the list of people (R12).
    groups.push('canDo', 'needToPrint')
  }
  if (facts.cloud) groups.push('leave')
  return groups
}

/** The items of "Where each item lives". */
export type AccessItem =
  'people' | 'joinRequests' | 'invites' | 'rules' | 'printerDevices' | 'olderTools' | 'developerMode' | 'unlink' |
  'yourDevices' | 'appsAndAgents' | 'yourPrinters' | 'leave'

export type AccessPlace = 'printer' | 'account'

/**
 * Where each item is managed. Each lives in exactly one place; Leave is the
 * one action offered in both, because both are where people look.
 */
export const ITEM_HOME: Record<AccessItem, AccessPlace | 'both'> = {
  people: 'printer',
  joinRequests: 'printer',
  invites: 'printer',
  rules: 'printer',
  printerDevices: 'printer',
  olderTools: 'printer',
  developerMode: 'printer',
  unlink: 'printer',
  yourDevices: 'account',
  appsAndAgents: 'account',
  yourPrinters: 'account',
  leave: 'both'
}

/** The Account sections People and access links to. */
export type AccountAccessSection = 'printers' | 'devices' | 'apps'

/** Account › Printers and access, Your devices, Apps and agents: always top-level, never under a printer (Jack, 6 Nov). */
export function accountAccessPath (section: AccountAccessSection): string {
  return `/account/${section}`
}

/** A printer's Settings › People and access. */
export function printerAccessPath (slug: string): string {
  return `/${slug}/settings#access`
}

/** What a printer's row in Account › Printers and access offers (frame D). */
export type AccountRowAction = 'people' | 'open' | 'leave'

export function accountRowActions (role: AccessViewer): AccountRowAction[] {
  return role === 'owner' ? ['people'] : ['open', 'leave']
}
