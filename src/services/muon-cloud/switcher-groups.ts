import type { DirectoryEntry } from './directory'

export interface SwitcherGroup {
  id: string;
  name: string;
  /** "2 printers". */
  hint: string;
  entries: DirectoryEntry[];
}

const count = (n: number) => `${n} printer${n === 1 ? '' : 's'}`

/**
 * The account's printers under the groups the account keeps (the Printers
 * page's groups). Printers in no group come last, under "Other printers";
 * an account with no groups has one list, "Your printers". A group with
 * nothing to show (empty, or filtered out by the search) is left out.
 */
export function switcherGroups (
  entries: DirectoryEntry[],
  groups: Array<{ id: string, name: string, printers: string[] }>
): SwitcherGroup[] {
  if (!entries.length) return []
  const placed = new Set<string>()
  const out: SwitcherGroup[] = []
  for (const g of groups) {
    const members = entries.filter(e => !placed.has(e.key) && !!e.cloud && g.printers.includes(e.cloud.id))
    if (!members.length) continue
    members.forEach(e => placed.add(e.key))
    out.push({ id: g.id, name: g.name, hint: count(members.length), entries: members })
  }
  const rest = entries.filter(e => !placed.has(e.key))
  if (rest.length) {
    out.push(out.length
      ? { id: 'other', name: 'Other printers', hint: count(rest.length), entries: rest }
      : { id: 'other', name: 'Your printers', hint: '', entries: rest })
  }
  return out
}

/** "Saved in this browser" and "Found on this network" show only when they hold a printer. */
export function switcherSectionShown (entryCount: number): boolean {
  return entryCount > 0
}
