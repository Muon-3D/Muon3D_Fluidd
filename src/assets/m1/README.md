# Accurate M1 model: `m1-accurate.glb`

This is the accurate M1 printer for Control's 3D view (I-163 / KAN-1412), **exterior only**. It is cut down from the detailed Blender model and contains no source CAD. Everything a person can't see from outside has been removed, face by face (see "Exterior only" below). The root is turned into Control's frame.

| | |
|---|---|
| File | `m1-accurate.glb`, 1,798,848 bytes (1.7 MiB) |
| Compression | Draco (`KHR_draco_mesh_compression`, required). The decoder ships in `public/draco/` (three r185's `examples/jsm/libs/draco/gltf/`, 763 KB), which is where `accurate/gltf-load.ts` points `DRACO_PATH`. |
| Other extensions | `KHR_materials_transmission` (the glass plate), `KHR_materials_emissive_strength` (LED, screen) |
| Triangles | 417,713 in total (KAN-2048 cut it from 681,041). The glass is transmissive, so three draws the opaque scene twice. |
| Load | Fetch and decode took 0.29 s from localhost with three 0.185.1 and the loader setup in `gltf-load.ts` |

**What follows the printer live:** only the toolhead (`M1_X_Carriage` and `M1_Y_Gantry`), the build plate (`M1_Z_Stage`), the hose, which moves with the head, and the cross-rail belt, which moves with the gantry. The arm, the knob and the other belts do **not** move live: they stay at their rest pose. The node list below names their joints for the rig, not for Control.

## Frame, units, origin

The frame is the same as `03-model.js`'s print frame:
- **+X** runs along the cross rail.
- **+Z** points toward the front corner, where the LED trough runs out.
- **+Y** is up.
- The round display is on the left corner (−X) and the spine at the back (−Z).

| | |
|---|---|
| Units | Millimetres, so `scale: 1` in `node-config.ts` |
| Origin | The centre of the glass plate's **top** surface, with the bed at its modelled height |
| Print surface | The glass underside, at Y = −4.11 mm. The part hangs below it, in −Y. |
| Bounds at rest | X −131…128, Y −159…110, Z −141…247 mm |
| Root rotation | The root node `M1` carries a −90° rotation about Y that turns the model into this frame. Child nodes keep their own local axes, so the bindings below are in each node's parent frame. |

## Nodes

```
M1                        root (rotation only)
├── M1_Base               shell, deck, frame, feet (static)
│   └── M1_Base_Decals    the MUON3D decal on the deck
├── M1_Hose               the corrugated hose, skinned to hose_base + hose_head (follows the head by itself)
├── M1_HoseRig
│   └── hose_base         skin joint at the chassis end (fixed)
├── M1_Belt               the cross-rail belt, skinned to belt_base + belt_gantry (follows the gantry by itself)
├── M1_BeltRig
│   └── belt_base         skin joint at the motor pulleys under the spine (fixed)
├── M1_Arm                spine; revolute fold hinge (local axis 0,0,-1)
│   └── M1_Z_Stage        bed lift: slides on local Y
│       └── M1_BuildPlate_Glass   glass plate (transmissive, silkscreen)
├── M1_Y_Gantry           cross rail: slides on local X (= down the trough)
│   ├── M1_X_Carriage     head: slides on local Z (= along the cross rail)
│   │   └── hose_head     skin joint at the head end of the hose
│   └── belt_gantry       skin joint for the belt, at the gantry's origin
├── M1_Knob               knob: spins on local Y
└── M1_Panel_Screen       round display (emissive logo)
```

Each moving node also carries `joint_type`, `joint_axis`, `joint_min_mm` and `joint_max_mm` in its glTF extras.

### Suggested `ACCURATE_M1` (node-config.ts)

```ts
export const ACCURATE_M1: AccurateModelConfig = {
  scale: 1,
  headX: { node: 'M1_X_Carriage', axis: 'z', travel: -102.2 },  // nozzle world X -101.6 … +102.8
  headZ: { node: 'M1_Y_Gantry', axis: 'x', travel: 89.95 },     // nozzle world Z -92.0 … +87.9
  bedHeight: { node: 'M1_Z_Stage', axis: 'y', travel: 150.5, zero: -0.5103 } // plate top -76.8 (z=0) … +73.7 (z=1)
}
```

I checked these with `bindNodes`'s own arithmetic in three r185:
- Each node moves along the expected world axis.
- At state 0 every node is back at rest.

**Still to be checked on a real machine:**
- The travels come from the Blender rig's limits, not from `printer.cfg`.
- The **signs** against Klipper are unverified, so flip `travel` if the head or bed runs the wrong way.
- Whether `z = 0` (bed lowest) matches `position_min` is unverified.
- `bedTravel` in `03-model.js` is 164 mm, while the rig gives 150.5 mm.

## The hose

`M1_Hose` is the corrugated hose from the chassis fitting to the toolhead. It is a skinned mesh with two joints:
- `hose_base` sits at the chassis end and never moves.
- `hose_head` sits at the head end and **is a child of `M1_X_Carriage`**.

Every vertex is weighted `(1 − w)` to `hose_base` and `w` to `hose_head`. Here `w = 3s² − 2s³` and `s` is the vertex's position along the hose's centreline, 0 at the chassis and 1 at the head. The joints only translate, so whenever the carriage moves by **d**, three's skinning moves each hose vertex by **w·d**:
- The head end moves exactly with the head.
- The chassis end stays put.
- The middle bends smoothly between them, and both ends keep their direction.

**Control drives nothing for it.** Moving `M1_X_Carriage` and `M1_Y_Gantry` through `bindNodes` moves the hose too: `hose_head` inherits the carriage's world position. The only requirement is that the loaded scene isn't cloned with a plain `clone()`. A SkinnedMesh needs `SkeletonUtils.clone()` to keep its bones.

The bed (`M1_Z_Stage`) isn't connected to the hose, so bed height doesn't affect it.

three works out a SkinnedMesh's bounding sphere once, at rest. If the hose ever vanishes at the edge of the view while the head is at a corner, set `frustumCulled = false` on its two meshes.

I checked this in three 0.185.1. At rest, at all four head corners (headX, headZ = ±1) and at bed z = 0 and z = 1, the vertex at the hose's head end stays at the same offset from `M1_X_Carriage`, to 0.1 mm.

## The cross-rail belt

`M1_Belt` is the belt that runs along the cross rail and back along the trough to the two motor pulleys under the spine. It used to be part of `M1_Base`, so it stayed at the gantry's rest position while the gantry moved and floated over the deck. It's now skinned like the hose, to two joints:
- `belt_base` (under `M1_BeltRig`) is at the motor pulleys and never moves.
- `belt_gantry` is a child of `M1_Y_Gantry`.

The weight on `belt_gantry` goes by the vertex's x in `M1`'s frame (along the trough). It's 0 behind x = −95 mm (around the motor pulleys) and 1 from x = −1 mm on (the rail strand and its idlers on the gantry). In between it rises linearly, so the straight strands back to the motors stretch or shorten as the gantry moves. A linear blend of two translations draws a straight strand exactly. `rig.ts` turns off frustum culling for it, as for the hose.

## Exterior only

The detailed model has 2,092 parts and 15.1 M triangles. It was cut in two passes.

1. **Hidden parts:** 1,623 parts that never show from outside were removed. That includes most of the electronics, wiring, internal fasteners and brackets.
2. **Hidden faces:** every face of what was left got an ID. It was rendered from 48 directions at 3072 px, from straight above down to 3° below the horizon (Control's camera stops at 2.8° below, over a floor). The poses were rest, both travel extremes, two mixed corners and folded. Only faces that cover a pixel in some view were kept, plus faces under 0.25 mm² next to a kept one, so that sub-pixel slivers don't open holes.

This went from 2.25 M to 0.84 M triangles. The base went from 1.40 M to 0.40 M. It lost its inside, its inner shell faces and its underside, including the bottom PCB plate.

A second pass with 41 different directions confirms 94% of the kept triangles. Views from outside are unchanged.

3. **Gutting (6 Nov 2026):** a camera inside the base still saw a lot: the bottom plate and its PCB traces, a fan, screw heads, and slivers of parts that were cut face by face. The base was split into its 1,080 connected pieces and drawn as piece IDs from 64 points inside the shell and from 48 directions outside (768 px, rest pose). A piece was dropped when no outside view saw it, or when the inside saw it and the outside saw less than 300 px of it, or less than 1% of what the inside saw (and under 6,000 px). The LED strip's chips and diffusers were kept whatever their counts, since Control lights them. 976 pieces went, 156,060 triangles. What's left inside is the inner side of the shell and what shows through its openings: the belt, the LED trough, the hose fitting, and the motor pulleys under the spine. Outside views at rest differ by at most 918 of 1,080,000 pixels. The small round hole in the deck by the display used to show a fan behind it and now shows the dark hollow.

Only the glass build plate is treated as see-through, so the print shows through it. The LED diffusers and the clear hose count as opaque and now use an opaque milky material, `M1_Diffuser`, so nobody can look into the emptied shell.

What's left of any inner part is only the surface that really shows through an opening in the shell, such as the fan behind the deck's intake grille or the floor of the LED trough.

## Known limits

- **The LED chips and the screen sit where the machine has them, under the deck.** The deck top is at Y −107. The base's bounding box reaches −86 only because of the spine's bracket. The LED chips (`M1_0.80_0.80_0.80_…_e0.00_0.54_1.00`) lie along the trough at Y −133.6 to −131.9, about 25 mm down. From outside they're hidden: 0 to 4 px in 48 views. What shows is their `M1_Diffuser` light guides, which reach up to −119.8 and are seen through the trough slot (about 10,000 px). The round screen (`M1_Panel_Screen`) is at −109.1 to −108.6, 1.5 mm under its window (`M1_Glass_Frost`, −108.5 to −107.1, about 67,000 px from outside). The window is transmissive at roughness 0.35, so the real-glass path blurs the screen to a soft glow. To show a lit strip, tint the diffusers. To show a sharp screen, lower the window's roughness.

- **The underside is open.** It was removed because Control's camera can't get below 2.8° and draws a floor. A view from beneath would look into the shell.
- **The corrugated hose and the LED diffusers are now milky white**, no longer clear (see above).
- **The hose's bend is interpolated, not simulated.** It's a smooth blend between its rest shape and the moved head, so at the far corners its middle stretches or tightens a little, and it can touch the edge of the base. The cross-rail belt follows the gantry. The other belts (the Z belt on the arm) stay at the rest pose, and the belt's teeth don't run along it.
- **The glass silkscreen is a recreated stand-in.** The original PNG isn't packed in the source file.
- **The arm fold isn't bound**, because `M1State.fold` has no binding role yet. `M1_Arm` is the fold node: it turns about its local (0, 0, −1) axis, 0° deployed to about 90° folded. The sign is unverified.
- **Bug in `accurate/gltf-load.ts`.** It imports `{ default: MeshoptDecoder }`, but three r185's `meshopt_decoder.module.js` only has the named export `MeshoptDecoder`. It would get `undefined`. That's harmless for this Draco file, but it would break a meshopt-compressed one.

## KAN-2048: no internal geometry

`tools/m1-exterior-only.mjs` produced the current file. It keeps only the outer skin: faces next to open air that is reachable from outside once small openings are sealed (6 mm). Cavities, inner walls and everything behind a sealed opening are dropped, in the body and in the toolhead, and the underside is treated as closed. A section cut through the model shows empty shells. Node names, materials, skins and UVs are unchanged.
