# Settings gates

Shared pieces so a Settings page never writes its own gate logic. They only read what Control already knows and change no existing gate. The printer enforces every rule too; these keep the page honest about it (`control-mockups/v3/PRINCIPLES.md` section 9).

| Piece | Where | Use |
| --- | --- | --- |
| `isMuonPrinter` | store getter `server/isMuonPrinter`, and `MuonGatesMixin` | Is this a Muon (Moonraker reports `muon_access` or `muon_protection`)? |
| `devModeEnabled` | `MuonGatesMixin` (`src/mixins/muon-gates.ts`), reading `devModeState` | Is developer mode on? Unknown counts as off. |
| `isOwner` | `MuonGatesMixin`, reading `ownerState` (`src/services/gates`) | `true`, `false`, or `null` when unknown. |
| `<LockedRow>` | `LockedRow.vue` | A visible, locked developer-mode row. |
| `<OwnerOnly>` | `OwnerOnly.vue` | Owner-only content, hidden (not greyed) for anyone else. |

## In a page

```ts
@Component({ components: { LockedRow, OwnerOnly } })
export default class MyPage extends Mixins(MuonGatesMixin) {}
```

Call `refreshDevMode()` (from `@/services/dev-mode/state`) in `mounted` if the page needs dev mode to be current; the mixin only reads it.

**isMuonPrinter** (hide a section a plain Moonraker has no use for):

```vue
<section v-if="isMuonPrinter">...</section>
```

**devModeEnabled** with **LockedRow** (rows about the machine stay visible but locked, with the reason):

```vue
<edit-macros-row v-if="devModeEnabled" />
<locked-row v-else label="Edit macros" />
<!-- another reason: reason="Needs a Muon printer" -->
```

A tap on a `LockedRow` goes to Settings > Developer mode (`#developer`); Control has no separate explainer sheet.

**OwnerOnly** (rows about a person's role are hidden from members and viewers):

```vue
<owner-only>
  <who-can-use-row />
</owner-only>
```

The owner is whoever the printer lets change who can use it: `server.muon.access.capabilities` reports `protection: 'allowed'`. This is the test Access settings already use for "Only the owner can change this" (`ownerOnly`), and `OwnerOnly` asks once per session when it first mounts. Where ownership is not known (a printer without `muon_access`, so no accounts and no owner, or the printer didn't answer) `OwnerOnly` hides its content, as Access settings lock theirs. A row that is harmless where nobody has accounts opts in with `<owner-only unknown="show">`. Call `resetOwner()` from `@/services/gates` when the active printer changes.

## Not built here: move or heat while printing

The Console setting "move or heat while printing" is a gate and is not built here. What it needs is already on the mixin, from `StateMixin`: `printerPrinting` (printing only) and `printerBusy` (printing, paused or busy). The motion itself must still go through `moveBy`/`moveTo` in `src/mixins/control.ts` and `src/services/control/safe-move.ts`.
