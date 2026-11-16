/**
 * The ports one e2e run uses. Parallel runs (one per worker or worktree) each
 * set their own, or they share a mock printer and a vite and collide:
 *
 *   E2E_PORT=8211 E2E_MOCK_PORT=7211 npm run test:e2e -- control/jobs
 */
export const VITE_PORT = Number(process.env.E2E_PORT || 8090)
export const MOCK_PORT = Number(process.env.E2E_MOCK_PORT || 7125)
