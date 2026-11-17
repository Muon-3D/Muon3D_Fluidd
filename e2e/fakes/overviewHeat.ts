import store from '@/store'

let releaseHistory = () => {}

export async function seedHeat (mode: 'normal' | 'empty' | 'invalid' = 'normal') {
  while (!store.state.charts.ready) await new Promise(resolve => setTimeout(resolve, 25))
  releaseHistory()
  const now = Date.now()
  const points = mode === 'invalid' ? [{ date: new Date(now), extruder: NaN, extruderTarget: 200, heater_bed: 60, heater_bedTarget: Infinity }] : mode === 'empty' ? [] : Array.from({ length: 600 }, (_, i) => {
    const section = Math.floor(i / 150)
    return { date: new Date(now - (599 - i) * 1000), extruder: [20, 100, 200, 220][section], extruderTarget: section ? 200 : 0, heater_bed: [22, 35, 60, 70][section], heater_bedTarget: section ? 60 : 0 }
  })
  store.commit('charts/setChartStore', points)
  releaseHistory = store.subscribe(mutation => {
    if (mutation.type === 'charts/setChartEntry' && mutation.payload?.type === 'chart') store.commit('charts/setChartStore', points)
  })
}

export function lightTheme (light: boolean) { return store.dispatch('config/updateTheme', { isDark: !light }) }

export function forgetFileEstimate () { store.commit('printer/setResetCurrentFile') }
