import type { GetterTree } from 'vuex'
import type { WebcamConfig, WebcamsState } from './types'
import type { RootState } from '../types'
import { orderCameras } from '@/services/camera/order'

export const getters: GetterTree<WebcamsState, RootState> = {
  getWebcams: (state, _getters, rootState) => {
    // The saved order (Settings > Cameras); cameras it doesn't name go last, by name.
    return orderCameras(state.webcams, rootState.config?.uiSettings?.general?.cameraOrder)
  },

  getEnabledWebcams: (state, getters) => {
    const webcams = getters.getWebcams as WebcamConfig[]

    return webcams
      .filter(webcam => webcam.enabled)
  },

  getVisibleWebcams: (state, getters) => {
    const enabledWebcams = getters.getEnabledWebcams as WebcamConfig[]

    return state.activeWebcam === 'all'
      ? enabledWebcams
      : enabledWebcams
        .filter(webcam => webcam.uid === state.activeWebcam)
  },

  getWebcamById: (state) => (id: string) => {
    return state.webcams.find(webcam => webcam.uid === id)
  }
}
