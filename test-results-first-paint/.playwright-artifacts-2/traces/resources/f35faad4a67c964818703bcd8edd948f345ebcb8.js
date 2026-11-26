import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { v4 as uuidv4 } from "/.vite-e2e/4291/deps/uuid.js?v=9b9fafc7";
import { defaultState } from "/src/store/console/state.ts";
import { Globals } from "/src/globals.ts";
import { compileFilter as compileExpression } from "/src/services/console/settings.ts";
export const mutations = {
  /**
   * Reset state
   */
  setReset(state) {
    Object.assign(state, defaultState());
  },
  /**
   * Adds a console entry
   */
  setConsoleEntry(state, entry) {
    if (entry.id === void 0) {
      state.consoleEntryCount++;
      entry.id = state.consoleEntryCount;
    }
    while (state.console.length >= Globals.CONSOLE_HISTORY_RETENTION) {
      state.console.shift();
    }
    state.console.push(entry);
  },
  /**
   * Sets all console entries from moonraker store.
   */
  setAllEntries(state, payload) {
    state.consoleEntryCount = payload.length;
    state.console = payload;
  },
  setResetPromptDialog(state, payload) {
    const { promptDialog } = defaultState();
    Object.assign(state, {
      promptDialog: {
        ...promptDialog,
        title: payload
      }
    });
  },
  setPromptDialogItem(state, payload) {
    state.promptDialog.items.push(payload);
  },
  setPromptDialogFooterButton(state, payload) {
    state.promptDialog.footerButtons.push(payload);
  },
  setPromptDialogOpen(state, payload) {
    state.promptDialog.open = payload;
  },
  /**
   * Defines the list of available commands
   */
  setGcodeHelp(state, payload) {
    Vue.set(state, "gcodeHelp", payload);
  },
  /**
   * Inits the console history from db
   */
  setInitConsole(state, payload) {
    if (payload) {
      if (payload.consoleFilters) {
        payload.consoleFiltersRegexp = payload.consoleFilters.map((filter) => {
          if (typeof filter.type === "number") {
            switch (filter.type) {
              case 1:
                filter.type = "starts-with";
                break;
              case 2:
                filter.type = "expression";
                break;
              default:
                filter.type = "contains";
            }
          }
          return compileExpression(filter);
        });
      }
      Object.assign(state, payload);
    }
  },
  /**
   * Inits the console history from file
   */
  setUpdateCommandHistory(state, payload) {
    if (payload) {
      state.commandHistory = [...payload];
    }
  },
  /**
   * Maintains the current console command
   */
  setConsoleCommand(state, payload) {
    state.consoleCommand = payload;
  },
  /**
   * Sets auto scroll
   */
  setAutoScroll(state, payload) {
    state.autoScroll = payload;
  },
  setFilter(state, filter) {
    if (filter.id) {
      const i = state.consoleFilters.findIndex((c) => c.id === filter.id);
      if (i >= 0) {
        const { type, value } = state.consoleFilters[i];
        Vue.set(state.consoleFilters, i, filter);
        if (type !== filter.type || value !== filter.value) {
          Vue.set(state.consoleFiltersRegexp, i, compileExpression(filter));
        }
      }
    } else {
      filter.id = uuidv4();
      state.consoleFilters.push(filter);
      state.consoleFiltersRegexp.push(compileExpression(filter));
    }
  },
  setRemoveFilter(state, filter) {
    const i = state.consoleFilters.findIndex((c) => c.id === filter.id);
    if (i >= 0) {
      state.consoleFilters.splice(i, 1);
      state.consoleFiltersRegexp.splice(i, 1);
    }
  },
  setLastCleared(state) {
    Vue.set(state, "lastCleared", Date.now());
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm11dGF0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgVnVlIGZyb20gJ3Z1ZSdcbmltcG9ydCB7IHY0IGFzIHV1aWR2NCB9IGZyb20gJ3V1aWQnXG5pbXBvcnQgdHlwZSB7IE11dGF0aW9uVHJlZSB9IGZyb20gJ3Z1ZXgnXG5pbXBvcnQgeyBkZWZhdWx0U3RhdGUgfSBmcm9tICcuL3N0YXRlJ1xuaW1wb3J0IHsgR2xvYmFscyB9IGZyb20gJ0AvZ2xvYmFscydcbmltcG9ydCB0eXBlIHsgQ29uc29sZUVudHJ5LCBDb25zb2xlRmlsdGVyLCBDb25zb2xlU3RhdGUsIFByb21wdERpYWxvZ0l0ZW1CdXR0b24sIFByb21wdERpYWxvZ0l0ZW0gfSBmcm9tICcuL3R5cGVzJ1xuaW1wb3J0IHsgY29tcGlsZUZpbHRlciBhcyBjb21waWxlRXhwcmVzc2lvbiB9IGZyb20gJ0Avc2VydmljZXMvY29uc29sZS9zZXR0aW5ncydcblxuZXhwb3J0IGNvbnN0IG11dGF0aW9uczogTXV0YXRpb25UcmVlPENvbnNvbGVTdGF0ZT4gPSB7XG4gIC8qKlxuICAgKiBSZXNldCBzdGF0ZVxuICAgKi9cbiAgc2V0UmVzZXQgKHN0YXRlKSB7XG4gICAgT2JqZWN0LmFzc2lnbihzdGF0ZSwgZGVmYXVsdFN0YXRlKCkpXG4gIH0sXG5cbiAgLyoqXG4gICAqIEFkZHMgYSBjb25zb2xlIGVudHJ5XG4gICAqL1xuICBzZXRDb25zb2xlRW50cnkgKHN0YXRlLCBlbnRyeTogQ29uc29sZUVudHJ5KSB7XG4gICAgaWYgKGVudHJ5LmlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHN0YXRlLmNvbnNvbGVFbnRyeUNvdW50KytcbiAgICAgIGVudHJ5LmlkID0gc3RhdGUuY29uc29sZUVudHJ5Q291bnRcbiAgICB9XG4gICAgd2hpbGUgKHN0YXRlLmNvbnNvbGUubGVuZ3RoID49IEdsb2JhbHMuQ09OU09MRV9ISVNUT1JZX1JFVEVOVElPTikge1xuICAgICAgc3RhdGUuY29uc29sZS5zaGlmdCgpXG4gICAgfVxuICAgIHN0YXRlLmNvbnNvbGUucHVzaChlbnRyeSlcbiAgfSxcblxuICAvKipcbiAgICogU2V0cyBhbGwgY29uc29sZSBlbnRyaWVzIGZyb20gbW9vbnJha2VyIHN0b3JlLlxuICAgKi9cbiAgc2V0QWxsRW50cmllcyAoc3RhdGUsIHBheWxvYWQ6IENvbnNvbGVFbnRyeVtdKSB7XG4gICAgc3RhdGUuY29uc29sZUVudHJ5Q291bnQgPSBwYXlsb2FkLmxlbmd0aFxuICAgIHN0YXRlLmNvbnNvbGUgPSBwYXlsb2FkXG4gIH0sXG5cbiAgc2V0UmVzZXRQcm9tcHREaWFsb2cgKHN0YXRlLCBwYXlsb2FkOiBzdHJpbmcpIHtcbiAgICBjb25zdCB7IHByb21wdERpYWxvZyB9ID0gZGVmYXVsdFN0YXRlKClcblxuICAgIE9iamVjdC5hc3NpZ24oc3RhdGUsIHtcbiAgICAgIHByb21wdERpYWxvZzoge1xuICAgICAgICAuLi5wcm9tcHREaWFsb2csXG4gICAgICAgIHRpdGxlOiBwYXlsb2FkXG4gICAgICB9XG4gICAgfSlcbiAgfSxcblxuICBzZXRQcm9tcHREaWFsb2dJdGVtIChzdGF0ZSwgcGF5bG9hZDogUHJvbXB0RGlhbG9nSXRlbSkge1xuICAgIHN0YXRlLnByb21wdERpYWxvZy5pdGVtcy5wdXNoKHBheWxvYWQpXG4gIH0sXG5cbiAgc2V0UHJvbXB0RGlhbG9nRm9vdGVyQnV0dG9uIChzdGF0ZSwgcGF5bG9hZDogUHJvbXB0RGlhbG9nSXRlbUJ1dHRvbikge1xuICAgIHN0YXRlLnByb21wdERpYWxvZy5mb290ZXJCdXR0b25zLnB1c2gocGF5bG9hZClcbiAgfSxcblxuICBzZXRQcm9tcHREaWFsb2dPcGVuIChzdGF0ZSwgcGF5bG9hZDogYm9vbGVhbikge1xuICAgIHN0YXRlLnByb21wdERpYWxvZy5vcGVuID0gcGF5bG9hZFxuICB9LFxuXG4gIC8qKlxuICAgKiBEZWZpbmVzIHRoZSBsaXN0IG9mIGF2YWlsYWJsZSBjb21tYW5kc1xuICAgKi9cbiAgc2V0R2NvZGVIZWxwIChzdGF0ZSwgcGF5bG9hZCkge1xuICAgIFZ1ZS5zZXQoc3RhdGUsICdnY29kZUhlbHAnLCBwYXlsb2FkKVxuICB9LFxuXG4gIC8qKlxuICAgKiBJbml0cyB0aGUgY29uc29sZSBoaXN0b3J5IGZyb20gZGJcbiAgICovXG4gIHNldEluaXRDb25zb2xlIChzdGF0ZSwgcGF5bG9hZDogQ29uc29sZVN0YXRlKSB7XG4gICAgaWYgKHBheWxvYWQpIHtcbiAgICAgIGlmIChwYXlsb2FkLmNvbnNvbGVGaWx0ZXJzKSB7XG4gICAgICAgIHBheWxvYWQuY29uc29sZUZpbHRlcnNSZWdleHAgPSBwYXlsb2FkLmNvbnNvbGVGaWx0ZXJzXG4gICAgICAgICAgLm1hcChmaWx0ZXIgPT4ge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBmaWx0ZXIudHlwZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgc3dpdGNoIChmaWx0ZXIudHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgIGZpbHRlci50eXBlID0gJ3N0YXJ0cy13aXRoJ1xuICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgIGZpbHRlci50eXBlID0gJ2V4cHJlc3Npb24nXG4gICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgIGZpbHRlci50eXBlID0gJ2NvbnRhaW5zJ1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjb21waWxlRXhwcmVzc2lvbihmaWx0ZXIpXG4gICAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIE9iamVjdC5hc3NpZ24oc3RhdGUsIHBheWxvYWQpXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBJbml0cyB0aGUgY29uc29sZSBoaXN0b3J5IGZyb20gZmlsZVxuICAgKi9cbiAgc2V0VXBkYXRlQ29tbWFuZEhpc3RvcnkgKHN0YXRlLCBwYXlsb2FkOiBzdHJpbmdbXSkge1xuICAgIGlmIChwYXlsb2FkKSB7XG4gICAgICBzdGF0ZS5jb21tYW5kSGlzdG9yeSA9IFsuLi5wYXlsb2FkXVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogTWFpbnRhaW5zIHRoZSBjdXJyZW50IGNvbnNvbGUgY29tbWFuZFxuICAgKi9cbiAgc2V0Q29uc29sZUNvbW1hbmQgKHN0YXRlLCBwYXlsb2FkKSB7XG4gICAgc3RhdGUuY29uc29sZUNvbW1hbmQgPSBwYXlsb2FkXG4gIH0sXG5cbiAgLyoqXG4gICAqIFNldHMgYXV0byBzY3JvbGxcbiAgICovXG4gIHNldEF1dG9TY3JvbGwgKHN0YXRlLCBwYXlsb2FkKSB7XG4gICAgc3RhdGUuYXV0b1Njcm9sbCA9IHBheWxvYWRcbiAgfSxcblxuICBzZXRGaWx0ZXIgKHN0YXRlLCBmaWx0ZXI6IENvbnNvbGVGaWx0ZXIpIHtcbiAgICBpZiAoZmlsdGVyLmlkKSB7XG4gICAgICBjb25zdCBpID0gc3RhdGUuY29uc29sZUZpbHRlcnMuZmluZEluZGV4KGMgPT4gYy5pZCA9PT0gZmlsdGVyLmlkKVxuICAgICAgaWYgKGkgPj0gMCkge1xuICAgICAgICBjb25zdCB7IHR5cGUsIHZhbHVlIH0gPSBzdGF0ZS5jb25zb2xlRmlsdGVyc1tpXVxuXG4gICAgICAgIFZ1ZS5zZXQoc3RhdGUuY29uc29sZUZpbHRlcnMsIGksIGZpbHRlcilcblxuICAgICAgICBpZiAodHlwZSAhPT0gZmlsdGVyLnR5cGUgfHwgdmFsdWUgIT09IGZpbHRlci52YWx1ZSkge1xuICAgICAgICAgIFZ1ZS5zZXQoc3RhdGUuY29uc29sZUZpbHRlcnNSZWdleHAsIGksIGNvbXBpbGVFeHByZXNzaW9uKGZpbHRlcikpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZmlsdGVyLmlkID0gdXVpZHY0KClcbiAgICAgIHN0YXRlLmNvbnNvbGVGaWx0ZXJzLnB1c2goZmlsdGVyKVxuICAgICAgc3RhdGUuY29uc29sZUZpbHRlcnNSZWdleHAucHVzaChjb21waWxlRXhwcmVzc2lvbihmaWx0ZXIpKVxuICAgIH1cbiAgfSxcblxuICBzZXRSZW1vdmVGaWx0ZXIgKHN0YXRlLCBmaWx0ZXI6IENvbnNvbGVGaWx0ZXIpIHtcbiAgICBjb25zdCBpID0gc3RhdGUuY29uc29sZUZpbHRlcnMuZmluZEluZGV4KGMgPT4gYy5pZCA9PT0gZmlsdGVyLmlkKVxuICAgIGlmIChpID49IDApIHtcbiAgICAgIHN0YXRlLmNvbnNvbGVGaWx0ZXJzLnNwbGljZShpLCAxKVxuICAgICAgc3RhdGUuY29uc29sZUZpbHRlcnNSZWdleHAuc3BsaWNlKGksIDEpXG4gICAgfVxuICB9LFxuXG4gIHNldExhc3RDbGVhcmVkIChzdGF0ZSkge1xuICAgIFZ1ZS5zZXQoc3RhdGUsICdsYXN0Q2xlYXJlZCcsIERhdGUubm93KCkpXG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxTQUFTO0FBQ2hCLFNBQVMsTUFBTSxjQUFjO0FBRTdCLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsZUFBZTtBQUV4QixTQUFTLGlCQUFpQix5QkFBeUI7QUFFNUMsYUFBTSxZQUF3QztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBSW5ELFNBQVUsT0FBTztBQUNmLFdBQU8sT0FBTyxPQUFPLGFBQWEsQ0FBQztBQUFBLEVBQ3JDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxnQkFBaUIsT0FBTyxPQUFxQjtBQUMzQyxRQUFJLE1BQU0sT0FBTyxRQUFXO0FBQzFCLFlBQU07QUFDTixZQUFNLEtBQUssTUFBTTtBQUFBLElBQ25CO0FBQ0EsV0FBTyxNQUFNLFFBQVEsVUFBVSxRQUFRLDJCQUEyQjtBQUNoRSxZQUFNLFFBQVEsTUFBTTtBQUFBLElBQ3RCO0FBQ0EsVUFBTSxRQUFRLEtBQUssS0FBSztBQUFBLEVBQzFCO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxjQUFlLE9BQU8sU0FBeUI7QUFDN0MsVUFBTSxvQkFBb0IsUUFBUTtBQUNsQyxVQUFNLFVB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