# Accurate M1 model: `m1-accurate.glb`

This is the accurate M1 printer for Control's 3D view (I-163 / KAN-1412), **exterior only**. It is cut down from the detailed Blender model and contains no source CAD. Everything a person can't see from outside has been removed, face by face (see "Exterior only" below). The root is turned into Control's frame.

| | |
|---|---|
| File | `m1-accurate.glb`, 3,448,604 bytes (3.3 MiB) |
| Compression | Draco (`KHR_draco_mesh_compression`, required). The decoder ships in `public/draco/` (three r185's `examples/jsm/libs/draco/gltf/`, 763 KB), which is where `accurate/gltf-load.ts` points `DRACO_PATH`. |
| Other extensions | `KHR_materials_transmission` (the glass plate), `KHR_materials_emissive_strength` (LED, screen) |
| Triangles | 841,337: Base 304,325, Arm 224,358, X_Carriage 110,384, Hose 98,661, Z_Stage 48,769, Y_Gantry 41,276, Knob 8,190, BuildPlate_Glass 4,640, Panel_Screen 732, Base_Decals 2. The glass is transmissive, so three draws the opaque scene twice. |
| Load | Fetch and decode took 0.29 s from localhost with three 0.185.1 and the loader setup in `gltf-load.ts` |

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
├── M1_Base               shell, deck, frame, belts, feet (static)
│   └── M1_Base_Decals    the MUON3D decal on the deck
├── M1_Hose               the corrugated hose, skinned to hose_base + hose_head (follows the head by itself)
├── M1_HoseRig
│   └── hose_base         skin joint at the chassis end (fixed)
├── M1_Arm                spine; revolute fold hinge (local axis 0,0,-1)
│   └── M1_Z_Stage        bed lift: slides on local Y
│       └── M1_BuildPlate_Glass   glass plate (transmissive, silkscreen)
├── M1_Y_Gantry           cross rail: slides on local X (= down the trough)
│   └── M1_X_Carriage     head: slides on local Z (= along the cross rail)
│       └── hose_head     skin joint at the head end of the hose
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

## Exterior only

The detailed model has 2,092 parts and 15.1 M triangles. It was cut in two passes.

1. **Hidden parts:** 1,623 parts that never show from outside were removed. That includes most of the electronics, wiring, internal fasteners and brackets.
2. **Hidden faces:** every face of what was left got an ID. It was rendered from 48 directions at 3072 px, from straight above down to 3° below the horizon (Control's camera stops at 2.8° below, over a floor). The poses were rest, both travel extremes, two mixed corners and folded. Only faces that cover a pixel in some view were kept, plus faces under 0.25 mm² next to a kept one, so that sub-pixel slivers don't open holes.

This went from 2.25 M to 0.84 M triangles. The base went from 1.40 M to 0.40 M. It lost its inside, its inner shell faces and its underside, including the bottom PCB plate.

A second pass with 41 different directions confirms 94% of the kept triangles. Views from outside are unchanged.

Only the glass build plate is treated as see-through, so the print shows through it. The LED diffusers and the clear hose count as opaque and now use an opaque milky material, `M1_Diffuser`, so nobody can look into the emptied shell.

What's left of any inner part is only the surface that really shows through an opening in the shell, such as the fan behind the deck's intake grille or the floor of the LED trough.

## Known limits

- **The underside is open.** It was removed because Control's camera can't get below 2.8° and draws a floor. A view from beneath would look into the shell.
- **The corrugated hose and the LED diffusers are now milky white**, no longer clear (see above).
- **The hose's bend is interpolated, not simulated.** It's a smooth blend between its rest shape and the moved head, so at the far corners its middle stretches or tightens a little, and it can touch the edge of the base. The belts are still frozen at the rest pose.
- **The glass silkscreen is a recreated stand-in.** The original PNG isn't packed in the source file.
- **The arm fold isn't bound**, because `M1State.fold` has no binding role yet. `M1_Arm` is the fold node: it turns about its local (0, 0, −1) axis, 0° deployed to about 90° folded. The sign is unverified.
- **Bug in `accurate/gltf-load.ts`.** It imports `{ default: MeshoptDecoder }`, but three r185's `meshopt_decoder.module.js` only has the named export `MeshoptDecoder`. It would get `undefined`. That's harmless for this Draco file, but it would break a meshopt-compressed one.
