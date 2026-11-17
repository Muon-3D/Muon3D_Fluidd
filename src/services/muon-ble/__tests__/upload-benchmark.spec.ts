import { expect, it } from 'vitest'
import { MAX_WRITE_SEGMENT, openBleLink } from '../link'
import { fakeEndpoint, fakePrinter, info } from './fakes'

it('measures the driver pump with immediate fake GATT writes, not radio throughput', async () => {
  const printer = fakePrinter({ infoValue: info(0, MAX_WRITE_SEGMENT) })
  const { endpoint, links } = fakeEndpoint()
  const handle = await openBleLink(endpoint, printer.device)
  const link = links[0]
  const next = link.nextSegment.bind(link)
  const count = 4096
  let remaining = count
  const segment = new Uint8Array(MAX_WRITE_SEGMENT)
  const started = performance.now()
  link.nextSegment = async () => remaining-- > 0 ? segment : next()
  link.retryHandshake()
  while (printer.written.filter(s => s.length === MAX_WRITE_SEGMENT).length < count) await new Promise(resolve => setTimeout(resolve, 0))
  const elapsed = performance.now() - started
  const bytes = count * MAX_WRITE_SEGMENT
  console.info(`BLE_DRIVER_BENCH: ${count} x ${MAX_WRITE_SEGMENT} = ${bytes} bytes in ${elapsed.toFixed(3)} ms = ${(bytes / elapsed / 1000).toFixed(3)} MB/s (immediate fake GATT promises; no radio or QUIC timing)`)
  expect(printer.written.filter(s => s.length === MAX_WRITE_SEGMENT)).toHaveLength(count)
  await handle.disconnect()
})
