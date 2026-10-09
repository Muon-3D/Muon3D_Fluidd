// Copies the Apache-2.0 parts of @muon3d/printer-client that Fluidd's /slice
// host needs into src/services/slicer-bridge/vendor/printer-client/, so the
// copies are made the same way every time:
//
//   node tools/vendor-printer-client.cjs <the package's folder>
//
// Each copied .ts file names its source by the package's version (its
// package.json), never by a commit of the repository it came from.
//
// What is copied: the bridge's host helper and protocol (createBridgeHost and
// its validators), the multipart builder, checker and name rules, the error
// kinds and parsers, and the bridge's conformance vectors. Two mechanical
// changes make them build under Fluidd's TypeScript settings and browser
// target, and each changed file says so (Apache-2.0 §4(b)):
//
// - relative imports lose their ".ts" suffix (Fluidd does not set
//   allowImportingTsExtensions);
// - Object.hasOwn(a, b) becomes Object.prototype.hasOwnProperty.call(a, b)
//   (ES2022, beyond Fluidd's ES2020 target).
//
// The package's LICENSE and NOTICE are copied beside them.
const fs = require('fs')
const path = require('path')

const FILES = [
  'src/bridge/host.ts',
  'src/bridge/protocol.ts',
  'src/bridge/vectors/handshake.json',
  'src/bridge/vectors/host.json',
  'src/bridge/vectors/messages.json',
  'src/errors/kinds.ts',
  'src/errors/parse.ts',
  'src/multipart/build.ts',
  'src/multipart/bytes.ts',
  'src/multipart/check.ts',
  'src/multipart/names.ts',
  'LICENSE',
  'NOTICE'
]

const OUT = path.resolve(__dirname, '..', 'src', 'services', 'slicer-bridge', 'vendor', 'printer-client')

/** The file with Fluidd's two changes, and the notice that says what changed. */
function adapt (text, rel, version) {
  let changed = text
    .replace(/(from\s+'\.{1,2}\/[^']+)\.ts'/g, "$1'")
    .replace(/Object\.hasOwn\(/g, 'Object.prototype.hasOwnProperty.call(')
  const notice = [
    `// Vendored from @muon3d/printer-client ${version} (${rel}), Copyright 2026 Muon 3D`,
    '// Technologies Limited, under the Apache License 2.0 (vendor/printer-client/LICENSE and NOTICE). Changed for',
    '// Fluidd by tools/vendor-printer-client.cjs: relative imports without ".ts"; Object.hasOwn as hasOwnProperty.call.'
  ].join('\n')
  const lines = changed.split('\n')
  const at = lines[0].startsWith('// SPDX-License-Identifier') ? 1 : 0
  lines.splice(at, 0, notice)
  changed = lines.join('\n')
  return changed
}

function main () {
  const [from, extra] = process.argv.slice(2)
  if (!from || extra) {
    console.error('Usage: node tools/vendor-printer-client.cjs <the package folder>')
    process.exit(2)
  }
  const root = path.resolve(from)
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  if (pkg.name !== '@muon3d/printer-client' || typeof pkg.version !== 'string') {
    console.error(`${root} is not @muon3d/printer-client`)
    process.exit(2)
  }
  for (const rel of FILES) {
    const source = path.join(root, rel)
    const target = path.join(OUT, rel.replace(/^src\//, ''))
    fs.mkdirSync(path.dirname(target), { recursive: true })
    const text = fs.readFileSync(source, 'utf8')
    fs.writeFileSync(target, rel.endsWith('.ts') ? adapt(text, rel, pkg.version) : text)
  }
  console.log(`Vendored ${FILES.length} files into ${path.relative(process.cwd(), OUT)}`)
}

main()
