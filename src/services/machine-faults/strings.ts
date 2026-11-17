/**
 * The words for the printer's machine faults (KAN-3418).
 *
 * They mirror the printer's own screen so the panel and Control say the same
 * thing. Source: MuonUI, branch feat/KAN-3387-machine-fault-alert (spec
 * spec-KAN-3387-machine-fault-alert.md; the panel's strings file was not on
 * the branch yet when this was written, so these follow the spec and the
 * KAN-3418 ticket). When the panel's strings land, change them here and in
 * nowhere else.
 */
export const BED_POWER_FAULT = 'Bed power cut, check the bed and its cable, then Reset'
export const BED_POWER_AGAIN = 'Bed power cut again: turn it off and check'

export const RESET_LABEL = 'Reset'
export const RESET_TITLE = 'Reset bed power?'
export const RESET_MESSAGE = 'This turns the bed power back on. Only do this after checking the bed and its cable.'
export const RESET_CANCEL = 'Cancel'
export const RESET_WHILE_PRINTING = 'Bed power can be reset when the print has stopped.'
export const RESET_FAILED = "Couldn't reset the bed power. Try again, or reset it at the printer."

export const FAN_FAULT = 'Hot-end fan fault, check the fan'
export const HOTEND_FAILED = 'The hot end sensor is faulty'

/** What a fault code this build doesn't know is called: the code itself, in words. */
export const unknownFault = (code: string): string => `Printer fault: ${code.replace(/_/g, ' ')}`

/** The shortest form, for a printer's card in the list. */
export const BED_POWER_SHORT = 'Bed power cut'
