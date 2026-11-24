import { LEVEL_PROTECTED } from "/src/store/protection/types.ts";
import { isLockedPath } from "/src/store/protection/helpers.ts";
export const getters = {
  /**
   * Protection is on, whoever is asking.
   */
  isProtected: (state) => {
    return state.status?.level === LEVEL_PROTECTED;
  },
  /**
   * Protection is on and this browser has no identity, so Wi-Fi, the Aux API
   * and updates will refuse it. A paired device is not locked.
   */
  isLocked: (state) => {
    return state.status?.level === LEVEL_PROTECTED && !state.status.callerHasIdentity;
  },
  isLockedPath: (state) => (path) => {
    return isLockedPath(state.status, path);
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdldHRlcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBHZXR0ZXJUcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHsgUHJvdGVjdGlvblN0YXRlIH0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB0eXBlIHsgUm9vdFN0YXRlIH0gZnJvbSAnLi4vdHlwZXMnXG5pbXBvcnQgeyBMRVZFTF9QUk9URUNURUQgfSBmcm9tICcuL3R5cGVzJ1xuaW1wb3J0IHsgaXNMb2NrZWRQYXRoIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5leHBvcnQgY29uc3QgZ2V0dGVyczogR2V0dGVyVHJlZTxQcm90ZWN0aW9uU3RhdGUsIFJvb3RTdGF0ZT4gPSB7XG4gIC8qKlxuICAgKiBQcm90ZWN0aW9uIGlzIG9uLCB3aG9ldmVyIGlzIGFza2luZy5cbiAgICovXG4gIGlzUHJvdGVjdGVkOiAoc3RhdGUpOiBib29sZWFuID0+IHtcbiAgICByZXR1cm4gc3RhdGUuc3RhdHVzPy5sZXZlbCA9PT0gTEVWRUxfUFJPVEVDVEVEXG4gIH0sXG5cbiAgLyoqXG4gICAqIFByb3RlY3Rpb24gaXMgb24gYW5kIHRoaXMgYnJvd3NlciBoYXMgbm8gaWRlbnRpdHksIHNvIFdpLUZpLCB0aGUgQXV4IEFQSVxuICAgKiBhbmQgdXBkYXRlcyB3aWxsIHJlZnVzZSBpdC4gQSBwYWlyZWQgZGV2aWNlIGlzIG5vdCBsb2NrZWQuXG4gICAqL1xuICBpc0xvY2tlZDogKHN0YXRlKTogYm9vbGVhbiA9PiB7XG4gICAgcmV0dXJuIHN0YXRlLnN0YXR1cz8ubGV2ZWwgPT09IExFVkVMX1BST1RFQ1RFRCAmJiAhc3RhdGUuc3RhdHVzLmNhbGxlckhhc0lkZW50aXR5XG4gIH0sXG5cbiAgaXNMb2NrZWRQYXRoOiAoc3RhdGUpID0+IChwYXRoOiBzdHJpbmcpOiBib29sZWFuID0+IHtcbiAgICByZXR1cm4gaXNMb2NrZWRQYXRoKHN0YXRlLnN0YXR1cywgcGF0aClcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFHQSxTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLG9CQUFvQjtBQUV0QixhQUFNLFVBQWtEO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFJN0QsYUFBYSxDQUFDLFVBQW1CO0FBQy9CLFdBQU8sTUFBTSxRQUFRLFVBQVU7QUFBQSxFQUNqQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxVQUFVLENBQUMsVUFBbUI7QUFDNUIsV0FBTyxNQUFNLFFBQVEsVUFBVSxtQkFBbUIsQ0FBQyxNQUFNLE9BQU87QUFBQSxFQUNsRTtBQUFBLEVBRUEsY0FBYyxDQUFDLFVBQVUsQ0FBQyxTQUEwQjtBQUNsRCxXQUFPLGFBQWEsTUFBTSxRQUFRLElBQUk7QUFBQSxFQUN4QztBQUNGOyIsIm5hbWVzIjpbXX0=