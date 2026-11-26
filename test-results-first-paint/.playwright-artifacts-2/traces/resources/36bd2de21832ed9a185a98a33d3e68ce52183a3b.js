import _Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { TinyColor } from "/.vite-e2e/4291/deps/@ctrl_tinycolor.js?v=9b9fafc7";
export class ColorSet {
  logPrefix = "[WEBSOCKET]";
  colorList = {};
  constructor(options) {
    if (options.colorList) {
      for (const item in options.colorList) {
        if ("base" in options.colorList[item]) {
          const opts = options.colorList[item];
          const base = new TinyColor(opts.base).toHsl();
          let h = base.h;
          let l = base.l;
          const s = base.s;
          const hsplit = opts.hsplit || 0;
          const lsplit = opts.lsplit ? opts.lsplit / 100 : 0;
          this.colorList[item] = [
            ...Array(opts.count).keys()
          ].map(() => {
            const color = new TinyColor({ h, s, l }).toHexString();
            h = h + hsplit;
            l = l - lsplit;
            return { color, used: false };
          });
        } else {
          const opts = options.colorList[item];
          this.colorList[item] = opts.map((color) => {
            return { color, used: false };
          });
        }
      }
    }
  }
  /**
   * Get the next unused color in the given list.
   */
  next(list, name) {
    if (this.colorList[list] === void 0) return;
    const namedColor = this.colorList[list].find((color) => color.name === name);
    if (namedColor) {
      return namedColor.color;
    }
    if (this.colorList[list].findIndex((color) => !color.used) >= 0) {
      this.reset(list);
    }
    for (const color of this.colorList[list]) {
      if (color.used) continue;
      if (name) color.name = name;
      color.used = true;
      return color.color;
    }
  }
  /**
   * Reset the used state for all colors given a list.
   */
  reset(list, force = false) {
    if (this.colorList[list] === void 0) return;
    this.colorList[list].forEach((color) => {
      if (!color.name || force) {
        color.used = false;
        delete color.name;
      }
    });
  }
  /**
   * Reset all color sets.
   */
  resetAll() {
    for (const list in this.colorList) {
      this.reset(list);
    }
  }
  /**
   * Force reset all color sets.
   * This also clears colors given a name.
   */
  forceResetAll() {
    for (const list in this.colorList) {
      this.reset(list, true);
    }
  }
}
export const ColorSetPlugin = {
  install(Vue, options) {
    const opts = {
      colorList: {
        heater: { base: "#ff5252", hsplit: 20, count: 3 },
        bed: { base: "#1fb0ff", hsplit: 20, count: 2 },
        fan: ["#3DC25A", "#58FC7C", "#10EB40", "#7EF297"],
        sensor: ["#D67600", "#830EE3", "#B366F2", "#E06573", "#E38819", "#795548", "#607D8B", "#3F51B5"]
      }
    };
    const colorset = new ColorSet({ ...opts, ...options });
    Vue.prototype.$colorset = colorset;
    Vue.$colorset = colorset;
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbG9yU2V0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQSBiYXNpYyBjbGFzcyB0byBtYW5hZ2UgY29sb3Igc3RlcHMgZm9yIG91ciBncmFwaHMuXG4gKi9cbmltcG9ydCBfVnVlIGZyb20gJ3Z1ZSdcbmltcG9ydCB7IFRpbnlDb2xvciB9IGZyb20gJ0BjdHJsL3Rpbnljb2xvcidcblxuZXhwb3J0IGNsYXNzIENvbG9yU2V0IHtcbiAgbG9nUHJlZml4ID0gJ1tXRUJTT0NLRVRdJ1xuICBjb2xvckxpc3Q6IENvbG9yTGlzdCA9IHt9XG5cbiAgY29uc3RydWN0b3IgKG9wdGlvbnM6IENvbG9yU2V0UGx1Z2luT3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLmNvbG9yTGlzdCkge1xuICAgICAgZm9yIChjb25zdCBpdGVtIGluIG9wdGlvbnMuY29sb3JMaXN0KSB7XG4gICAgICAgIGlmICgnYmFzZScgaW4gb3B0aW9ucy5jb2xvckxpc3RbaXRlbV0pIHtcbiAgICAgICAgICBjb25zdCBvcHRzID0gb3B0aW9ucy5jb2xvckxpc3RbaXRlbV0gYXMgQ29sb3JHZW5PcHRpb25cbiAgICAgICAgICAvLyB0aGlzLmNvbG9yTGlzdFtpdGVtXSA9IG5ldyBUaW55Y29sb3Iob3B0cy5iYXNlKS5hbmFsb2dvdXMob3B0cy5jb3VudCwgMjApXG4gICAgICAgICAgLy8gICAubWFwKChjb2xvcjogVGlueUNvbG9yKSA9PiB7XG4gICAgICAgICAgLy8gICAgIC8vIGNvbnN0IGNvbG9yID0gbmV3IFRpbnljb2xvcih7IGg6IG51bSwgczogMC44LCBsOiAwLjggfSkudG9IZXhTdHJpbmcoKVxuICAgICAgICAgIC8vICAgICByZXR1cm4geyBjb2xvcjogY29sb3IudG9IZXhTdHJpbmcoKSwgdXNlZDogZmFsc2UgfVxuICAgICAgICAgIC8vICAgfSlcbiAgICAgICAgICBjb25zdCBiYXNlID0gbmV3IFRpbnlDb2xvcihvcHRzLmJhc2UpLnRvSHNsKClcbiAgICAgICAgICBsZXQgaCA9IGJhc2UuaFxuICAgICAgICAgIGxldCBsID0gYmFzZS5sXG4gICAgICAgICAgY29uc3QgcyA9IGJhc2Uuc1xuICAgICAgICAgIGNvbnN0IGhzcGxpdCA9IG9wdHMuaHNwbGl0IHx8IDBcbiAgICAgICAgICBjb25zdCBsc3BsaXQgPSAob3B0cy5sc3BsaXQpID8gb3B0cy5sc3BsaXQgLyAxMDAgOiAwXG4gICAgICAgICAgLy8gbGV0IHN0YXJ0ID0gMTAwXG4gICAgICAgICAgdGhpcy5jb2xvckxpc3RbaXRlbV0gPSBbXG4gICAgICAgICAgICAuLi5BcnJheShvcHRzLmNvdW50KS5rZXlzKClcbiAgICAgICAgICBdXG4gICAgICAgICAgICAubWFwKCgpID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgY29sb3IgPSBuZXcgVGlueUNvbG9yKHsgaCwgcywgbCB9KS50b0hleFN0cmluZygpXG4gICAgICAgICAgICAgIGggPSBoICsgaHNwbGl0XG4gICAgICAgICAgICAgIGwgPSBsIC0gbHNwbGl0XG4gICAgICAgICAgICAgIHJldHVybiB7IGNvbG9yLCB1c2VkOiBmYWxzZSB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgIC8vIHRoaXMuY29sb3JMaXN0W2l0ZW1dLnVuc2hpZnQoeyBjb2xvcjogb3B0cy5iYXNlLCB1c2VkOiBmYWxzZSB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IG9wdHMgPSBvcHRpb25zLmNvbG9yTGlzdFtpdGVtXSBhcyBzdHJpbmdbXVxuICAgICAgICAgIHRoaXMuY29sb3JMaXN0W2l0ZW1dID0gb3B0cy5tYXAoY29sb3IgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHsgY29sb3IsIHVzZWQ6IGZhbHNlIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbmV4dCB1bnVzZWQgY29sb3IgaW4gdGhlIGdpdmVuIGxpc3QuXG4gICAqL1xuICBuZXh0IChsaXN0OiBzdHJpbmcsIG5hbWU/OiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5jb2xvckxpc3RbbGlzdF0gPT09IHVuZGVmaW5lZCkgcmV0dXJuIC8vIG5vdCBmb3VuZFxuXG4gICAgLy8gUmV0dXJuIGEgbmFtZWQgY29sb3IgaWYgZ2l2ZW5cbiAgICBjb25zdCBuYW1lZENvbG9yID0gdGhpcy5jb2xvckxpc3RbbGlzdF0uZmluZChjb2xvciA9PiBjb2xvci5uYW1lID09PSBuYW1lKVxuICAgIGlmIChuYW1lZENvbG9yKSB7XG4gICAgICByZXR1cm4gbmFtZWRDb2xvci5jb2xvclxuICAgIH1cblxuICAgIC8vIElmIG5vIG1vcmUgY29sb3JzLCByZXNldCBub24gbmFtZWQuXG4gICAgaWYgKHRoaXMuY29sb3JMaXN0W2xpc3RdLmZpbmRJbmRleChjb2xvciA9PiAhY29sb3IudXNlZCkgPj0gMCkge1xuICAgICAgdGhpcy5yZXNldChsaXN0KVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgY29sb3Igb2YgdGhpcy5jb2xvckxpc3RbbGlzdF0pIHtcbiAgICAgIGlmIChjb2xvci51c2VkKSBjb250aW51ZVxuICAgICAgaWYgKG5hbWUpIGNvbG9yLm5hbWUgPSBuYW1lXG4gICAgICBjb2xvci51c2VkID0gdHJ1ZVxuICAgICAgcmV0dXJuIGNvbG9yLmNvbG9yXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSB1c2VkIHN0YXRlIGZvciBhbGwgY29sb3JzIGdpdmVuIGEgbGlzdC5cbiAgICovXG4gIHJlc2V0IChsaXN0OiBzdHJpbmcsIGZvcmNlID0gZmFsc2UpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jb2xvckxpc3RbbGlzdF0gPT09IHVuZGVmaW5lZCkgcmV0dXJuIC8vIG5vdCBmb3VuZFxuICAgIHRoaXMuY29sb3JMaXN0W2xpc3RdLmZvckVhY2goY29sb3IgPT4ge1xuICAgICAgLy8gZG9uJ3QgcmVzZXQgY29sb3JzIHRoYXQgaGF2ZSBhIG5hbWUsIHVubGVzcyBmb3JjZWQuXG4gICAgICBpZiAoIWNvbG9yLm5hbWUgfHwgZm9yY2UpIHtcbiAgICAgICAgY29sb3IudXNlZCA9IGZhbHNlXG4gICAgICAgIGRlbGV0ZSBjb2xvci5uYW1lXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCBhbGwgY29sb3Igc2V0cy5cbiAgICovXG4gIHJlc2V0QWxsICgpOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IGxpc3QgaW4gdGhpcy5jb2xvckxpc3QpIHtcbiAgICAgIHRoaXMucmVzZXQobGlzdClcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRm9yY2UgcmVzZXQgYWxsIGNvbG9yIHNldHMuXG4gICAqIFRoaXMgYWxzbyBjbGVhcnMgY29sb3JzIGdpdmVuIGEgbmFtZS5cbiAgICovXG4gIGZvcmNlUmVzZXRBbGwgKCk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgbGlzdCBpbiB0aGlzLmNvbG9yTGlzdCkge1xuICAgICAgdGhpcy5yZXNldChsaXN0LCB0cnVlKVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY29uc3QgQ29sb3JTZXRQbHVnaW4gPSB7XG4gIGluc3RhbGwgKFZ1ZTogdHlwZW9mIF9WdWUsIG9wdGlvbnM/OiBDb2xvclNldFBsdWdpbk9wdGlvbnMpIHtcbiAgICAvLyBQcm92aWRlIGEgc3BlY2lmaWMgbGlzdCwgb3IgYW4gb3B0aW9uIG9iamVjdCB0b1xuICAgIC8vIGRlZmluZSB0aGUgY29sb3IgbGlzdHMuXG4gICAgY29uc3Qgb3B0czogQ29sb3JTZXRQbHVnaW5PcHRpb25zID0ge1xuICAgICAgY29sb3JMaXN0OiB7XG4gICAgICAgIGhlYXRlcjogeyBiYXNlOiAnI2ZmNTI1MicsIGhzcGxpdDogMjAsIGNvdW50OiAzIH0sXG4gICAgICAgIGJlZDogeyBiYXNlOiAnIzFmYjBmZicsIGhzcGxpdDogMjAsIGNvdW50OiAyIH0sXG4gICAgICAgIGZhbjogWycjM0RDMjVBJywgJyM1OEZDN0MnLCAnIzEwRUI0MCcsICcjN0VGMjk3J10sXG4gICAgICAgIHNlbnNvcjogWycjRDY3NjAwJywgJyM4MzBFRTMnLCAnI0IzNjZGMicsICcjRTA2NTczJywgJyNFMzg4MTknLCAnIzc5NTU0OCcsICcjNjA3RDhCJywgJyMzRjUxQjUnXVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBjb2xvcnNldCA9IG5ldyBDb2xvclNldCh7IC4uLm9wdHMsIC4uLm9wdGlvbnMgfSlcbiAgICBWdWUucHJvdG90eXBlLiRjb2xvcnNldCA9IGNvbG9yc2V0XG4gICAgVnVlLiRjb2xvcnNldCA9IGNvbG9yc2V0XG4gIH1cbn1cbmRlY2xhcmUgbW9kdWxlICd2dWUvdHlwZXMvdnVlJyB7XG4gIGludGVyZmFjZSBWdWUge1xuICAgICRjb2xvcnNldDogQ29sb3JTZXQ7XG4gIH1cblxuICBpbnRlcmZhY2UgVnVlQ29uc3RydWN0b3Ige1xuICAgICRjb2xvcnNldDogQ29sb3JTZXQ7XG4gIH1cbn1cblxuaW50ZXJmYWNlIENvbG9yU2V0UGx1Z2luT3B0aW9ucyB7XG4gIGNvbG9yTGlzdD86IENvbG9yTGlzdE9wdGlvbjtcbn1cblxuaW50ZXJmYWNlIENvbG9yTGlzdE9wdGlvbiB7XG4gIFtpbmRleDogc3RyaW5nXTogc3RyaW5nW10gfCBDb2xvckdlbk9wdGlvbjtcbn1cblxuaW50ZXJmYWNlIENvbG9yR2VuT3B0aW9uIHtcbiAgYmFzZTogc3RyaW5nO1xuICBjb3VudDogbnVtYmVyO1xuICBoc3BsaXQ/OiBudW1iZXI7XG4gIGxzcGxpdD86IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIENvbG9yTGlzdCB7XG4gIFtpbmRleDogc3RyaW5nXTogQ29sb3JbXTtcbn1cblxuaW50ZXJmYWNlIENvbG9yIHtcbiAgbmFtZT86IHN0cmluZzsgLy8gYWxsb3cgbG9va3VwcyBvZiBhIGNvbG9yIGdpdmVuIGl0cyBuYW1lLlxuICBjb2xvcjogc3RyaW5nO1xuICB1c2VkOiBib29sZWFuO1xufVxuIl0sIm1hcHBpbmdzIjoiQUFHQSxPQUFPLFVBQVU7QUFDakIsU0FBUyxpQkFBaUI7QUFFbkIsYUFBTSxTQUFTO0FBQUEs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