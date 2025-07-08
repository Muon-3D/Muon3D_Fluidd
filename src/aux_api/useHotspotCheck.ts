import { ref, onMounted } from 'vue'
import axios from 'axios'

export function useHotspotCheck() {
  // `true` = on hotspot, `false` = not, `null` = still testing
  const onHotspot = ref<boolean|null>(null)

  async function check() {
    try {
      // HEAD is lighter than GET; timeout in 2s
      await axios.head('http://10.42.0.1/', {
        timeout: 2000,
        // if your hotspot doesn’t serve CORS headers, you can still proceed:
        validateStatus: () => true,  
      })
      // any response (2xx/3xx/4xx/5xx) means the host answered → hotspot up
      onHotspot.value = true
    } catch (err) {
      // network error or timeout → hotspot unreachable
      onHotspot.value = false
    }
  }

  onMounted(check)
  return { onHotspot, check }
}