import { describe, expect, it } from 'vitest'
import { currentStep, frameSteps, previousStep } from '../steps'
import type { SetupState } from '../types'
import newState from './fixtures/state.01-new.json'
import networkPhone from './fixtures/state.02-network-phone-driver.json'
import linkCode from './fixtures/state.06-remote-link-code.json'
import readySelfTest from './fixtures/state.07-ready-self-test.json'
import completeWithSkips from './fixtures/state.08-complete-with-skips.json'

const copy = (fixture: unknown): SetupState => JSON.parse(JSON.stringify(fixture))

describe('the setup frame steps', () => {
  it('lists Welcome, the printer\'s steps and Finish, with Welcome current before Start', () => {
    const steps = frameSteps(copy(newState), 'S1')
    expect(steps.map(s => s.label)).toEqual([
      'Welcome', 'Wi-Fi', 'Name your printer', 'Updates', 'Your account', 'First calibration', 'Finish'
    ])
    expect(steps.map(s => s.status)).toEqual(['on', 'todo', 'todo', 'todo', 'todo', 'todo', 'todo'])
  })

  it('marks the steps before the cursor done, and the cursor current', () => {
    const steps = frameSteps(copy(linkCode), 'S6')
    expect(steps.find(s => s.status === 'on')?.id).toBe('remote')
    expect(steps.filter(s => s.status === 'done').map(s => s.id)).toEqual(['welcome', 'network', 'name', 'update'])
  })

  it('leaves hidden steps out', () => {
    const state = copy(networkPhone)
    state.steps.update.status = 'hidden'
    expect(frameSteps(state, 'S3').map(s => s.id)).not.toContain('update')
  })

  it('is on Finish once setup is complete', () => {
    expect(currentStep(copy(completeWithSkips), 'S10')).toBe('finish')
    expect(currentStep(null, 'S0')).toBe('welcome')
  })
})

describe('Back', () => {
  it('goes to the nearest earlier step that is done or skipped', () => {
    expect(previousStep(copy(linkCode))).toBe('update')
    expect(previousStep(copy(readySelfTest))).toBe('remote')
  })

  it('has nowhere to go from Wi-Fi, or once setup is complete', () => {
    expect(previousStep(copy(networkPhone))).toBeNull()
    expect(previousStep(copy(completeWithSkips))).toBeNull()
  })
})
