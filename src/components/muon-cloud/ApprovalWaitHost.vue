<template>
  <approval-wait-dialog
    v-if="approval"
    :key="approvalKey"
    :watch="approval"
    :printer-name="name"
    @close="approval = null"
    @retry="retry"
  />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { activateCloudPrinter, activationState } from '@/services/muon-cloud/activate'
import type { ApprovalWatch } from '@/services/muon-cloud/approval'
import { printerName } from '@/services/muon-cloud/state'
import ApprovalWaitDialog from '@/components/muon-cloud/ApprovalWaitDialog.vue'

const approvalIds = new WeakMap<ApprovalWatch, number>()
let approvalCount = 0

/**
 * Where the wait for approval at the printer shows (I-170), whichever page the person is on:
 * "Pair this browser" is pressed from a menu, not only from a printer's opening page.
 */
@Component({ components: { ApprovalWaitDialog } })
export default class ApprovalWaitHost extends Vue {
  get approval (): ApprovalWatch | null {
    return activationState.approval
  }

  set approval (watch: ApprovalWatch | null) {
    activationState.approval = watch
  }

  /** A new wait is a new dialog, not the last one with new props. */
  get approvalKey (): number {
    if (!this.approval) return 0
    if (!approvalIds.has(this.approval)) approvalIds.set(this.approval, ++approvalCount)
    return approvalIds.get(this.approval) as number
  }

  get name (): string {
    const id = activationState.approvalFor
    return (id && printerName(id)) || 'the printer'
  }

  retry () {
    const id = activationState.approvalFor
    activationState.approval = null
    activationState.error = null
    if (id) activateCloudPrinter(id).catch(() => {})
  }
}
</script>
