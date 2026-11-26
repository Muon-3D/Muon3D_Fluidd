import globalAxios from "/.vite-e2e/4291/deps/axios.js?v=9b9fafc7";
import { DUMMY_BASE_URL, assertParamExists, setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, setSearchParams, serializeDataIfNeeded, toPathString, createRequestFunction } from "/src/aux_api/common.ts";
import { BASE_PATH, COLLECTION_FORMATS, BaseAPI, RequiredError, operationServerMap } from "/src/aux_api/base.ts";
export const WifiApiAxiosParamCreator = function(configuration) {
  return {
    /**
     * Show all connection profiles
     * @summary Get Details
     * @param {string} ssid 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getDetailsWifiShowGet: async (ssid, options = {}) => {
      assertParamExists("getDetailsWifiShowGet", "ssid", ssid);
      const localVarPath = `/wifi/show`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "GET", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      if (ssid !== void 0) {
        localVarQueryParameter["ssid"] = ssid;
      }
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * List the saved Wi-Fi profiles, in one call.
     * @summary Wifi Saved
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiSavedWifiSavedGet: async (options = {}) => {
      const localVarPath = `/wifi/saved`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "GET", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Connect to an SSID (with optional password).
     * @summary Wifi Connect
     * @param {Credentials} credentials 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiConnectWifiConnectPost: async (credentials, options = {}) => {
      assertParamExists("wifiConnectWifiConnectPost", "credentials", credentials);
      const localVarPath = `/wifi/connect`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "POST", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      localVarHeaderParameter["Content-Type"] = "application/json";
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      localVarRequestOptions.data = serializeDataIfNeeded(credentials, localVarRequestOptions, configuration);
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Return the currently active Wi-Fi connection, or null if none.
     * @summary Wifi Current
     * @param {boolean} [update] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiCurrentWifiCurrentGet: async (update, options = {}) => {
      const localVarPath = `/wifi/current`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "GET", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      if (update !== void 0) {
        localVarQueryParameter["update"] = update;
      }
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Bring the wifi device down.
     * @summary Wifi Device Down
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiDeviceDownWifiDeviceDownPost: async (options = {}) => {
      const localVarPath = `/wifi/device/down`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "POST", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Bring the  wifi device up.
     * @summary Wifi Device Up
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiDeviceUpWifiDeviceUpPost: async (options = {}) => {
      const localVarPath = `/wifi/device/up`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "POST", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Disconnect from the current Wi-Fi network.
     * @summary Wifi Disconnect
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiDisconnectWifiDisconnectPost: async (options = {}) => {
      const localVarPath = `/wifi/disconnect`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "POST", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Permanently delete the current Wi-Fi connection profile.
     * @summary Wifi Forget
     * @param {string} [ssid] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiForgetWifiForgetDelete: async (ssid, options = {}) => {
      const localVarPath = `/wifi/forget`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "DELETE", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      if (ssid !== void 0) {
        localVarQueryParameter["ssid"] = ssid;
      }
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Scan for available Wi-Fi networks. Only performs a fresh scan if `rescan` is True and it hasn\'t rescanned in the last SCAN_TTL seconds.
     * @summary Wifi Scan
     * @param {boolean} [rescan] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiScanWifiScanGet: async (rescan, options = {}) => {
      const localVarPath = `/wifi/scan`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "GET", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      if (rescan !== void 0) {
        localVarQueryParameter["rescan"] = rescan;
      }
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * 
     * @summary Wifi Status
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiStatusWifiDeviceStatusGet: async (options = {}) => {
      const localVarPath = `/wifi/device/status`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "GET", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Start or switch to a known connection by its SSID.
     * @summary Wifi Switch
     * @param {string} ssid 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiSwitchWifiUpPost: async (ssid, options = {}) => {
      assertParamExists("wifiSwitchWifiUpPost", "ssid", ssid);
      const localVarPath = `/wifi/up`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "POST", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      if (ssid !== void 0) {
        localVarQueryParameter["ssid"] = ssid;
      }
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    }
  };
};
export const WifiApiFp = function(configuration) {
  const localVarAxiosParamCreator = WifiApiAxiosParamCreator(configuration);
  return {
    /**
     * Show all connection profiles
     * @summary Get Details
     * @param {string} ssid 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getDetailsWifiShowGet(ssid, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.getDetailsWifiShowGet(ssid, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["WifiApi.getDetailsWifiShowGet"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * List the saved Wi-Fi profiles, in one call.
     * @summary Wifi Saved
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async wifiSavedWifiSavedGet(options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.wifiSavedWifiSavedGet(options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["WifiApi.wifiSavedWifiSavedGet"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Connect to an SSID (with optional password).
     * @summary Wifi Connect
     * @param {Credentials} credentials 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async wifiConnectWifiConnectPost(credentials, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.wifiConnectWifiConnectPost(credentials, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["WifiApi.wifiConnectWifiConnectPost"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Return the currently active Wi-Fi connection, or null if none.
     * @summary Wifi Current
     * @param {boolean} [update] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async wifiCurrentWifiCurrentGet(update, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.wifiCurrentWifiCurrentGet(update, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["WifiApi.wifiCurrentWifiCurrentGet"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Bring the wifi device down.
     * @summary Wifi Device Down
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async wifiDeviceDownWifiDeviceDownPost(options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.wifiDeviceDownWifiDeviceDownPost(options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["WifiApi.wifiDeviceDownWifiDeviceDownPost"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Bring the  wifi device up.
     * @summary Wifi Device Up
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async wifiDeviceUpWifiDeviceUpPost(options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.wifiDeviceUpWifiDeviceUpPost(options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["WifiApi.wifiDeviceUpWifiDeviceUpPost"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Disconnect from the current Wi-Fi network.
     * @summary Wifi Disconnect
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async wifiDisconnectWifiDisconnectPost(options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.wifiDisconnectWifiDisconnectPost(options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["WifiApi.wifiDisconnectWifiDisconnectPost"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Permanently delete the current Wi-Fi connection profile.
     * @summary Wifi Forget
     * @param {string} [ssid] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async wifiForgetWifiForgetDelete(ssid, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.wifiForgetWifiForgetDelete(ssid, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["WifiApi.wifiForgetWifiForgetDelete"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Scan for available Wi-Fi networks. Only performs a fresh scan if `rescan` is True and it hasn\'t rescanned in the last SCAN_TTL seconds.
     * @summary Wifi Scan
     * @param {boolean} [rescan] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async wifiScanWifiScanGet(rescan, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.wifiScanWifiScanGet(rescan, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["WifiApi.wifiScanWifiScanGet"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * 
     * @summary Wifi Status
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async wifiStatusWifiDeviceStatusGet(options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.wifiStatusWifiDeviceStatusGet(options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["WifiApi.wifiStatusWifiDeviceStatusGet"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Start or switch to a known connection by its SSID.
     * @summary Wifi Switch
     * @param {string} ssid 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async wifiSwitchWifiUpPost(ssid, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.wifiSwitchWifiUpPost(ssid, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["WifiApi.wifiSwitchWifiUpPost"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    }
  };
};
export const WifiApiFactory = function(configuration, basePath, axios) {
  const localVarFp = WifiApiFp(configuration);
  return {
    /**
     * Show all connection profiles
     * @summary Get Details
     * @param {string} ssid 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getDetailsWifiShowGet(ssid, options) {
      return localVarFp.getDetailsWifiShowGet(ssid, options).then((request) => request(axios, basePath));
    },
    /**
     * List the saved Wi-Fi profiles, in one call.
     * @summary Wifi Saved
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiSavedWifiSavedGet(options) {
      return localVarFp.wifiSavedWifiSavedGet(options).then((request) => request(axios, basePath));
    },
    /**
     * Connect to an SSID (with optional password).
     * @summary Wifi Connect
     * @param {Credentials} credentials 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiConnectWifiConnectPost(credentials, options) {
      return localVarFp.wifiConnectWifiConnectPost(credentials, options).then((request) => request(axios, basePath));
    },
    /**
     * Return the currently active Wi-Fi connection, or null if none.
     * @summary Wifi Current
     * @param {boolean} [update] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiCurrentWifiCurrentGet(update, options) {
      return localVarFp.wifiCurrentWifiCurrentGet(update, options).then((request) => request(axios, basePath));
    },
    /**
     * Bring the wifi device down.
     * @summary Wifi Device Down
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiDeviceDownWifiDeviceDownPost(options) {
      return localVarFp.wifiDeviceDownWifiDeviceDownPost(options).then((request) => request(axios, basePath));
    },
    /**
     * Bring the  wifi device up.
     * @summary Wifi Device Up
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiDeviceUpWifiDeviceUpPost(options) {
      return localVarFp.wifiDeviceUpWifiDeviceUpPost(options).then((request) => request(axios, basePath));
    },
    /**
     * Disconnect from the current Wi-Fi network.
     * @summary Wifi Disconnect
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiDisconnectWifiDisconnectPost(options) {
      return localVarFp.wifiDisconnectWifiDisconnectPost(options).then((request) => request(axios, basePath));
    },
    /**
     * Permanently delete the current Wi-Fi connection profile.
     * @summary Wifi Forget
     * @param {string} [ssid] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiForgetWifiForgetDelete(ssid, options) {
      return localVarFp.wifiForgetWifiForgetDelete(ssid, options).then((request) => request(axios, basePath));
    },
    /**
     * Scan for available Wi-Fi networks. Only performs a fresh scan if `rescan` is True and it hasn\'t rescanned in the last SCAN_TTL seconds.
     * @summary Wifi Scan
     * @param {boolean} [rescan] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiScanWifiScanGet(rescan, options) {
      return localVarFp.wifiScanWifiScanGet(rescan, options).then((request) => request(axios, basePath));
    },
    /**
     * 
     * @summary Wifi Status
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiStatusWifiDeviceStatusGet(options) {
      return localVarFp.wifiStatusWifiDeviceStatusGet(options).then((request) => request(axios, basePath));
    },
    /**
     * Start or switch to a known connection by its SSID.
     * @summary Wifi Switch
     * @param {string} ssid 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiSwitchWifiUpPost(ssid, options) {
      return localVarFp.wifiSwitchWifiUpPost(ssid, options).then((request) => request(axios, basePath));
    }
  };
};
export class WifiApi extends BaseAPI {
  /**
   * Show all connection profiles
   * @summary Get Details
   * @param {string} ssid 
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof WifiApi
   */
  getDetailsWifiShowGet(ssid, options) {
    return WifiApiFp(this.configuration).getDetailsWifiShowGet(ssid, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * List the saved Wi-Fi profiles, in one call.
   * @summary Wifi Saved
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof WifiApi
   */
  wifiSavedWifiSavedGet(options) {
    return WifiApiFp(this.configuration).wifiSavedWifiSavedGet(options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Connect to an SSID (with optional password).
   * @summary Wifi Connect
   * @param {Credentials} credentials 
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof WifiApi
   */
  wifiConnectWifiConnectPost(credentials, options) {
    return WifiApiFp(this.configuration).wifiConnectWifiConnectPost(credentials, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Return the currently active Wi-Fi connection, or null if none.
   * @summary Wifi Current
   * @param {boolean} [update] 
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof WifiApi
   */
  wifiCurrentWifiCurrentGet(update, options) {
    return WifiApiFp(this.configuration).wifiCurrentWifiCurrentGet(update, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Bring the wifi device down.
   * @summary Wifi Device Down
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof WifiApi
   */
  wifiDeviceDownWifiDeviceDownPost(options) {
    return WifiApiFp(this.configuration).wifiDeviceDownWifiDeviceDownPost(options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Bring the  wifi device up.
   * @summary Wifi Device Up
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof WifiApi
   */
  wifiDeviceUpWifiDeviceUpPost(options) {
    return WifiApiFp(this.configuration).wifiDeviceUpWifiDeviceUpPost(options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Disconnect from the current Wi-Fi network.
   * @summary Wifi Disconnect
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof WifiApi
   */
  wifiDisconnectWifiDisconnectPost(options) {
    return WifiApiFp(this.configuration).wifiDisconnectWifiDisconnectPost(options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Permanently delete the current Wi-Fi connection profile.
   * @summary Wifi Forget
   * @param {string} [ssid] 
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof WifiApi
   */
  wifiForgetWifiForgetDelete(ssid, options) {
    return WifiApiFp(this.configuration).wifiForgetWifiForgetDelete(ssid, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Scan for available Wi-Fi networks. Only performs a fresh scan if `rescan` is True and it hasn\'t rescanned in the last SCAN_TTL seconds.
   * @summary Wifi Scan
   * @param {boolean} [rescan] 
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof WifiApi
   */
  wifiScanWifiScanGet(rescan, options) {
    return WifiApiFp(this.configuration).wifiScanWifiScanGet(rescan, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * 
   * @summary Wifi Status
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof WifiApi
   */
  wifiStatusWifiDeviceStatusGet(options) {
    return WifiApiFp(this.configuration).wifiStatusWifiDeviceStatusGet(options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Start or switch to a known connection by its SSID.
   * @summary Wifi Switch
   * @param {string} ssid 
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof WifiApi
   */
  wifiSwitchWifiUpPost(ssid, options) {
    return WifiApiFp(this.configuration).wifiSwitchWifiUpPost(ssid, options).then((request) => request(this.axios, this.basePath));
  }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndpZmktYXBpLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIHRzbGludDpkaXNhYmxlICovXG4vKiBlc2xpbnQtZGlzYWJsZSAqL1xuLyoqXG4gKiBTbWFydEtub2IgQVVYIEhUVFAgQVBJXG4gKiBObyBkZXNjcmlwdGlvbiBwcm92aWRlZCAoZ2VuZXJhdGVkIGJ5IE9wZW5hcGkgR2VuZXJhdG9yIGh0dHBzOi8vZ2l0aHViLmNvbS9vcGVuYXBpdG9vbHMvb3BlbmFwaS1nZW5lcmF0b3IpXG4gKlxuICogVGhlIHZlcnNpb24gb2YgdGhlIE9wZW5BUEkgZG9jdW1lbnQ6IDAuMS4wXG4gKiBcbiAqXG4gKiBOT1RFOiBUaGlzIGNsYXNzIGlzIGF1dG8gZ2VuZXJhdGVkIGJ5IE9wZW5BUEkgR2VuZXJhdG9yIChodHRwczovL29wZW5hcGktZ2VuZXJhdG9yLnRlY2gpLlxuICogaHR0cHM6Ly9vcGVuYXBpLWdlbmVyYXRvci50ZWNoXG4gKiBEbyBub3QgZWRpdCB0aGUgY2xhc3MgbWFudWFsbHkuXG4gKi9cblxuXG5pbXBvcnQgdHlwZSB7IENvbmZpZ3VyYXRpb24gfSBmcm9tICcuLi9jb25maWd1cmF0aW9uJztcbmltcG9ydCB0eXBlIHsgQXhpb3NQcm9taXNlLCBBeGlvc0luc3RhbmNlLCBSYXdBeGlvc1JlcXVlc3RDb25maWcgfSBmcm9tICdheGlvcyc7XG5pbXBvcnQgZ2xvYmFsQXhpb3MgZnJvbSAnYXhpb3MnO1xuLy8gU29tZSBpbXBvcnRzIG5vdCB1c2VkIGRlcGVuZGluZyBvbiB0ZW1wbGF0ZSBjb25kaXRpb25zXG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgeyBEVU1NWV9CQVNFX1VSTCwgYXNzZXJ0UGFyYW1FeGlzdHMsIHNldEFwaUtleVRvT2JqZWN0LCBzZXRCYXNpY0F1dGhUb09iamVjdCwgc2V0QmVhcmVyQXV0aFRvT2JqZWN0LCBzZXRPQXV0aFRvT2JqZWN0LCBzZXRTZWFyY2hQYXJhbXMsIHNlcmlhbGl6ZURhdGFJZk5lZWRlZCwgdG9QYXRoU3RyaW5nLCBjcmVhdGVSZXF1ZXN0RnVuY3Rpb24gfSBmcm9tICcuLi9jb21tb24nO1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IHsgQkFTRV9QQVRILCBDT0xMRUNUSU9OX0ZPUk1BVFMsIHR5cGUgUmVxdWVzdEFyZ3MsIEJhc2VBUEksIFJlcXVpcmVkRXJyb3IsIG9wZXJhdGlvblNlcnZlck1hcCB9IGZyb20gJy4uL2Jhc2UnO1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IHR5cGUgeyBDcmVkZW50aWFscyB9IGZyb20gJy4uL21vZGVscyc7XG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgdHlwZSB7IERldmljZVN0YXR1cyB9IGZyb20gJy4uL21vZGVscyc7XG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgdHlwZSB7IERldmljZVdpZmkgfSBmcm9tICcuLi9tb2RlbHMnO1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IHR5cGUgeyBIVFRQVmFsaWRhdGlvbkVycm9yIH0gZnJvbSAnLi4vbW9kZWxzJztcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCB0eXBlIHsgUmVzcG9uc2VHZXREZXRhaWxzV2lmaVNob3dHZXRWYWx1ZSB9IGZyb20gJy4uL21vZGVscyc7XG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgdHlwZSB7IFNhdmVkTmV0d29yayB9IGZyb20gJy4uL21vZGVscyc7XG4vKipcbiAqIFdpZmlBcGkgLSBheGlvcyBwYXJhbWV0ZXIgY3JlYXRvclxuICogQGV4cG9ydFxuICovXG5leHBvcnQgY29uc3QgV2lmaUFwaUF4aW9zUGFyYW1DcmVhdG9yID0gZnVuY3Rpb24gKGNvbmZpZ3VyYXRpb24/OiBDb25maWd1cmF0aW9uKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNob3cgYWxsIGNvbm5lY3Rpb24gcHJvZmlsZXNcbiAgICAgICAgICogQHN1bW1hcnkgR2V0IERldGFpbHNcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHNzaWQgXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBnZXREZXRhaWxzV2lmaVNob3dHZXQ6IGFzeW5jIChzc2lkOiBzdHJpbmcsIG9wdGlvbnM6IFJhd0F4aW9zUmVxdWVzdENvbmZpZyA9IHt9KTogUHJvbWlzZTxSZXF1ZXN0QXJncz4gPT4ge1xuICAgICAgICAgICAgLy8gdmVyaWZ5IHJlcXVpcmVkIHBhcmFtZXRlciAnc3NpZCcgaXMgbm90IG51bGwgb3IgdW5kZWZpbmVkXG4gICAgICAgICAgICBhc3NlcnRQYXJhbUV4aXN0cygnZ2V0RGV0YWlsc1dpZmlTaG93R2V0JywgJ3NzaWQnLCBzc2lkKVxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJQYXRoID0gYC93aWZpL3Nob3dgO1xuICAgICAgICAgICAgLy8gdXNlIGR1bW15IGJhc2UgVVJMIHN0cmluZyBiZWNhdXNlIHRoZSBVUkwgY29uc3RydWN0b3Igb25seSBhY2NlcHRzIGFic29sdXRlIFVSTHMuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclVybE9iaiA9IG5ldyBVUkwobG9jYWxWYXJQYXRoLCBEVU1NWV9CQVNFX1VSTCk7XG4gICAgICAgICAgICBsZXQgYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICBpZiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGJhc2VPcHRpb25zID0gY29uZmlndXJhdGlvbi5iYXNlT3B0aW9ucztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyA9IHsgbWV0aG9kOiAnR0VUJywgLi4uYmFzZU9wdGlvbnMsIC4uLm9wdGlvbnN9O1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclF1ZXJ5UGFyYW1ldGVyID0ge30gYXMgYW55O1xuXG4gICAgICAgICAgICBpZiAoc3NpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgbG9jYWxWYXJRdWVyeVBhcmFtZXRlclsnc3NpZCddID0gc3NpZDtcbiAgICAgICAgICAgIH1cblxuXG4gICAgXG4gICAgICAgICAgICBzZXRTZWFyY2hQYXJhbXMobG9jYWxWYXJVcmxPYmosIGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIpO1xuICAgICAgICAgICAgbGV0IGhlYWRlcnNGcm9tQmFzZU9wdGlvbnMgPSBiYXNlT3B0aW9ucyAmJiBiYXNlT3B0aW9ucy5oZWFkZXJzID8gYmFzZU9wdGlvbnMuaGVhZGVycyA6IHt9O1xuICAgICAgICAgICAgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucy5oZWFkZXJzID0gey4uLmxvY2FsVmFySGVhZGVyUGFyYW1ldGVyLCAuLi5oZWFkZXJzRnJvbUJhc2VPcHRpb25zLCAuLi5vcHRpb25zLmhlYWRlcnN9O1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHVybDogdG9QYXRoU3RyaW5nKGxvY2FsVmFyVXJsT2JqKSxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBsb2NhbFZhclJlcXVlc3RPcHRpb25zLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIExpc3QgdGhlIHNhdmVkIFdpLUZpIHByb2ZpbGVzLCBpbiBvbmUgY2FsbC5cbiAgICAgICAgICogQHN1bW1hcnkgV2lmaSBTYXZlZFxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgd2lmaVNhdmVkV2lmaVNhdmVkR2V0OiBhc3luYyAob3B0aW9uczogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnID0ge30pOiBQcm9taXNlPFJlcXVlc3RBcmdzPiA9PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclBhdGggPSBgL3dpZmkvc2F2ZWRgO1xuICAgICAgICAgICAgLy8gdXNlIGR1bW15IGJhc2UgVVJMIHN0cmluZyBiZWNhdXNlIHRoZSBVUkwgY29uc3RydWN0b3Igb25seSBhY2NlcHRzIGFic29sdXRlIFVSTHMuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclVybE9iaiA9IG5ldyBVUkwobG9jYWxWYXJQYXRoLCBEVU1NWV9CQVNFX1VSTCk7XG4gICAgICAgICAgICBsZXQgYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICBpZiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGJhc2VPcHRpb25zID0gY29uZmlndXJhdGlvbi5iYXNlT3B0aW9ucztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyA9IHsgbWV0aG9kOiAnR0VUJywgLi4uYmFzZU9wdGlvbnMsIC4uLm9wdGlvbnN9O1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclF1ZXJ5UGFyYW1ldGVyID0ge30gYXMgYW55O1xuXG4gICAgICAgICAgICBzZXRTZWFyY2hQYXJhbXMobG9jYWxWYXJVcmxPYmosIGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIpO1xuICAgICAgICAgICAgbGV0IGhlYWRlcnNGcm9tQmFzZU9wdGlvbnMgPSBiYXNlT3B0aW9ucyAmJiBiYXNlT3B0aW9ucy5oZWFkZXJzID8gYmFzZU9wdGlvbnMuaGVhZGVycyA6IHt9O1xuICAgICAgICAgICAgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucy5oZWFkZXJzID0gey4uLmxvY2FsVmFySGVhZGVyUGFyYW1ldGVyLCAuLi5oZWFkZXJzRnJvbUJhc2VPcHRpb25zLCAuLi5vcHRpb25zLmhlYWRlcnN9O1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHVybDogdG9QYXRoU3RyaW5nKGxvY2FsVmFyVXJsT2JqKSxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBsb2NhbFZhclJlcXVlc3RPcHRpb25zLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbm5lY3QgdG8gYW4gU1NJRCAod2l0aCBvcHRpb25hbCBwYXNzd29yZCkuXG4gICAgICAgICAqIEBzdW1tYXJ5IFdpZmkgQ29ubmVjdFxuICAgICAgICAgKiBAcGFyYW0ge0NyZWRlbnRpYWxzfSBjcmVkZW50aWFscyBcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIHdpZmlDb25uZWN0V2lmaUNvbm5lY3RQb3N0OiBhc3luYyAoY3JlZGVudGlhbHM6IENyZWRlbnRpYWxzLCBvcHRpb25zOiBSYXdBeGlvc1JlcXVlc3RDb25maWcgPSB7fSk6IFByb21pc2U8UmVxdWVzdEFyZ3M+ID0+IHtcbiAgICAgICAgICAgIC8vIHZlcmlmeSByZXF1aXJlZCBwYXJhbWV0ZXIgJ2NyZWRlbnRpYWxzJyBpcyBub3QgbnVsbCBvciB1bmRlZmluZWRcbiAgICAgICAgICAgIGFzc2VydFBhcmFtRXhpc3RzKCd3aWZpQ29ubmVjdFdpZmlDb25uZWN0UG9zdCcsICdjcmVkZW50aWFscycsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJQYXRoID0gYC93aWZpL2Nvbm5lY3RgO1xuICAgICAgICAgICAgLy8gdXNlIGR1bW15IGJhc2UgVVJMIHN0cmluZyBiZWNhdXNlIHRoZSBVUkwgY29uc3RydWN0b3Igb25seSBhY2NlcHRzIGFic29sdXRlIFVSTHMuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclVybE9iaiA9IG5ldyBVUkwobG9jYWxWYXJQYXRoLCBEVU1NWV9CQVNFX1VSTCk7XG4gICAgICAgICAgICBsZXQgYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICBpZiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGJhc2VPcHRpb25zID0gY29uZmlndXJhdGlvbi5iYXNlT3B0aW9ucztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyA9IHsgbWV0aG9kOiAnUE9TVCcsIC4uLmJhc2VPcHRpb25zLCAuLi5vcHRpb25zfTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFySGVhZGVyUGFyYW1ldGVyID0ge30gYXMgYW55O1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJRdWVyeVBhcmFtZXRlciA9IHt9IGFzIGFueTtcblxuXG4gICAgXG4gICAgICAgICAgICBsb2NhbFZhckhlYWRlclBhcmFtZXRlclsnQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG5cbiAgICAgICAgICAgIHNldFNlYXJjaFBhcmFtcyhsb2NhbFZhclVybE9iaiwgbG9jYWxWYXJRdWVyeVBhcmFtZXRlcik7XG4gICAgICAgICAgICBsZXQgaGVhZGVyc0Zyb21CYXNlT3B0aW9ucyA9IGJhc2VPcHRpb25zICYmIGJhc2VPcHRpb25zLmhlYWRlcnMgPyBiYXNlT3B0aW9ucy5oZWFkZXJzIDoge307XG4gICAgICAgICAgICBsb2NhbFZhclJlcXVlc3RPcHRpb25zLmhlYWRlcnMgPSB7Li4ubG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIsIC4uLmhlYWRlcnNGcm9tQmFzZU9wdGlvbnMsIC4uLm9wdGlvbnMuaGVhZGVyc307XG4gICAgICAgICAgICBsb2NhbFZhclJlcXVlc3RPcHRpb25zLmRhdGEgPSBzZXJpYWxpemVEYXRhSWZOZWVkZWQoY3JlZGVudGlhbHMsIGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsIGNvbmZpZ3VyYXRpb24pXG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdXJsOiB0b1BhdGhTdHJpbmcobG9jYWxWYXJVcmxPYmopLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJuIHRoZSBjdXJyZW50bHkgYWN0aXZlIFdpLUZpIGNvbm5lY3Rpb24sIG9yIG51bGwgaWYgbm9uZS5cbiAgICAgICAgICogQHN1bW1hcnkgV2lmaSBDdXJyZW50XG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3VwZGF0ZV0gXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICB3aWZpQ3VycmVudFdpZmlDdXJyZW50R2V0OiBhc3luYyAodXBkYXRlPzogYm9vbGVhbiwgb3B0aW9uczogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnID0ge30pOiBQcm9taXNlPFJlcXVlc3RBcmdzPiA9PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclBhdGggPSBgL3dpZmkvY3VycmVudGA7XG4gICAgICAgICAgICAvLyB1c2UgZHVtbXkgYmFzZSBVUkwgc3RyaW5nIGJlY2F1c2UgdGhlIFVSTCBjb25zdHJ1Y3RvciBvbmx5IGFjY2VwdHMgYWJzb2x1dGUgVVJMcy5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyVXJsT2JqID0gbmV3IFVSTChsb2NhbFZhclBhdGgsIERVTU1ZX0JBU0VfVVJMKTtcbiAgICAgICAgICAgIGxldCBiYXNlT3B0aW9ucztcbiAgICAgICAgICAgIGlmIChjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgYmFzZU9wdGlvbnMgPSBjb25maWd1cmF0aW9uLmJhc2VPcHRpb25zO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclJlcXVlc3RPcHRpb25zID0geyBtZXRob2Q6ICdHRVQnLCAuLi5iYXNlT3B0aW9ucywgLi4ub3B0aW9uc307XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckhlYWRlclBhcmFtZXRlciA9IHt9IGFzIGFueTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG5cbiAgICAgICAgICAgIGlmICh1cGRhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXJbJ3VwZGF0ZSddID0gdXBkYXRlO1xuICAgICAgICAgICAgfVxuXG5cbiAgICBcbiAgICAgICAgICAgIHNldFNlYXJjaFBhcmFtcyhsb2NhbFZhclVybE9iaiwgbG9jYWxWYXJRdWVyeVBhcmFtZXRlcik7XG4gICAgICAgICAgICBsZXQgaGVhZGVyc0Zyb21CYXNlT3B0aW9ucyA9IGJhc2VPcHRpb25zICYmIGJhc2VPcHRpb25zLmhlYWRlcnMgPyBiYXNlT3B0aW9ucy5oZWFkZXJzIDoge307XG4gICAgICAgICAgICBsb2NhbFZhclJlcXVlc3RPcHRpb25zLmhlYWRlcnMgPSB7Li4ubG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIsIC4uLmhlYWRlcnNGcm9tQmFzZU9wdGlvbnMsIC4uLm9wdGlvbnMuaGVhZGVyc307XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdXJsOiB0b1BhdGhTdHJpbmcobG9jYWxWYXJVcmxPYmopLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogQnJpbmcgdGhlIHdpZmkgZGV2aWNlIGRvd24uXG4gICAgICAgICAqIEBzdW1tYXJ5IFdpZmkgRGV2aWNlIERvd25cbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIHdpZmlEZXZpY2VEb3duV2lmaURldmljZURvd25Qb3N0OiBhc3luYyAob3B0aW9uczogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnID0ge30pOiBQcm9taXNlPFJlcXVlc3RBcmdzPiA9PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclBhdGggPSBgL3dpZmkvZGV2aWNlL2Rvd25gO1xuICAgICAgICAgICAgLy8gdXNlIGR1bW15IGJhc2UgVVJMIHN0cmluZyBiZWNhdXNlIHRoZSBVUkwgY29uc3RydWN0b3Igb25seSBhY2NlcHRzIGFic29sdXRlIFVSTHMuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclVybE9iaiA9IG5ldyBVUkwobG9jYWxWYXJQYXRoLCBEVU1NWV9CQVNFX1VSTCk7XG4gICAgICAgICAgICBsZXQgYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICBpZiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGJhc2VPcHRpb25zID0gY29uZmlndXJhdGlvbi5iYXNlT3B0aW9ucztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyA9IHsgbWV0aG9kOiAnUE9TVCcsIC4uLmJhc2VPcHRpb25zLCAuLi5vcHRpb25zfTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFySGVhZGVyUGFyYW1ldGVyID0ge30gYXMgYW55O1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJRdWVyeVBhcmFtZXRlciA9IHt9IGFzIGFueTtcblxuXG4gICAgXG4gICAgICAgICAgICBzZXRTZWFyY2hQYXJhbXMobG9jYWxWYXJVcmxPYmosIGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIpO1xuICAgICAgICAgICAgbGV0IGhlYWRlcnNGcm9tQmFzZU9wdGlvbnMgPSBiYXNlT3B0aW9ucyAmJiBiYXNlT3B0aW9ucy5oZWFkZXJzID8gYmFzZU9wdGlvbnMuaGVhZGVycyA6IHt9O1xuICAgICAgICAgICAgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucy5oZWFkZXJzID0gey4uLmxvY2FsVmFySGVhZGVyUGFyYW1ldGVyLCAuLi5oZWFkZXJzRnJvbUJhc2VPcHRpb25zLCAuLi5vcHRpb25zLmhlYWRlcnN9O1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHVybDogdG9QYXRoU3RyaW5nKGxvY2FsVmFyVXJsT2JqKSxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBsb2NhbFZhclJlcXVlc3RPcHRpb25zLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJyaW5nIHRoZSAgd2lmaSBkZXZpY2UgdXAuXG4gICAgICAgICAqIEBzdW1tYXJ5IFdpZmkgRGV2aWNlIFVwXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICB3aWZpRGV2aWNlVXBXaWZpRGV2aWNlVXBQb3N0OiBhc3luYyAob3B0aW9uczogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnID0ge30pOiBQcm9taXNlPFJlcXVlc3RBcmdzPiA9PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclBhdGggPSBgL3dpZmkvZGV2aWNlL3VwYDtcbiAgICAgICAgICAgIC8vIHVzZSBkdW1teSBiYXNlIFVSTCBzdHJpbmcgYmVjYXVzZSB0aGUgVVJMIGNvbnN0cnVjdG9yIG9ubHkgYWNjZXB0cyBhYnNvbHV0ZSBVUkxzLlxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJVcmxPYmogPSBuZXcgVVJMKGxvY2FsVmFyUGF0aCwgRFVNTVlfQkFTRV9VUkwpO1xuICAgICAgICAgICAgbGV0IGJhc2VPcHRpb25zO1xuICAgICAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBiYXNlT3B0aW9ucyA9IGNvbmZpZ3VyYXRpb24uYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMgPSB7IG1ldGhvZDogJ1BPU1QnLCAuLi5iYXNlT3B0aW9ucywgLi4ub3B0aW9uc307XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckhlYWRlclBhcmFtZXRlciA9IHt9IGFzIGFueTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG5cblxuICAgIFxuICAgICAgICAgICAgc2V0U2VhcmNoUGFyYW1zKGxvY2FsVmFyVXJsT2JqLCBsb2NhbFZhclF1ZXJ5UGFyYW1ldGVyKTtcbiAgICAgICAgICAgIGxldCBoZWFkZXJzRnJvbUJhc2VPcHRpb25zID0gYmFzZU9wdGlvbnMgJiYgYmFzZU9wdGlvbnMuaGVhZGVycyA/IGJhc2VPcHRpb25zLmhlYWRlcnMgOiB7fTtcbiAgICAgICAgICAgIGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMuaGVhZGVycyA9IHsuLi5sb2NhbFZhckhlYWRlclBhcmFtZXRlciwgLi4uaGVhZGVyc0Zyb21CYXNlT3B0aW9ucywgLi4ub3B0aW9ucy5oZWFkZXJzfTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB1cmw6IHRvUGF0aFN0cmluZyhsb2NhbFZhclVybE9iaiksXG4gICAgICAgICAgICAgICAgb3B0aW9uczogbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNjb25uZWN0IGZyb20gdGhlIGN1cnJlbnQgV2ktRmkgbmV0d29yay5cbiAgICAgICAgICogQHN1bW1hcnkgV2lmaSBEaXNjb25uZWN0XG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICB3aWZpRGlzY29ubmVjdFdpZmlEaXNjb25uZWN0UG9zdDogYXN5bmMgKG9wdGlvbnM6IFJhd0F4aW9zUmVxdWVzdENvbmZpZyA9IHt9KTogUHJvbWlzZTxSZXF1ZXN0QXJncz4gPT4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJQYXRoID0gYC93aWZpL2Rpc2Nvbm5lY3RgO1xuICAgICAgICAgICAgLy8gdXNlIGR1bW15IGJhc2UgVVJMIHN0cmluZyBiZWNhdXNlIHRoZSBVUkwgY29uc3RydWN0b3Igb25seSBhY2NlcHRzIGFic29sdXRlIFVSTHMuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclVybE9iaiA9IG5ldyBVUkwobG9jYWxWYXJQYXRoLCBEVU1NWV9CQVNFX1VSTCk7XG4gICAgICAgICAgICBsZXQgYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICBpZiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGJhc2VPcHRpb25zID0gY29uZmlndXJhdGlvbi5iYXNlT3B0aW9ucztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyA9IHsgbWV0aG9kOiAnUE9TVCcsIC4uLmJhc2VPcHRpb25zLCAuLi5vcHRpb25zfTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFySGVhZGVyUGFyYW1ldGVyID0ge30gYXMgYW55O1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJRdWVyeVBhcmFtZXRlciA9IHt9IGFzIGFueTtcblxuXG4gICAgXG4gICAgICAgICAgICBzZXRTZWFyY2hQYXJhbXMobG9jYWxWYXJVcmxPYmosIGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIpO1xuICAgICAgICAgICAgbGV0IGhlYWRlcnNGcm9tQmFzZU9wdGlvbnMgPSBiYXNlT3B0aW9ucyAmJiBiYXNlT3B0aW9ucy5oZWFkZXJzID8gYmFzZU9wdGlvbnMuaGVhZGVycyA6IHt9O1xuICAgICAgICAgICAgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucy5oZWFkZXJzID0gey4uLmxvY2FsVmFySGVhZGVyUGFyYW1ldGVyLCAuLi5oZWFkZXJzRnJvbUJhc2VPcHRpb25zLCAuLi5vcHRpb25zLmhlYWRlcnN9O1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHVybDogdG9QYXRoU3RyaW5nKGxvY2FsVmFyVXJsT2JqKSxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBsb2NhbFZhclJlcXVlc3RPcHRpb25zLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBlcm1hbmVudGx5IGRlbGV0ZSB0aGUgY3VycmVudCBXaS1GaSBjb25uZWN0aW9uIHByb2ZpbGUuXG4gICAgICAgICAqIEBzdW1tYXJ5IFdpZmkgRm9yZ2V0XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbc3NpZF0gXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICB3aWZpRm9yZ2V0V2lmaUZvcmdldERlbGV0ZTogYXN5bmMgKHNzaWQ/OiBzdHJpbmcsIG9wdGlvbnM6IFJhd0F4aW9zUmVxdWVzdENvbmZpZyA9IHt9KTogUHJvbWlzZTxSZXF1ZXN0QXJncz4gPT4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJQYXRoID0gYC93aWZpL2ZvcmdldGA7XG4gICAgICAgICAgICAvLyB1c2UgZHVtbXkgYmFzZSBVUkwgc3RyaW5nIGJlY2F1c2UgdGhlIFVSTCBjb25zdHJ1Y3RvciBvbmx5IGFjY2VwdHMgYWJzb2x1dGUgVVJMcy5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyVXJsT2JqID0gbmV3IFVSTChsb2NhbFZhclBhdGgsIERVTU1ZX0JBU0VfVVJMKTtcbiAgICAgICAgICAgIGxldCBiYXNlT3B0aW9ucztcbiAgICAgICAgICAgIGlmIChjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgYmFzZU9wdGlvbnMgPSBjb25maWd1cmF0aW9uLmJhc2VPcHRpb25zO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclJlcXVlc3RPcHRpb25zID0geyBtZXRob2Q6ICdERUxFVEUnLCAuLi5iYXNlT3B0aW9ucywgLi4ub3B0aW9uc307XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckhlYWRlclBhcmFtZXRlciA9IHt9IGFzIGFueTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG5cbiAgICAgICAgICAgIGlmIChzc2lkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBsb2NhbFZhclF1ZXJ5UGFyYW1ldGVyWydzc2lkJ10gPSBzc2lkO1xuICAgICAgICAgICAgfVxuXG5cbiAgICBcbiAgICAgICAgICAgIHNldFNlYXJjaFBhcmFtcyhsb2NhbFZhclVybE9iaiwgbG9jYWxWYXJRdWVyeVBhcmFtZXRlcik7XG4gICAgICAgICAgICBsZXQgaGVhZGVyc0Zyb21CYXNlT3B0aW9ucyA9IGJhc2VPcHRpb25zICYmIGJhc2VPcHRpb25zLmhlYWRlcnMgPyBiYXNlT3B0aW9ucy5oZWFkZXJzIDoge307XG4gICAgICAgICAgICBsb2NhbFZhclJlcXVlc3RPcHRpb25zLmhlYWRlcnMgPSB7Li4ubG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIsIC4uLmhlYWRlcnNGcm9tQmFzZU9wdGlvbnMsIC4uLm9wdGlvbnMuaGVhZGVyc307XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdXJsOiB0b1BhdGhTdHJpbmcobG9jYWxWYXJVcmxPYmopLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogU2NhbiBmb3IgYXZhaWxhYmxlIFdpLUZpIG5ldHdvcmtzLiBPbmx5IHBlcmZvcm1zIGEgZnJlc2ggc2NhbiBpZiBgcmVzY2FuYCBpcyBUcnVlIGFuZCBpdCBoYXNuXFwndCByZXNjYW5uZWQgaW4gdGhlIGxhc3QgU0NBTl9UVEwgc2Vjb25kcy5cbiAgICAgICAgICogQHN1bW1hcnkgV2lmaSBTY2FuXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3Jlc2Nhbl0gXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICB3aWZpU2NhbldpZmlTY2FuR2V0OiBhc3luYyAocmVzY2FuPzogYm9vbGVhbiwgb3B0aW9uczogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnID0ge30pOiBQcm9taXNlPFJlcXVlc3RBcmdzPiA9PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclBhdGggPSBgL3dpZmkvc2NhbmA7XG4gICAgICAgICAgICAvLyB1c2UgZHVtbXkgYmFzZSBVUkwgc3RyaW5nIGJlY2F1c2UgdGhlIFVSTCBjb25zdHJ1Y3RvciBvbmx5IGFjY2VwdHMgYWJzb2x1dGUgVVJMcy5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyVXJsT2JqID0gbmV3IFVSTChsb2NhbFZhclBhdGgsIERVTU1ZX0JBU0VfVVJMKTtcbiAgICAgICAgICAgIGxldCBiYXNlT3B0aW9ucztcbiAgICAgICAgICAgIGlmIChjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgYmFzZU9wdGlvbnMgPSBjb25maWd1cmF0aW9uLmJhc2VPcHRpb25zO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclJlcXVlc3RPcHRpb25zID0geyBtZXRob2Q6ICdHRVQnLCAuLi5iYXNlT3B0aW9ucywgLi4ub3B0aW9uc307XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckhlYWRlclBhcmFtZXRlciA9IHt9IGFzIGFueTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG5cbiAgICAgICAgICAgIGlmIChyZXNjYW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXJbJ3Jlc2NhbiddID0gcmVzY2FuO1xuICAgICAgICAgICAgfVxuXG5cbiAgICBcbiAgICAgICAgICAgIHNldFNlYXJjaFBhcmFtcyhsb2NhbFZhclVybE9iaiwgbG9jYWxWYXJRdWVyeVBhcmFtZXRlcik7XG4gICAgICAgICAgICBsZXQgaGVhZGVyc0Zyb21CYXNlT3B0aW9ucyA9IGJhc2VPcHRpb25zICYmIGJhc2VPcHRpb25zLmhlYWRlcnMgPyBiYXNlT3B0aW9ucy5oZWFkZXJzIDoge307XG4gICAgICAgICAgICBsb2NhbFZhclJlcXVlc3RPcHRpb25zLmhlYWRlcnMgPSB7Li4ubG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIsIC4uLmhlYWRlcnNGcm9tQmFzZU9wdGlvbnMsIC4uLm9wdGlvbnMuaGVhZGVyc307XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdXJsOiB0b1BhdGhTdHJpbmcobG9jYWxWYXJVcmxPYmopLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogXG4gICAgICAgICAqIEBzdW1tYXJ5IFdpZmkgU3RhdHVzXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICB3aWZpU3RhdHVzV2lmaURldmljZVN0YXR1c0dldDogYXN5bmMgKG9wdGlvbnM6IFJhd0F4aW9zUmVxdWVzdENvbmZpZyA9IHt9KTogUHJvbWlzZTxSZXF1ZXN0QXJncz4gPT4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJQYXRoID0gYC93aWZpL2RldmljZS9zdGF0dXNgO1xuICAgICAgICAgICAgLy8gdXNlIGR1bW15IGJhc2UgVVJMIHN0cmluZyBiZWNhdXNlIHRoZSBVUkwgY29uc3RydWN0b3Igb25seSBhY2NlcHRzIGFic29sdXRlIFVSTHMuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclVybE9iaiA9IG5ldyBVUkwobG9jYWxWYXJQYXRoLCBEVU1NWV9CQVNFX1VSTCk7XG4gICAgICAgICAgICBsZXQgYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICBpZiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGJhc2VPcHRpb25zID0gY29uZmlndXJhdGlvbi5iYXNlT3B0aW9ucztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyA9IHsgbWV0aG9kOiAnR0VUJywgLi4uYmFzZU9wdGlvbnMsIC4uLm9wdGlvbnN9O1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclF1ZXJ5UGFyYW1ldGVyID0ge30gYXMgYW55O1xuXG5cbiAgICBcbiAgICAgICAgICAgIHNldFNlYXJjaFBhcmFtcyhsb2NhbFZhclVybE9iaiwgbG9jYWxWYXJRdWVyeVBhcmFtZXRlcik7XG4gICAgICAgICAgICBsZXQgaGVhZGVyc0Zyb21CYXNlT3B0aW9ucyA9IGJhc2VPcHRpb25zICYmIGJhc2VPcHRpb25zLmhlYWRlcnMgPyBiYXNlT3B0aW9ucy5oZWFkZXJzIDoge307XG4gICAgICAgICAgICBsb2NhbFZhclJlcXVlc3RPcHRpb25zLmhlYWRlcnMgPSB7Li4ubG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIsIC4uLmhlYWRlcnNGcm9tQmFzZU9wdGlvbnMsIC4uLm9wdGlvbnMuaGVhZGVyc307XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdXJsOiB0b1BhdGhTdHJpbmcobG9jYWxWYXJVcmxPYmopLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogU3RhcnQgb3Igc3dpdGNoIHRvIGEga25vd24gY29ubmVjdGlvbiBieSBpdHMgU1NJRC5cbiAgICAgICAgICogQHN1bW1hcnkgV2lmaSBTd2l0Y2hcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHNzaWQgXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICB3aWZpU3dpdGNoV2lmaVVwUG9zdDogYXN5bmMgKHNzaWQ6IHN0cmluZywgb3B0aW9uczogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnID0ge30pOiBQcm9taXNlPFJlcXVlc3RBcmdzPiA9PiB7XG4gICAgICAgICAgICAvLyB2ZXJpZnkgcmVxdWlyZWQgcGFyYW1ldGVyICdzc2lkJyBpcyBub3QgbnVsbCBvciB1bmRlZmluZWRcbiAgICAgICAgICAgIGFzc2VydFBhcmFtRXhpc3RzKCd3aWZpU3dpdGNoV2lmaVVwUG9zdCcsICdzc2lkJywgc3NpZClcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUGF0aCA9IGAvd2lmaS91cGA7XG4gICAgICAgICAgICAvLyB1c2UgZHVtbXkgYmFzZSBVUkwgc3RyaW5nIGJlY2F1c2UgdGhlIFVSTCBjb25zdHJ1Y3RvciBvbmx5IGFjY2VwdHMgYWJzb2x1dGUgVVJMcy5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyVXJsT2JqID0gbmV3IFVSTChsb2NhbFZhclBhdGgsIERVTU1ZX0JBU0VfVVJMKTtcbiAgICAgICAgICAgIGxldCBiYXNlT3B0aW9ucztcbiAgICAgICAgICAgIGlmIChjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgYmFzZU9wdGlvbnMgPSBjb25maWd1cmF0aW9uLmJhc2VPcHRpb25zO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclJlcXVlc3RPcHRpb25zID0geyBtZXRob2Q6ICdQT1NUJywgLi4uYmFzZU9wdGlvbnMsIC4uLm9wdGlvbnN9O1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclF1ZXJ5UGFyYW1ldGVyID0ge30gYXMgYW55O1xuXG4gICAgICAgICAgICBpZiAoc3NpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgbG9jYWxWYXJRdWVyeVBhcmFtZXRlclsnc3NpZCddID0gc3NpZDtcbiAgICAgICAgICAgIH1cblxuXG4gICAgXG4gICAgICAgICAgICBzZXRTZWFyY2hQYXJhbXMobG9jYWxWYXJVcmxPYmosIGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIpO1xuICAgICAgICAgICAgbGV0IGhlYWRlcnNGcm9tQmFzZU9wdGlvbnMgPSBiYXNlT3B0aW9ucyAmJiBiYXNlT3B0aW9ucy5oZWFkZXJzID8gYmFzZU9wdGlvbnMuaGVhZGVycyA6IHt9O1xuICAgICAgICAgICAgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucy5oZWFkZXJzID0gey4uLmxvY2FsVmFySGVhZGVyUGFyYW1ldGVyLCAuLi5oZWFkZXJzRnJvbUJhc2VPcHRpb25zLCAuLi5vcHRpb25zLmhlYWRlcnN9O1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHVybDogdG9QYXRoU3RyaW5nKGxvY2FsVmFyVXJsT2JqKSxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBsb2NhbFZhclJlcXVlc3RPcHRpb25zLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICB9XG59O1xuXG4vKipcbiAqIFdpZmlBcGkgLSBmdW5jdGlvbmFsIHByb2dyYW1taW5nIGludGVyZmFjZVxuICogQGV4cG9ydFxuICovXG5leHBvcnQgY29uc3QgV2lmaUFwaUZwID0gZnVuY3Rpb24oY29uZmlndXJhdGlvbj86IENvbmZpZ3VyYXRpb24pIHtcbiAgICBjb25zdCBsb2NhbFZhckF4aW9zUGFyYW1DcmVhdG9yID0gV2lmaUFwaUF4aW9zUGFyYW1DcmVhdG9yKGNvbmZpZ3VyYXRpb24pXG4gICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNob3cgYWxsIGNvbm5lY3Rpb24gcHJvZmlsZXNcbiAgICAgICAgICogQHN1bW1hcnkgR2V0IERldGFpbHNcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHNzaWQgXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBnZXREZXRhaWxzV2lmaVNob3dHZXQoc3NpZDogc3RyaW5nLCBvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogUHJvbWlzZTwoYXhpb3M/OiBBeGlvc0luc3RhbmNlLCBiYXNlUGF0aD86IHN0cmluZykgPT4gQXhpb3NQcm9taXNlPHsgW2tleTogc3RyaW5nXTogUmVzcG9uc2VHZXREZXRhaWxzV2lmaVNob3dHZXRWYWx1ZTsgfT4+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyQXhpb3NBcmdzID0gYXdhaXQgbG9jYWxWYXJBeGlvc1BhcmFtQ3JlYXRvci5nZXREZXRhaWxzV2lmaVNob3dHZXQoc3NpZCwgb3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckluZGV4ID0gY29uZmlndXJhdGlvbj8uc2VydmVySW5kZXggPz8gMDtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVyQmFzZVBhdGggPSBvcGVyYXRpb25TZXJ2ZXJNYXBbJ1dpZmlBcGkuZ2V0RGV0YWlsc1dpZmlTaG93R2V0J10/Lltsb2NhbFZhck9wZXJhdGlvblNlcnZlckluZGV4XT8udXJsO1xuICAgICAgICAgICAgcmV0dXJuIChheGlvcywgYmFzZVBhdGgpID0+IGNyZWF0ZVJlcXVlc3RGdW5jdGlvbihsb2NhbFZhckF4aW9zQXJncywgZ2xvYmFsQXhpb3MsIEJBU0VfUEFUSCwgY29uZmlndXJhdGlvbikoYXhpb3MsIGxvY2FsVmFyT3BlcmF0aW9uU2VydmVyQmFzZVBhdGggfHwgYmFzZVBhdGgpO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogTGlzdCB0aGUgc2F2ZWQgV2ktRmkgcHJvZmlsZXMsIGluIG9uZSBjYWxsLlxuICAgICAgICAgKiBAc3VtbWFyeSBXaWZpIFNhdmVkXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyB3aWZpU2F2ZWRXaWZpU2F2ZWRHZXQob3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZyk6IFByb21pc2U8KGF4aW9zPzogQXhpb3NJbnN0YW5jZSwgYmFzZVBhdGg/OiBzdHJpbmcpID0+IEF4aW9zUHJvbWlzZTxBcnJheTxTYXZlZE5ldHdvcms+Pj4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJBeGlvc0FyZ3MgPSBhd2FpdCBsb2NhbFZhckF4aW9zUGFyYW1DcmVhdG9yLndpZmlTYXZlZFdpZmlTYXZlZEdldChvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXggPSBjb25maWd1cmF0aW9uPy5zZXJ2ZXJJbmRleCA/PyAwO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCA9IG9wZXJhdGlvblNlcnZlck1hcFsnV2lmaUFwaS53aWZpU2F2ZWRXaWZpU2F2ZWRHZXQnXT8uW2xvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXhdPy51cmw7XG4gICAgICAgICAgICByZXR1cm4gKGF4aW9zLCBiYXNlUGF0aCkgPT4gY3JlYXRlUmVxdWVzdEZ1bmN0aW9uKGxvY2FsVmFyQXhpb3NBcmdzLCBnbG9iYWxBeGlvcywgQkFTRV9QQVRILCBjb25maWd1cmF0aW9uKShheGlvcywgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCB8fCBiYXNlUGF0aCk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb25uZWN0IHRvIGFuIFNTSUQgKHdpdGggb3B0aW9uYWwgcGFzc3dvcmQpLlxuICAgICAgICAgKiBAc3VtbWFyeSBXaWZpIENvbm5lY3RcbiAgICAgICAgICogQHBhcmFtIHtDcmVkZW50aWFsc30gY3JlZGVudGlhbHMgXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyB3aWZpQ29ubmVjdFdpZmlDb25uZWN0UG9zdChjcmVkZW50aWFsczogQ3JlZGVudGlhbHMsIG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpOiBQcm9taXNlPChheGlvcz86IEF4aW9zSW5zdGFuY2UsIGJhc2VQYXRoPzogc3RyaW5nKSA9PiBBeGlvc1Byb21pc2U8YW55Pj4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJBeGlvc0FyZ3MgPSBhd2FpdCBsb2NhbFZhckF4aW9zUGFyYW1DcmVhdG9yLndpZmlDb25uZWN0V2lmaUNvbm5lY3RQb3N0KGNyZWRlbnRpYWxzLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXggPSBjb25maWd1cmF0aW9uPy5zZXJ2ZXJJbmRleCA/PyAwO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCA9IG9wZXJhdGlvblNlcnZlck1hcFsnV2lmaUFwaS53aWZpQ29ubmVjdFdpZmlDb25uZWN0UG9zdCddPy5bbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleF0/LnVybDtcbiAgICAgICAgICAgIHJldHVybiAoYXhpb3MsIGJhc2VQYXRoKSA9PiBjcmVhdGVSZXF1ZXN0RnVuY3Rpb24obG9jYWxWYXJBeGlvc0FyZ3MsIGdsb2JhbEF4aW9zLCBCQVNFX1BBVEgsIGNvbmZpZ3VyYXRpb24pKGF4aW9zLCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoIHx8IGJhc2VQYXRoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybiB0aGUgY3VycmVudGx5IGFjdGl2ZSBXaS1GaSBjb25uZWN0aW9uLCBvciBudWxsIGlmIG5vbmUuXG4gICAgICAgICAqIEBzdW1tYXJ5IFdpZmkgQ3VycmVudFxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFt1cGRhdGVdIFxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgd2lmaUN1cnJlbnRXaWZpQ3VycmVudEdldCh1cGRhdGU/OiBib29sZWFuLCBvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogUHJvbWlzZTwoYXhpb3M/OiBBeGlvc0luc3RhbmNlLCBiYXNlUGF0aD86IHN0cmluZykgPT4gQXhpb3NQcm9taXNlPERldmljZVdpZmk+PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckF4aW9zQXJncyA9IGF3YWl0IGxvY2FsVmFyQXhpb3NQYXJhbUNyZWF0b3Iud2lmaUN1cnJlbnRXaWZpQ3VycmVudEdldCh1cGRhdGUsIG9wdGlvbnMpO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleCA9IGNvbmZpZ3VyYXRpb24/LnNlcnZlckluZGV4ID8/IDA7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoID0gb3BlcmF0aW9uU2VydmVyTWFwWydXaWZpQXBpLndpZmlDdXJyZW50V2lmaUN1cnJlbnRHZXQnXT8uW2xvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXhdPy51cmw7XG4gICAgICAgICAgICByZXR1cm4gKGF4aW9zLCBiYXNlUGF0aCkgPT4gY3JlYXRlUmVxdWVzdEZ1bmN0aW9uKGxvY2FsVmFyQXhpb3NBcmdzLCBnbG9iYWxBeGlvcywgQkFTRV9QQVRILCBjb25maWd1cmF0aW9uKShheGlvcywgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCB8fCBiYXNlUGF0aCk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBCcmluZyB0aGUgd2lmaSBkZXZpY2UgZG93bi5cbiAgICAgICAgICogQHN1bW1hcnkgV2lmaSBEZXZpY2UgRG93blxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgd2lmaURldmljZURvd25XaWZpRGV2aWNlRG93blBvc3Qob3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZyk6IFByb21pc2U8KGF4aW9zPzogQXhpb3NJbnN0YW5jZSwgYmFzZVBhdGg/OiBzdHJpbmcpID0+IEF4aW9zUHJvbWlzZTxhbnk+PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckF4aW9zQXJncyA9IGF3YWl0IGxvY2FsVmFyQXhpb3NQYXJhbUNyZWF0b3Iud2lmaURldmljZURvd25XaWZpRGV2aWNlRG93blBvc3Qob3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckluZGV4ID0gY29uZmlndXJhdGlvbj8uc2VydmVySW5kZXggPz8gMDtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVyQmFzZVBhdGggPSBvcGVyYXRpb25TZXJ2ZXJNYXBbJ1dpZmlBcGkud2lmaURldmljZURvd25XaWZpRGV2aWNlRG93blBvc3QnXT8uW2xvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXhdPy51cmw7XG4gICAgICAgICAgICByZXR1cm4gKGF4aW9zLCBiYXNlUGF0aCkgPT4gY3JlYXRlUmVxdWVzdEZ1bmN0aW9uKGxvY2FsVmFyQXhpb3NBcmdzLCBnbG9iYWxBeGlvcywgQkFTRV9QQVRILCBjb25maWd1cmF0aW9uKShheGlvcywgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCB8fCBiYXNlUGF0aCk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBCcmluZyB0aGUgIHdpZmkgZGV2aWNlIHVwLlxuICAgICAgICAgKiBAc3VtbWFyeSBXaWZpIERldmljZSBVcFxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgd2lmaURldmljZVVwV2lmaURldmljZVVwUG9zdChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogUHJvbWlzZTwoYXhpb3M/OiBBeGlvc0luc3RhbmNlLCBiYXNlUGF0aD86IHN0cmluZykgPT4gQXhpb3NQcm9taXNlPGFueT4+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyQXhpb3NBcmdzID0gYXdhaXQgbG9jYWxWYXJBeGlvc1BhcmFtQ3JlYXRvci53aWZpRGV2aWNlVXBXaWZpRGV2aWNlVXBQb3N0KG9wdGlvbnMpO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleCA9IGNvbmZpZ3VyYXRpb24/LnNlcnZlckluZGV4ID8/IDA7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoID0gb3BlcmF0aW9uU2VydmVyTWFwWydXaWZpQXBpLndpZmlEZXZpY2VVcFdpZmlEZXZpY2VVcFBvc3QnXT8uW2xvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXhdPy51cmw7XG4gICAgICAgICAgICByZXR1cm4gKGF4aW9zLCBiYXNlUGF0aCkgPT4gY3JlYXRlUmVxdWVzdEZ1bmN0aW9uKGxvY2FsVmFyQXhpb3NBcmdzLCBnbG9iYWxBeGlvcywgQkFTRV9QQVRILCBjb25maWd1cmF0aW9uKShheGlvcywgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCB8fCBiYXNlUGF0aCk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNjb25uZWN0IGZyb20gdGhlIGN1cnJlbnQgV2ktRmkgbmV0d29yay5cbiAgICAgICAgICogQHN1bW1hcnkgV2lmaSBEaXNjb25uZWN0XG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyB3aWZpRGlzY29ubmVjdFdpZmlEaXNjb25uZWN0UG9zdChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogUHJvbWlzZTwoYXhpb3M/OiBBeGlvc0luc3RhbmNlLCBiYXNlUGF0aD86IHN0cmluZykgPT4gQXhpb3NQcm9taXNlPGFueT4+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyQXhpb3NBcmdzID0gYXdhaXQgbG9jYWxWYXJBeGlvc1BhcmFtQ3JlYXRvci53aWZpRGlzY29ubmVjdFdpZmlEaXNjb25uZWN0UG9zdChvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXggPSBjb25maWd1cmF0aW9uPy5zZXJ2ZXJJbmRleCA/PyAwO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCA9IG9wZXJhdGlvblNlcnZlck1hcFsnV2lmaUFwaS53aWZpRGlzY29ubmVjdFdpZmlEaXNjb25uZWN0UG9zdCddPy5bbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleF0/LnVybDtcbiAgICAgICAgICAgIHJldHVybiAoYXhpb3MsIGJhc2VQYXRoKSA9PiBjcmVhdGVSZXF1ZXN0RnVuY3Rpb24obG9jYWxWYXJBeGlvc0FyZ3MsIGdsb2JhbEF4aW9zLCBCQVNFX1BBVEgsIGNvbmZpZ3VyYXRpb24pKGF4aW9zLCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoIHx8IGJhc2VQYXRoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBlcm1hbmVudGx5IGRlbGV0ZSB0aGUgY3VycmVudCBXaS1GaSBjb25uZWN0aW9uIHByb2ZpbGUuXG4gICAgICAgICAqIEBzdW1tYXJ5IFdpZmkgRm9yZ2V0XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbc3NpZF0gXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyB3aWZpRm9yZ2V0V2lmaUZvcmdldERlbGV0ZShzc2lkPzogc3RyaW5nLCBvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogUHJvbWlzZTwoYXhpb3M/OiBBeGlvc0luc3RhbmNlLCBiYXNlUGF0aD86IHN0cmluZykgPT4gQXhpb3NQcm9taXNlPGFueT4+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyQXhpb3NBcmdzID0gYXdhaXQgbG9jYWxWYXJBeGlvc1BhcmFtQ3JlYXRvci53aWZpRm9yZ2V0V2lmaUZvcmdldERlbGV0ZShzc2lkLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXggPSBjb25maWd1cmF0aW9uPy5zZXJ2ZXJJbmRleCA/PyAwO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCA9IG9wZXJhdGlvblNlcnZlck1hcFsnV2lmaUFwaS53aWZpRm9yZ2V0V2lmaUZvcmdldERlbGV0ZSddPy5bbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleF0/LnVybDtcbiAgICAgICAgICAgIHJldHVybiAoYXhpb3MsIGJhc2VQYXRoKSA9PiBjcmVhdGVSZXF1ZXN0RnVuY3Rpb24obG9jYWxWYXJBeGlvc0FyZ3MsIGdsb2JhbEF4aW9zLCBCQVNFX1BBVEgsIGNvbmZpZ3VyYXRpb24pKGF4aW9zLCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoIHx8IGJhc2VQYXRoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNjYW4gZm9yIGF2YWlsYWJsZSBXaS1GaSBuZXR3b3Jrcy4gT25seSBwZXJmb3JtcyBhIGZyZXNoIHNjYW4gaWYgYHJlc2NhbmAgaXMgVHJ1ZSBhbmQgaXQgaGFzblxcJ3QgcmVzY2FubmVkIGluIHRoZSBsYXN0IFNDQU5fVFRMIHNlY29uZHMuXG4gICAgICAgICAqIEBzdW1tYXJ5IFdpZmkgU2NhblxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtyZXNjYW5dIFxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgd2lmaVNjYW5XaWZpU2NhbkdldChyZXNjYW4/OiBib29sZWFuLCBvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogUHJvbWlzZTwoYXhpb3M/OiBBeGlvc0luc3RhbmNlLCBiYXNlUGF0aD86IHN0cmluZykgPT4gQXhpb3NQcm9taXNlPEFycmF5PERldmljZVdpZmk+Pj4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJBeGlvc0FyZ3MgPSBhd2FpdCBsb2NhbFZhckF4aW9zUGFyYW1DcmVhdG9yLndpZmlTY2FuV2lmaVNjYW5HZXQocmVzY2FuLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXggPSBjb25maWd1cmF0aW9uPy5zZXJ2ZXJJbmRleCA/PyAwO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCA9IG9wZXJhdGlvblNlcnZlck1hcFsnV2lmaUFwaS53aWZpU2NhbldpZmlTY2FuR2V0J10/Lltsb2NhbFZhck9wZXJhdGlvblNlcnZlckluZGV4XT8udXJsO1xuICAgICAgICAgICAgcmV0dXJuIChheGlvcywgYmFzZVBhdGgpID0+IGNyZWF0ZVJlcXVlc3RGdW5jdGlvbihsb2NhbFZhckF4aW9zQXJncywgZ2xvYmFsQXhpb3MsIEJBU0VfUEFUSCwgY29uZmlndXJhdGlvbikoYXhpb3MsIGxvY2FsVmFyT3BlcmF0aW9uU2VydmVyQmFzZVBhdGggfHwgYmFzZVBhdGgpO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogXG4gICAgICAgICAqIEBzdW1tYXJ5IFdpZmkgU3RhdHVzXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyB3aWZpU3RhdHVzV2lmaURldmljZVN0YXR1c0dldChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogUHJvbWlzZTwoYXhpb3M/OiBBeGlvc0luc3RhbmNlLCBiYXNlUGF0aD86IHN0cmluZykgPT4gQXhpb3NQcm9taXNlPERldmljZVN0YXR1cz4+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyQXhpb3NBcmdzID0gYXdhaXQgbG9jYWxWYXJBeGlvc1BhcmFtQ3JlYXRvci53aWZpU3RhdHVzV2lmaURldmljZVN0YXR1c0dldChvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXggPSBjb25maWd1cmF0aW9uPy5zZXJ2ZXJJbmRleCA/PyAwO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCA9IG9wZXJhdGlvblNlcnZlck1hcFsnV2lmaUFwaS53aWZpU3RhdHVzV2lmaURldmljZVN0YXR1c0dldCddPy5bbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleF0/LnVybDtcbiAgICAgICAgICAgIHJldHVybiAoYXhpb3MsIGJhc2VQYXRoKSA9PiBjcmVhdGVSZXF1ZXN0RnVuY3Rpb24obG9jYWxWYXJBeGlvc0FyZ3MsIGdsb2JhbEF4aW9zLCBCQVNFX1BBVEgsIGNvbmZpZ3VyYXRpb24pKGF4aW9zLCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoIHx8IGJhc2VQYXRoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN0YXJ0IG9yIHN3aXRjaCB0byBhIGtub3duIGNvbm5lY3Rpb24gYnkgaXRzIFNTSUQuXG4gICAgICAgICAqIEBzdW1tYXJ5IFdpZmkgU3dpdGNoXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzc2lkIFxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgd2lmaVN3aXRjaFdpZmlVcFBvc3Qoc3NpZDogc3RyaW5nLCBvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogUHJvbWlzZTwoYXhpb3M/OiBBeGlvc0luc3RhbmNlLCBiYXNlUGF0aD86IHN0cmluZykgPT4gQXhpb3NQcm9taXNlPGFueT4+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyQXhpb3NBcmdzID0gYXdhaXQgbG9jYWxWYXJBeGlvc1BhcmFtQ3JlYXRvci53aWZpU3dpdGNoV2lmaVVwUG9zdChzc2lkLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXggPSBjb25maWd1cmF0aW9uPy5zZXJ2ZXJJbmRleCA/PyAwO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCA9IG9wZXJhdGlvblNlcnZlck1hcFsnV2lmaUFwaS53aWZpU3dpdGNoV2lmaVVwUG9zdCddPy5bbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleF0/LnVybDtcbiAgICAgICAgICAgIHJldHVybiAoYXhpb3MsIGJhc2VQYXRoKSA9PiBjcmVhdGVSZXF1ZXN0RnVuY3Rpb24obG9jYWxWYXJBeGlvc0FyZ3MsIGdsb2JhbEF4aW9zLCBCQVNFX1BBVEgsIGNvbmZpZ3VyYXRpb24pKGF4aW9zLCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoIHx8IGJhc2VQYXRoKTtcbiAgICAgICAgfSxcbiAgICB9XG59O1xuXG4vKipcbiAqIFdpZmlBcGkgLSBmYWN0b3J5IGludGVyZmFjZVxuICogQGV4cG9ydFxuICovXG5leHBvcnQgY29uc3QgV2lmaUFwaUZhY3RvcnkgPSBmdW5jdGlvbiAoY29uZmlndXJhdGlvbj86IENvbmZpZ3VyYXRpb24sIGJhc2VQYXRoPzogc3RyaW5nLCBheGlvcz86IEF4aW9zSW5zdGFuY2UpIHtcbiAgICBjb25zdCBsb2NhbFZhckZwID0gV2lmaUFwaUZwKGNvbmZpZ3VyYXRpb24pXG4gICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNob3cgYWxsIGNvbm5lY3Rpb24gcHJvZmlsZXNcbiAgICAgICAgICogQHN1bW1hcnkgR2V0IERldGFpbHNcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHNzaWQgXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBnZXREZXRhaWxzV2lmaVNob3dHZXQoc3NpZDogc3RyaW5nLCBvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogQXhpb3NQcm9taXNlPHsgW2tleTogc3RyaW5nXTogUmVzcG9uc2VHZXREZXRhaWxzV2lmaVNob3dHZXRWYWx1ZTsgfT4ge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsVmFyRnAuZ2V0RGV0YWlsc1dpZmlTaG93R2V0KHNzaWQsIG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QoYXhpb3MsIGJhc2VQYXRoKSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMaXN0IHRoZSBzYXZlZCBXaS1GaSBwcm9maWxlcywgaW4gb25lIGNhbGwuXG4gICAgICAgICAqIEBzdW1tYXJ5IFdpZmkgU2F2ZWRcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIHdpZmlTYXZlZFdpZmlTYXZlZEdldChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogQXhpb3NQcm9taXNlPEFycmF5PFNhdmVkTmV0d29yaz4+IHtcbiAgICAgICAgICAgIHJldHVybiBsb2NhbFZhckZwLndpZmlTYXZlZFdpZmlTYXZlZEdldChvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KGF4aW9zLCBiYXNlUGF0aCkpO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogQ29ubmVjdCB0byBhbiBTU0lEICh3aXRoIG9wdGlvbmFsIHBhc3N3b3JkKS5cbiAgICAgICAgICogQHN1bW1hcnkgV2lmaSBDb25uZWN0XG4gICAgICAgICAqIEBwYXJhbSB7Q3JlZGVudGlhbHN9IGNyZWRlbnRpYWxzIFxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgd2lmaUNvbm5lY3RXaWZpQ29ubmVjdFBvc3QoY3JlZGVudGlhbHM6IENyZWRlbnRpYWxzLCBvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogQXhpb3NQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsVmFyRnAud2lmaUNvbm5lY3RXaWZpQ29ubmVjdFBvc3QoY3JlZGVudGlhbHMsIG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QoYXhpb3MsIGJhc2VQYXRoKSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm4gdGhlIGN1cnJlbnRseSBhY3RpdmUgV2ktRmkgY29ubmVjdGlvbiwgb3IgbnVsbCBpZiBub25lLlxuICAgICAgICAgKiBAc3VtbWFyeSBXaWZpIEN1cnJlbnRcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBbdXBkYXRlXSBcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIHdpZmlDdXJyZW50V2lmaUN1cnJlbnRHZXQodXBkYXRlPzogYm9vbGVhbiwgb3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZyk6IEF4aW9zUHJvbWlzZTxEZXZpY2VXaWZpPiB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxWYXJGcC53aWZpQ3VycmVudFdpZmlDdXJyZW50R2V0KHVwZGF0ZSwgb3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdChheGlvcywgYmFzZVBhdGgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJyaW5nIHRoZSB3aWZpIGRldmljZSBkb3duLlxuICAgICAgICAgKiBAc3VtbWFyeSBXaWZpIERldmljZSBEb3duXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICB3aWZpRGV2aWNlRG93bldpZmlEZXZpY2VEb3duUG9zdChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogQXhpb3NQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsVmFyRnAud2lmaURldmljZURvd25XaWZpRGV2aWNlRG93blBvc3Qob3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdChheGlvcywgYmFzZVBhdGgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJyaW5nIHRoZSAgd2lmaSBkZXZpY2UgdXAuXG4gICAgICAgICAqIEBzdW1tYXJ5IFdpZmkgRGV2aWNlIFVwXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICB3aWZpRGV2aWNlVXBXaWZpRGV2aWNlVXBQb3N0KG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpOiBBeGlvc1Byb21pc2U8YW55PiB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxWYXJGcC53aWZpRGV2aWNlVXBXaWZpRGV2aWNlVXBQb3N0KG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QoYXhpb3MsIGJhc2VQYXRoKSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNjb25uZWN0IGZyb20gdGhlIGN1cnJlbnQgV2ktRmkgbmV0d29yay5cbiAgICAgICAgICogQHN1bW1hcnkgV2lmaSBEaXNjb25uZWN0XG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICB3aWZpRGlzY29ubmVjdFdpZmlEaXNjb25uZWN0UG9zdChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogQXhpb3NQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsVmFyRnAud2lmaURpc2Nvbm5lY3RXaWZpRGlzY29ubmVjdFBvc3Qob3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdChheGlvcywgYmFzZVBhdGgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBlcm1hbmVudGx5IGRlbGV0ZSB0aGUgY3VycmVudCBXaS1GaSBjb25uZWN0aW9uIHByb2ZpbGUuXG4gICAgICAgICAqIEBzdW1tYXJ5IFdpZmkgRm9yZ2V0XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbc3NpZF0gXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICB3aWZpRm9yZ2V0V2lmaUZvcmdldERlbGV0ZShzc2lkPzogc3RyaW5nLCBvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogQXhpb3NQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsVmFyRnAud2lmaUZvcmdldFdpZmlGb3JnZXREZWxldGUoc3NpZCwgb3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdChheGlvcywgYmFzZVBhdGgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNjYW4gZm9yIGF2YWlsYWJsZSBXaS1GaSBuZXR3b3Jrcy4gT25seSBwZXJmb3JtcyBhIGZyZXNoIHNjYW4gaWYgYHJlc2NhbmAgaXMgVHJ1ZSBhbmQgaXQgaGFzblxcJ3QgcmVzY2FubmVkIGluIHRoZSBsYXN0IFNDQU5fVFRMIHNlY29uZHMuXG4gICAgICAgICAqIEBzdW1tYXJ5IFdpZmkgU2NhblxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtyZXNjYW5dIFxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgd2lmaVNjYW5XaWZpU2NhbkdldChyZXNjYW4/OiBib29sZWFuLCBvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogQXhpb3NQcm9taXNlPEFycmF5PERldmljZVdpZmk+PiB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxWYXJGcC53aWZpU2NhbldpZmlTY2FuR2V0KHJlc2Nhbiwgb3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdChheGlvcywgYmFzZVBhdGgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFxuICAgICAgICAgKiBAc3VtbWFyeSBXaWZpIFN0YXR1c1xuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgd2lmaVN0YXR1c1dpZmlEZXZpY2VTdGF0dXNHZXQob3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZyk6IEF4aW9zUHJvbWlzZTxEZXZpY2VTdGF0dXM+IHtcbiAgICAgICAgICAgIHJldHVybiBsb2NhbFZhckZwLndpZmlTdGF0dXNXaWZpRGV2aWNlU3RhdHVzR2V0KG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QoYXhpb3MsIGJhc2VQYXRoKSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdGFydCBvciBzd2l0Y2ggdG8gYSBrbm93biBjb25uZWN0aW9uIGJ5IGl0cyBTU0lELlxuICAgICAgICAgKiBAc3VtbWFyeSBXaWZpIFN3aXRjaFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3NpZCBcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIHdpZmlTd2l0Y2hXaWZpVXBQb3N0KHNzaWQ6IHN0cmluZywgb3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZyk6IEF4aW9zUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgICAgIHJldHVybiBsb2NhbFZhckZwLndpZmlTd2l0Y2hXaWZpVXBQb3N0KHNzaWQsIG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QoYXhpb3MsIGJhc2VQYXRoKSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn07XG5cbi8qKlxuICogV2lmaUFwaSAtIG9iamVjdC1vcmllbnRlZCBpbnRlcmZhY2VcbiAqIEBleHBvcnRcbiAqIEBjbGFzcyBXaWZpQXBpXG4gKiBAZXh0ZW5kcyB7QmFzZUFQSX1cbiAqL1xuZXhwb3J0IGNsYXNzIFdpZmlBcGkgZXh0ZW5kcyBCYXNlQVBJIHtcbiAgICAvKipcbiAgICAgKiBTaG93IGFsbCBjb25uZWN0aW9uIHByb2ZpbGVzXG4gICAgICogQHN1bW1hcnkgR2V0IERldGFpbHNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3NpZCBcbiAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICogQG1lbWJlcm9mIFdpZmlBcGlcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0RGV0YWlsc1dpZmlTaG93R2V0KHNzaWQ6IHN0cmluZywgb3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZykge1xuICAgICAgICByZXR1cm4gV2lmaUFwaUZwKHRoaXMuY29uZmlndXJhdGlvbikuZ2V0RGV0YWlsc1dpZmlTaG93R2V0KHNzaWQsIG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QodGhpcy5heGlvcywgdGhpcy5iYXNlUGF0aCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExpc3QgdGhlIHNhdmVkIFdpLUZpIHByb2ZpbGVzLCBpbiBvbmUgY2FsbC5cbiAgICAgKiBAc3VtbWFyeSBXaWZpIFNhdmVkXG4gICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAqIEBtZW1iZXJvZiBXaWZpQXBpXG4gICAgICovXG4gICAgcHVibGljIHdpZmlTYXZlZFdpZmlTYXZlZEdldChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKSB7XG4gICAgICAgIHJldHVybiBXaWZpQXBpRnAodGhpcy5jb25maWd1cmF0aW9uKS53aWZpU2F2ZWRXaWZpU2F2ZWRHZXQob3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdCh0aGlzLmF4aW9zLCB0aGlzLmJhc2VQYXRoKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbm5lY3QgdG8gYW4gU1NJRCAod2l0aCBvcHRpb25hbCBwYXNzd29yZCkuXG4gICAgICogQHN1bW1hcnkgV2lmaSBDb25uZWN0XG4gICAgICogQHBhcmFtIHtDcmVkZW50aWFsc30gY3JlZGVudGlhbHMgXG4gICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAqIEBtZW1iZXJvZiBXaWZpQXBpXG4gICAgICovXG4gICAgcHVibGljIHdpZmlDb25uZWN0V2lmaUNvbm5lY3RQb3N0KGNyZWRlbnRpYWxzOiBDcmVkZW50aWFscywgb3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZykge1xuICAgICAgICByZXR1cm4gV2lmaUFwaUZwKHRoaXMuY29uZmlndXJhdGlvbikud2lmaUNvbm5lY3RXaWZpQ29ubmVjdFBvc3QoY3JlZGVudGlhbHMsIG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QodGhpcy5heGlvcywgdGhpcy5iYXNlUGF0aCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0aGUgY3VycmVudGx5IGFjdGl2ZSBXaS1GaSBjb25uZWN0aW9uLCBvciBudWxsIGlmIG5vbmUuXG4gICAgICogQHN1bW1hcnkgV2lmaSBDdXJyZW50XG4gICAgICogQHBhcmFtIHtib29sZWFufSBbdXBkYXRlXSBcbiAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICogQG1lbWJlcm9mIFdpZmlBcGlcbiAgICAgKi9cbiAgICBwdWJsaWMgd2lmaUN1cnJlbnRXaWZpQ3VycmVudEdldCh1cGRhdGU/OiBib29sZWFuLCBvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKSB7XG4gICAgICAgIHJldHVybiBXaWZpQXBpRnAodGhpcy5jb25maWd1cmF0aW9uKS53aWZpQ3VycmVudFdpZmlDdXJyZW50R2V0KHVwZGF0ZSwgb3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdCh0aGlzLmF4aW9zLCB0aGlzLmJhc2VQYXRoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQnJpbmcgdGhlIHdpZmkgZGV2aWNlIGRvd24uXG4gICAgICogQHN1bW1hcnkgV2lmaSBEZXZpY2UgRG93blxuICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgKiBAbWVtYmVyb2YgV2lmaUFwaVxuICAgICAqL1xuICAgIHB1YmxpYyB3aWZpRGV2aWNlRG93bldpZmlEZXZpY2VEb3duUG9zdChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKSB7XG4gICAgICAgIHJldHVybiBXaWZpQXBpRnAodGhpcy5jb25maWd1cmF0aW9uKS53aWZpRGV2aWNlRG93bldpZmlEZXZpY2VEb3duUG9zdChvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KHRoaXMuYXhpb3MsIHRoaXMuYmFzZVBhdGgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCcmluZyB0aGUgIHdpZmkgZGV2aWNlIHVwLlxuICAgICAqIEBzdW1tYXJ5IFdpZmkgRGV2aWNlIFVwXG4gICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAqIEBtZW1iZXJvZiBXaWZpQXBpXG4gICAgICovXG4gICAgcHVibGljIHdpZmlEZXZpY2VVcFdpZmlEZXZpY2VVcFBvc3Qob3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZykge1xuICAgICAgICByZXR1cm4gV2lmaUFwaUZwKHRoaXMuY29uZmlndXJhdGlvbikud2lmaURldmljZVVwV2lmaURldmljZVVwUG9zdChvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KHRoaXMuYXhpb3MsIHRoaXMuYmFzZVBhdGgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEaXNjb25uZWN0IGZyb20gdGhlIGN1cnJlbnQgV2ktRmkgbmV0d29yay5cbiAgICAgKiBAc3VtbWFyeSBXaWZpIERpc2Nvbm5lY3RcbiAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICogQG1lbWJlcm9mIFdpZmlBcGlcbiAgICAgKi9cbiAgICBwdWJsaWMgd2lmaURpc2Nvbm5lY3RXaWZpRGlzY29ubmVjdFBvc3Qob3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZykge1xuICAgICAgICByZXR1cm4gV2lmaUFwaUZwKHRoaXMuY29uZmlndXJhdGlvbikud2lmaURpc2Nvbm5lY3RXaWZpRGlzY29ubmVjdFBvc3Qob3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdCh0aGlzLmF4aW9zLCB0aGlzLmJhc2VQYXRoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGVybWFuZW50bHkgZGVsZXRlIHRoZSBjdXJyZW50IFdpLUZpIGNvbm5lY3Rpb24gcHJvZmlsZS5cbiAgICAgKiBAc3VtbWFyeSBXaWZpIEZvcmdldFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbc3NpZF0gXG4gICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAqIEBtZW1iZXJvZiBXaWZpQXBpXG4gICAgICovXG4gICAgcHVibGljIHdpZmlGb3JnZXRXaWZpRm9yZ2V0RGVsZXRlKHNzaWQ/OiBzdHJpbmcsIG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpIHtcbiAgICAgICAgcmV0dXJuIFdpZmlBcGlGcCh0aGlzLmNvbmZpZ3VyYXRpb24pLndpZmlGb3JnZXRXaWZpRm9yZ2V0RGVsZXRlKHNzaWQsIG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QodGhpcy5heGlvcywgdGhpcy5iYXNlUGF0aCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNjYW4gZm9yIGF2YWlsYWJsZSBXaS1GaSBuZXR3b3Jrcy4gT25seSBwZXJmb3JtcyBhIGZyZXNoIHNjYW4gaWYgYHJlc2NhbmAgaXMgVHJ1ZSBhbmQgaXQgaGFzblxcJ3QgcmVzY2FubmVkIGluIHRoZSBsYXN0IFNDQU5fVFRMIHNlY29uZHMuXG4gICAgICogQHN1bW1hcnkgV2lmaSBTY2FuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbcmVzY2FuXSBcbiAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICogQG1lbWJlcm9mIFdpZmlBcGlcbiAgICAgKi9cbiAgICBwdWJsaWMgd2lmaVNjYW5XaWZpU2NhbkdldChyZXNjYW4/OiBib29sZWFuLCBvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKSB7XG4gICAgICAgIHJldHVybiBXaWZpQXBpRnAodGhpcy5jb25maWd1cmF0aW9uKS53aWZpU2NhbldpZmlTY2FuR2V0KHJlc2Nhbiwgb3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdCh0aGlzLmF4aW9zLCB0aGlzLmJhc2VQYXRoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHN1bW1hcnkgV2lmaSBTdGF0dXNcbiAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICogQG1lbWJlcm9mIFdpZmlBcGlcbiAgICAgKi9cbiAgICBwdWJsaWMgd2lmaVN0YXR1c1dpZmlEZXZpY2VTdGF0dXNHZXQob3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZykge1xuICAgICAgICByZXR1cm4gV2lmaUFwaUZwKHRoaXMuY29uZmlndXJhdGlvbikud2lmaVN0YXR1c1dpZmlEZXZpY2VTdGF0dXNHZXQob3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdCh0aGlzLmF4aW9zLCB0aGlzLmJhc2VQYXRoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RhcnQgb3Igc3dpdGNoIHRvIGEga25vd24gY29ubmVjdGlvbiBieSBpdHMgU1NJRC5cbiAgICAgKiBAc3VtbWFyeSBXaWZpIFN3aXRjaFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzc2lkIFxuICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgKiBAbWVtYmVyb2YgV2lmaUFwaVxuICAgICAqL1xuICAgIHB1YmxpYyB3aWZpU3dpdGNoV2lmaVVwUG9zdChzc2lkOiBzdHJpbmcsIG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpIHtcbiAgICAgICAgcmV0dXJuIFdpZmlBcGlGcCh0aGlzLmNvbmZpZ3VyYXRpb24pLndpZmlTd2l0Y2hXaWZpVXBQb3N0KHNzaWQsIG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QodGhpcy5heGlvcywgdGhpcy5iYXNlUGF0aCkpO1xuICAgIH1cbn1cblxuIl0sIm1hcHBpbmdzIjoiQUFpQkEsT0FBTyxpQkFBaUI7QUFHeEIsU0FBUyxnQkFBZ0IsbUJBQW1CLG1CQUFtQixzQkFBc0IsdUJBQXVCLGtCQUFrQixpQkFBaUIsdUJBQXVCLGNBQWMsNkJBQTZCO0FBRWpOLFNBQVMsV0FBVyxvQkFBc0MsU0FBUyxlQUFlLDBCQUEwQjtBQWlCckcsYUFB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