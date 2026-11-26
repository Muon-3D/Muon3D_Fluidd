import { SupportedImageFormats, SupportedMarkdownFormats, SupportedVideoFormats } from "/src/globals.ts";
export const getters = {
  /**
   * Returns a directory of files and sub-directories.
   */
  getDirectory: (state, getters2, rootState) => (path) => {
    const pathContent = state.pathFiles[path];
    if (pathContent) {
      const items = [];
      const [root, ...restOfPath] = path.split("/");
      const pathNoRoot = restOfPath.join("/");
      if (pathNoRoot !== "") {
        const item = {
          type: "directory",
          name: "..",
          dirname: "..",
          modified: 0,
          size: 0
        };
        items.push(item);
      }
      for (const dir of pathContent.dirs) {
        const item = {
          ...dir,
          type: "directory",
          name: dir.dirname,
          modified: new Date(dir.modified).getTime()
        };
        items.push(item);
      }
      const timelapseThumbnailFiles = root === "timelapse" ? new Set(pathContent.files.map((file) => file.filename).filter((filename) => filename.endsWith(".jpg"))) : void 0;
      for (const file of pathContent.files) {
        const history = file.job_id && rootState.history.jobs.find((job) => job.job_id === file.job_id) || {};
        const item = {
          ...file,
          type: "file",
          name: file.filename,
          extension: file.filename.split(".").pop() || "",
          path: pathNoRoot,
          modified: new Date(file.modified).getTime(),
          history
        };
        if (timelapseThumbnailFiles && item.extension !== "jpg") {
          const expectedThumbnailFile = `${item.filename.slice(0, -(item.extension.length + 1))}.jpg`;
          if (timelapseThumbnailFiles.has(expectedThumbnailFile)) {
            item.thumbnails = [
              {
                // we have no data regarding the thumbnail other than it's URL, but setting it is mandatory...
                height: 0,
                width: 0,
                size: 0,
                relative_path: expectedThumbnailFile
              }
            ];
          }
        }
        items.push(item);
      }
      return items;
    }
  },
  getRootFiles: (state) => (root) => {
    return state.rootFiles[root];
  },
  /**
   * Indicates if a root is available.
   */
  isRootAvailable: (state, getters2, rootState) => (r) => {
    return rootState.server.info.registered_directories.includes(r);
  },
  /**
   * Returns the properties of a root.
   */
  getRootProperties: () => (root) => {
    const canView = [
      ...SupportedImageFormats,
      ...SupportedMarkdownFormats,
      ...SupportedVideoFormats
    ];
    switch (root) {
      case "gcodes":
        return {
          readonly: false,
          accepts: [".gcode", ".g", ".gc", ".gco", ".ufp", ".nc"],
          canView,
          canConfigure: true,
          filterTypes: ["hidden_files", "print_start_time"]
        };
      case "config":
      case "calibration":
        return {
          readonly: false,
          accepts: [".conf", ".cfg", ".md", ".css", ".jpg", ".jpeg", ".png", ".gif"],
          canView,
          canConfigure: false,
          filterTypes: ["hidden_files", "klipper_backup_files", "moonraker_backup_files", "crowsnest_backup_files"]
        };
      case "config_examples":
        return {
          readonly: true,
          accepts: [],
          canView,
          canConfigure: false,
          filterTypes: ["hidden_files"]
        };
      case "docs":
        return {
          readonly: true,
          accepts: [],
          canView,
          canConfigure: false,
          filterTypes: ["hidden_files"]
        };
      case "logs":
        return {
          readonly: true,
          accepts: [],
          canView,
          canConfigure: false,
          filterTypes: ["hidden_files", "rolled_log_files"]
        };
      case "timelapse":
        return {
          readonly: false,
          accepts: [],
          canView,
          canConfigure: false,
          filterTypes: ["hidden_files"]
        };
      default:
        return {
          readonly: true,
          accepts: [],
          canView: [],
          canConfigure: false,
          filterTypes: ["hidden_files"]
        };
    }
  },
  /**
   * Returns a specific file.
   */
  getFile: (state, getters2, rootState) => (path, filename) => {
    const pathContent = state.pathFiles[path];
    const file = pathContent?.files.find((file2) => file2.filename === filename);
    if (file) {
      const history = file.job_id && rootState.history.jobs.find((job) => job.job_id === file.job_id) || {};
      const [, ...restOfPath] = path.split("/");
      const pathNoRoot = restOfPath.join("/");
      const item = {
        ...file,
        type: "file",
        name: file.filename,
        extension: file.filename.split(".").pop() || "",
        path: pathNoRoot,
        modified: new Date(file.modified).getDate(),
        history
      };
      return item;
    }
  },
  /**
   * Gets the currently stored path for any given root.
   */
  getCurrentPathByRoot: (state) => (r) => {
    return state.currentPaths[r] || "";
  },
  /**
   * Returns a boolean indicating if we're low on disk space.
   */
  getLowOnSpace: (state) => {
    return state.disk_usage.free < 1073741824;
  },
  /**
   * Returns curent file system usage.
   */
  getUsage: (state) => {
    return state.disk_usage;
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdldHRlcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBHZXR0ZXJUcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHsgQXBwRGlyZWN0b3J5LCBBcHBGaWxlV2l0aE1ldGEsIEZpbGVCcm93c2VyRW50cnksIEZpbGVzU3RhdGUsIFJvb3RQcm9wZXJ0aWVzIH0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB0eXBlIHsgUm9vdFN0YXRlIH0gZnJvbSAnLi4vdHlwZXMnXG5pbXBvcnQgdHlwZSB7IEhpc3RvcnlJdGVtIH0gZnJvbSAnLi4vaGlzdG9yeS90eXBlcydcbmltcG9ydCB7IFN1cHBvcnRlZEltYWdlRm9ybWF0cywgU3VwcG9ydGVkTWFya2Rvd25Gb3JtYXRzLCBTdXBwb3J0ZWRWaWRlb0Zvcm1hdHMgfSBmcm9tICdAL2dsb2JhbHMnXG5cbmV4cG9ydCBjb25zdCBnZXR0ZXJzOiBHZXR0ZXJUcmVlPEZpbGVzU3RhdGUsIFJvb3RTdGF0ZT4gPSB7XG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgZGlyZWN0b3J5IG9mIGZpbGVzIGFuZCBzdWItZGlyZWN0b3JpZXMuXG4gICAqL1xuICBnZXREaXJlY3Rvcnk6IChzdGF0ZSwgZ2V0dGVycywgcm9vdFN0YXRlKSA9PiAocGF0aDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgcGF0aENvbnRlbnQgPSBzdGF0ZS5wYXRoRmlsZXNbcGF0aF1cblxuICAgIGlmIChwYXRoQ29udGVudCkge1xuICAgICAgY29uc3QgaXRlbXM6IEZpbGVCcm93c2VyRW50cnlbXSA9IFtdXG5cbiAgICAgIGNvbnN0IFtyb290LCAuLi5yZXN0T2ZQYXRoXSA9IHBhdGguc3BsaXQoJy8nKVxuICAgICAgY29uc3QgcGF0aE5vUm9vdCA9IHJlc3RPZlBhdGguam9pbignLycpXG5cbiAgICAgIGlmIChwYXRoTm9Sb290ICE9PSAnJykge1xuICAgICAgICBjb25zdCBpdGVtOiBBcHBEaXJlY3RvcnkgPSB7XG4gICAgICAgICAgdHlwZTogJ2RpcmVjdG9yeScsXG4gICAgICAgICAgbmFtZTogJy4uJyxcbiAgICAgICAgICBkaXJuYW1lOiAnLi4nLFxuICAgICAgICAgIG1vZGlmaWVkOiAwLFxuICAgICAgICAgIHNpemU6IDBcbiAgICAgICAgfVxuXG4gICAgICAgIGl0ZW1zLnB1c2goaXRlbSlcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBkaXIgb2YgcGF0aENvbnRlbnQuZGlycykge1xuICAgICAgICBjb25zdCBpdGVtOiBBcHBEaXJlY3RvcnkgPSB7XG4gICAgICAgICAgLi4uZGlyLFxuICAgICAgICAgIHR5cGU6ICdkaXJlY3RvcnknLFxuICAgICAgICAgIG5hbWU6IGRpci5kaXJuYW1lLFxuICAgICAgICAgIG1vZGlmaWVkOiBuZXcgRGF0ZShkaXIubW9kaWZpZWQpLmdldFRpbWUoKVxuICAgICAgICB9XG5cbiAgICAgICAgaXRlbXMucHVzaChpdGVtKVxuICAgICAgfVxuXG4gICAgICAvLyBJZiByb290IGlzIHRpbWVsYXBzZSwgdGhlbiBhZGQgdGh1bWJuYWlscyBkYXRhIHRvIGZpbGVzXG5cbiAgICAgIGNvbnN0IHRpbWVsYXBzZVRodW1ibmFpbEZpbGVzID0gcm9vdCA9PT0gJ3RpbWVsYXBzZSdcbiAgICAgICAgPyBuZXcgU2V0KHBhdGhDb250ZW50LmZpbGVzXG4gICAgICAgICAgLm1hcChmaWxlID0+IGZpbGUuZmlsZW5hbWUpXG4gICAgICAgICAgLmZpbHRlcihmaWxlbmFtZSA9PiBmaWxlbmFtZS5lbmRzV2l0aCgnLmpwZycpKSlcbiAgICAgICAgOiB1bmRlZmluZWRcblxuICAgICAgZm9yIChjb25zdCBmaWxlIG9mIHBhdGhDb250ZW50LmZpbGVzKSB7XG4gICAgICAgIGNvbnN0IGhpc3RvcnkgPSAoZmlsZS5qb2JfaWQgJiYgcm9vdFN0YXRlLmhpc3Rvcnkuam9icy5maW5kKGpvYiA9PiBqb2Iuam9iX2lkID09PSBmaWxlLmpvYl9pZCkpIHx8IHt9IGFzIEhpc3RvcnlJdGVtXG5cbiAgICAgICAgY29uc3QgaXRlbTogQXBwRmlsZVdpdGhNZXRhID0ge1xuICAgICAgICAgIC4uLmZpbGUsXG4gICAgICAgICAgdHlwZTogJ2ZpbGUnLFxuICAgICAgICAgIG5hbWU6IGZpbGUuZmlsZW5hbWUsXG4gICAgICAgICAgZXh0ZW5zaW9uOiBmaWxlLmZpbGVuYW1lLnNwbGl0KCcuJykucG9wKCkgfHwgJycsXG4gICAgICAgICAgcGF0aDogcGF0aE5vUm9vdCxcbiAgICAgICAgICBtb2RpZmllZDogbmV3IERhdGUoZmlsZS5tb2RpZmllZCkuZ2V0VGltZSgpLFxuICAgICAgICAgIGhpc3RvcnlcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aW1lbGFwc2VUaHVtYm5haWxGaWxlcyAmJiBpdGVtLmV4dGVuc2lvbiAhPT0gJ2pwZycpIHtcbiAgICAgICAgICBjb25zdCBleHBlY3RlZFRodW1ibmFpbEZpbGUgPSBgJHtpdGVtLmZpbGVuYW1lLnNsaWNlKDAsIC0oaXRlbS5leHRlbnNpb24ubGVuZ3RoICsgMSkpfS5qcGdgXG5cbiAgICAgICAgICBpZiAodGltZWxhcHNlVGh1bWJuYWlsRmlsZXMuaGFzKGV4cGVjdGVkVGh1bWJuYWlsRmlsZSkpIHtcbiAgICAgICAgICAgIGl0ZW0udGh1bWJuYWlscyA9IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIC8vIHdlIGhhdmUgbm8gZGF0YSByZWdhcmRpbmcgdGhlIHRodW1ibmFpbCBvdGhlciB0aGFuIGl0J3MgVVJMLCBidXQgc2V0dGluZyBpdCBpcyBtYW5kYXRvcnkuLi5cbiAgICAgICAgICAgICAgICBoZWlnaHQ6IDAsXG4gICAgICAgICAgICAgICAgd2lkdGg6IDAsXG4gICAgICAgICAgICAgICAgc2l6ZTogMCxcbiAgICAgICAgICAgICAgICByZWxhdGl2ZV9wYXRoOiBleHBlY3RlZFRodW1ibmFpbEZpbGVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGl0ZW1zLnB1c2goaXRlbSlcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGl0ZW1zXG4gICAgfVxuICB9LFxuXG4gIGdldFJvb3RGaWxlczogKHN0YXRlKSA9PiAocm9vdDogc3RyaW5nKSA9PiB7XG4gICAgcmV0dXJuIHN0YXRlLnJvb3RGaWxlc1tyb290XVxuICB9LFxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgYSByb290IGlzIGF2YWlsYWJsZS5cbiAgICovXG4gIGlzUm9vdEF2YWlsYWJsZTogKHN0YXRlLCBnZXR0ZXJzLCByb290U3RhdGUpID0+IChyOiBzdHJpbmcpID0+IHtcbiAgICByZXR1cm4gcm9vdFN0YXRlLnNlcnZlci5pbmZvLnJlZ2lzdGVyZWRfZGlyZWN0b3JpZXMuaW5jbHVkZXMocilcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcHJvcGVydGllcyBvZiBhIHJvb3QuXG4gICAqL1xuICBnZXRSb290UHJvcGVydGllczogKCkgPT4gKHJvb3Q6IHN0cmluZyk6IFJvb3RQcm9wZXJ0aWVzID0+IHtcbiAgICBjb25zdCBjYW5WaWV3ID0gW1xuICAgICAgLi4uU3VwcG9ydGVkSW1hZ2VGb3JtYXRzLFxuICAgICAgLi4uU3VwcG9ydGVkTWFya2Rvd25Gb3JtYXRzLFxuICAgICAgLi4uU3VwcG9ydGVkVmlkZW9Gb3JtYXRzXG4gICAgXVxuXG4gICAgc3dpdGNoIChyb290KSB7XG4gICAgICBjYXNlICdnY29kZXMnOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHJlYWRvbmx5OiBmYWxzZSxcbiAgICAgICAgICBhY2NlcHRzOiBbJy5nY29kZScsICcuZycsICcuZ2MnLCAnLmdjbycsICcudWZwJywgJy5uYyddLFxuICAgICAgICAgIGNhblZpZXcsXG4gICAgICAgICAgY2FuQ29uZmlndXJlOiB0cnVlLFxuICAgICAgICAgIGZpbHRlclR5cGVzOiBbJ2hpZGRlbl9maWxlcycsICdwcmludF9zdGFydF90aW1lJ11cbiAgICAgICAgfVxuICAgICAgY2FzZSAnY29uZmlnJzpcbiAgICAgIGNhc2UgJ2NhbGlicmF0aW9uJzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICByZWFkb25seTogZmFsc2UsXG4gICAgICAgICAgYWNjZXB0czogWycuY29uZicsICcuY2ZnJywgJy5tZCcsICcuY3NzJywgJy5qcGcnLCAnLmpwZWcnLCAnLnBuZycsICcuZ2lmJ10sXG4gICAgICAgICAgY2FuVmlldyxcbiAgICAgICAgICBjYW5Db25maWd1cmU6IGZhbHNlLFxuICAgICAgICAgIGZpbHRlclR5cGVzOiBbJ2hpZGRlbl9maWxlcycsICdrbGlwcGVyX2JhY2t1cF9maWxlcycsICdtb29ucmFrZXJfYmFja3VwX2ZpbGVzJywgJ2Nyb3dzbmVzdF9iYWNrdXBfZmlsZXMnXVxuICAgICAgICB9XG4gICAgICBjYXNlICdjb25maWdfZXhhbXBsZXMnOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHJlYWRvbmx5OiB0cnVlLFxuICAgICAgICAgIGFjY2VwdHM6IFtdLFxuICAgICAgICAgIGNhblZpZXcsXG4gICAgICAgICAgY2FuQ29uZmlndXJlOiBmYWxzZSxcbiAgICAgICAgICBmaWx0ZXJUeXBlczogWydoaWRkZW5fZmlsZXMnXVxuICAgICAgICB9XG4gICAgICBjYXNlICdkb2NzJzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICByZWFkb25seTogdHJ1ZSxcbiAgICAgICAgICBhY2NlcHRzOiBbXSxcbiAgICAgICAgICBjYW5WaWV3LFxuICAgICAgICAgIGNhbkNvbmZpZ3VyZTogZmFsc2UsXG4gICAgICAgICAgZmlsdGVyVHlwZXM6IFsnaGlkZGVuX2ZpbGVzJ11cbiAgICAgICAgfVxuICAgICAgY2FzZSAnbG9ncyc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcmVhZG9ubHk6IHRydWUsXG4gICAgICAgICAgYWNjZXB0czogW10sXG4gICAgICAgICAgY2FuVmlldyxcbiAgICAgICAgICBjYW5Db25maWd1cmU6IGZhbHNlLFxuICAgICAgICAgIGZpbHRlclR5cGVzOiBbJ2hpZGRlbl9maWxlcycsICdyb2xsZWRfbG9nX2ZpbGVzJ11cbiAgICAgICAgfVxuICAgICAgY2FzZSAndGltZWxhcHNlJzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICByZWFkb25seTogZmFsc2UsXG4gICAgICAgICAgYWNjZXB0czogW10sXG4gICAgICAgICAgY2FuVmlldyxcbiAgICAgICAgICBjYW5Db25maWd1cmU6IGZhbHNlLFxuICAgICAgICAgIGZpbHRlclR5cGVzOiBbJ2hpZGRlbl9maWxlcyddXG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcmVhZG9ubHk6IHRydWUsXG4gICAgICAgICAgYWNjZXB0czogW10sXG4gICAgICAgICAgY2FuVmlldzogW10sXG4gICAgICAgICAgY2FuQ29uZmlndXJlOiBmYWxzZSxcbiAgICAgICAgICBmaWx0ZXJUeXBlczogWydoaWRkZW5fZmlsZXMnXVxuICAgICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgc3BlY2lmaWMgZmlsZS5cbiAgICovXG4gIGdldEZpbGU6IChzdGF0ZSwgZ2V0dGVycywgcm9vdFN0YXRlKSA9PiAocGF0aDogc3RyaW5nLCBmaWxlbmFtZTogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgcGF0aENvbnRlbnQgPSBzdGF0ZS5wYXRoRmlsZXNbcGF0aF1cblxuICAgIGNvbnN0IGZpbGUgPSBwYXRoQ29udGVudD8uZmlsZXMuZmluZChmaWxlID0+IGZpbGUuZmlsZW5hbWUgPT09IGZpbGVuYW1lKVxuXG4gICAgaWYgKGZpbGUpIHtcbiAgICAgIGNvbnN0IGhpc3RvcnkgPSAoZmlsZS5qb2JfaWQgJiYgcm9vdFN0YXRlLmhpc3Rvcnkuam9icy5maW5kKGpvYiA9PiBqb2Iuam9iX2lkID09PSBmaWxlLmpvYl9pZCkpIHx8IHt9IGFzIEhpc3RvcnlJdGVtXG4gICAgICBjb25zdCBbLCAuLi5yZXN0T2ZQYXRoXSA9IHBhdGguc3BsaXQoJy8nKVxuICAgICAgY29uc3QgcGF0aE5vUm9vdCA9IHJlc3RPZlBhdGguam9pbignLycpXG5cbiAgICAgIGNvbnN0IGl0ZW06IEFwcEZpbGVXaXRoTWV0YSA9IHtcbiAgICAgICAgLi4uZmlsZSxcbiAgICAgICAgdHlwZTogJ2ZpbGUnLFxuICAgICAgICBuYW1lOiBmaWxlLmZpbGVuYW1lLFxuICAgICAgICBleHRlbnNpb246IGZpbGUuZmlsZW5hbWUuc3BsaXQoJy4nKS5wb3AoKSB8fCAnJyxcbiAgICAgICAgcGF0aDogcGF0aE5vUm9vdCxcbiAgICAgICAgbW9kaWZpZWQ6IG5ldyBEYXRlKGZpbGUubW9kaWZpZWQpLmdldERhdGUoKSxcbiAgICAgICAgaGlzdG9yeVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gaXRlbVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudGx5IHN0b3JlZCBwYXRoIGZvciBhbnkgZ2l2ZW4gcm9vdC5cbiAgICovXG4gIGdldEN1cnJlbnRQYXRoQnlSb290OiAoc3RhdGUpID0+IChyOiBzdHJpbmcpID0+IHtcbiAgICByZXR1cm4gc3RhdGUuY3VycmVudFBhdGhzW3JdIHx8ICcnXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBib29sZWFuIGluZGljYXRpbmcgaWYgd2UncmUgbG93IG9uIGRpc2sgc3BhY2UuXG4gICAqL1xuICBnZXRMb3dPblNwYWNlOiAoc3RhdGUpID0+IHtcbiAgICAvLyAxMDczNzQxODI0ID0gMWdiXG4gICAgcmV0dXJuIHN0YXRlLmRpc2tfdXNhZ2UuZnJlZSA8IDEwNzM3NDE4MjRcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJucyBjdXJlbnQgZmlsZSBzeXN0ZW0gdXNhZ2UuXG4gICAqL1xuICBnZXRVc2FnZTogKHN0YXRlKSA9PiB7XG4gICAgcmV0dXJuIHN0YXRlLmRpc2tfdXNhZ2VcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFJQSxTQUFTLHVCQUF1QiwwQkFBMEIsNkJBQTZCO0FBRWhGLGFBQU0sVUFBNkM7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