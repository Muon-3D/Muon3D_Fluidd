import { Globals } from "/src/globals.ts";
import { SocketActions } from "/src/api/socketActions.ts";
import DOMPurify from "/.vite-e2e/4291/deps/dompurify.js?v=9b9fafc7";
import { takeRightWhile } from "/.vite-e2e/4291/deps/lodash-es.js?v=9b9fafc7";
let consoleLoaded = false;
export const resetConsoleLoaded = () => {
  consoleLoaded = false;
};
export const actions = {
  /**
   * Reset our store
   */
  async reset({ commit }) {
    commit("setReset");
  },
  /**
   * Inits known command history
   */
  async initConsole({ commit }, payload) {
    commit("setInitConsole", payload);
  },
  /**
   * Add a command history item, and update server store.
   */
  async onUpdateCommandHistory({ state, commit }, payload) {
    commit("setUpdateCommandHistory", payload);
    SocketActions.serverWrite(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + ".commandHistory", state.commandHistory);
  },
  /**
   * The result of a specific gcode request.
   */
  async onGcodeScript({ dispatch }, payload) {
    if (payload && payload.result && payload.result !== "ok") {
      dispatch("onAddConsoleEntry", { message: Globals.CONSOLE_RECEIVE_PREFIX + payload.result });
    }
  },
  /**
   * Add a console entry
   */
  async onAddConsoleEntry({ commit, dispatch }, payload) {
    payload.message = DOMPurify.sanitize(payload.message).replace(/\r\n|\r|\n/g, "<br />");
    if (!payload.time || payload.time <= 0) {
      payload.time = Date.now() / 1e3 | 0;
    }
    if (!payload.type) {
      payload.type = "response";
    }
    if (payload.type === "response" && payload.message.startsWith("// action:")) {
      payload.type = "action";
    }
    commit("setConsoleEntry", payload);
    dispatch("onUpdatePromptDialog", payload);
  },
  /**
   * On a fresh load of the UI, we load prior gcode / console history
   */
  async onGcodeStore({ commit, dispatch, rootState }, payload) {
    if (payload && payload.gcode_store) {
      const entries = payload.gcode_store.map((entry, index) => {
        entry.message = Globals.CONSOLE_RECEIVE_PREFIX + entry.message;
        entry.message = DOMPurify.sanitize(entry.message).replace(/\r\n|\r|\n/g, "<br />");
        entry.id = index;
        if (entry.type === "response" && entry.message.startsWith("// action:")) {
          entry.type = "action";
        }
        return entry;
      });
      commit("setAllEntries", entries);
      if (consoleLoaded && rootState.config?.uiSettings?.console?.clearOnReconnect === true) commit("setLastCleared");
      consoleLoaded = true;
      const dialogEntries = entries.filter((entry) => entry.type === "action" && entry.message.startsWith("// action:prompt_"));
      const dialogEntriesAfterEnd = takeRightWhile(dialogEntries, (entry) => entry.message !== "// action:prompt_end");
      const dialogEntriesAfterBegin = takeRightWhile(dialogEntriesAfterEnd, (entry) => entry.message !== "// action:prompt_begin");
      dialogEntriesAfterBegin.forEach((entry) => dispatch("onUpdatePromptDialog", entry));
    }
  },
  async onUpdatePromptDialog({ commit }, payload) {
    const parsedMessage = payload.type === "action" && /^\/\/ action:prompt_([^ ]+)(?: (.+))?/.exec(payload.message);
    if (parsedMessage) {
      const [, type, param] = parsedMessage;
      switch (type) {
        case "begin":
          commit("setResetPromptDialog", param);
          break;
        case "text": {
          const item = {
            type: "text",
            text: param
          };
          commit("setPromptDialogItem", item);
          break;
        }
        case "button": {
          const [text, command, color] = param.split("|");
          const item = {
            type: "button",
            text,
            command,
            color
          };
          commit("setPromptDialogItem", item);
          break;
        }
        case "footer_button": {
          const [text, command, color] = param.split("|");
          const item = {
            text,
            command,
            color
          };
          commit("setPromptDialogFooterButton", item);
          break;
        }
        case "show":
        case "end":
          commit("setPromptDialogOpen", type === "show");
      }
    }
  },
  /**
   * Klipper provides us with a list of available gcode commands
   * based on the current configuration.
   */
  async onGcodeHelp({ commit }, payload) {
    commit("setGcodeHelp", payload);
  },
  /**
   * Updates auto scroll value
   */
  async onUpdateAutoScroll({ commit }, payload) {
    commit("setAutoScroll", payload);
    SocketActions.serverWrite(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + ".autoScroll", payload);
  },
  /**
   * Remove a filter
   */
  async onRemoveFilter({ commit, state }, filter) {
    commit("setRemoveFilter", filter);
    SocketActions.serverWrite(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + ".consoleFilters", state.consoleFilters);
  },
  /**
    * Add/Edit a filter
    */
  async onSaveFilter({ commit, state }, filter) {
    commit("setFilter", filter);
    SocketActions.serverWrite(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + ".consoleFilters", state.consoleFilters);
  },
  async onClear({ commit, state }) {
    commit("setLastCleared");
    SocketActions.serverWrite(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + ".lastCleared", state.lastCleared);
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjdGlvbnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBBY3Rpb25UcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB7IEdsb2JhbHMgfSBmcm9tICdAL2dsb2JhbHMnXG5pbXBvcnQgdHlwZSB7IENvbnNvbGVFbnRyeSwgQ29uc29sZUZpbHRlciwgQ29uc29sZVN0YXRlLCBQcm9tcHREaWFsb2dCdXR0b24sIFByb21wdERpYWxvZ0l0ZW1CdXR0b24sIFByb21wdERpYWxvZ0l0ZW1UZXh0IH0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB0eXBlIHsgUm9vdFN0YXRlIH0gZnJvbSAnLi4vdHlwZXMnXG5pbXBvcnQgeyBTb2NrZXRBY3Rpb25zIH0gZnJvbSAnQC9hcGkvc29ja2V0QWN0aW9ucydcbmltcG9ydCBET01QdXJpZnkgZnJvbSAnZG9tcHVyaWZ5J1xuaW1wb3J0IHsgdGFrZVJpZ2h0V2hpbGUgfSBmcm9tICdsb2Rhc2gtZXMnXG5cbi8qKiBUaGUgY29uc29sZSBoaXN0b3J5IHdhcyBsb2FkZWQgb25jZSBpbiB0aGlzIHRhYjogdGhlIG5leHQgbG9hZCBpcyBhIHJlY29ubmVjdC4gKi9cbmxldCBjb25zb2xlTG9hZGVkID0gZmFsc2VcblxuZXhwb3J0IGNvbnN0IHJlc2V0Q29uc29sZUxvYWRlZCA9ICgpID0+IHsgY29uc29sZUxvYWRlZCA9IGZhbHNlIH1cblxuZXhwb3J0IGNvbnN0IGFjdGlvbnM6IEFjdGlvblRyZWU8Q29uc29sZVN0YXRlLCBSb290U3RhdGU+ID0ge1xuICAvKipcbiAgICogUmVzZXQgb3VyIHN0b3JlXG4gICAqL1xuICBhc3luYyByZXNldCAoeyBjb21taXQgfSkge1xuICAgIGNvbW1pdCgnc2V0UmVzZXQnKVxuICB9LFxuXG4gIC8qKlxuICAgKiBJbml0cyBrbm93biBjb21tYW5kIGhpc3RvcnlcbiAgICovXG4gIGFzeW5jIGluaXRDb25zb2xlICh7IGNvbW1pdCB9LCBwYXlsb2FkKSB7XG4gICAgY29tbWl0KCdzZXRJbml0Q29uc29sZScsIHBheWxvYWQpXG4gIH0sXG5cbiAgLyoqXG4gICAqIEFkZCBhIGNvbW1hbmQgaGlzdG9yeSBpdGVtLCBhbmQgdXBkYXRlIHNlcnZlciBzdG9yZS5cbiAgICovXG4gIGFzeW5jIG9uVXBkYXRlQ29tbWFuZEhpc3RvcnkgKHsgc3RhdGUsIGNvbW1pdCB9LCBwYXlsb2FkKSB7XG4gICAgY29tbWl0KCdzZXRVcGRhdGVDb21tYW5kSGlzdG9yeScsIHBheWxvYWQpXG4gICAgU29ja2V0QWN0aW9ucy5zZXJ2ZXJXcml0ZShHbG9iYWxzLk1PT05SQUtFUl9EQi5mbHVpZGQuUk9PVFMuY29uc29sZS5uYW1lICsgJy5jb21tYW5kSGlzdG9yeScsIHN0YXRlLmNvbW1hbmRIaXN0b3J5KVxuICB9LFxuXG4gIC8qKlxuICAgKiBUaGUgcmVzdWx0IG9mIGEgc3BlY2lmaWMgZ2NvZGUgcmVxdWVzdC5cbiAgICovXG4gIGFzeW5jIG9uR2NvZGVTY3JpcHQgKHsgZGlzcGF0Y2ggfSwgcGF5bG9hZCkge1xuICAgIC8vIElmIHRoZSByZXNwb25zZSBpcyBub3Qgb2ssIHBhc3MgaXQgdG8gdGhlIGNvbnNvbGUuXG4gICAgaWYgKHBheWxvYWQgJiYgcGF5bG9hZC5yZXN1bHQgJiYgcGF5bG9hZC5yZXN1bHQgIT09ICdvaycpIHtcbiAgICAgIGRpc3BhdGNoKCdvbkFkZENvbnNvbGVFbnRyeScsIHsgbWVzc2FnZTogR2xvYmFscy5DT05TT0xFX1JFQ0VJVkVfUFJFRklYICsgcGF5bG9hZC5yZXN1bHQgfSlcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFkZCBhIGNvbnNvbGUgZW50cnlcbiAgICovXG4gIGFzeW5jIG9uQWRkQ29uc29sZUVudHJ5ICh7IGNvbW1pdCwgZGlzcGF0Y2ggfSwgcGF5bG9hZDogQ29uc29sZUVudHJ5KSB7XG4gICAgcGF5bG9hZC5tZXNzYWdlID0gRE9NUHVyaWZ5LnNhbml0aXplKHBheWxvYWQubWVzc2FnZSkucmVwbGFjZSgvXFxyXFxufFxccnxcXG4vZywgJzxiciAvPicpXG4gICAgaWYgKCFwYXlsb2FkLnRpbWUgfHwgcGF5bG9hZC50aW1lIDw9IDApIHtcbiAgICAgIHBheWxvYWQudGltZSA9IERhdGUubm93KCkgLyAxMDAwIHwgMFxuICAgIH1cbiAgICBpZiAoIXBheWxvYWQudHlwZSkge1xuICAgICAgcGF5bG9hZC50eXBlID0gJ3Jlc3BvbnNlJ1xuICAgIH1cbiAgICBpZiAocGF5bG9hZC50eXBlID09PSAncmVzcG9uc2UnICYmIHBheWxvYWQubWVzc2FnZS5zdGFydHNXaXRoKCcvLyBhY3Rpb246JykpIHtcbiAgICAgIHBheWxvYWQudHlwZSA9ICdhY3Rpb24nXG4gICAgfVxuXG4gICAgY29tbWl0KCdzZXRDb25zb2xlRW50cnknLCBwYXlsb2FkKVxuXG4gICAgZGlzcGF0Y2goJ29uVXBkYXRlUHJvbXB0RGlhbG9nJywgcGF5bG9hZClcbiAgfSxcblxuICAvKipcbiAgICogT24gYSBmcmVzaCBsb2FkIG9mIHRoZSBVSSwgd2UgbG9hZCBwcmlvciBnY29kZSAvIGNvbnNvbGUgaGlzdG9yeVxuICAgKi9cbiAgYXN5bmMgb25HY29kZVN0b3JlICh7IGNvbW1pdCwgZGlzcGF0Y2gsIHJvb3RTdGF0ZSB9LCBwYXlsb2FkOiB7IGdjb2RlX3N0b3JlPzogQ29uc29sZUVudHJ5W10gfSkge1xuICAgIGlmIChwYXlsb2FkICYmIHBheWxvYWQuZ2NvZGVfc3RvcmUpIHtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBwYXlsb2FkLmdjb2RlX3N0b3JlXG4gICAgICAgIC5tYXAoKGVudHJ5LCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgZW50cnkubWVzc2FnZSA9IEdsb2JhbHMuQ09OU09MRV9SRUNFSVZFX1BSRUZJWCArIGVudHJ5Lm1lc3NhZ2VcblxuICAgICAgICAgIGVudHJ5Lm1lc3NhZ2UgPSBET01QdXJpZnkuc2FuaXRpemUoZW50cnkubWVzc2FnZSkucmVwbGFjZSgvXFxyXFxufFxccnxcXG4vZywgJzxiciAvPicpXG5cbiAgICAgICAgICBlbnRyeS5pZCA9IGluZGV4XG5cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBlbnRyeS50eXBlID09PSAncmVzcG9uc2UnICYmXG4gICAgICAgICAgICBlbnRyeS5tZXNzYWdlLnN0YXJ0c1dpdGgoJy8vIGFjdGlvbjonKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgZW50cnkudHlwZSA9ICdhY3Rpb24nXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGVudHJ5XG4gICAgICAgIH0pXG5cbiAgICAgIGNvbW1pdCgnc2V0QWxsRW50cmllcycsIGVudHJpZXMpXG5cbiAgICAgIC8vIFNldHRpbmdzIOKAuiBDb25zb2xlIOKAuiBTdGFydCBlbXB0eSBhZnRlciBhIHJlY29ubmVjdDogdGhpcyB0YWIncyB2aWV3IG9ubHk7IHRoZSBsb2cga2VlcHMgdGhlIGxpbmVzLlxuICAgICAgaWYgKGNvbnNvbGVMb2FkZWQgJiYgcm9vdFN0YXRlLmNvbmZpZz8udWlTZXR0aW5ncz8uY29uc29sZT8uY2xlYXJPblJlY29ubmVjdCA9PT0gdHJ1ZSkgY29tbWl0KCdzZXRMYXN0Q2xlYXJlZCcpXG4gICAgICBjb25zb2xlTG9hZGVkID0gdHJ1ZVxuXG4gICAgICBjb25zdCBkaWFsb2dFbnRyaWVzID0gZW50cmllc1xuICAgICAgICAuZmlsdGVyKGVudHJ5ID0+IChcbiAgICAgICAgICBlbnRyeS50eXBlID09PSAnYWN0aW9uJyAmJlxuICAgICAgICAgIGVudHJ5Lm1lc3NhZ2Uuc3RhcnRzV2l0aCgnLy8gYWN0aW9uOnByb21wdF8nKVxuICAgICAgICApKVxuXG4gICAgICBjb25zdCBkaWFsb2dFbnRyaWVzQWZ0ZXJFbmQgPSB0YWtlUmlnaHRXaGlsZShkaWFsb2dFbnRyaWVzLCBlbnRyeSA9PiBlbnRyeS5tZXNzYWdlICE9PSAnLy8gYWN0aW9uOnByb21wdF9lbmQnKVxuICAgICAgY29uc3QgZGlhbG9nRW50cmllc0FmdGVyQmVnaW4gPSB0YWtlUmlnaHRXaGlsZShkaWFsb2dFbnRyaWVzQWZ0ZXJFbmQsIGVudHJ5ID0+IGVudHJ5Lm1lc3NhZ2UgIT09ICcvLyBhY3Rpb246cHJvbXB0X2JlZ2luJylcblxuICAgICAgZGlhbG9nRW50cmllc0FmdGVyQmVnaW5cbiAgICAgICAgLmZvckVhY2goZW50cnkgPT4gZGlzcGF0Y2goJ29uVXBkYXRlUHJvbXB0RGlhbG9nJywgZW50cnkpKVxuICAgIH1cbiAgfSxcblxuICBhc3luYyBvblVwZGF0ZVByb21wdERpYWxvZyAoeyBjb21taXQgfSwgcGF5bG9hZDogQ29uc29sZUVudHJ5KSB7XG4gICAgY29uc3QgcGFyc2VkTWVzc2FnZSA9IChcbiAgICAgIHBheWxvYWQudHlwZSA9PT0gJ2FjdGlvbicgJiZcbiAgICAgIC9eXFwvXFwvIGFjdGlvbjpwcm9tcHRfKFteIF0rKSg/OiAoLispKT8vLmV4ZWMocGF5bG9hZC5tZXNzYWdlKVxuICAgIClcblxuICAgIGlmIChwYXJzZWRNZXNzYWdlKSB7XG4gICAgICBjb25zdCBbLCB0eXBlLCBwYXJhbV0gPSBwYXJzZWRNZXNzYWdlXG5cbiAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlICdiZWdpbic6XG4gICAgICAgICAgY29tbWl0KCdzZXRSZXNldFByb21wdERpYWxvZycsIHBhcmFtKVxuICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgY2FzZSAndGV4dCc6IHtcbiAgICAgICAgICBjb25zdCBpdGVtOiBQcm9tcHREaWFsb2dJdGVtVGV4dCA9IHtcbiAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgIHRleHQ6IHBhcmFtXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29tbWl0KCdzZXRQcm9tcHREaWFsb2dJdGVtJywgaXRlbSlcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSAnYnV0dG9uJzoge1xuICAgICAgICAgIGNvbnN0IFt0ZXh0LCBjb21tYW5kLCBjb2xvcl0gPSBwYXJhbS5zcGxpdCgnfCcpXG5cbiAgICAgICAgICBjb25zdCBpdGVtOiBQcm9tcHREaWFsb2dJdGVtQnV0dG9uID0ge1xuICAgICAgICAgICAgdHlwZTogJ2J1dHRvbicsXG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgY29tbWFuZCxcbiAgICAgICAgICAgIGNvbG9yXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29tbWl0KCdzZXRQcm9tcHREaWFsb2dJdGVtJywgaXRlbSlcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSAnZm9vdGVyX2J1dHRvbic6IHtcbiAgICAgICAgICBjb25zdCBbdGV4dCwgY29tbWFuZCwgY29sb3JdID0gcGFyYW0uc3BsaXQoJ3wnKVxuXG4gICAgICAgICAgY29uc3QgaXRlbTogUHJvbXB0RGlhbG9nQnV0dG9uID0ge1xuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIGNvbW1hbmQsXG4gICAgICAgICAgICBjb2xvclxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbW1pdCgnc2V0UHJvbXB0RGlhbG9nRm9vdGVyQnV0dG9uJywgaXRlbSlcblxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cblxuICAgICAgICBjYXNlICdzaG93JzpcbiAgICAgICAgY2FzZSAnZW5kJzpcbiAgICAgICAgICBjb21taXQoJ3NldFByb21wdERpYWxvZ09wZW4nLCB0eXBlID09PSAnc2hvdycpXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBLbGlwcGVyIHByb3ZpZGVzIHVzIHdpdGggYSBsaXN0IG9mIGF2YWlsYWJsZSBnY29kZSBjb21tYW5kc1xuICAgKiBiYXNlZCBvbiB0aGUgY3VycmVudCBjb25maWd1cmF0aW9uLlxuICAgKi9cbiAgYXN5bmMgb25HY29kZUhlbHAgKHsgY29tbWl0IH0sIHBheWxvYWQpIHtcbiAgICBjb21taXQoJ3NldEdjb2RlSGVscCcsIHBheWxvYWQpXG4gIH0sXG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgYXV0byBzY3JvbGwgdmFsdWVcbiAgICovXG4gIGFzeW5jIG9uVXBkYXRlQXV0b1Njcm9sbCAoeyBjb21taXQgfSwgcGF5bG9hZCkge1xuICAgIGNvbW1pdCgnc2V0QXV0b1Njcm9sbCcsIHBheWxvYWQpXG4gICAgU29ja2V0QWN0aW9ucy5zZXJ2ZXJXcml0ZShHbG9iYWxzLk1PT05SQUtFUl9EQi5mbHVpZGQuUk9PVFMuY29uc29sZS5uYW1lICsgJy5hdXRvU2Nyb2xsJywgcGF5bG9hZClcbiAgfSxcblxuICAvKipcbiAgICogUmVtb3ZlIGEgZmlsdGVyXG4gICAqL1xuICBhc3luYyBvblJlbW92ZUZpbHRlciAoeyBjb21taXQsIHN0YXRlIH0sIGZpbHRlcjogQ29uc29sZUZpbHRlcikge1xuICAgIGNvbW1pdCgnc2V0UmVtb3ZlRmlsdGVyJywgZmlsdGVyKVxuICAgIFNvY2tldEFjdGlvbnMuc2VydmVyV3JpdGUoR2xvYmFscy5NT09OUkFLRVJfREIuZmx1aWRkLlJPT1RTLmNvbnNvbGUubmFtZSArICcuY29uc29sZUZpbHRlcnMnLCBzdGF0ZS5jb25zb2xlRmlsdGVycylcbiAgfSxcblxuICAvKipcbiAgICAqIEFkZC9FZGl0IGEgZmlsdGVyXG4gICAgKi9cbiAgYXN5bmMgb25TYXZlRmlsdGVyICh7IGNvbW1pdCwgc3RhdGUgfSwgZmlsdGVyOiBDb25zb2xlRmlsdGVyKSB7XG4gICAgY29tbWl0KCdzZXRGaWx0ZXInLCBmaWx0ZXIpXG4gICAgU29ja2V0QWN0aW9ucy5zZXJ2ZXJXcml0ZShHbG9iYWxzLk1PT05SQUtFUl9EQi5mbHVpZGQuUk9PVFMuY29uc29sZS5uYW1lICsgJy5jb25zb2xlRmlsdGVycycsIHN0YXRlLmNvbnNvbGVGaWx0ZXJzKVxuICB9LFxuXG4gIGFzeW5jIG9uQ2xlYXIgKHsgY29tbWl0LCBzdGF0ZSB9KSB7XG4gICAgY29tbWl0KCdzZXRMYXN0Q2xlYXJlZCcpXG4gICAgU29ja2V0QWN0aW9ucy5zZXJ2ZXJXcml0ZShHbG9iYWxzLk1PT05SQUtFUl9EQi5mbHVpZGQuUk9PVFMuY29uc29sZS5uYW1lICsgJy5sYXN0Q2xlYXJlZCcsIHN0YXRl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