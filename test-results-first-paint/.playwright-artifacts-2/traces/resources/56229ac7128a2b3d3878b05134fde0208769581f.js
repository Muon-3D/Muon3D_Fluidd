import globalAxios from "/.vite-e2e/4291/deps/axios.js?v=9b9fafc7";
import { DUMMY_BASE_URL, assertParamExists, setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, setSearchParams, serializeDataIfNeeded, toPathString, createRequestFunction } from "/src/aux_api/common.ts";
import { BASE_PATH, COLLECTION_FORMATS, BaseAPI, RequiredError, operationServerMap } from "/src/aux_api/base.ts";
export const ApApiAxiosParamCreator = function(configuration) {
  return {
    /**
     * Bring the AP connection down.
     * @summary Ap Down
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    apDownWifiApDownPost: async (options = {}) => {
      const localVarPath = `/wifi/ap/down`;
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
     * Modify AP settings: SSID, optional WPA2 PSK, and autoconnect flag.
     * @summary Ap Modify
     * @param {APCredentials} aPCredentials 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    apModifyWifiApModifyPost: async (aPCredentials, options = {}) => {
      assertParamExists("apModifyWifiApModifyPost", "aPCredentials", aPCredentials);
      const localVarPath = `/wifi/ap/modify`;
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
      localVarRequestOptions.data = serializeDataIfNeeded(aPCredentials, localVarRequestOptions, configuration);
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Get just the SSID, PSK (if any), and autoconnect flag from the AP profile.
     * @summary Ap Show Credentials
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    apShowCredentialsWifiApShowGet: async (options = {}) => {
      const localVarPath = `/wifi/ap/show`;
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
     * Bring the AP connection up; optionally modify parameters first.
     * @summary Ap Up
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    apUpWifiApUpPost: async (options = {}) => {
      const localVarPath = `/wifi/ap/up`;
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
     * 
     * @summary Count Stations
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    countStationsWifiApCountPost: async (options = {}) => {
      const localVarPath = `/wifi/ap/count`;
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
     * 
     * @summary Wifi Status
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiStatusWifiApDeviceStatusGet: async (options = {}) => {
      const localVarPath = `/wifi/ap/device/status`;
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
    }
  };
};
export const ApApiFp = function(configuration) {
  const localVarAxiosParamCreator = ApApiAxiosParamCreator(configuration);
  return {
    /**
     * Bring the AP connection down.
     * @summary Ap Down
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async apDownWifiApDownPost(options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apDownWifiApDownPost(options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["ApApi.apDownWifiApDownPost"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Modify AP settings: SSID, optional WPA2 PSK, and autoconnect flag.
     * @summary Ap Modify
     * @param {APCredentials} aPCredentials 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async apModifyWifiApModifyPost(aPCredentials, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apModifyWifiApModifyPost(aPCredentials, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["ApApi.apModifyWifiApModifyPost"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Get just the SSID, PSK (if any), and autoconnect flag from the AP profile.
     * @summary Ap Show Credentials
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async apShowCredentialsWifiApShowGet(options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apShowCredentialsWifiApShowGet(options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["ApApi.apShowCredentialsWifiApShowGet"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Bring the AP connection up; optionally modify parameters first.
     * @summary Ap Up
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async apUpWifiApUpPost(options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.apUpWifiApUpPost(options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["ApApi.apUpWifiApUpPost"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * 
     * @summary Count Stations
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async countStationsWifiApCountPost(options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.countStationsWifiApCountPost(options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["ApApi.countStationsWifiApCountPost"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * 
     * @summary Wifi Status
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async wifiStatusWifiApDeviceStatusGet(options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.wifiStatusWifiApDeviceStatusGet(options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["ApApi.wifiStatusWifiApDeviceStatusGet"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    }
  };
};
export const ApApiFactory = function(configuration, basePath, axios) {
  const localVarFp = ApApiFp(configuration);
  return {
    /**
     * Bring the AP connection down.
     * @summary Ap Down
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    apDownWifiApDownPost(options) {
      return localVarFp.apDownWifiApDownPost(options).then((request) => request(axios, basePath));
    },
    /**
     * Modify AP settings: SSID, optional WPA2 PSK, and autoconnect flag.
     * @summary Ap Modify
     * @param {APCredentials} aPCredentials 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    apModifyWifiApModifyPost(aPCredentials, options) {
      return localVarFp.apModifyWifiApModifyPost(aPCredentials, options).then((request) => request(axios, basePath));
    },
    /**
     * Get just the SSID, PSK (if any), and autoconnect flag from the AP profile.
     * @summary Ap Show Credentials
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    apShowCredentialsWifiApShowGet(options) {
      return localVarFp.apShowCredentialsWifiApShowGet(options).then((request) => request(axios, basePath));
    },
    /**
     * Bring the AP connection up; optionally modify parameters first.
     * @summary Ap Up
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    apUpWifiApUpPost(options) {
      return localVarFp.apUpWifiApUpPost(options).then((request) => request(axios, basePath));
    },
    /**
     * 
     * @summary Count Stations
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    countStationsWifiApCountPost(options) {
      return localVarFp.countStationsWifiApCountPost(options).then((request) => request(axios, basePath));
    },
    /**
     * 
     * @summary Wifi Status
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    wifiStatusWifiApDeviceStatusGet(options) {
      return localVarFp.wifiStatusWifiApDeviceStatusGet(options).then((request) => request(axios, basePath));
    }
  };
};
export class ApApi extends BaseAPI {
  /**
   * Bring the AP connection down.
   * @summary Ap Down
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof ApApi
   */
  apDownWifiApDownPost(options) {
    return ApApiFp(this.configuration).apDownWifiApDownPost(options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Modify AP settings: SSID, optional WPA2 PSK, and autoconnect flag.
   * @summary Ap Modify
   * @param {APCredentials} aPCredentials 
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof ApApi
   */
  apModifyWifiApModifyPost(aPCredentials, options) {
    return ApApiFp(this.configuration).apModifyWifiApModifyPost(aPCredentials, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Get just the SSID, PSK (if any), and autoconnect flag from the AP profile.
   * @summary Ap Show Credentials
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof ApApi
   */
  apShowCredentialsWifiApShowGet(options) {
    return ApApiFp(this.configuration).apShowCredentialsWifiApShowGet(options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Bring the AP connection up; optionally modify parameters first.
   * @summary Ap Up
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof ApApi
   */
  apUpWifiApUpPost(options) {
    return ApApiFp(this.configuration).apUpWifiApUpPost(options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * 
   * @summary Count Stations
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof ApApi
   */
  countStationsWifiApCountPost(options) {
    return ApApiFp(this.configuration).countStationsWifiApCountPost(options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * 
   * @summary Wifi Status
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof ApApi
   */
  wifiStatusWifiApDeviceStatusGet(options) {
    return ApApiFp(this.configuration).wifiStatusWifiApDeviceStatusGet(options).then((request) => request(this.axios, this.basePath));
  }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwLWFwaS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiB0c2xpbnQ6ZGlzYWJsZSAqL1xuLyogZXNsaW50LWRpc2FibGUgKi9cbi8qKlxuICogU21hcnRLbm9iIEFVWCBIVFRQIEFQSVxuICogTm8gZGVzY3JpcHRpb24gcHJvdmlkZWQgKGdlbmVyYXRlZCBieSBPcGVuYXBpIEdlbmVyYXRvciBodHRwczovL2dpdGh1Yi5jb20vb3BlbmFwaXRvb2xzL29wZW5hcGktZ2VuZXJhdG9yKVxuICpcbiAqIFRoZSB2ZXJzaW9uIG9mIHRoZSBPcGVuQVBJIGRvY3VtZW50OiAwLjEuMFxuICogXG4gKlxuICogTk9URTogVGhpcyBjbGFzcyBpcyBhdXRvIGdlbmVyYXRlZCBieSBPcGVuQVBJIEdlbmVyYXRvciAoaHR0cHM6Ly9vcGVuYXBpLWdlbmVyYXRvci50ZWNoKS5cbiAqIGh0dHBzOi8vb3BlbmFwaS1nZW5lcmF0b3IudGVjaFxuICogRG8gbm90IGVkaXQgdGhlIGNsYXNzIG1hbnVhbGx5LlxuICovXG5cblxuaW1wb3J0IHR5cGUgeyBDb25maWd1cmF0aW9uIH0gZnJvbSAnLi4vY29uZmlndXJhdGlvbic7XG5pbXBvcnQgdHlwZSB7IEF4aW9zUHJvbWlzZSwgQXhpb3NJbnN0YW5jZSwgUmF3QXhpb3NSZXF1ZXN0Q29uZmlnIH0gZnJvbSAnYXhpb3MnO1xuaW1wb3J0IGdsb2JhbEF4aW9zIGZyb20gJ2F4aW9zJztcbi8vIFNvbWUgaW1wb3J0cyBub3QgdXNlZCBkZXBlbmRpbmcgb24gdGVtcGxhdGUgY29uZGl0aW9uc1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IHsgRFVNTVlfQkFTRV9VUkwsIGFzc2VydFBhcmFtRXhpc3RzLCBzZXRBcGlLZXlUb09iamVjdCwgc2V0QmFzaWNBdXRoVG9PYmplY3QsIHNldEJlYXJlckF1dGhUb09iamVjdCwgc2V0T0F1dGhUb09iamVjdCwgc2V0U2VhcmNoUGFyYW1zLCBzZXJpYWxpemVEYXRhSWZOZWVkZWQsIHRvUGF0aFN0cmluZywgY3JlYXRlUmVxdWVzdEZ1bmN0aW9uIH0gZnJvbSAnLi4vY29tbW9uJztcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCB7IEJBU0VfUEFUSCwgQ09MTEVDVElPTl9GT1JNQVRTLCB0eXBlIFJlcXVlc3RBcmdzLCBCYXNlQVBJLCBSZXF1aXJlZEVycm9yLCBvcGVyYXRpb25TZXJ2ZXJNYXAgfSBmcm9tICcuLi9iYXNlJztcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCB0eXBlIHsgQVBDcmVkZW50aWFscyB9IGZyb20gJy4uL21vZGVscyc7XG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgdHlwZSB7IERldmljZSB9IGZyb20gJy4uL21vZGVscyc7XG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgdHlwZSB7IEhUVFBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuLi9tb2RlbHMnO1xuLyoqXG4gKiBBcEFwaSAtIGF4aW9zIHBhcmFtZXRlciBjcmVhdG9yXG4gKiBAZXhwb3J0XG4gKi9cbmV4cG9ydCBjb25zdCBBcEFwaUF4aW9zUGFyYW1DcmVhdG9yID0gZnVuY3Rpb24gKGNvbmZpZ3VyYXRpb24/OiBDb25maWd1cmF0aW9uKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJyaW5nIHRoZSBBUCBjb25uZWN0aW9uIGRvd24uXG4gICAgICAgICAqIEBzdW1tYXJ5IEFwIERvd25cbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIGFwRG93bldpZmlBcERvd25Qb3N0OiBhc3luYyAob3B0aW9uczogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnID0ge30pOiBQcm9taXNlPFJlcXVlc3RBcmdzPiA9PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclBhdGggPSBgL3dpZmkvYXAvZG93bmA7XG4gICAgICAgICAgICAvLyB1c2UgZHVtbXkgYmFzZSBVUkwgc3RyaW5nIGJlY2F1c2UgdGhlIFVSTCBjb25zdHJ1Y3RvciBvbmx5IGFjY2VwdHMgYWJzb2x1dGUgVVJMcy5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyVXJsT2JqID0gbmV3IFVSTChsb2NhbFZhclBhdGgsIERVTU1ZX0JBU0VfVVJMKTtcbiAgICAgICAgICAgIGxldCBiYXNlT3B0aW9ucztcbiAgICAgICAgICAgIGlmIChjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgYmFzZU9wdGlvbnMgPSBjb25maWd1cmF0aW9uLmJhc2VPcHRpb25zO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclJlcXVlc3RPcHRpb25zID0geyBtZXRob2Q6ICdQT1NUJywgLi4uYmFzZU9wdGlvbnMsIC4uLm9wdGlvbnN9O1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclF1ZXJ5UGFyYW1ldGVyID0ge30gYXMgYW55O1xuXG5cbiAgICBcbiAgICAgICAgICAgIHNldFNlYXJjaFBhcmFtcyhsb2NhbFZhclVybE9iaiwgbG9jYWxWYXJRdWVyeVBhcmFtZXRlcik7XG4gICAgICAgICAgICBsZXQgaGVhZGVyc0Zyb21CYXNlT3B0aW9ucyA9IGJhc2VPcHRpb25zICYmIGJhc2VPcHRpb25zLmhlYWRlcnMgPyBiYXNlT3B0aW9ucy5oZWFkZXJzIDoge307XG4gICAgICAgICAgICBsb2NhbFZhclJlcXVlc3RPcHRpb25zLmhlYWRlcnMgPSB7Li4ubG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIsIC4uLmhlYWRlcnNGcm9tQmFzZU9wdGlvbnMsIC4uLm9wdGlvbnMuaGVhZGVyc307XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdXJsOiB0b1BhdGhTdHJpbmcobG9jYWxWYXJVcmxPYmopLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogTW9kaWZ5IEFQIHNldHRpbmdzOiBTU0lELCBvcHRpb25hbCBXUEEyIFBTSywgYW5kIGF1dG9jb25uZWN0IGZsYWcuXG4gICAgICAgICAqIEBzdW1tYXJ5IEFwIE1vZGlmeVxuICAgICAgICAgKiBAcGFyYW0ge0FQQ3JlZGVudGlhbHN9IGFQQ3JlZGVudGlhbHMgXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBhcE1vZGlmeVdpZmlBcE1vZGlmeVBvc3Q6IGFzeW5jIChhUENyZWRlbnRpYWxzOiBBUENyZWRlbnRpYWxzLCBvcHRpb25zOiBSYXdBeGlvc1JlcXVlc3RDb25maWcgPSB7fSk6IFByb21pc2U8UmVxdWVzdEFyZ3M+ID0+IHtcbiAgICAgICAgICAgIC8vIHZlcmlmeSByZXF1aXJlZCBwYXJhbWV0ZXIgJ2FQQ3JlZGVudGlhbHMnIGlzIG5vdCBudWxsIG9yIHVuZGVmaW5lZFxuICAgICAgICAgICAgYXNzZXJ0UGFyYW1FeGlzdHMoJ2FwTW9kaWZ5V2lmaUFwTW9kaWZ5UG9zdCcsICdhUENyZWRlbnRpYWxzJywgYVBDcmVkZW50aWFscylcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUGF0aCA9IGAvd2lmaS9hcC9tb2RpZnlgO1xuICAgICAgICAgICAgLy8gdXNlIGR1bW15IGJhc2UgVVJMIHN0cmluZyBiZWNhdXNlIHRoZSBVUkwgY29uc3RydWN0b3Igb25seSBhY2NlcHRzIGFic29sdXRlIFVSTHMuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclVybE9iaiA9IG5ldyBVUkwobG9jYWxWYXJQYXRoLCBEVU1NWV9CQVNFX1VSTCk7XG4gICAgICAgICAgICBsZXQgYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICBpZiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGJhc2VPcHRpb25zID0gY29uZmlndXJhdGlvbi5iYXNlT3B0aW9ucztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyA9IHsgbWV0aG9kOiAnUE9TVCcsIC4uLmJhc2VPcHRpb25zLCAuLi5vcHRpb25zfTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFySGVhZGVyUGFyYW1ldGVyID0ge30gYXMgYW55O1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJRdWVyeVBhcmFtZXRlciA9IHt9IGFzIGFueTtcblxuXG4gICAgXG4gICAgICAgICAgICBsb2NhbFZhckhlYWRlclBhcmFtZXRlclsnQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG5cbiAgICAgICAgICAgIHNldFNlYXJjaFBhcmFtcyhsb2NhbFZhclVybE9iaiwgbG9jYWxWYXJRdWVyeVBhcmFtZXRlcik7XG4gICAgICAgICAgICBsZXQgaGVhZGVyc0Zyb21CYXNlT3B0aW9ucyA9IGJhc2VPcHRpb25zICYmIGJhc2VPcHRpb25zLmhlYWRlcnMgPyBiYXNlT3B0aW9ucy5oZWFkZXJzIDoge307XG4gICAgICAgICAgICBsb2NhbFZhclJlcXVlc3RPcHRpb25zLmhlYWRlcnMgPSB7Li4ubG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIsIC4uLmhlYWRlcnNGcm9tQmFzZU9wdGlvbnMsIC4uLm9wdGlvbnMuaGVhZGVyc307XG4gICAgICAgICAgICBsb2NhbFZhclJlcXVlc3RPcHRpb25zLmRhdGEgPSBzZXJpYWxpemVEYXRhSWZOZWVkZWQoYVBDcmVkZW50aWFscywgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucywgY29uZmlndXJhdGlvbilcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB1cmw6IHRvUGF0aFN0cmluZyhsb2NhbFZhclVybE9iaiksXG4gICAgICAgICAgICAgICAgb3B0aW9uczogbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQganVzdCB0aGUgU1NJRCwgUFNLIChpZiBhbnkpLCBhbmQgYXV0b2Nvbm5lY3QgZmxhZyBmcm9tIHRoZSBBUCBwcm9maWxlLlxuICAgICAgICAgKiBAc3VtbWFyeSBBcCBTaG93IENyZWRlbnRpYWxzXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBhcFNob3dDcmVkZW50aWFsc1dpZmlBcFNob3dHZXQ6IGFzeW5jIChvcHRpb25zOiBSYXdBeGlvc1JlcXVlc3RDb25maWcgPSB7fSk6IFByb21pc2U8UmVxdWVzdEFyZ3M+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUGF0aCA9IGAvd2lmaS9hcC9zaG93YDtcbiAgICAgICAgICAgIC8vIHVzZSBkdW1teSBiYXNlIFVSTCBzdHJpbmcgYmVjYXVzZSB0aGUgVVJMIGNvbnN0cnVjdG9yIG9ubHkgYWNjZXB0cyBhYnNvbHV0ZSBVUkxzLlxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJVcmxPYmogPSBuZXcgVVJMKGxvY2FsVmFyUGF0aCwgRFVNTVlfQkFTRV9VUkwpO1xuICAgICAgICAgICAgbGV0IGJhc2VPcHRpb25zO1xuICAgICAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBiYXNlT3B0aW9ucyA9IGNvbmZpZ3VyYXRpb24uYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMgPSB7IG1ldGhvZDogJ0dFVCcsIC4uLmJhc2VPcHRpb25zLCAuLi5vcHRpb25zfTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFySGVhZGVyUGFyYW1ldGVyID0ge30gYXMgYW55O1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJRdWVyeVBhcmFtZXRlciA9IHt9IGFzIGFueTtcblxuXG4gICAgXG4gICAgICAgICAgICBzZXRTZWFyY2hQYXJhbXMobG9jYWxWYXJVcmxPYmosIGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIpO1xuICAgICAgICAgICAgbGV0IGhlYWRlcnNGcm9tQmFzZU9wdGlvbnMgPSBiYXNlT3B0aW9ucyAmJiBiYXNlT3B0aW9ucy5oZWFkZXJzID8gYmFzZU9wdGlvbnMuaGVhZGVycyA6IHt9O1xuICAgICAgICAgICAgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucy5oZWFkZXJzID0gey4uLmxvY2FsVmFySGVhZGVyUGFyYW1ldGVyLCAuLi5oZWFkZXJzRnJvbUJhc2VPcHRpb25zLCAuLi5vcHRpb25zLmhlYWRlcnN9O1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHVybDogdG9QYXRoU3RyaW5nKGxvY2FsVmFyVXJsT2JqKSxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBsb2NhbFZhclJlcXVlc3RPcHRpb25zLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJyaW5nIHRoZSBBUCBjb25uZWN0aW9uIHVwOyBvcHRpb25hbGx5IG1vZGlmeSBwYXJhbWV0ZXJzIGZpcnN0LlxuICAgICAgICAgKiBAc3VtbWFyeSBBcCBVcFxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgYXBVcFdpZmlBcFVwUG9zdDogYXN5bmMgKG9wdGlvbnM6IFJhd0F4aW9zUmVxdWVzdENvbmZpZyA9IHt9KTogUHJvbWlzZTxSZXF1ZXN0QXJncz4gPT4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJQYXRoID0gYC93aWZpL2FwL3VwYDtcbiAgICAgICAgICAgIC8vIHVzZSBkdW1teSBiYXNlIFVSTCBzdHJpbmcgYmVjYXVzZSB0aGUgVVJMIGNvbnN0cnVjdG9yIG9ubHkgYWNjZXB0cyBhYnNvbHV0ZSBVUkxzLlxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJVcmxPYmogPSBuZXcgVVJMKGxvY2FsVmFyUGF0aCwgRFVNTVlfQkFTRV9VUkwpO1xuICAgICAgICAgICAgbGV0IGJhc2VPcHRpb25zO1xuICAgICAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBiYXNlT3B0aW9ucyA9IGNvbmZpZ3VyYXRpb24uYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMgPSB7IG1ldGhvZDogJ1BPU1QnLCAuLi5iYXNlT3B0aW9ucywgLi4ub3B0aW9uc307XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckhlYWRlclBhcmFtZXRlciA9IHt9IGFzIGFueTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG5cblxuICAgIFxuICAgICAgICAgICAgc2V0U2VhcmNoUGFyYW1zKGxvY2FsVmFyVXJsT2JqLCBsb2NhbFZhclF1ZXJ5UGFyYW1ldGVyKTtcbiAgICAgICAgICAgIGxldCBoZWFkZXJzRnJvbUJhc2VPcHRpb25zID0gYmFzZU9wdGlvbnMgJiYgYmFzZU9wdGlvbnMuaGVhZGVycyA/IGJhc2VPcHRpb25zLmhlYWRlcnMgOiB7fTtcbiAgICAgICAgICAgIGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMuaGVhZGVycyA9IHsuLi5sb2NhbFZhckhlYWRlclBhcmFtZXRlciwgLi4uaGVhZGVyc0Zyb21CYXNlT3B0aW9ucywgLi4ub3B0aW9ucy5oZWFkZXJzfTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB1cmw6IHRvUGF0aFN0cmluZyhsb2NhbFZhclVybE9iaiksXG4gICAgICAgICAgICAgICAgb3B0aW9uczogbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBcbiAgICAgICAgICogQHN1bW1hcnkgQ291bnQgU3RhdGlvbnNcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIGNvdW50U3RhdGlvbnNXaWZpQXBDb3VudFBvc3Q6IGFzeW5jIChvcHRpb25zOiBSYXdBeGlvc1JlcXVlc3RDb25maWcgPSB7fSk6IFByb21pc2U8UmVxdWVzdEFyZ3M+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUGF0aCA9IGAvd2lmaS9hcC9jb3VudGA7XG4gICAgICAgICAgICAvLyB1c2UgZHVtbXkgYmFzZSBVUkwgc3RyaW5nIGJlY2F1c2UgdGhlIFVSTCBjb25zdHJ1Y3RvciBvbmx5IGFjY2VwdHMgYWJzb2x1dGUgVVJMcy5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyVXJsT2JqID0gbmV3IFVSTChsb2NhbFZhclBhdGgsIERVTU1ZX0JBU0VfVVJMKTtcbiAgICAgICAgICAgIGxldCBiYXNlT3B0aW9ucztcbiAgICAgICAgICAgIGlmIChjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgYmFzZU9wdGlvbnMgPSBjb25maWd1cmF0aW9uLmJhc2VPcHRpb25zO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclJlcXVlc3RPcHRpb25zID0geyBtZXRob2Q6ICdQT1NUJywgLi4uYmFzZU9wdGlvbnMsIC4uLm9wdGlvbnN9O1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclF1ZXJ5UGFyYW1ldGVyID0ge30gYXMgYW55O1xuXG5cbiAgICBcbiAgICAgICAgICAgIHNldFNlYXJjaFBhcmFtcyhsb2NhbFZhclVybE9iaiwgbG9jYWxWYXJRdWVyeVBhcmFtZXRlcik7XG4gICAgICAgICAgICBsZXQgaGVhZGVyc0Zyb21CYXNlT3B0aW9ucyA9IGJhc2VPcHRpb25zICYmIGJhc2VPcHRpb25zLmhlYWRlcnMgPyBiYXNlT3B0aW9ucy5oZWFkZXJzIDoge307XG4gICAgICAgICAgICBsb2NhbFZhclJlcXVlc3RPcHRpb25zLmhlYWRlcnMgPSB7Li4ubG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIsIC4uLmhlYWRlcnNGcm9tQmFzZU9wdGlvbnMsIC4uLm9wdGlvbnMuaGVhZGVyc307XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdXJsOiB0b1BhdGhTdHJpbmcobG9jYWxWYXJVcmxPYmopLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogXG4gICAgICAgICAqIEBzdW1tYXJ5IFdpZmkgU3RhdHVzXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICB3aWZpU3RhdHVzV2lmaUFwRGV2aWNlU3RhdHVzR2V0OiBhc3luYyAob3B0aW9uczogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnID0ge30pOiBQcm9taXNlPFJlcXVlc3RBcmdzPiA9PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclBhdGggPSBgL3dpZmkvYXAvZGV2aWNlL3N0YXR1c2A7XG4gICAgICAgICAgICAvLyB1c2UgZHVtbXkgYmFzZSBVUkwgc3RyaW5nIGJlY2F1c2UgdGhlIFVSTCBjb25zdHJ1Y3RvciBvbmx5IGFjY2VwdHMgYWJzb2x1dGUgVVJMcy5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyVXJsT2JqID0gbmV3IFVSTChsb2NhbFZhclBhdGgsIERVTU1ZX0JBU0VfVVJMKTtcbiAgICAgICAgICAgIGxldCBiYXNlT3B0aW9ucztcbiAgICAgICAgICAgIGlmIChjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgYmFzZU9wdGlvbnMgPSBjb25maWd1cmF0aW9uLmJhc2VPcHRpb25zO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclJlcXVlc3RPcHRpb25zID0geyBtZXRob2Q6ICdHRVQnLCAuLi5iYXNlT3B0aW9ucywgLi4ub3B0aW9uc307XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckhlYWRlclBhcmFtZXRlciA9IHt9IGFzIGFueTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG5cblxuICAgIFxuICAgICAgICAgICAgc2V0U2VhcmNoUGFyYW1zKGxvY2FsVmFyVXJsT2JqLCBsb2NhbFZhclF1ZXJ5UGFyYW1ldGVyKTtcbiAgICAgICAgICAgIGxldCBoZWFkZXJzRnJvbUJhc2VPcHRpb25zID0gYmFzZU9wdGlvbnMgJiYgYmFzZU9wdGlvbnMuaGVhZGVycyA/IGJhc2VPcHRpb25zLmhlYWRlcnMgOiB7fTtcbiAgICAgICAgICAgIGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMuaGVhZGVycyA9IHsuLi5sb2NhbFZhckhlYWRlclBhcmFtZXRlciwgLi4uaGVhZGVyc0Zyb21CYXNlT3B0aW9ucywgLi4ub3B0aW9ucy5oZWFkZXJzfTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB1cmw6IHRvUGF0aFN0cmluZyhsb2NhbFZhclVybE9iaiksXG4gICAgICAgICAgICAgICAgb3B0aW9uczogbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgfVxufTtcblxuLyoqXG4gKiBBcEFwaSAtIGZ1bmN0aW9uYWwgcHJvZ3JhbW1pbmcgaW50ZXJmYWNlXG4gKiBAZXhwb3J0XG4gKi9cbmV4cG9ydCBjb25zdCBBcEFwaUZwID0gZnVuY3Rpb24oY29uZmlndXJhdGlvbj86IENvbmZpZ3VyYXRpb24pIHtcbiAgICBjb25zdCBsb2NhbFZhckF4aW9zUGFyYW1DcmVhdG9yID0gQXBBcGlBeGlvc1BhcmFtQ3JlYXRvcihjb25maWd1cmF0aW9uKVxuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBCcmluZyB0aGUgQVAgY29ubmVjdGlvbiBkb3duLlxuICAgICAgICAgKiBAc3VtbWFyeSBBcCBEb3duXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBhcERvd25XaWZpQXBEb3duUG9zdChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogUHJvbWlzZTwoYXhpb3M/OiBBeGlvc0luc3RhbmNlLCBiYXNlUGF0aD86IHN0cmluZykgPT4gQXhpb3NQcm9taXNlPGFueT4+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyQXhpb3NBcmdzID0gYXdhaXQgbG9jYWxWYXJBeGlvc1BhcmFtQ3JlYXRvci5hcERvd25XaWZpQXBEb3duUG9zdChvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXggPSBjb25maWd1cmF0aW9uPy5zZXJ2ZXJJbmRleCA/PyAwO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCA9IG9wZXJhdGlvblNlcnZlck1hcFsnQXBBcGkuYXBEb3duV2lmaUFwRG93blBvc3QnXT8uW2xvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXhdPy51cmw7XG4gICAgICAgICAgICByZXR1cm4gKGF4aW9zLCBiYXNlUGF0aCkgPT4gY3JlYXRlUmVxdWVzdEZ1bmN0aW9uKGxvY2FsVmFyQXhpb3NBcmdzLCBnbG9iYWxBeGlvcywgQkFTRV9QQVRILCBjb25maWd1cmF0aW9uKShheGlvcywgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCB8fCBiYXNlUGF0aCk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNb2RpZnkgQVAgc2V0dGluZ3M6IFNTSUQsIG9wdGlvbmFsIFdQQTIgUFNLLCBhbmQgYXV0b2Nvbm5lY3QgZmxhZy5cbiAgICAgICAgICogQHN1bW1hcnkgQXAgTW9kaWZ5XG4gICAgICAgICAqIEBwYXJhbSB7QVBDcmVkZW50aWFsc30gYVBDcmVkZW50aWFscyBcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIGFwTW9kaWZ5V2lmaUFwTW9kaWZ5UG9zdChhUENyZWRlbnRpYWxzOiBBUENyZWRlbnRpYWxzLCBvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogUHJvbWlzZTwoYXhpb3M/OiBBeGlvc0luc3RhbmNlLCBiYXNlUGF0aD86IHN0cmluZykgPT4gQXhpb3NQcm9taXNlPGFueT4+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyQXhpb3NBcmdzID0gYXdhaXQgbG9jYWxWYXJBeGlvc1BhcmFtQ3JlYXRvci5hcE1vZGlmeVdpZmlBcE1vZGlmeVBvc3QoYVBDcmVkZW50aWFscywgb3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckluZGV4ID0gY29uZmlndXJhdGlvbj8uc2VydmVySW5kZXggPz8gMDtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVyQmFzZVBhdGggPSBvcGVyYXRpb25TZXJ2ZXJNYXBbJ0FwQXBpLmFwTW9kaWZ5V2lmaUFwTW9kaWZ5UG9zdCddPy5bbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleF0/LnVybDtcbiAgICAgICAgICAgIHJldHVybiAoYXhpb3MsIGJhc2VQYXRoKSA9PiBjcmVhdGVSZXF1ZXN0RnVuY3Rpb24obG9jYWxWYXJBeGlvc0FyZ3MsIGdsb2JhbEF4aW9zLCBCQVNFX1BBVEgsIGNvbmZpZ3VyYXRpb24pKGF4aW9zLCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoIHx8IGJhc2VQYXRoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBqdXN0IHRoZSBTU0lELCBQU0sgKGlmIGFueSksIGFuZCBhdXRvY29ubmVjdCBmbGFnIGZyb20gdGhlIEFQIHByb2ZpbGUuXG4gICAgICAgICAqIEBzdW1tYXJ5IEFwIFNob3cgQ3JlZGVudGlhbHNcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIGFwU2hvd0NyZWRlbnRpYWxzV2lmaUFwU2hvd0dldChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogUHJvbWlzZTwoYXhpb3M/OiBBeGlvc0luc3RhbmNlLCBiYXNlUGF0aD86IHN0cmluZykgPT4gQXhpb3NQcm9taXNlPEFQQ3JlZGVudGlhbHM+PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckF4aW9zQXJncyA9IGF3YWl0IGxvY2FsVmFyQXhpb3NQYXJhbUNyZWF0b3IuYXBTaG93Q3JlZGVudGlhbHNXaWZpQXBTaG93R2V0KG9wdGlvbnMpO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleCA9IGNvbmZpZ3VyYXRpb24/LnNlcnZlckluZGV4ID8/IDA7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoID0gb3BlcmF0aW9uU2VydmVyTWFwWydBcEFwaS5hcFNob3dDcmVkZW50aWFsc1dpZmlBcFNob3dHZXQnXT8uW2xvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXhdPy51cmw7XG4gICAgICAgICAgICByZXR1cm4gKGF4aW9zLCBiYXNlUGF0aCkgPT4gY3JlYXRlUmVxdWVzdEZ1bmN0aW9uKGxvY2FsVmFyQXhpb3NBcmdzLCBnbG9iYWxBeGlvcywgQkFTRV9QQVRILCBjb25maWd1cmF0aW9uKShheGlvcywgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCB8fCBiYXNlUGF0aCk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBCcmluZyB0aGUgQVAgY29ubmVjdGlvbiB1cDsgb3B0aW9uYWxseSBtb2RpZnkgcGFyYW1ldGVycyBmaXJzdC5cbiAgICAgICAgICogQHN1bW1hcnkgQXAgVXBcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIGFwVXBXaWZpQXBVcFBvc3Qob3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZyk6IFByb21pc2U8KGF4aW9zPzogQXhpb3NJbnN0YW5jZSwgYmFzZVBhdGg/OiBzdHJpbmcpID0+IEF4aW9zUHJvbWlzZTxhbnk+PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckF4aW9zQXJncyA9IGF3YWl0IGxvY2FsVmFyQXhpb3NQYXJhbUNyZWF0b3IuYXBVcFdpZmlBcFVwUG9zdChvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXggPSBjb25maWd1cmF0aW9uPy5zZXJ2ZXJJbmRleCA/PyAwO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCA9IG9wZXJhdGlvblNlcnZlck1hcFsnQXBBcGkuYXBVcFdpZmlBcFVwUG9zdCddPy5bbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleF0/LnVybDtcbiAgICAgICAgICAgIHJldHVybiAoYXhpb3MsIGJhc2VQYXRoKSA9PiBjcmVhdGVSZXF1ZXN0RnVuY3Rpb24obG9jYWxWYXJBeGlvc0FyZ3MsIGdsb2JhbEF4aW9zLCBCQVNFX1BBVEgsIGNvbmZpZ3VyYXRpb24pKGF4aW9zLCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoIHx8IGJhc2VQYXRoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFxuICAgICAgICAgKiBAc3VtbWFyeSBDb3VudCBTdGF0aW9uc1xuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgY291bnRTdGF0aW9uc1dpZmlBcENvdW50UG9zdChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogUHJvbWlzZTwoYXhpb3M/OiBBeGlvc0luc3RhbmNlLCBiYXNlUGF0aD86IHN0cmluZykgPT4gQXhpb3NQcm9taXNlPG51bWJlcj4+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyQXhpb3NBcmdzID0gYXdhaXQgbG9jYWxWYXJBeGlvc1BhcmFtQ3JlYXRvci5jb3VudFN0YXRpb25zV2lmaUFwQ291bnRQb3N0KG9wdGlvbnMpO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleCA9IGNvbmZpZ3VyYXRpb24/LnNlcnZlckluZGV4ID8/IDA7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoID0gb3BlcmF0aW9uU2VydmVyTWFwWydBcEFwaS5jb3VudFN0YXRpb25zV2lmaUFwQ291bnRQb3N0J10/Lltsb2NhbFZhck9wZXJhdGlvblNlcnZlckluZGV4XT8udXJsO1xuICAgICAgICAgICAgcmV0dXJuIChheGlvcywgYmFzZVBhdGgpID0+IGNyZWF0ZVJlcXVlc3RGdW5jdGlvbihsb2NhbFZhckF4aW9zQXJncywgZ2xvYmFsQXhpb3MsIEJBU0VfUEFUSCwgY29uZmlndXJhdGlvbikoYXhpb3MsIGxvY2FsVmFyT3BlcmF0aW9uU2VydmVyQmFzZVBhdGggfHwgYmFzZVBhdGgpO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogXG4gICAgICAgICAqIEBzdW1tYXJ5IFdpZmkgU3RhdHVzXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyB3aWZpU3RhdHVzV2lmaUFwRGV2aWNlU3RhdHVzR2V0KG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpOiBQcm9taXNlPChheGlvcz86IEF4aW9zSW5zdGFuY2UsIGJhc2VQYXRoPzogc3RyaW5nKSA9PiBBeGlvc1Byb21pc2U8RGV2aWNlPj4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJBeGlvc0FyZ3MgPSBhd2FpdCBsb2NhbFZhckF4aW9zUGFyYW1DcmVhdG9yLndpZmlTdGF0dXNXaWZpQXBEZXZpY2VTdGF0dXNHZXQob3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckluZGV4ID0gY29uZmlndXJhdGlvbj8uc2VydmVySW5kZXggPz8gMDtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVyQmFzZVBhdGggPSBvcGVyYXRpb25TZXJ2ZXJNYXBbJ0FwQXBpLndpZmlTdGF0dXNXaWZpQXBEZXZpY2VTdGF0dXNHZXQnXT8uW2xvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXhdPy51cmw7XG4gICAgICAgICAgICByZXR1cm4gKGF4aW9zLCBiYXNlUGF0aCkgPT4gY3JlYXRlUmVxdWVzdEZ1bmN0aW9uKGxvY2FsVmFyQXhpb3NBcmdzLCBnbG9iYWxBeGlvcywgQkFTRV9QQVRILCBjb25maWd1cmF0aW9uKShheGlvcywgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCB8fCBiYXNlUGF0aCk7XG4gICAgICAgIH0sXG4gICAgfVxufTtcblxuLyoqXG4gKiBBcEFwaSAtIGZhY3RvcnkgaW50ZXJmYWNlXG4gKiBAZXhwb3J0XG4gKi9cbmV4cG9ydCBjb25zdCBBcEFwaUZhY3RvcnkgPSBmdW5jdGlvbiAoY29uZmlndXJhdGlvbj86IENvbmZpZ3VyYXRpb24sIGJhc2VQYXRoPzogc3RyaW5nLCBheGlvcz86IEF4aW9zSW5zdGFuY2UpIHtcbiAgICBjb25zdCBsb2NhbFZhckZwID0gQXBBcGlGcChjb25maWd1cmF0aW9uKVxuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBCcmluZyB0aGUgQVAgY29ubmVjdGlvbiBkb3duLlxuICAgICAgICAgKiBAc3VtbWFyeSBBcCBEb3duXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBhcERvd25XaWZpQXBEb3duUG9zdChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogQXhpb3NQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsVmFyRnAuYXBEb3duV2lmaUFwRG93blBvc3Qob3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdChheGlvcywgYmFzZVBhdGgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1vZGlmeSBBUCBzZXR0aW5nczogU1NJRCwgb3B0aW9uYWwgV1BBMiBQU0ssIGFuZCBhdXRvY29ubmVjdCBmbGFnLlxuICAgICAgICAgKiBAc3VtbWFyeSBBcCBNb2RpZnlcbiAgICAgICAgICogQHBhcmFtIHtBUENyZWRlbnRpYWxzfSBhUENyZWRlbnRpYWxzIFxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgYXBNb2RpZnlXaWZpQXBNb2RpZnlQb3N0KGFQQ3JlZGVudGlhbHM6IEFQQ3JlZGVudGlhbHMsIG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpOiBBeGlvc1Byb21pc2U8YW55PiB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxWYXJGcC5hcE1vZGlmeVdpZmlBcE1vZGlmeVBvc3QoYVBDcmVkZW50aWFscywgb3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdChheGlvcywgYmFzZVBhdGgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBqdXN0IHRoZSBTU0lELCBQU0sgKGlmIGFueSksIGFuZCBhdXRvY29ubmVjdCBmbGFnIGZyb20gdGhlIEFQIHByb2ZpbGUuXG4gICAgICAgICAqIEBzdW1tYXJ5IEFwIFNob3cgQ3JlZGVudGlhbHNcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIGFwU2hvd0NyZWRlbnRpYWxzV2lmaUFwU2hvd0dldChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogQXhpb3NQcm9taXNlPEFQQ3JlZGVudGlhbHM+IHtcbiAgICAgICAgICAgIHJldHVybiBsb2NhbFZhckZwLmFwU2hvd0NyZWRlbnRpYWxzV2lmaUFwU2hvd0dldChvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KGF4aW9zLCBiYXNlUGF0aCkpO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogQnJpbmcgdGhlIEFQIGNvbm5lY3Rpb24gdXA7IG9wdGlvbmFsbHkgbW9kaWZ5IHBhcmFtZXRlcnMgZmlyc3QuXG4gICAgICAgICAqIEBzdW1tYXJ5IEFwIFVwXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBhcFVwV2lmaUFwVXBQb3N0KG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpOiBBeGlvc1Byb21pc2U8YW55PiB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxWYXJGcC5hcFVwV2lmaUFwVXBQb3N0KG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QoYXhpb3MsIGJhc2VQYXRoKSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBcbiAgICAgICAgICogQHN1bW1hcnkgQ291bnQgU3RhdGlvbnNcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIGNvdW50U3RhdGlvbnNXaWZpQXBDb3VudFBvc3Qob3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZyk6IEF4aW9zUHJvbWlzZTxudW1iZXI+IHtcbiAgICAgICAgICAgIHJldHVybiBsb2NhbFZhckZwLmNvdW50U3RhdGlvbnNXaWZpQXBDb3VudFBvc3Qob3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdChheGlvcywgYmFzZVBhdGgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFxuICAgICAgICAgKiBAc3VtbWFyeSBXaWZpIFN0YXR1c1xuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgd2lmaVN0YXR1c1dpZmlBcERldmljZVN0YXR1c0dldChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogQXhpb3NQcm9taXNlPERldmljZT4ge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsVmFyRnAud2lmaVN0YXR1c1dpZmlBcERldmljZVN0YXR1c0dldChvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KGF4aW9zLCBiYXNlUGF0aCkpO1xuICAgICAgICB9LFxuICAgIH07XG59O1xuXG4vKipcbiAqIEFwQXBpIC0gb2JqZWN0LW9yaWVudGVkIGludGVyZmFjZVxuICogQGV4cG9ydFxuICogQGNsYXNzIEFwQXBpXG4gKiBAZXh0ZW5kcyB7QmFzZUFQSX1cbiAqL1xuZXhwb3J0IGNsYXNzIEFwQXBpIGV4dGVuZHMgQmFzZUFQSSB7XG4gICAgLyoqXG4gICAgICogQnJpbmcgdGhlIEFQIGNvbm5lY3Rpb24gZG93bi5cbiAgICAgKiBAc3VtbWFyeSBBcCBEb3duXG4gICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAqIEBtZW1iZXJvZiBBcEFwaVxuICAgICAqL1xuICAgIHB1YmxpYyBhcERvd25XaWZpQXBEb3duUG9zdChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKSB7XG4gICAgICAgIHJldHVybiBBcEFwaUZwKHRoaXMuY29uZmlndXJhdGlvbikuYXBEb3duV2lmaUFwRG93blBvc3Qob3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdCh0aGlzLmF4aW9zLCB0aGlzLmJhc2VQYXRoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTW9kaWZ5IEFQIHNldHRpbmdzOiBTU0lELCBvcHRpb25hbCBXUEEyIFBTSywgYW5kIGF1dG9jb25uZWN0IGZsYWcuXG4gICAgICogQHN1bW1hcnkgQXAgTW9kaWZ5XG4gICAgICogQHBhcmFtIHtBUENyZWRlbnRpYWxzfSBhUENyZWRlbnRpYWxzIFxuICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgKiBAbWVtYmVyb2YgQXBBcGlcbiAgICAgKi9cbiAgICBwdWJsaWMgYXBNb2RpZnlXaWZpQXBNb2RpZnlQb3N0KGFQQ3JlZGVudGlhbHM6IEFQQ3JlZGVudGlhbHMsIG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpIHtcbiAgICAgICAgcmV0dXJuIEFwQXBpRnAodGhpcy5jb25maWd1cmF0aW9uKS5hcE1vZGlmeVdpZmlBcE1vZGlmeVBvc3QoYVBDcmVkZW50aWFscywgb3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdCh0aGlzLmF4aW9zLCB0aGlzLmJhc2VQYXRoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGp1c3QgdGhlIFNTSUQsIFBTSyAoaWYgYW55KSwgYW5kIGF1dG9jb25uZWN0IGZsYWcgZnJvbSB0aGUgQVAgcHJvZmlsZS5cbiAgICAgKiBAc3VtbWFyeSBBcCBTaG93IENyZWRlbnRpYWxzXG4gICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAqIEBtZW1iZXJvZiBBcEFwaVxuICAgICAqL1xuICAgIHB1YmxpYyBhcFNob3dDcmVkZW50aWFsc1dpZmlBcFNob3dHZXQob3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZykge1xuICAgICAgICByZXR1cm4gQXBBcGlGcCh0aGlzLmNvbmZpZ3VyYXRpb24pLmFwU2hvd0NyZWRlbnRpYWxzV2lmaUFwU2hvd0dldChvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KHRoaXMuYXhpb3MsIHRoaXMuYmFzZVBhdGgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCcmluZyB0aGUgQVAgY29ubmVjdGlvbiB1cDsgb3B0aW9uYWxseSBtb2RpZnkgcGFyYW1ldGVycyBmaXJzdC5cbiAgICAgKiBAc3VtbWFyeSBBcCBVcFxuICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgKiBAbWVtYmVyb2YgQXBBcGlcbiAgICAgKi9cbiAgICBwdWJsaWMgYXBVcFdpZmlBcFVwUG9zdChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKSB7XG4gICAgICAgIHJldHVybiBBcEFwaUZwKHRoaXMuY29uZmlndXJhdGlvbikuYXBVcFdpZmlBcFVwUG9zdChvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KHRoaXMuYXhpb3MsIHRoaXMuYmFzZVBhdGgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAc3VtbWFyeSBDb3VudCBTdGF0aW9uc1xuICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgKiBAbWVtYmVyb2YgQXBBcGlcbiAgICAgKi9cbiAgICBwdWJsaWMgY291bnRTdGF0aW9uc1dpZmlBcENvdW50UG9zdChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKSB7XG4gICAgICAgIHJldHVybiBBcEFwaUZwKHRoaXMuY29uZmlndXJhdGlvbikuY291bnRTdGF0aW9uc1dpZmlBcENvdW50UG9zdChvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KHRoaXMuYXhpb3MsIHRoaXMuYmFzZVBhdGgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAc3VtbWFyeSBXaWZpIFN0YXR1c1xuICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgKiBAbWVtYmVyb2YgQXBBcGlcbiAgICAgKi9cbiAgICBwdWJsaWMgd2lmaVN0YXR1c1dpZmlBcERldmljZVN0YXR1c0dldChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKSB7XG4gICAgICAgIHJldHVybiBBcEFwaUZwKHRoaXMuY29uZmlndXJhdGlvbikud2lmaVN0YXR1c1dpZmlBcERldmljZVN0YXR1c0dldChvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KHRoaXMuYXhpb3MsIHRoaXMuYmFzZVBhdGgpKTtcbiAgICB9XG59XG5cbiJdLCJtYXBwaW5ncyI6IkFBaUJBLE9BQU8saUJBQWlCO0FBR3hCLFNBQVMsZ0JBQWdCLG1CQUFtQixtQkFBbUIsc0JBQXNCLHVCQUF1QixrQkFBa0IsaUJBQWlCLHVCQUF1QixjQUFjLDZCQUE2QjtBQUVqTixTQUFTLFdBQVcsb0JBQXNDLFNBQVMsZUFBZSwwQkFBMEI7QUFXckcsYUFBTSx5QkFBeUIsU0FBVSxlQUErQjtBQUMzRSxTQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFPSCxzQkFBc0IsT0FBTyxVQUFpQyxDQUFDLE1BQTRCO0FBQ3ZGLFlBQU0sZUFBZTtBQUVyQixZQUFNLGlCQUFpQixJQUFJLElBQUksY0FBYyxjQUFjO0FBQzNELFVBQUk7QUFDSixVQUFJLGVBQWU7QUFDZixzQkFBYyxj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