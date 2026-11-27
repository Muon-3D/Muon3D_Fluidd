<!--
  The console's sign-in page (WEB-12, muon-link-cloud#15), now the one
  MUON3D sign-in for every surface (KAN-6114): Control, Library, the slicer
  and Models all end up here, and nowhere else.

  `/authorize` sends a browser with no console session here, with `continue`
  set to the `/authorize?...` it came from. The card (`SignInCard`) signs the
  person in, turns that into the console's browser session with a handoff
  (`POST /v1/handoff`, then `GET /handoff?code=&next=`), and the console
  carries on to `continue`, which now finds a session and returns to the
  surface that asked. A person who already has a console session never sees
  this page: `/authorize` answers them silently (`prompt=none`) or with a
  code at once.

  `continue` is followed only if it begins `/authorize?` (`safeContinue`).
  Anything else, or none, still signs in, and then asks `/authorize` itself
  for this page, so the person lands signed in to Control. The session made
  here exists only for the handoff, and is ended as soon as the handoff is
  in hand (KAN-532), so it never shows in the person's devices.

  `?mode=forgot` and `?mode=sign-up` open the card on that step.
-->
<template>
  <sign-in-card
    :continue-path="continuePath"
    :initial-mode="initialMode"
    :arrival-error="arrivalError"
  />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import SignInCard from '@/components/auth/SignInCard.vue'
import { safeContinue } from '@/services/muon-cloud/centralLogin'

@Component({ components: { SignInCard } })
export default class SignIn extends Vue {
  /** Where the console carries on after the handoff, if it is one it may. */
  get continuePath (): string | null {
    return safeContinue(this.$route.query.continue)
  }

  get initialMode (): 'sign-in' | 'sign-up' | 'forgot' {
    const mode = this.$route.query.mode
    return mode === 'forgot' || mode === 'sign-up' ? mode : 'sign-in'
  }

  get arrivalError (): string {
    const error = this.$route.query.error
    return typeof error === 'string' ? error : ''
  }
}
</script>
