// Imported first by main.ts: a return from accounts is read and scrubbed from the address before the router,
// the store or anything else sees it (KAN-7197).
import { captureCallbackEarly } from './centralLogin'

captureCallbackEarly()
