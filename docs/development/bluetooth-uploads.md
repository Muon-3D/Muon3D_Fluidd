---
layout: default
title: Bluetooth upload policy
parent: Development
nav_order: 20
---

# Bluetooth uploads

`MAX_BLUETOOTH_UPLOAD_BYTES` in `src/services/muon-ble/upload.ts` limits a
file to **512 KiB (524,288 bytes)** when `bluetoothCarrying(printerId)` says
Bluetooth is the current path. Multipart overhead does not count against the
file limit. Selecting Bluetooth is not sufficient; Auto is subject to the same
current-path check. LAN and cloud-relay uploads are not limited by this policy.
The check runs before encoding a file and again before calling WASM, so a route
change during encoding is checked too.

## Derivation without hardware

The driver in `src/services/muon-ble/link.ts` caps GATT segments at **244 bytes**
and prefers **write-without-response**. Its fallback segment size is 182 bytes.
Neither a resolved write promise nor the segment cap establishes radio speed.

The `upload-benchmark.spec.ts` unit test pumps 4,096 full-size segments through
the real driver's `nextSegment`/GATT-write loop and the existing fake printer.
One Node 20.9.0 run measured:

```text
BLE_DRIVER_BENCH: 4096 x 244 = 999424 bytes in 14.188 ms = 70.443 MB/s (immediate fake GATT promises; no radio or QUIC timing)
```

This only measures JavaScript scheduling and copying with immediate fake GATT
promises. It is **not** measured BLE goodput or a hardware sizing guarantee.

For sizing, assume conservatively **50 segment writes/second**, with **60%**
of their payload becoming uploaded file bytes after framing, QUIC, contention,
and retransmissions. At 182 bytes this is 5,460 B/s; at 244 bytes it is 7,320 B/s.
Round down again to **5 KiB/s (5,120 B/s)** of useful file throughput.
512 KiB / 5 KiB/s = **102.4 seconds**, leaving **17.6 seconds** of a two-minute
budget for request overhead and verification. These are explicit assumptions,
not properties inferred from the fake. Real printers, smaller negotiated
segments, or noisy radios may be slower; hardware validation remains necessary.

## Progress and stalls

BLE and cloud relay share `IrohPrinter.fetch` → WASM `fetchWithProgress` →
managed transport → Axios upload events → the existing upload progress UI.
The pinned client reports body bytes written to QUIC at 256 KiB intervals,
not every GATT write and not final Moonraker publication. A very small file
may only report zero and completion.

At the assumed goodput, 256 KiB takes **51.2 seconds**, so the no-progress
watchdog allows **75 seconds** between increasing byte counts. Duplicate
callbacks do not reset it. Increasing progress can keep an upload alive longer
than 75 seconds in total. The timer also bounds waiting for the final response;
success still requires the HTTP response and checksum verification.

On a stall, the request fails with a Bluetooth-specific explanation and closes
the WASM printer session so the incomplete request cannot keep sending. The
current WASM API has no per-request cancellation; closing may interrupt other
requests sharing that connection. Normal user aborts retain the existing shared
connection behavior. A local size refusal does not close the connection.

Desktop/phone acceptance tests use `e2e/fakes/managedBluetooth.ts`. They exercise
the real BLE route state and application progress plumbing, replacing WASM
HTTP at `fetchWithProgress`; file bytes do not traverse a physical radio or
real QUIC in those tests.
