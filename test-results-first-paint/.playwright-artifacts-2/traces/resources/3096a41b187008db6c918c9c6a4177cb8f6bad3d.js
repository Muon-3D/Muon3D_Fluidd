var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { Component } from "/.vite-e2e/4291/deps/vue-property-decorator.js?v=9b9fafc7";
import { httpClientActions } from "/src/api/httpClientActions.ts";
import consola from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
import { EventBus } from "/src/eventBus.ts";
export function uploadErrorText(error) {
  const response = error?.response;
  if (response) {
    const data = response.data;
    const message = typeof data === "string" ? data.trim() : typeof data?.error?.message === "string" ? data.error.message : "";
    if (response.status === 422) return `Checksum mismatch: the printer could not verify the file${message ? `: ${message}` : ""} (HTTP 422)`;
    if (message) return `${message} (HTTP ${response.status})`;
    if (response.status) return `the printer answered HTTP ${response.status}`;
  }
  if (error instanceof Error && error.message) {
    if (/closed|lost|stopped by peer|network error|failed to fetch|connectionreset/i.test(error.message)) {
      return `Connection cut during upload: ${error.message}`;
    }
    return error.message;
  }
  if (typeof error === "string" && error) return error;
  return "unknown error";
}
const uploadsInFlight = /* @__PURE__ */ new WeakMap();
let FilesMixin = class extends Vue {
  get apiUrl() {
    return this.$store.state.config.apiUrl;
  }
  get isTrustedUser() {
    return this.$store.getters["auth/getCurrentUser"]?.username === "_TRUSTED_USER_";
  }
  getThumbUrl(meta, root, path, large, date) {
    const thumb = this.getThumb(meta, root, path, large, date);
    return thumb?.url ?? "";
  }
  getThumb(meta, root, path, large = true, date) {
    if (meta.thumbnails?.length) {
      const thumb = meta.thumbnails.reduce((a, b) => a.size > b.size === large ? a : b);
      if (thumb.relative_path) {
        const filepath = path ? `${root}/${path}` : root;
        return {
          ...thumb,
          url: this.createFileUrl(thumb.relative_path, filepath, date)
        };
      }
    }
  }
  /**
   * Loads a gcode file and parses for the gcode-viewer.
   */
  async getGcode(file) {
    const sizeInMB = file.size / 1024 / 1024;
    const result = sizeInMB < 100 || await this.$confirm(
      this.$t("app.gcode.msg.confirm", {
        filename: file.filename,
        size: this.$filters.getReadableFileSizeString(file.size)
      }).toString(),
      {
        title: "Load a large file?",
        buttonTrueText: "Load it"
      }
    );
    if (result) {
      const path = file.path ? `gcodes/${file.path}` : "gcodes";
      return await this.getFile(file.filename, path, file.size, {
        responseType: "text",
        transformResponse: [(v) => v]
      });
    }
  }
  /**
   * Will retrieve a file blob for independent processing.
   * @param filename The filename to retrieve
   * @param path The path to the file
   */
  async getFile(filename, path, size = 0, options) {
    const filepath = path ? `${path}/${filename}` : filename;
    try {
      const abortController = new AbortController();
      this.$store.dispatch("files/updateFileDownload", {
        filepath,
        size,
        loaded: 0,
        percent: 0,
        speed: 0,
        abortController
      });
      const response = await httpClientActions.serverFilesGet(filepath, {
        ...options,
        signal: abortController.signal,
        onDownloadProgress: (event) => {
          if (abortController.signal.aborted) {
            return;
          }
          const progress = event.progress ?? (size > 0 ? event.loaded / size : 0);
          const payload = {
            filepath,
            loaded: event.loaded,
            percent: Math.round(progress * 100),
            speed: event.rate ?? 0
          };
          if (event.total) {
            size = payload.size = event.total;
          }
          this.$store.dispatch("files/updateFileDownload", payload);
        }
      });
      abortController.abort();
      return response;
    } finally {
      this.$store.dispatch("files/removeFileDownload");
    }
  }
  /**
   * Will download a file by filepath via a standard browser link.
   * @param filename The filename to retrieve.
   * @param path The path to the file.
   */
  async downloadFile(filename, path) {
    try {
      const url = await this.createFileUrlWithToken(filename, path);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      link.setAttribute("target", "_blank");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
    }
  }
  /**
   * Creates a url for a file by filepath.
   * Implements a oneshot.
   * @param filename The filename.
   * @param path The path to the file.
   * @returns The url for the requested file
   */
  createFileUrl(filename, path, date) {
    const filepath = path ? `${path}/${filename}` : `${filename}`;
    return `${this.apiUrl}/server/files/${encodeURI(filepath)}?date=${date || Date.now()}`;
  }
  async createFileUrlWithToken(filename, path, date) {
    const url = this.createFileUrl(filename, path, date);
    return this.isTrustedUser ? url : `${url}&token=${(await httpClientActions.accessOneshotTokenGet()).data.result}`;
  }
  /**
   * Uploads a single file via moonraker.
   * @param file The file object. Contains the filename.
   * @param path The path we're uploading to.
   * @param root The root we're downloading from.
   * @param andPrint If we should attempt to print this file or not.
   * @param options Axios request options
   */
  uploadFile(file, path, root, andPrint, options) {
    const destination = `${root}\0${path}\0${andPrint}`;
    let destinations = uploadsInFlight.get(file);
    const existing = destinations?.get(destination);
    if (existing) return existing;
    if (!destinations) {
      destinations = /* @__PURE__ */ new Map();
      uploadsInFlight.set(file, destinations);
    }
    const upload = this.performUploadFile(file, path, root, andPrint, options);
    destinations.set(destination, upload);
    upload.finally(() => {
      destinations?.delete(destination);
      if (!destinations?.size) uploadsInFlight.delete(file);
    }).catch(() => {
    });
    return upload;
  }
  async performUploadFile(file, path, root, andPrint, options) {
    const filepath = path ? `${path}/${file.name}` : file.name;
    try {
      const abortController = new AbortController();
      this.$store.dispatch("files/updateFileUpload", {
        filepath,
        size: file.size,
        loaded: 0,
        percent: 0,
        speed: 0,
        cancelled: false,
        abortController
      });
      const response = await httpClientActions.serverFilesUploadPost(file, path, root, andPrint, {
        ...options,
        signal: abortController.signal,
        onUploadProgress: (event) => {
          if (abortController.signal.aborted) {
            return;
          }
          this.$store.dispatch("files/updateFileUpload", {
            filepath,
            loaded: event.loaded,
            size: event.total ?? file.size,
            percent: event.progress ? Math.round(event.progress * 100) : 0,
            speed: event.rate ?? 0
          });
        }
      });
      abortController.abort();
      return response;
    } finally {
      this.$store.dispatch("files/removeFileUpload", filepath);
    }
  }
  getFullPathAndFile(rootPath, file) {
    if ("path" in file) {
      return [
        [rootPath, file.path].filter((path) => !!path).join("/"),
        file.file
      ];
    } else {
      return [
        rootPath,
        file
      ];
    }
  }
  // Upload some files.
  async uploadFiles(files, path, root, andPrint, canContinue = () => true) {
    const pendingFiles = Array.from(files);
    for (const file of pendingFiles) {
      const [fullPath, fileObject] = this.getFullPathAndFile(path, file);
      const filepath = fullPath ? `${fullPath}/${fileObject.name}` : fileObject.name;
      this.$store.dispatch("files/updateFileUpload", {
        filepath,
        size: fileObject.size,
        loaded: 0,
        percent: 0,
        speed: 0,
        unit: "kB",
        cancelled: false
      });
    }
    if (files.length > 1) andPrint = false;
    const uploaded = [];
    for (const [index, file] of pendingFiles.entries()) {
      const [fullPath, fileObject] = this.getFullPathAndFile(path, file);
      const filepath = fullPath ? `${fullPath}/${fileObject.name}` : fileObject.name;
      if (!canContinue()) {
        for (const remaining of pendingFiles.slice(index)) {
          const [remainingPath, remainingFile] = this.getFullPathAndFile(path, remaining);
          this.$store.dispatch("files/removeFileUpload", remainingPath ? `${remainingPath}/${remainingFile.name}` : remainingFile.name);
        }
        return false;
      }
      const fileState = this.$store.state.files.uploads.find((u) => u.filepath === filepath);
      if (fileState && !fileState?.cancelled) {
        try {
          await this.uploadFile(fileObject, fullPath, root, andPrint);
          uploaded.push(filepath);
          EventBus.$emit(`Uploaded ${fileObject.name}`, { type: "success", timeout: 4e3 });
        } catch (error) {
          consola.error("[FileUpload] file", error);
          const cancelled = this.$store.state.files.uploads.find((u) => u.filepath === filepath)?.cancelled || error?.name === "CanceledError" || error?.code === "ERR_CANCELED";
          if (!cancelled) {
            EventBus.$emit(`Upload of ${fileObject.name} failed: ${uploadErrorText(error)}`, {
              type: "error",
              timeout: -1,
              action: {
                label: "Try again",
                run: () => {
                  if (canContinue()) this.uploadFiles([fileObject], fullPath, root, andPrint, canContinue).catch(consola.error);
                  else EventBus.$emit("Reconnect to the same printer before trying this upload again.", { type: "warning", timeout: 5e3 });
                }
              }
            });
          }
        }
      } else {
        this.$store.dispatch("files/removeFileUpload", filepath);
      }
    }
    return uploaded;
  }
};
FilesMixin = __decorateClass([
  Component
], FilesMixin);
export {
  FilesMixin as default
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgQXBwRmlsZSwgRmlsZXNVcGxvYWQsIEFwcEZpbGVUaHVtYm5haWwsIEtsaXBwZXJGaWxlTWV0YSB9IGZyb20gJ0Avc3RvcmUvZmlsZXMvdHlwZXMnXG5pbXBvcnQgVnVlIGZyb20gJ3Z1ZSdcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJ3Z1ZS1wcm9wZXJ0eS1kZWNvcmF0b3InXG5pbXBvcnQgdHlwZSB7IEF4aW9zUmVxdWVzdENvbmZpZywgQXhpb3NQcm9ncmVzc0V2ZW50IH0gZnJvbSAnYXhpb3MnXG5pbXBvcnQgeyBodHRwQ2xpZW50QWN0aW9ucyB9IGZyb20gJ0AvYXBpL2h0dHBDbGllbnRBY3Rpb25zJ1xuaW1wb3J0IHR5cGUgeyBGaWxlV2l0aFBhdGggfSBmcm9tICdAL3R5cGVzJ1xuaW1wb3J0IGNvbnNvbGEgZnJvbSAnY29uc29sYSdcbmltcG9ydCB7IEV2ZW50QnVzIH0gZnJvbSAnQC9ldmVudEJ1cydcblxuLyoqXG4gKiBUaGUgd29yZHMgYSBmYWlsZWQgdXBsb2FkIGlzIHJlcG9ydGVkIHdpdGg6IE1vb25yYWtlcidzIG9yIG11b24tbGluaydzIG93blxuICogbWVzc2FnZSB3aGVuIHRoZSBwcmludGVyIGFuc3dlcmVkLCBlbHNlIHRoZSB0cmFuc3BvcnQncyBlcnJvciB0ZXh0IChmb3JcbiAqIGV4YW1wbGUgdGhlIHJlbGF5J3MgXCJzZW5kaW5nIHN0b3BwZWQgYnkgcGVlcjogZXJyb3IgMFwiKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwbG9hZEVycm9yVGV4dCAoZXJyb3I6IHVua25vd24pOiBzdHJpbmcge1xuICBjb25zdCByZXNwb25zZSA9IChlcnJvciBhcyB7IHJlc3BvbnNlPzogeyBzdGF0dXM/OiBudW1iZXIsIGRhdGE/OiB1bmtub3duIH0gfSB8IG51bGwpPy5yZXNwb25zZVxuICBpZiAocmVzcG9uc2UpIHtcbiAgICBjb25zdCBkYXRhID0gcmVzcG9uc2UuZGF0YSBhcyB7IGVycm9yPzogeyBtZXNzYWdlPzogdW5rbm93biB9IH0gfCBzdHJpbmcgfCB1bmRlZmluZWRcbiAgICBjb25zdCBtZXNzYWdlID0gdHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnXG4gICAgICA/IGRhdGEudHJpbSgpXG4gICAgICA6IHR5cGVvZiBkYXRhPy5lcnJvcj8ubWVzc2FnZSA9PT0gJ3N0cmluZycgPyBkYXRhLmVycm9yLm1lc3NhZ2UgOiAnJ1xuICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQyMikgcmV0dXJuIGBDaGVja3N1bSBtaXNtYXRjaDogdGhlIHByaW50ZXIgY291bGQgbm90IHZlcmlmeSB0aGUgZmlsZSR7bWVzc2FnZSA/IGA6ICR7bWVzc2FnZX1gIDogJyd9IChIVFRQIDQyMilgXG4gICAgaWYgKG1lc3NhZ2UpIHJldHVybiBgJHttZXNzYWdlfSAoSFRUUCAke3Jlc3BvbnNlLnN0YXR1c30pYFxuICAgIGlmIChyZXNwb25zZS5zdGF0dXMpIHJldHVybiBgdGhlIHByaW50ZXIgYW5zd2VyZWQgSFRUUCAke3Jlc3BvbnNlLnN0YXR1c31gXG4gIH1cbiAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgJiYgZXJyb3IubWVzc2FnZSkge1xuICAgIGlmICgvY2xvc2VkfGxvc3R8c3RvcHBlZCBieSBwZWVyfG5ldHdvcmsgZXJyb3J8ZmFpbGVkIHRvIGZldGNofGNvbm5lY3Rpb25yZXNldC9pLnRlc3QoZXJyb3IubWVzc2FnZSkpIHtcbiAgICAgIHJldHVybiBgQ29ubmVjdGlvbiBjdXQgZHVyaW5nIHVwbG9hZDogJHtlcnJvci5tZXNzYWdlfWBcbiAgICB9XG4gICAgcmV0dXJuIGVycm9yLm1lc3NhZ2VcbiAgfVxuICBpZiAodHlwZW9mIGVycm9yID09PSAnc3RyaW5nJyAmJiBlcnJvcikgcmV0dXJuIGVycm9yXG4gIHJldHVybiAndW5rbm93biBlcnJvcidcbn1cblxudHlwZSBVcGxvYWRSZXNwb25zZSA9IFJldHVyblR5cGU8dHlwZW9mIGh0dHBDbGllbnRBY3Rpb25zLnNlcnZlckZpbGVzVXBsb2FkUG9zdD5cblxuLy8gQSBwaWNrZXIvZHJvcCBhY3Rpb24gY2FuIGJlIG9ic2VydmVkIGJ5IG1vcmUgdGhhbiBvbmUgbW91bnRlZCB1cGxvYWQgc3VyZmFjZS5cbi8vIFRoZSBGaWxlIG9iamVjdCBpZGVudGlmaWVzIHRoYXQgb25lIGJyb3dzZXIgYWN0aW9uOyBmb3JnZXQgaXQgYWZ0ZXIgc2V0dGxlbWVudFxuLy8gc28gYSBsYXRlciwgZGVsaWJlcmF0ZSB1cGxvYWQgb3IgcmV0cnkgc3RpbGwgcmVhY2hlcyB0aGUgcHJpbnRlci5cbmNvbnN0IHVwbG9hZHNJbkZsaWdodCA9IG5ldyBXZWFrTWFwPEZpbGUsIE1hcDxzdHJpbmcsIFVwbG9hZFJlc3BvbnNlPj4oKVxuXG5AQ29tcG9uZW50XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGaWxlc01peGluIGV4dGVuZHMgVnVlIHtcbiAgZ2V0IGFwaVVybCAoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuc3RhdGUuY29uZmlnLmFwaVVybCBhcyBzdHJpbmdcbiAgfVxuXG4gIGdldCBpc1RydXN0ZWRVc2VyICgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kc3RvcmUuZ2V0dGVyc1snYXV0aC9nZXRDdXJyZW50VXNlciddPy51c2VybmFtZSA9PT0gJ19UUlVTVEVEX1VTRVJfJ1xuICB9XG5cbiAgZ2V0VGh1bWJVcmwgKG1ldGE6IEtsaXBwZXJGaWxlTWV0YSwgcm9vdDogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIGxhcmdlOiBib29sZWFuLCBkYXRlPzogbnVtYmVyKSB7XG4gICAgY29uc3QgdGh1bWIgPSB0aGlzLmdldFRodW1iKG1ldGEsIHJvb3QsIHBhdGgsIGxhcmdlLCBkYXRlKVxuXG4gICAgcmV0dXJuIHRodW1iPy51cmwgPz8gJydcbiAgfVxuXG4gIGdldFRodW1iIChtZXRhOiBLbGlwcGVyRmlsZU1ldGEsIHJvb3Q6IHN0cmluZywgcGF0aDogc3RyaW5nLCBsYXJnZSA9IHRydWUsIGRhdGU/OiBudW1iZXIpOiBBcHBGaWxlVGh1bWJuYWlsIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAobWV0YS50aHVtYm5haWxzPy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHRodW1iID0gbWV0YS50aHVtYm5haWxzLnJlZHVjZSgoYSwgYikgPT4gKGEuc2l6ZSA+IGIuc2l6ZSkgPT09IGxhcmdlID8gYSA6IGIpXG5cbiAgICAgIGlmICh0aHVtYi5yZWxhdGl2ZV9wYXRoKSB7XG4gICAgICAgIGNvbnN0IGZpbGVwYXRoID0gcGF0aCA/IGAke3Jvb3R9LyR7cGF0aH1gIDogcm9vdFxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4udGh1bWIsXG4gICAgICAgICAgdXJsOiB0aGlzLmNyZWF0ZUZpbGVVcmwodGh1bWIucmVsYXRpdmVfcGF0aCwgZmlsZXBhdGgsIGRhdGUpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYSBnY29kZSBmaWxlIGFuZCBwYXJzZXMgZm9yIHRoZSBnY29kZS12aWV3ZXIuXG4gICAqL1xuICBhc3luYyBnZXRHY29kZSAoZmlsZTogQXBwRmlsZSkge1xuICAgIGNvbnN0IHNpemVJbk1CID0gZmlsZS5zaXplIC8gMTAyNCAvIDEwMjRcblxuICAgIGNvbnN0IHJlc3VsdCA9IChcbiAgICAgIHNpemVJbk1CIDwgMTAwIHx8XG4gICAgICBhd2FpdCB0aGlzLiRjb25maXJtKFxuICAgICAgICB0aGlzLiR0KCdhcHAuZ2NvZGUubXNnLmNvbmZpcm0nLCB7XG4gICAgICAgICAgZmlsZW5hbWU6IGZpbGUuZmlsZW5hbWUsXG4gICAgICAgICAgc2l6ZTogdGhpcy4kZmlsdGVycy5nZXRSZWFkYWJsZUZpbGVTaXplU3RyaW5nKGZpbGUuc2l6ZSlcbiAgICAgICAgfSkudG9TdHJpbmcoKSwge1xuICAgICAgICAgIHRpdGxlOiAnTG9hZCBhIGxhcmdlIGZpbGU/JyxcbiAgICAgICAgICBidXR0b25UcnVlVGV4dDogJ0xvYWQgaXQnXG4gICAgICAgIH0pXG4gICAgKVxuXG4gICAgaWYgKHJlc3VsdCkge1xuICAgICAgY29uc3QgcGF0aCA9IGZpbGUucGF0aCA/IGBnY29kZXMvJHtmaWxlLnBhdGh9YCA6ICdnY29kZXMnXG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRGaWxlPHN0cmluZz4oZmlsZS5maWxlbmFtZSwgcGF0aCwgZmlsZS5zaXplLCB7XG4gICAgICAgIHJlc3BvbnNlVHlwZTogJ3RleHQnLFxuICAgICAgICB0cmFuc2Zvcm1SZXNwb25zZTogW3YgPT4gdl1cbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFdpbGwgcmV0cmlldmUgYSBmaWxlIGJsb2IgZm9yIGluZGVwZW5kZW50IHByb2Nlc3NpbmcuXG4gICAqIEBwYXJhbSBmaWxlbmFtZSBUaGUgZmlsZW5hbWUgdG8gcmV0cmlldmVcbiAgICogQHBhcmFtIHBhdGggVGhlIHBhdGggdG8gdGhlIGZpbGVcbiAgICovXG4gIGFzeW5jIGdldEZpbGU8VCA9IGFueT4gKGZpbGVuYW1lOiBzdHJpbmcsIHBhdGg6IHN0cmluZywgc2l6ZSA9IDAsIG9wdGlvbnM/OiBBeGlvc1JlcXVlc3RDb25maWcpIHtcbiAgICAvLyBTb3J0IG91dCB0aGUgZmlsZXBhdGhcbiAgICBjb25zdCBmaWxlcGF0aCA9IHBhdGggPyBgJHtwYXRofS8ke2ZpbGVuYW1lfWAgOiBmaWxlbmFtZVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGFib3J0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKVxuXG4gICAgICAvLyBBZGQgYW4gZW50cnkgdG8gdnVleCBpbmRpY2F0aW5nIHdlJ3JlIGRvd25sb2FkaW5nIGEgZmlsZS5cbiAgICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdmaWxlcy91cGRhdGVGaWxlRG93bmxvYWQnLCB7XG4gICAgICAgIGZpbGVwYXRoLFxuICAgICAgICBzaXplLFxuICAgICAgICBsb2FkZWQ6IDAsXG4gICAgICAgIHBlcmNlbnQ6IDAsXG4gICAgICAgIHNwZWVkOiAwLFxuICAgICAgICBhYm9ydENvbnRyb2xsZXJcbiAgICAgIH0pXG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgaHR0cENsaWVudEFjdGlvbnMuc2VydmVyRmlsZXNHZXQ8VD4oZmlsZXBhdGgsIHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgc2lnbmFsOiBhYm9ydENvbnRyb2xsZXIuc2lnbmFsLFxuICAgICAgICBvbkRvd25sb2FkUHJvZ3Jlc3M6IChldmVudDogQXhpb3NQcm9ncmVzc0V2ZW50KSA9PiB7XG4gICAgICAgICAgaWYgKGFib3J0Q29udHJvbGxlci5zaWduYWwuYWJvcnRlZCkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgcHJvZ3Jlc3MgPSBldmVudC5wcm9ncmVzcyA/PyAoXG4gICAgICAgICAgICBzaXplID4gMFxuICAgICAgICAgICAgICA/IGV2ZW50LmxvYWRlZCAvIHNpemVcbiAgICAgICAgICAgICAgOiAwXG4gICAgICAgICAgKVxuXG4gICAgICAgICAgY29uc3QgcGF5bG9hZDogYW55ID0ge1xuICAgICAgICAgICAgZmlsZXBhdGgsXG4gICAgICAgICAgICBsb2FkZWQ6IGV2ZW50LmxvYWRlZCxcbiAgICAgICAgICAgIHBlcmNlbnQ6IE1hdGgucm91bmQocHJvZ3Jlc3MgKiAxMDApLFxuICAgICAgICAgICAgc3BlZWQ6IGV2ZW50LnJhdGUgPz8gMFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChldmVudC50b3RhbCkge1xuICAgICAgICAgICAgc2l6ZSA9IHBheWxvYWQuc2l6ZSA9IGV2ZW50LnRvdGFsXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ2ZpbGVzL3VwZGF0ZUZpbGVEb3dubG9hZCcsIHBheWxvYWQpXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIGFib3J0Q29udHJvbGxlci5hYm9ydCgpXG5cbiAgICAgIHJldHVybiByZXNwb25zZVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnZmlsZXMvcmVtb3ZlRmlsZURvd25sb2FkJylcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogV2lsbCBkb3dubG9hZCBhIGZpbGUgYnkgZmlsZXBhdGggdmlhIGEgc3RhbmRhcmQgYnJvd3NlciBsaW5rLlxuICAgKiBAcGFyYW0gZmlsZW5hbWUgVGhlIGZpbGVuYW1lIHRvIHJldHJpZXZlLlxuICAgKiBAcGFyYW0gcGF0aCBUaGUgcGF0aCB0byB0aGUgZmlsZS5cbiAgICovXG4gIGFzeW5jIGRvd25sb2FkRmlsZSAoZmlsZW5hbWU6IHN0cmluZywgcGF0aDogc3RyaW5nKSB7XG4gICAgLy8gR3JhYiBhIG9uZXNob3QuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHVybCA9IGF3YWl0IHRoaXMuY3JlYXRlRmlsZVVybFdpdGhUb2tlbihmaWxlbmFtZSwgcGF0aClcblxuICAgICAgLy8gQ3JlYXRlIGEgbGluaywgaGFuZGxlIGl0cyBjbGljayAtIGFuZCBmaW5hbGx5IHJlbW92ZSBpdCBhZ2Fpbi5cbiAgICAgIGNvbnN0IGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJylcbiAgICAgIGxpbmsuaHJlZiA9IHVybFxuICAgICAgbGluay5zZXRBdHRyaWJ1dGUoJ2Rvd25sb2FkJywgZmlsZW5hbWUpXG4gICAgICBsaW5rLnNldEF0dHJpYnV0ZSgndGFyZ2V0JywgJ19ibGFuaycpXG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGxpbmspXG4gICAgICBsaW5rLmNsaWNrKClcbiAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQobGluaylcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIExpa2VseSBhIDQwMS5cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHVybCBmb3IgYSBmaWxlIGJ5IGZpbGVwYXRoLlxuICAgKiBJbXBsZW1lbnRzIGEgb25lc2hvdC5cbiAgICogQHBhcmFtIGZpbGVuYW1lIFRoZSBmaWxlbmFtZS5cbiAgICogQHBhcmFtIHBhdGggVGhlIHBhdGggdG8gdGhlIGZpbGUuXG4gICAqIEByZXR1cm5zIFRoZSB1cmwgZm9yIHRoZSByZXF1ZXN0ZWQgZmlsZVxuICAgKi9cbiAgY3JlYXRlRmlsZVVybCAoZmlsZW5hbWU6IHN0cmluZywgcGF0aDogc3RyaW5nLCBkYXRlPzogbnVtYmVyKSB7XG4gICAgY29uc3QgZmlsZXBhdGggPSAocGF0aCkgPyBgJHtwYXRofS8ke2ZpbGVuYW1lfWAgOiBgJHtmaWxlbmFtZX1gXG5cbiAgICByZXR1cm4gYCR7dGhpcy5hcGlVcmx9L3NlcnZlci9maWxlcy8ke2VuY29kZVVSSShmaWxlcGF0aCl9P2RhdGU9JHtkYXRlIHx8IERhdGUubm93KCl9YFxuICB9XG5cbiAgYXN5bmMgY3JlYXRlRmlsZVVybFdpdGhUb2tlbiAoZmlsZW5hbWU6IHN0cmluZywgcGF0aDogc3RyaW5nLCBkYXRlPzogbnVtYmVyKSB7XG4gICAgY29uc3QgdXJsID0gdGhpcy5jcmVhdGVGaWxlVXJsKGZpbGVuYW1lLCBwYXRoLCBkYXRlKVxuXG4gICAgcmV0dXJuIHRoaXMuaXNUcnVzdGVkVXNlclxuICAgICAgPyB1cmxcbiAgICAgIDogYCR7dXJsfSZ0b2tlbj0keyhhd2FpdCBodHRwQ2xpZW50QWN0aW9ucy5hY2Nlc3NPbmVzaG90VG9rZW5HZXQoKSkuZGF0YS5yZXN1bHR9YFxuICB9XG5cbiAgLyoqXG4gICAqIFVwbG9hZHMgYSBzaW5nbGUgZmlsZSB2aWEgbW9vbnJha2VyLlxuICAgKiBAcGFyYW0gZmlsZSBUaGUgZmlsZSBvYmplY3QuIENvbnRhaW5zIHRoZSBmaWxlbmFtZS5cbiAgICogQHBhcmFtIHBhdGggVGhlIHBhdGggd2UncmUgdXBsb2FkaW5nIHRvLlxuICAgKiBAcGFyYW0gcm9vdCBUaGUgcm9vdCB3ZSdyZSBkb3dubG9hZGluZyBmcm9tLlxuICAgKiBAcGFyYW0gYW5kUHJpbnQgSWYgd2Ugc2hvdWxkIGF0dGVtcHQgdG8gcHJpbnQgdGhpcyBmaWxlIG9yIG5vdC5cbiAgICogQHBhcmFtIG9wdGlvbnMgQXhpb3MgcmVxdWVzdCBvcHRpb25zXG4gICAqL1xuICB1cGxvYWRGaWxlIChmaWxlOiBGaWxlLCBwYXRoOiBzdHJpbmcsIHJvb3Q6IHN0cmluZywgYW5kUHJpbnQ6IGJvb2xlYW4sIG9wdGlvbnM/OiBBeGlvc1JlcXVlc3RDb25maWcpOiBVcGxvYWRSZXNwb25zZSB7XG4gICAgY29uc3QgZGVzdGluYXRpb24gPSBgJHtyb290fVxcMCR7cGF0aH1cXDAke2FuZFByaW50fWBcbiAgICBsZXQgZGVzdGluYXRpb25zID0gdXBsb2Fkc0luRmxpZ2h0LmdldChmaWxlKVxuICAgIGNvbnN0IGV4aXN0aW5nID0gZGVzdGluYXRpb25zPy5nZXQoZGVzdGluYXRpb24pXG4gICAgaWYgKGV4aXN0aW5nKSByZXR1cm4gZXhpc3RpbmdcblxuICAgIGlmICghZGVzdGluYXRpb25zKSB7XG4gICAgICBkZXN0aW5hdGlvbnMgPSBuZXcgTWFwKClcbiAgICAgIHVwbG9hZHNJbkZsaWdodC5zZXQoZmlsZSwgZGVzdGluYXRpb25zKVxuICAgIH1cblxuICAgIGNvbnN0IHVwbG9hZCA9IHRoaXMucGVyZm9ybVVwbG9hZEZpbGUoZmlsZSwgcGF0aCwgcm9vdCwgYW5kUHJpbnQsIG9wdGlvbnMpXG4gICAgZGVzdGluYXRpb25zLnNldChkZXN0aW5hdGlvbiwgdXBsb2FkKVxuICAgIHVwbG9hZC5maW5hbGx5KCgpID0+IHtcbiAgICAgIGRlc3RpbmF0aW9ucz8uZGVsZXRlKGRlc3RpbmF0aW9uKVxuICAgICAgaWYgKCFkZXN0aW5hdGlvbnM/LnNpemUpIHVwbG9hZHNJbkZsaWdodC5kZWxldGUoZmlsZSlcbiAgICB9KS5jYXRjaCgoKSA9PiB7fSlcbiAgICByZXR1cm4gdXBsb2FkXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBlcmZvcm1VcGxvYWRGaWxlIChmaWxlOiBGaWxlLCBwYXRoOiBzdHJpbmcsIHJvb3Q6IHN0cmluZywgYW5kUHJpbnQ6IGJvb2xlYW4sIG9wdGlvbnM/OiBBeGlvc1JlcXVlc3RDb25maWcpIHtcbiAgICBjb25zdCBmaWxlcGF0aCA9IHBhdGhcbiAgICAgID8gYCR7cGF0aH0vJHtmaWxlLm5hbWV9YFxuICAgICAgOiBmaWxlLm5hbWVcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBhYm9ydENvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKClcblxuICAgICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ2ZpbGVzL3VwZGF0ZUZpbGVVcGxvYWQnLCB7XG4gICAgICAgIGZpbGVwYXRoLFxuICAgICAgICBzaXplOiBmaWxlLnNpemUsXG4gICAgICAgIGxvYWRlZDogMCxcbiAgICAgICAgcGVyY2VudDogMCxcbiAgICAgICAgc3BlZWQ6IDAsXG4gICAgICAgIGNhbmNlbGxlZDogZmFsc2UsXG4gICAgICAgIGFib3J0Q29udHJvbGxlclxuICAgICAgfSlcblxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBodHRwQ2xpZW50QWN0aW9ucy5zZXJ2ZXJGaWxlc1VwbG9hZFBvc3QoZmlsZSwgcGF0aCwgcm9vdCwgYW5kUHJpbnQsIHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgc2lnbmFsOiBhYm9ydENvbnRyb2xsZXIuc2lnbmFsLFxuICAgICAgICBvblVwbG9hZFByb2dyZXNzOiAoZXZlbnQ6IEF4aW9zUHJvZ3Jlc3NFdmVudCkgPT4ge1xuICAgICAgICAgIGlmIChhYm9ydENvbnRyb2xsZXIuc2lnbmFsLmFib3J0ZWQpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdmaWxlcy91cGRhdGVGaWxlVXBsb2FkJywge1xuICAgICAgICAgICAgZmlsZXBhdGgsXG4gICAgICAgICAgICBsb2FkZWQ6IGV2ZW50LmxvYWRlZCxcbiAgICAgICAgICAgIHNpemU6IGV2ZW50LnRvdGFsID8/IGZpbGUuc2l6ZSxcbiAgICAgICAgICAgIHBlcmNlbnQ6IGV2ZW50LnByb2dyZXNzID8gTWF0aC5yb3VuZChldmVudC5wcm9ncmVzcyAqIDEwMCkgOiAwLFxuICAgICAgICAgICAgc3BlZWQ6IGV2ZW50LnJhdGUgPz8gMFxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIGFib3J0Q29udHJvbGxlci5hYm9ydCgpXG5cbiAgICAgIHJldHVybiByZXNwb25zZVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnZmlsZXMvcmVtb3ZlRmlsZVVwbG9hZCcsIGZpbGVwYXRoKVxuICAgIH1cbiAgfVxuXG4gIGdldEZ1bGxQYXRoQW5kRmlsZSAocm9vdFBhdGg6IHN0cmluZywgZmlsZTogRmlsZSB8IEZpbGVXaXRoUGF0aCk6IFtzdHJpbmcsIEZpbGVdIHtcbiAgICBpZiAoJ3BhdGgnIGluIGZpbGUpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIFtyb290UGF0aCwgZmlsZS5wYXRoXVxuICAgICAgICAgIC5maWx0ZXIocGF0aCA9PiAhIXBhdGgpXG4gICAgICAgICAgLmpvaW4oJy8nKSxcbiAgICAgICAgZmlsZS5maWxlXG4gICAgICBdXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIHJvb3RQYXRoLFxuICAgICAgICBmaWxlXG4gICAgICBdXG4gICAgfVxuICB9XG5cbiAgLy8gVXBsb2FkIHNvbWUgZmlsZXMuXG4gIGFzeW5jIHVwbG9hZEZpbGVzIChmaWxlczogRmlsZUxpc3QgfCBGaWxlW10gfCBGaWxlV2l0aFBhdGhbXSwgcGF0aDogc3RyaW5nLCByb290OiBzdHJpbmcsIGFuZFByaW50OiBib29sZWFuLCBjYW5Db250aW51ZTogKCkgPT4gYm9vbGVhbiA9ICgpID0+IHRydWUpOiBQcm9taXNlPHN0cmluZ1tdIHwgZmFsc2U+IHtcbiAgICBjb25zdCBwZW5kaW5nRmlsZXMgPSBBcnJheS5mcm9tKGZpbGVzIGFzIEFycmF5TGlrZTxGaWxlIHwgRmlsZVdpdGhQYXRoPilcbiAgICAvLyBGb3IgZWFjaCBmaWxlLCBhZGRzIHRoZSBhc3NvY2lhdGVkIHN0YXRlLlxuICAgIGZvciAoY29uc3QgZmlsZSBvZiBwZW5kaW5nRmlsZXMpIHtcbiAgICAgIGNvbnN0IFtmdWxsUGF0aCwgZmlsZU9iamVjdF0gPSB0aGlzLmdldEZ1bGxQYXRoQW5kRmlsZShwYXRoLCBmaWxlKVxuXG4gICAgICBjb25zdCBmaWxlcGF0aCA9IGZ1bGxQYXRoXG4gICAgICAgID8gYCR7ZnVsbFBhdGh9LyR7ZmlsZU9iamVjdC5uYW1lfWBcbiAgICAgICAgOiBmaWxlT2JqZWN0Lm5hbWVcblxuICAgICAgdGhpcy4kc3RvcmUuZGlzcGF0Y2goJ2ZpbGVzL3VwZGF0ZUZpbGVVcGxvYWQnLCB7XG4gICAgICAgIGZpbGVwYXRoLFxuICAgICAgICBzaXplOiBmaWxlT2JqZWN0LnNpemUsXG4gICAgICAgIGxvYWRlZDogMCxcbiAgICAgICAgcGVyY2VudDogMCxcbiAgICAgICAgc3BlZWQ6IDAsXG4gICAgICAgIHVuaXQ6ICdrQicsXG4gICAgICAgIGNhbmNlbGxlZDogZmFsc2VcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gQXN5bmMgdXBsb2FkcyBjYXVzZSBpc3N1ZXMgaW4gbW9vbnJha2VyIC8ga2xpcHBlci5cbiAgICAvLyBTbyBpbnN0ZWFkLCB1cGxvYWQgc2VxdWVudGlhbGx5IHdhaXRpbmcgZm9yIG1vb25yYWtlciB0byBmaW5pc2hcbiAgICAvLyBwcm9jZXNzaW5nIG9mIGVhY2ggZmlsZS5cbiAgICBpZiAoZmlsZXMubGVuZ3RoID4gMSkgYW5kUHJpbnQgPSBmYWxzZVxuICAgIC8vIFRoZSBmaWxlcyB0aGF0IHJlYWxseSByZWFjaGVkIHRoZSBwcmludGVyOiBhIGNhbmNlbGxlZCBvciBmYWlsZWQgb25lIGlzIGxlZnQgb3V0LlxuICAgIGNvbnN0IHVwbG9hZGVkOiBzdHJpbmdbXSA9IFtdXG4gICAgZm9yIChjb25zdCBbaW5kZXgsIGZpbGVdIG9mIHBlbmRpbmdGaWxlcy5lbnRyaWVzKCkpIHtcbiAgICAgIGNvbnN0IFtmdWxsUGF0aCwgZmlsZU9iamVjdF0gPSB0aGlzLmdldEZ1bGxQYXRoQW5kRmlsZShwYXRoLCBmaWxlKVxuXG4gICAgICBjb25zdCBmaWxlcGF0aCA9IGZ1bGxQYXRoXG4gICAgICAgID8gYCR7ZnVsbFBhdGh9LyR7ZmlsZU9iamVjdC5uYW1lfWBcbiAgICAgICAgOiBmaWxlT2JqZWN0Lm5hbWVcblxuICAgICAgLy8gQSBjYWxsZXIgd2hvc2UgY29tbWFuZHMgYmVsb25nIHRvIGEgY2FwdHVyZWQgcHJpbnRlci9hY2NvdW50IGNoZWNrc1xuICAgICAgLy8gYWdhaW4gYWZ0ZXIgZXZlcnkgYXdhaXRlZCB1cGxvYWQsIGJlZm9yZSB0aGUgbmV4dCByZXF1ZXN0IGlzIHNlbnQuXG4gICAgICBpZiAoIWNhbkNvbnRpbnVlKCkpIHtcbiAgICAgICAgZm9yIChjb25zdCByZW1haW5pbmcgb2YgcGVuZGluZ0ZpbGVzLnNsaWNlKGluZGV4KSkge1xuICAgICAgICAgIGNvbnN0IFtyZW1haW5pbmdQYXRoLCByZW1haW5pbmdGaWxlXSA9IHRoaXMuZ2V0RnVsbFBhdGhBbmRGaWxlKHBhdGgsIHJlbWFpbmluZylcbiAgICAgICAgICB0aGlzLiRzdG9yZS5kaXNwYXRjaCgnZmlsZXMvcmVtb3ZlRmlsZVVwbG9hZCcsIHJlbWFpbmluZ1BhdGggPyBgJHtyZW1haW5pbmdQYXRofS8ke3JlbWFpbmluZ0ZpbGUubmFtZX1gIDogcmVtYWluaW5nRmlsZS5uYW1lKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuXG4gICAgICBjb25zdCBmaWxlU3RhdGUgPSB0aGlzLiRzdG9yZS5zdGF0ZS5maWxlcy51cGxvYWRzLmZpbmQoKHU6IEZpbGVzVXBsb2FkKSA9PiB1LmZpbGVwYXRoID09PSBmaWxlcGF0aClcblxuICAgICAgaWYgKGZpbGVTdGF0ZSAmJiAhZmlsZVN0YXRlPy5jYW5jZWxsZWQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnVwbG9hZEZpbGUoZmlsZU9iamVjdCwgZnVsbFBhdGgsIHJvb3QsIGFuZFByaW50KVxuICAgICAgICAgIHVwbG9hZGVkLnB1c2goZmlsZXBhdGgpXG4gICAgICAgICAgRXZlbnRCdXMuJGVtaXQoYFVwbG9hZGVkICR7ZmlsZU9iamVjdC5uYW1lfWAsIHsgdHlwZTogJ3N1Y2Nlc3MnLCB0aW1lb3V0OiA0MDAwIH0pXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiB1bmtub3duKSB7XG4gICAgICAgICAgY29uc29sYS5lcnJvcignW0ZpbGVVcGxvYWRdIGZpbGUnLCBlcnJvcilcbiAgICAgICAgICAvLyBBIGNhbmNlbGxlZCB1cGxvYWQgd2FzIHRoZSB1c2VyJ3MgY2hvaWNlLCBub3QgYSBmYWlsdXJlLlxuICAgICAgICAgIGNvbnN0IGNhbmNlbGxlZCA9IHRoaXMuJHN0b3JlLnN0YXRlLmZpbGVzLnVwbG9hZHMuZmluZCgodTogRmlsZXNVcGxvYWQpID0+IHUuZmlsZXBhdGggPT09IGZpbGVwYXRoKT8uY2FuY2VsbGVkIHx8XG4gICAgICAgICAgICAoZXJyb3IgYXMgeyBuYW1lPzogc3RyaW5nLCBjb2RlPzogc3RyaW5nIH0gfCBudWxsKT8ubmFtZSA9PT0gJ0NhbmNlbGVkRXJyb3InIHx8XG4gICAgICAgICAgICAoZXJyb3IgYXMgeyBjb2RlPzogc3RyaW5nIH0gfCBudWxsKT8uY29kZSA9PT0gJ0VSUl9DQU5DRUxFRCdcbiAgICAgICAgICBpZiAoIWNhbmNlbGxlZCkge1xuICAgICAgICAgICAgRXZlbnRCdXMuJGVtaXQoYFVwbG9hZCBvZiAke2ZpbGVPYmplY3QubmFtZX0gZmFpbGVkOiAke3VwbG9hZEVycm9yVGV4dChlcnJvcil9YCwge1xuICAgICAgICAgICAgICB0eXBlOiAnZXJyb3InLFxuICAgICAgICAgICAgICB0aW1lb3V0OiAtMSxcbiAgICAgICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdUcnkgYWdhaW4nLFxuICAgICAgICAgICAgICAgIHJ1bjogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgaWYgKGNhbkNvbnRpbnVlKCkpIHRoaXMudXBsb2FkRmlsZXMoW2ZpbGVPYmplY3RdLCBmdWxsUGF0aCwgcm9vdCwgYW5kUHJpbnQsIGNhbkNvbnRpbnVlKS5jYXRjaChjb25zb2xhLmVycm9yKVxuICAgICAgICAgICAgICAgICAgZWxzZSBFdmVudEJ1cy4kZW1pdCgnUmVjb25uZWN0IHRvIHRoZSBzYW1lIHByaW50ZXIgYmVmb3JlIHRyeWluZyB0aGlzIHVwbG9hZCBhZ2Fpbi4nLCB7IHR5cGU6ICd3YXJuaW5nJywgdGltZW91dDogNTAwMCB9KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuJHN0b3JlLmRpc3BhdGNoKCdmaWxlcy9yZW1vdmVGaWxlVXBsb2FkJywgZmlsZXBhdGgpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1cGxvYWRlZFxuICB9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFDQSxPQUFPLFNBQVM7QUFDaEIsU0FBUyxpQkFBaUI7QUFFMUIsU0FBUyx5QkFBeUI7QUFFbEMsT0FBTyxhQUFhO0FBQ3BCLFNBQVMsZ0JBQWdCO0FBT2xCLGdCQUFTLGdCQUFpQixPQUF3QjtBQUN2RCxRQUFNLFdBQVksT0FBcUU7QUFDdkYsTUFBSSxVQUFVO0FBQ1osVUFBTSxPQUFPLFNBQVM7QUFDdEIsVUFBTSxVQUFVLE9BQU8sU0FBUyxXQUM1QixLQUFLLEtBQUssSUFDVixPQUFPLE1BQU0sT0FBTyxZQUFZLFdBQVcsS0FBSyxNQUFNLFVBQVU7QUFDcEUsUUFBSSxTQUFTLFdBQVcsSUFBSyxRQUFPLDJEQUEyRCxVQUFVLEtBQUssT0FBTyxLQUFLLEVBQUU7QUFDNUgsUUFBSSxRQUFTLFFBQU8sR0FBRyxPQUFPLFVBQVUsU0FBUyxNQUFNO0FBQ3ZELFFBQUksU0FBUyxPQUFRLFFBQU8sNkJBQTZCLFNBQVMsTUFBTTtBQUFB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