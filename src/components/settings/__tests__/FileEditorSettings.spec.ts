import { shallowMount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import FileEditorSettings from '../FileEditorSettings.vue'
import SegPicker from '@/components/control/SegPicker.vue'
import { defaultState } from '@/store/config/state'

function show (editor: Record<string, unknown>) {
  const config = defaultState()
  Object.assign(config.uiSettings.editor, editor)
  const dispatch = vi.fn()
  const wrapper = shallowMount(FileEditorSettings, { mocks: { $store: { state: { config }, dispatch }, $t: (key: string) => key } })
  const picker = (label: string) => wrapper.findAllComponents(SegPicker).wrappers.find(w => w.props('label') === label)!
  return { wrapper, dispatch, picker }
}

it.each([
  { saveAndRestart: undefined, textSize: undefined },
  { saveAndRestart: 'sometimes', textSize: 'giant' }
])('renders legacy or invalid editor settings as Ask and Normal without saving: %j', editor => {
  const { wrapper, dispatch, picker } = show(editor)
  expect(picker('Save and restart').props('value')).toBe('ask')
  expect(picker('Text size').props('value')).toBe('normal')
  expect(wrapper.get('[data-tid="editor-text-size-preview"]').attributes('style')).toContain('font-size: 16px')
  expect(dispatch).not.toHaveBeenCalled()
  wrapper.destroy()
})

it.each([
  { saveAndRestart: 'always', textSize: 'large', px: 20 },
  { saveAndRestart: 'never', textSize: 'small', px: 13 }
])('renders stored editor choices without rewriting them: %j', ({ saveAndRestart, textSize, px }) => {
  const { wrapper, dispatch, picker } = show({ saveAndRestart, textSize })
  expect(picker('Save and restart').props('value')).toBe(saveAndRestart)
  expect(picker('Text size').props('value')).toBe(textSize)
  expect(wrapper.get('[data-tid="editor-text-size-preview"]').attributes('style')).toContain(`font-size: ${px}px`)
  expect(dispatch).not.toHaveBeenCalled()
  wrapper.destroy()
})

it('writes each row only to its existing printer setting', () => {
  const { wrapper, dispatch, picker } = show({})
  picker('Save and restart').vm.$emit('input', 'never')
  picker('Text size').vm.$emit('input', 'small')
  expect(dispatch.mock.calls).toEqual([
    ['config/saveByPath', { path: 'uiSettings.editor.saveAndRestart', value: 'never', server: true }],
    ['config/saveByPath', { path: 'uiSettings.editor.textSize', value: 'small', server: true }]
  ])
  wrapper.destroy()
})
