# Settings gates

Shared pieces so a Settings page never writes its own gate logic. They only read what Control already knows and change no existing gate. The printer enforces every rule too; these keep the page honest about it (`control-mockups/v3/PRINCIPLES.md` section 9).

Every answer is for the printer on screen. It is reset centrally (app init, which a printer switch runs, and every socket close) and asked again on the new connection. A reply that arrives after a switch or a reset is dropped. Until a printer has answered, the answer is unknown, and unknown never unlocks or shows anything.

| Piece | Where | Use |
| --- | --- | --- |
| `isMuonPrinter` | store getter `server/isMuonPrinter`, and `MuonGatesMixin` | `true` (Moonraker reports `muon_access` or `muon_protection`), `false` (a loaded list with neither), `null` until server.info has been received for this printer. |
| `devModeEnabled` | `MuonGatesMixin` (`src/mixins/muon-gates.ts`) | `true` only when this printer has said developer mode is on. Unknown is `false`. |
| `canManageAccess` | `MuonGatesMixin` | `true`, `false`, or `null` when unknown. |
| `<LockedRow>` | `LockedRow.vue` | A visible, locked row. |
| `<CanManageAccess>` | `CanManageAccess.vue` | Content for clients that may manage access; hidden (not greyed) for anyone else. |

## In a page

```ts
@Component({ components: { LockedRow, CanManageAccess } })
export default class MyPage extends Mixins(MuonGatesMixin) {}
```

The mixin asks on mount and again whenever the printer, a reset or server.info changes. `devModeEnabled` is read through the gates, not from `devModeState` directly, because `devModeState` is one global that keeps another printer's value.

**isMuonPrinter** (three states, so say what loading shows):

```vue
<section v-if="isMuonPrinter === true">...</section>
<locked-row v-else-if="isMuonPrinter === false" label="Wi-Fi" lock="muon" />
```

**devModeEnabled** with **LockedRow** (rows about the machine stay visible but locked, with the reason):

```vue
<edit-macros-row v-if="devModeEnabled" />
<locked-row v-else label="Edit macros" />
```

A developer-mode lock (the default) links to Settings > Developer mode (`#developer`); Control has no separate explainer sheet. `lock="muon"` says "Needs a Muon printer", which nothing here can unlock, so it has no link. `reason-text` changes the words, never the link.

**CanManageAccess** (the protection rows, hidden from everyone who may not change them):

```vue
<can-manage-access>
  <entry-row />
</can-manage-access>
```

### What `canManageAccess` means

It is the printer's own answer, `protection: allowed` from `server.muon.access.capabilities`, the same test Access settings use for "Only the owner can change this". It means "this client may manage access". The printer also allows that to any admin, to the panel, to local addresses and to gateway callers with no level, so it is not "is the account owner". It governs the protection-row controls and nothing more. **No account-owner check is provided yet**; if one is needed it must be built from `get().owner` together with `you.level`.

`CanManageAccess` hides on anything that is not a clear yes: a member or viewer, a refused (403), failed (5xx) or timed-out call, an answer from another printer, a printer whose server info has not loaded, and a printer with only `muon_protection` (it has no access route, so it is Muon with unknown access). A row that is harmless on a certainly non-Muon printer (a loaded list with no Muon component, so no accounts) may use `<can-manage-access non-muon="show">`. A failed call on a Muon never shows it.

## Not built here: move or heat while printing

The Console setting "move or heat while printing" is a gate and is not built here. What it needs is already on the mixin, from `StateMixin`: `printerPrinting` (printing only) and `printerBusy` (printing, paused or busy). The motion itself must still go through `moveBy`/`moveTo` in `src/mixins/control.ts` and `src/services/control/safe-move.ts`.
