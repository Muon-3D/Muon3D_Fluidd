import __vite__cjsImport0_semver from "/.vite-e2e/4291/deps/semver.js?v=9b9fafc7"; const valid = __vite__cjsImport0_semver["valid"]; const gt = __vite__cjsImport0_semver["gt"];
export const getters = {
  /**
   * Returns an array list of available components
   */
  getVisibleComponents: (state) => {
    const o = Object.keys(state.version_info).map((k) => {
      const r = state.version_info[k];
      r.key = k;
      return r;
    }).sort((a, b) => a.key.localeCompare(b.key));
    return o;
  },
  /**
   * Returns an object indicating if any component (but system) has an update.
   */
  hasUpdates: (state, getters2, rootState) => {
    const enableNotifications = rootState.config.uiSettings.general.enableVersionNotifications;
    return enableNotifications && Object.keys(state.version_info).filter((component) => component !== "system").some(getters2.hasUpdate);
  },
  /**
   * Returns a boolean indicating if a given component has an update.
   */
  hasUpdate: (state) => (component) => {
    const componentVersionInfo = state.version_info[component];
    if ("name" in componentVersionInfo) {
      const version = valid(componentVersionInfo.version);
      const remoteVersion = valid(componentVersionInfo.remote_version);
      if (version && remoteVersion) {
        return gt(remoteVersion, version);
      }
    } else if ("package_count" in componentVersionInfo) {
      return componentVersionInfo.package_count > 0;
    }
    if ("current_hash" in componentVersionInfo && "remote_hash" in componentVersionInfo) {
      return componentVersionInfo.current_hash !== componentVersionInfo.remote_hash;
    }
    return false;
  },
  getResponses: (state) => {
    return [...state.responses];
  },
  /**
   * Returns commit history grouped by day.
   */
  getCommitHistory: (state) => (component) => {
    const componentVersionInfo = state.version_info[component];
    if (componentVersionInfo && "git_messages" in componentVersionInfo) {
      const result = [...componentVersionInfo.commits_behind].reduce((groups, commitItem) => {
        const dateAndTime = new Date(+commitItem.date * 1e3);
        const dateOnly = +new Date(dateAndTime.getFullYear(), dateAndTime.getMonth(), dateAndTime.getDate());
        if (dateOnly in groups) {
          groups[dateOnly].push(commitItem);
        } else {
          groups[dateOnly] = [commitItem];
        }
        return groups;
      }, {});
      return {
        keys: Object.keys(result).map((key) => parseInt(key)).sort().reverse(),
        result
      };
    }
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdldHRlcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBHZXR0ZXJUcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHsgQ29tbWl0SXRlbSwgVmVyc2lvblN0YXRlIH0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB0eXBlIHsgUm9vdFN0YXRlIH0gZnJvbSAnLi4vdHlwZXMnXG5pbXBvcnQgeyB2YWxpZCwgZ3QgfSBmcm9tICdzZW12ZXInXG5cbmV4cG9ydCBjb25zdCBnZXR0ZXJzOiBHZXR0ZXJUcmVlPFZlcnNpb25TdGF0ZSwgUm9vdFN0YXRlPiA9IHtcbiAgLyoqXG4gICAqIFJldHVybnMgYW4gYXJyYXkgbGlzdCBvZiBhdmFpbGFibGUgY29tcG9uZW50c1xuICAgKi9cbiAgZ2V0VmlzaWJsZUNvbXBvbmVudHM6IChzdGF0ZSkgPT4ge1xuICAgIGNvbnN0IG8gPSBPYmplY3Qua2V5cyhzdGF0ZS52ZXJzaW9uX2luZm8pXG4gICAgICAubWFwKGsgPT4ge1xuICAgICAgICBjb25zdCByID0gc3RhdGUudmVyc2lvbl9pbmZvW2tdXG4gICAgICAgIHIua2V5ID0ga1xuICAgICAgICByZXR1cm4gclxuICAgICAgfSlcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBhLmtleS5sb2NhbGVDb21wYXJlKGIua2V5KSlcblxuICAgIHJldHVybiBvXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gb2JqZWN0IGluZGljYXRpbmcgaWYgYW55IGNvbXBvbmVudCAoYnV0IHN5c3RlbSkgaGFzIGFuIHVwZGF0ZS5cbiAgICovXG4gIGhhc1VwZGF0ZXM6IChzdGF0ZSwgZ2V0dGVycywgcm9vdFN0YXRlKSA9PiB7XG4gICAgY29uc3QgZW5hYmxlTm90aWZpY2F0aW9ucyA9IHJvb3RTdGF0ZS5jb25maWcudWlTZXR0aW5ncy5nZW5lcmFsLmVuYWJsZVZlcnNpb25Ob3RpZmljYXRpb25zXG5cbiAgICByZXR1cm4gKFxuICAgICAgZW5hYmxlTm90aWZpY2F0aW9ucyAmJlxuICAgICAgT2JqZWN0LmtleXMoc3RhdGUudmVyc2lvbl9pbmZvKVxuICAgICAgICAuZmlsdGVyKGNvbXBvbmVudCA9PiBjb21wb25lbnQgIT09ICdzeXN0ZW0nKVxuICAgICAgICAuc29tZShnZXR0ZXJzLmhhc1VwZGF0ZSlcbiAgICApXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBib29sZWFuIGluZGljYXRpbmcgaWYgYSBnaXZlbiBjb21wb25lbnQgaGFzIGFuIHVwZGF0ZS5cbiAgICovXG4gIGhhc1VwZGF0ZTogKHN0YXRlKSA9PiAoY29tcG9uZW50OiBzdHJpbmcpOiBib29sZWFuID0+IHtcbiAgICBjb25zdCBjb21wb25lbnRWZXJzaW9uSW5mbyA9IHN0YXRlLnZlcnNpb25faW5mb1tjb21wb25lbnRdXG5cbiAgICBpZiAoJ25hbWUnIGluIGNvbXBvbmVudFZlcnNpb25JbmZvKSB7XG4gICAgICBjb25zdCB2ZXJzaW9uID0gdmFsaWQoY29tcG9uZW50VmVyc2lvbkluZm8udmVyc2lvbilcbiAgICAgIGNvbnN0IHJlbW90ZVZlcnNpb24gPSB2YWxpZChjb21wb25lbnRWZXJzaW9uSW5mby5yZW1vdGVfdmVyc2lvbilcbiAgICAgIGlmICh2ZXJzaW9uICYmIHJlbW90ZVZlcnNpb24pIHtcbiAgICAgICAgcmV0dXJuIGd0KHJlbW90ZVZlcnNpb24sIHZlcnNpb24pXG4gICAgICB9XG4gICAgfSBlbHNlIGlmICgncGFja2FnZV9jb3VudCcgaW4gY29tcG9uZW50VmVyc2lvbkluZm8pIHtcbiAgICAgIHJldHVybiBjb21wb25lbnRWZXJzaW9uSW5mby5wYWNrYWdlX2NvdW50ID4gMFxuICAgIH1cblxuICAgIGlmICgnY3VycmVudF9oYXNoJyBpbiBjb21wb25lbnRWZXJzaW9uSW5mbyAmJiAncmVtb3RlX2hhc2gnIGluIGNvbXBvbmVudFZlcnNpb25JbmZvKSB7XG4gICAgICByZXR1cm4gY29tcG9uZW50VmVyc2lvbkluZm8uY3VycmVudF9oYXNoICE9PSBjb21wb25lbnRWZXJzaW9uSW5mby5yZW1vdGVfaGFzaFxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxuICB9LFxuXG4gIGdldFJlc3BvbnNlczogKHN0YXRlKSA9PiB7XG4gICAgcmV0dXJuIFsuLi5zdGF0ZS5yZXNwb25zZXNdXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgY29tbWl0IGhpc3RvcnkgZ3JvdXBlZCBieSBkYXkuXG4gICAqL1xuICBnZXRDb21taXRIaXN0b3J5OiAoc3RhdGUpID0+IChjb21wb25lbnQ6IHN0cmluZykgPT4ge1xuICAgIC8vIFRoaXMgaXMgb25seSByZWxldmFudCBmb3IgY2VydGFpbiB0eXBlcy5cbiAgICBjb25zdCBjb21wb25lbnRWZXJzaW9uSW5mbyA9IHN0YXRlLnZlcnNpb25faW5mb1tjb21wb25lbnRdXG4gICAgaWYgKGNvbXBvbmVudFZlcnNpb25JbmZvICYmICdnaXRfbWVzc2FnZXMnIGluIGNvbXBvbmVudFZlcnNpb25JbmZvKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBbLi4uY29tcG9uZW50VmVyc2lvbkluZm8uY29tbWl0c19iZWhpbmRdXG4gICAgICAgIC5yZWR1Y2UoKGdyb3VwcywgY29tbWl0SXRlbSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGRhdGVBbmRUaW1lID0gbmV3IERhdGUoK2NvbW1pdEl0ZW0uZGF0ZSAqIDEwMDApXG4gICAgICAgICAgY29uc3QgZGF0ZU9ubHkgPSArKG5ldyBEYXRlKGRhdGVBbmRUaW1lLmdldEZ1bGxZZWFyKCksIGRhdGVBbmRUaW1lLmdldE1vbnRoKCksIGRhdGVBbmRUaW1lLmdldERhdGUoKSkpXG5cbiAgICAgICAgICBpZiAoZGF0ZU9ubHkgaW4gZ3JvdXBzKSB7XG4gICAgICAgICAgICBncm91cHNbZGF0ZU9ubHldLnB1c2goY29tbWl0SXRlbSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ3JvdXBzW2RhdGVPbmx5XSA9IFtjb21taXRJdGVtXVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBncm91cHNcbiAgICAgICAgfSwge30gYXMgUmVjb3JkPG51bWJlciwgQ29tbWl0SXRlbVtdPilcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGtleXM6IE9iamVjdFxuICAgICAgICAgIC5rZXlzKHJlc3VsdClcbiAgICAgICAgICAubWFwKGtleSA9PiBwYXJzZUludChrZXkpKVxuICAgICAgICAgIC5zb3J0KClcbiAgICAgICAgICAucmV2ZXJzZSgpLFxuICAgICAgICByZXN1bHRcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6IkFBR0EsU0FBUyxPQUFPLFVBQVU7QUFFbkIsYUFBTSxVQUErQztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBSTFELHNCQUFzQixDQUFDLFVBQVU7QUFDL0IsVUFBTSxJQUFJLE9BQU8sS0FBSyxNQUFNLFlBQVksRUFDckMsSUFBSSxPQUFLO0FBQ1IsWUFBTSxJQUFJLE1BQU0sYUFBYSxDQUFDO0FBQzlCLFFBQUUsTUFBTTtBQUNSLGFBQU87QUFBQSxJQUNULENBQUMsRUFDQSxLQUFLLENBQUMsR0FBRyxNQUFNLEVBQUUsSUFBSSxjQUFjLEVBQUUsR0FBRyxDQUFDO0FBRTVDLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxZQUFZLENBQUMsT0FBT0EsVUFBUyxjQUFjO0FBQ3pDLFVBQU0sc0JBQXNCLFVBQVUsT0FBTyxXQUFXLFFBQVE7QUFFaEUsV0FDRSx1QkFDQSxPQUFPLEtBQUssTUFBTSxZQUFZLEVBQzNCLE9BQU8sZUFBYSxjQUFjLFFBQVEsRUFDMUMsS0FBS0EsU0FBUSxTQUFTO0FBQUEsRUFFN0I7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLFdBQVcsQ0FBQyxVQUFVLENBQUMsY0FBK0I7QUFDcEQsVUFBTSx1QkFBdUIsTUFBTSxhQUFhLFNBQVM7QUFFekQsUUFBSSxVQUFVLHNCQUFzQjtBQUNsQyxZQUFNLFVBQVUsTUFBTSxxQkFBcUIsT0FBTztBQUNsRCxZQUFNLGdCQUFnQixNQUFNLHFCQUFxQixjQUFjO0FBQy9ELFVBQUksV0FBVyxlQUFlO0FBQzVCLGVBQU8sR0FBRyxlQUFlLE9BQU87QUFBQSxNQUNsQztBQUFBLElBQ0YsV0FBVyxtQkFBbUIsc0JBQXNCO0FBQ2xELGFBQU8scUJBQXFCLGdCQUFnQjtBQUFBLElBQzlDO0FBRUEsUUFBSSxrQkFBa0Isd0JBQXdCLGlCQUFpQixzQkFBc0I7QUFDbkYsYUFBTyxxQkFBcUIsaUJBQWlCLHFCQUFxQjtBQUFBLElBQ3BFO0FBRUEsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLGNBQWMsQ0FBQyxVQUFVO0FBQ3ZCLFdBQU8sQ0FBQyxHQUFHLE1BQU0sU0FBUztBQUFBLEVBQzVCO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsY0FBc0I7QUFFbEQsVUFBTSx1QkFBdUIsTUFBTSxhQUFhLFNBQVM7QUFDekQsUUFBSSx3QkFBd0Isa0JBQWtCLHNCQUFzQjtBQUNsRSxZQUFNLFNBQVMsQ0FBQyxHQUFHLHFCQUFxQixjQUFjLEVBQ25ELE9BQU8sQ0FBQyxRQUFRLGVBQWU7QUFDOUIsY0FBTSxjQUFjLElBQUksS0FBSyxDQUFDLFdBQVcsT0FBTyxHQUFJO0FBQ3BELGNBQU0sV0FBVyxDQUFFLElBQUksS0FBSyxZQUFZLFlBQVksR0FBRyxZQUFZLFNBQVMsR0FBRyxZQUFZLFFBQVEsQ0FBQztBQUVwRyxZQUFJLFlBQVksUUFBUTtBQUN0QixpQkFBTyxRQUFRLEVBQUUsS0FBSyxVQUFVO0FBQUEsUUFDbEMsT0FBTztBQUNMLGlCQUFPLFFBQVEsSUFBSSxDQUFDLFVBQVU7QUFBQSxRQUNoQztBQUVBLGVBQU87QUFBQSxNQUNULEdBQUcsQ0FBQyxDQUFpQztBQUN2QyxhQUFPO0FBQUEsUUFDTCxNQUFNLE9BQ0gsS0FBSyxNQUFNLEVBQ1gsSUFBSSxTQUFPLFNBQVMsR0FBRyxDQUFDLEVBQ3hCLEtBQUssRUFDTCxRQUFRO0FBQUEsUUFDWDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGOyIsIm5hbWVzIjpbImdldHRlcnMiXX0=