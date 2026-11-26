import globalAxios from "/.vite-e2e/4291/deps/axios.js?v=9b9fafc7";
import { DUMMY_BASE_URL, assertParamExists, setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, setSearchParams, serializeDataIfNeeded, toPathString, createRequestFunction } from "/src/aux_api/common.ts";
import { BASE_PATH, COLLECTION_FORMATS, BaseAPI, RequiredError, operationServerMap } from "/src/aux_api/base.ts";
export const DevModeApiAxiosParamCreator = function(configuration) {
  return {
    /**
     * Poll whether a challenge has been confirmed at the printer yet.  Read-only: confirming still has to happen on the hardware, so polling this can never advance the state on its own.
     * @summary Get Dev Mode Consent
     * @param {string} challengeId 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getDevModeConsentDevModeConsentChallengeIdGet: async (challengeId, options = {}) => {
      assertParamExists("getDevModeConsentDevModeConsentChallengeIdGet", "challengeId", challengeId);
      const localVarPath = `/dev_mode/consent/{challenge_id}`.replace(`{${"challenge_id"}}`, encodeURIComponent(String(challengeId)));
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "GET", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      await setApiKeyToObject(localVarHeaderParameter, "X-Aux-Api-Key", configuration);
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Dev mode is TRUE if CORE_CFG == DEV_MODE_CORE_CFG, FALSE if CORE_CFG == OEM_CORE_CFG, ERROR otherwise.
     * @summary Get Dev Mode Status
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getDevModeStatusDevModeGet: async (options = {}) => {
      const localVarPath = `/dev_mode`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "GET", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      await setApiKeyToObject(localVarHeaderParameter, "X-Aux-Api-Key", configuration);
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * The exact text the panel must display before enabling (DEV-2).  Served rather than hard-coded in the UI so the wording, and the version the client has to echo back, have one home.
     * @summary Get Dev Mode Waiver
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getDevModeWaiverDevModeWaiverGet: async (options = {}) => {
      const localVarPath = `/dev_mode/waiver`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "GET", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      await setApiKeyToObject(localVarHeaderParameter, "X-Aux-Api-Key", configuration);
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Create a timestamped backup of the current dev-mode working directory. Only valid while dev mode is enabled.
     * @summary Manual Backup
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    manualBackupDevModeBackupPost: async (options = {}) => {
      const localVarPath = `/dev_mode/backup`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "POST", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      await setApiKeyToObject(localVarHeaderParameter, "X-Aux-Api-Key", configuration);
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Ask the operator, at the printer, to confirm entering Developer Mode.  Returns a short-lived single-use challenge id. Redeem it by passing `challenge_id` to `POST /dev_mode {\"enabled\": true}` once the operator has confirmed on the hardware. Nothing about the printer changes here.
     * @summary Open Dev Mode Consent
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    openDevModeConsentDevModeConsentPost: async (options = {}) => {
      const localVarPath = `/dev_mode/consent`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "POST", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      await setApiKeyToObject(localVarHeaderParameter, "X-Aux-Api-Key", configuration);
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Refresh the developer-mode working copy from OEM core. Only valid while dev mode is enabled.  Steps:   * backup DEV_MODE_DIR to backups/<timestamp> (excluding backups)   * clear DEV_MODE_DIR except \'backups\'   * copy OEM_CORE_DIR into DEV_MODE_DIR
     * @summary Refresh Dev Mode Config
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    refreshDevModeConfigDevModeRefreshPost: async (options = {}) => {
      const localVarPath = `/dev_mode/refresh`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "POST", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      await setApiKeyToObject(localVarHeaderParameter, "X-Aux-Api-Key", configuration);
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Enable/disable Developer Mode.  - true from false (requires physical confirmation, see dev_mode_consent):     * redeem the operator\'s confirmation challenge     * durably record the entry (fails closed, see dev_mode_record)     * backup existing DEV_MODE_DIR if it exists     * refresh DEV_MODE_DIR from OEM_CORE_DIR     * set CORE_CFG to DEV_MODE_CORE_CFG     * restart klipper - false from true (deliberately ungated):     * set CORE_CFG to OEM_CORE_CFG     * restart klipper - no state change: no-op  Only the enable direction is gated. Enabling puts operator-supplied config in charge of the heaters; disabling puts the OEM config back. Getting *out* of Developer Mode must not depend on a working knob, a reachable operator, or an attacker\'s cooperation, so recovery stays a plain unconditional call.
     * @summary Set Dev Mode
     * @param {DevModeToggle} devModeToggle 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    setDevModeDevModePost: async (devModeToggle, options = {}) => {
      assertParamExists("setDevModeDevModePost", "devModeToggle", devModeToggle);
      const localVarPath = `/dev_mode`;
      const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
      let baseOptions;
      if (configuration) {
        baseOptions = configuration.baseOptions;
      }
      const localVarRequestOptions = { method: "POST", ...baseOptions, ...options };
      const localVarHeaderParameter = {};
      const localVarQueryParameter = {};
      await setApiKeyToObject(localVarHeaderParameter, "X-Aux-Api-Key", configuration);
      localVarHeaderParameter["Content-Type"] = "application/json";
      setSearchParams(localVarUrlObj, localVarQueryParameter);
      let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
      localVarRequestOptions.headers = { ...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers };
      localVarRequestOptions.data = serializeDataIfNeeded(devModeToggle, localVarRequestOptions, configuration);
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    }
  };
};
export const DevModeApiFp = function(configuration) {
  const localVarAxiosParamCreator = DevModeApiAxiosParamCreator(configuration);
  return {
    /**
     * Poll whether a challenge has been confirmed at the printer yet.  Read-only: confirming still has to happen on the hardware, so polling this can never advance the state on its own.
     * @summary Get Dev Mode Consent
     * @param {string} challengeId 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getDevModeConsentDevModeConsentChallengeIdGet(challengeId, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.getDevModeConsentDevModeConsentChallengeIdGet(challengeId, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["DevModeApi.getDevModeConsentDevModeConsentChallengeIdGet"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Dev mode is TRUE if CORE_CFG == DEV_MODE_CORE_CFG, FALSE if CORE_CFG == OEM_CORE_CFG, ERROR otherwise.
     * @summary Get Dev Mode Status
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getDevModeStatusDevModeGet(options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.getDevModeStatusDevModeGet(options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["DevModeApi.getDevModeStatusDevModeGet"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * The exact text the panel must display before enabling (DEV-2).  Served rather than hard-coded in the UI so the wording, and the version the client has to echo back, have one home.
     * @summary Get Dev Mode Waiver
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getDevModeWaiverDevModeWaiverGet(options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.getDevModeWaiverDevModeWaiverGet(options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["DevModeApi.getDevModeWaiverDevModeWaiverGet"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Create a timestamped backup of the current dev-mode working directory. Only valid while dev mode is enabled.
     * @summary Manual Backup
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async manualBackupDevModeBackupPost(options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.manualBackupDevModeBackupPost(options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["DevModeApi.manualBackupDevModeBackupPost"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Ask the operator, at the printer, to confirm entering Developer Mode.  Returns a short-lived single-use challenge id. Redeem it by passing `challenge_id` to `POST /dev_mode {\"enabled\": true}` once the operator has confirmed on the hardware. Nothing about the printer changes here.
     * @summary Open Dev Mode Consent
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async openDevModeConsentDevModeConsentPost(options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.openDevModeConsentDevModeConsentPost(options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["DevModeApi.openDevModeConsentDevModeConsentPost"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Refresh the developer-mode working copy from OEM core. Only valid while dev mode is enabled.  Steps:   * backup DEV_MODE_DIR to backups/<timestamp> (excluding backups)   * clear DEV_MODE_DIR except \'backups\'   * copy OEM_CORE_DIR into DEV_MODE_DIR
     * @summary Refresh Dev Mode Config
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async refreshDevModeConfigDevModeRefreshPost(options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.refreshDevModeConfigDevModeRefreshPost(options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["DevModeApi.refreshDevModeConfigDevModeRefreshPost"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Enable/disable Developer Mode.  - true from false (requires physical confirmation, see dev_mode_consent):     * redeem the operator\'s confirmation challenge     * durably record the entry (fails closed, see dev_mode_record)     * backup existing DEV_MODE_DIR if it exists     * refresh DEV_MODE_DIR from OEM_CORE_DIR     * set CORE_CFG to DEV_MODE_CORE_CFG     * restart klipper - false from true (deliberately ungated):     * set CORE_CFG to OEM_CORE_CFG     * restart klipper - no state change: no-op  Only the enable direction is gated. Enabling puts operator-supplied config in charge of the heaters; disabling puts the OEM config back. Getting *out* of Developer Mode must not depend on a working knob, a reachable operator, or an attacker\'s cooperation, so recovery stays a plain unconditional call.
     * @summary Set Dev Mode
     * @param {DevModeToggle} devModeToggle 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async setDevModeDevModePost(devModeToggle, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.setDevModeDevModePost(devModeToggle, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["DevModeApi.setDevModeDevModePost"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    }
  };
};
export const DevModeApiFactory = function(configuration, basePath, axios) {
  const localVarFp = DevModeApiFp(configuration);
  return {
    /**
     * Poll whether a challenge has been confirmed at the printer yet.  Read-only: confirming still has to happen on the hardware, so polling this can never advance the state on its own.
     * @summary Get Dev Mode Consent
     * @param {string} challengeId 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getDevModeConsentDevModeConsentChallengeIdGet(challengeId, options) {
      return localVarFp.getDevModeConsentDevModeConsentChallengeIdGet(challengeId, options).then((request) => request(axios, basePath));
    },
    /**
     * Dev mode is TRUE if CORE_CFG == DEV_MODE_CORE_CFG, FALSE if CORE_CFG == OEM_CORE_CFG, ERROR otherwise.
     * @summary Get Dev Mode Status
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getDevModeStatusDevModeGet(options) {
      return localVarFp.getDevModeStatusDevModeGet(options).then((request) => request(axios, basePath));
    },
    /**
     * The exact text the panel must display before enabling (DEV-2).  Served rather than hard-coded in the UI so the wording, and the version the client has to echo back, have one home.
     * @summary Get Dev Mode Waiver
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    getDevModeWaiverDevModeWaiverGet(options) {
      return localVarFp.getDevModeWaiverDevModeWaiverGet(options).then((request) => request(axios, basePath));
    },
    /**
     * Create a timestamped backup of the current dev-mode working directory. Only valid while dev mode is enabled.
     * @summary Manual Backup
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    manualBackupDevModeBackupPost(options) {
      return localVarFp.manualBackupDevModeBackupPost(options).then((request) => request(axios, basePath));
    },
    /**
     * Ask the operator, at the printer, to confirm entering Developer Mode.  Returns a short-lived single-use challenge id. Redeem it by passing `challenge_id` to `POST /dev_mode {\"enabled\": true}` once the operator has confirmed on the hardware. Nothing about the printer changes here.
     * @summary Open Dev Mode Consent
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    openDevModeConsentDevModeConsentPost(options) {
      return localVarFp.openDevModeConsentDevModeConsentPost(options).then((request) => request(axios, basePath));
    },
    /**
     * Refresh the developer-mode working copy from OEM core. Only valid while dev mode is enabled.  Steps:   * backup DEV_MODE_DIR to backups/<timestamp> (excluding backups)   * clear DEV_MODE_DIR except \'backups\'   * copy OEM_CORE_DIR into DEV_MODE_DIR
     * @summary Refresh Dev Mode Config
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    refreshDevModeConfigDevModeRefreshPost(options) {
      return localVarFp.refreshDevModeConfigDevModeRefreshPost(options).then((request) => request(axios, basePath));
    },
    /**
     * Enable/disable Developer Mode.  - true from false (requires physical confirmation, see dev_mode_consent):     * redeem the operator\'s confirmation challenge     * durably record the entry (fails closed, see dev_mode_record)     * backup existing DEV_MODE_DIR if it exists     * refresh DEV_MODE_DIR from OEM_CORE_DIR     * set CORE_CFG to DEV_MODE_CORE_CFG     * restart klipper - false from true (deliberately ungated):     * set CORE_CFG to OEM_CORE_CFG     * restart klipper - no state change: no-op  Only the enable direction is gated. Enabling puts operator-supplied config in charge of the heaters; disabling puts the OEM config back. Getting *out* of Developer Mode must not depend on a working knob, a reachable operator, or an attacker\'s cooperation, so recovery stays a plain unconditional call.
     * @summary Set Dev Mode
     * @param {DevModeToggle} devModeToggle 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    setDevModeDevModePost(devModeToggle, options) {
      return localVarFp.setDevModeDevModePost(devModeToggle, options).then((request) => request(axios, basePath));
    }
  };
};
export class DevModeApi extends BaseAPI {
  /**
   * Poll whether a challenge has been confirmed at the printer yet.  Read-only: confirming still has to happen on the hardware, so polling this can never advance the state on its own.
   * @summary Get Dev Mode Consent
   * @param {string} challengeId 
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DevModeApi
   */
  getDevModeConsentDevModeConsentChallengeIdGet(challengeId, options) {
    return DevModeApiFp(this.configuration).getDevModeConsentDevModeConsentChallengeIdGet(challengeId, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Dev mode is TRUE if CORE_CFG == DEV_MODE_CORE_CFG, FALSE if CORE_CFG == OEM_CORE_CFG, ERROR otherwise.
   * @summary Get Dev Mode Status
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DevModeApi
   */
  getDevModeStatusDevModeGet(options) {
    return DevModeApiFp(this.configuration).getDevModeStatusDevModeGet(options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * The exact text the panel must display before enabling (DEV-2).  Served rather than hard-coded in the UI so the wording, and the version the client has to echo back, have one home.
   * @summary Get Dev Mode Waiver
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DevModeApi
   */
  getDevModeWaiverDevModeWaiverGet(options) {
    return DevModeApiFp(this.configuration).getDevModeWaiverDevModeWaiverGet(options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Create a timestamped backup of the current dev-mode working directory. Only valid while dev mode is enabled.
   * @summary Manual Backup
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DevModeApi
   */
  manualBackupDevModeBackupPost(options) {
    return DevModeApiFp(this.configuration).manualBackupDevModeBackupPost(options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Ask the operator, at the printer, to confirm entering Developer Mode.  Returns a short-lived single-use challenge id. Redeem it by passing `challenge_id` to `POST /dev_mode {\"enabled\": true}` once the operator has confirmed on the hardware. Nothing about the printer changes here.
   * @summary Open Dev Mode Consent
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DevModeApi
   */
  openDevModeConsentDevModeConsentPost(options) {
    return DevModeApiFp(this.configuration).openDevModeConsentDevModeConsentPost(options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Refresh the developer-mode working copy from OEM core. Only valid while dev mode is enabled.  Steps:   * backup DEV_MODE_DIR to backups/<timestamp> (excluding backups)   * clear DEV_MODE_DIR except \'backups\'   * copy OEM_CORE_DIR into DEV_MODE_DIR
   * @summary Refresh Dev Mode Config
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DevModeApi
   */
  refreshDevModeConfigDevModeRefreshPost(options) {
    return DevModeApiFp(this.configuration).refreshDevModeConfigDevModeRefreshPost(options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Enable/disable Developer Mode.  - true from false (requires physical confirmation, see dev_mode_consent):     * redeem the operator\'s confirmation challenge     * durably record the entry (fails closed, see dev_mode_record)     * backup existing DEV_MODE_DIR if it exists     * refresh DEV_MODE_DIR from OEM_CORE_DIR     * set CORE_CFG to DEV_MODE_CORE_CFG     * restart klipper - false from true (deliberately ungated):     * set CORE_CFG to OEM_CORE_CFG     * restart klipper - no state change: no-op  Only the enable direction is gated. Enabling puts operator-supplied config in charge of the heaters; disabling puts the OEM config back. Getting *out* of Developer Mode must not depend on a working knob, a reachable operator, or an attacker\'s cooperation, so recovery stays a plain unconditional call.
   * @summary Set Dev Mode
   * @param {DevModeToggle} devModeToggle 
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DevModeApi
   */
  setDevModeDevModePost(devModeToggle, options) {
    return DevModeApiFp(this.configuration).setDevModeDevModePost(devModeToggle, options).then((request) => request(this.axios, this.basePath));
  }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRldi1tb2RlLWFwaS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiB0c2xpbnQ6ZGlzYWJsZSAqL1xuLyogZXNsaW50LWRpc2FibGUgKi9cbi8qKlxuICogU21hcnRLbm9iIEFVWCBIVFRQIEFQSVxuICogTm8gZGVzY3JpcHRpb24gcHJvdmlkZWQgKGdlbmVyYXRlZCBieSBPcGVuYXBpIEdlbmVyYXRvciBodHRwczovL2dpdGh1Yi5jb20vb3BlbmFwaXRvb2xzL29wZW5hcGktZ2VuZXJhdG9yKVxuICpcbiAqIFRoZSB2ZXJzaW9uIG9mIHRoZSBPcGVuQVBJIGRvY3VtZW50OiAwLjEuMFxuICogXG4gKlxuICogTk9URTogVGhpcyBjbGFzcyBpcyBhdXRvIGdlbmVyYXRlZCBieSBPcGVuQVBJIEdlbmVyYXRvciAoaHR0cHM6Ly9vcGVuYXBpLWdlbmVyYXRvci50ZWNoKS5cbiAqIGh0dHBzOi8vb3BlbmFwaS1nZW5lcmF0b3IudGVjaFxuICogRG8gbm90IGVkaXQgdGhlIGNsYXNzIG1hbnVhbGx5LlxuICovXG5cblxuaW1wb3J0IHR5cGUgeyBDb25maWd1cmF0aW9uIH0gZnJvbSAnLi4vY29uZmlndXJhdGlvbic7XG5pbXBvcnQgdHlwZSB7IEF4aW9zUHJvbWlzZSwgQXhpb3NJbnN0YW5jZSwgUmF3QXhpb3NSZXF1ZXN0Q29uZmlnIH0gZnJvbSAnYXhpb3MnO1xuaW1wb3J0IGdsb2JhbEF4aW9zIGZyb20gJ2F4aW9zJztcbi8vIFNvbWUgaW1wb3J0cyBub3QgdXNlZCBkZXBlbmRpbmcgb24gdGVtcGxhdGUgY29uZGl0aW9uc1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IHsgRFVNTVlfQkFTRV9VUkwsIGFzc2VydFBhcmFtRXhpc3RzLCBzZXRBcGlLZXlUb09iamVjdCwgc2V0QmFzaWNBdXRoVG9PYmplY3QsIHNldEJlYXJlckF1dGhUb09iamVjdCwgc2V0T0F1dGhUb09iamVjdCwgc2V0U2VhcmNoUGFyYW1zLCBzZXJpYWxpemVEYXRhSWZOZWVkZWQsIHRvUGF0aFN0cmluZywgY3JlYXRlUmVxdWVzdEZ1bmN0aW9uIH0gZnJvbSAnLi4vY29tbW9uJztcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCB7IEJBU0VfUEFUSCwgQ09MTEVDVElPTl9GT1JNQVRTLCB0eXBlIFJlcXVlc3RBcmdzLCBCYXNlQVBJLCBSZXF1aXJlZEVycm9yLCBvcGVyYXRpb25TZXJ2ZXJNYXAgfSBmcm9tICcuLi9iYXNlJztcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCB0eXBlIHsgRGV2TW9kZUNvbnNlbnRDaGFsbGVuZ2UgfSBmcm9tICcuLi9tb2RlbHMnO1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IHR5cGUgeyBEZXZNb2RlQ29uc2VudFN0YXRlIH0gZnJvbSAnLi4vbW9kZWxzJztcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCB0eXBlIHsgRGV2TW9kZVN0YXR1cyB9IGZyb20gJy4uL21vZGVscyc7XG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgdHlwZSB7IERldk1vZGVUb2dnbGUgfSBmcm9tICcuLi9tb2RlbHMnO1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IHR5cGUgeyBEZXZNb2RlV2FpdmVyIH0gZnJvbSAnLi4vbW9kZWxzJztcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCB0eXBlIHsgSFRUUFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uL21vZGVscyc7XG4vKipcbiAqIERldk1vZGVBcGkgLSBheGlvcyBwYXJhbWV0ZXIgY3JlYXRvclxuICogQGV4cG9ydFxuICovXG5leHBvcnQgY29uc3QgRGV2TW9kZUFwaUF4aW9zUGFyYW1DcmVhdG9yID0gZnVuY3Rpb24gKGNvbmZpZ3VyYXRpb24/OiBDb25maWd1cmF0aW9uKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBvbGwgd2hldGhlciBhIGNoYWxsZW5nZSBoYXMgYmVlbiBjb25maXJtZWQgYXQgdGhlIHByaW50ZXIgeWV0LiAgUmVhZC1vbmx5OiBjb25maXJtaW5nIHN0aWxsIGhhcyB0byBoYXBwZW4gb24gdGhlIGhhcmR3YXJlLCBzbyBwb2xsaW5nIHRoaXMgY2FuIG5ldmVyIGFkdmFuY2UgdGhlIHN0YXRlIG9uIGl0cyBvd24uXG4gICAgICAgICAqIEBzdW1tYXJ5IEdldCBEZXYgTW9kZSBDb25zZW50XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjaGFsbGVuZ2VJZCBcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIGdldERldk1vZGVDb25zZW50RGV2TW9kZUNvbnNlbnRDaGFsbGVuZ2VJZEdldDogYXN5bmMgKGNoYWxsZW5nZUlkOiBzdHJpbmcsIG9wdGlvbnM6IFJhd0F4aW9zUmVxdWVzdENvbmZpZyA9IHt9KTogUHJvbWlzZTxSZXF1ZXN0QXJncz4gPT4ge1xuICAgICAgICAgICAgLy8gdmVyaWZ5IHJlcXVpcmVkIHBhcmFtZXRlciAnY2hhbGxlbmdlSWQnIGlzIG5vdCBudWxsIG9yIHVuZGVmaW5lZFxuICAgICAgICAgICAgYXNzZXJ0UGFyYW1FeGlzdHMoJ2dldERldk1vZGVDb25zZW50RGV2TW9kZUNvbnNlbnRDaGFsbGVuZ2VJZEdldCcsICdjaGFsbGVuZ2VJZCcsIGNoYWxsZW5nZUlkKVxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJQYXRoID0gYC9kZXZfbW9kZS9jb25zZW50L3tjaGFsbGVuZ2VfaWR9YFxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKGB7JHtcImNoYWxsZW5nZV9pZFwifX1gLCBlbmNvZGVVUklDb21wb25lbnQoU3RyaW5nKGNoYWxsZW5nZUlkKSkpO1xuICAgICAgICAgICAgLy8gdXNlIGR1bW15IGJhc2UgVVJMIHN0cmluZyBiZWNhdXNlIHRoZSBVUkwgY29uc3RydWN0b3Igb25seSBhY2NlcHRzIGFic29sdXRlIFVSTHMuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclVybE9iaiA9IG5ldyBVUkwobG9jYWxWYXJQYXRoLCBEVU1NWV9CQVNFX1VSTCk7XG4gICAgICAgICAgICBsZXQgYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICBpZiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGJhc2VPcHRpb25zID0gY29uZmlndXJhdGlvbi5iYXNlT3B0aW9ucztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyA9IHsgbWV0aG9kOiAnR0VUJywgLi4uYmFzZU9wdGlvbnMsIC4uLm9wdGlvbnN9O1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclF1ZXJ5UGFyYW1ldGVyID0ge30gYXMgYW55O1xuXG4gICAgICAgICAgICAvLyBhdXRoZW50aWNhdGlvbiBBdXhBcGlLZXkgcmVxdWlyZWRcbiAgICAgICAgICAgIGF3YWl0IHNldEFwaUtleVRvT2JqZWN0KGxvY2FsVmFySGVhZGVyUGFyYW1ldGVyLCBcIlgtQXV4LUFwaS1LZXlcIiwgY29uZmlndXJhdGlvbilcblxuXG4gICAgXG4gICAgICAgICAgICBzZXRTZWFyY2hQYXJhbXMobG9jYWxWYXJVcmxPYmosIGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIpO1xuICAgICAgICAgICAgbGV0IGhlYWRlcnNGcm9tQmFzZU9wdGlvbnMgPSBiYXNlT3B0aW9ucyAmJiBiYXNlT3B0aW9ucy5oZWFkZXJzID8gYmFzZU9wdGlvbnMuaGVhZGVycyA6IHt9O1xuICAgICAgICAgICAgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucy5oZWFkZXJzID0gey4uLmxvY2FsVmFySGVhZGVyUGFyYW1ldGVyLCAuLi5oZWFkZXJzRnJvbUJhc2VPcHRpb25zLCAuLi5vcHRpb25zLmhlYWRlcnN9O1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHVybDogdG9QYXRoU3RyaW5nKGxvY2FsVmFyVXJsT2JqKSxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBsb2NhbFZhclJlcXVlc3RPcHRpb25zLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERldiBtb2RlIGlzIFRSVUUgaWYgQ09SRV9DRkcgPT0gREVWX01PREVfQ09SRV9DRkcsIEZBTFNFIGlmIENPUkVfQ0ZHID09IE9FTV9DT1JFX0NGRywgRVJST1Igb3RoZXJ3aXNlLlxuICAgICAgICAgKiBAc3VtbWFyeSBHZXQgRGV2IE1vZGUgU3RhdHVzXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBnZXREZXZNb2RlU3RhdHVzRGV2TW9kZUdldDogYXN5bmMgKG9wdGlvbnM6IFJhd0F4aW9zUmVxdWVzdENvbmZpZyA9IHt9KTogUHJvbWlzZTxSZXF1ZXN0QXJncz4gPT4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJQYXRoID0gYC9kZXZfbW9kZWA7XG4gICAgICAgICAgICAvLyB1c2UgZHVtbXkgYmFzZSBVUkwgc3RyaW5nIGJlY2F1c2UgdGhlIFVSTCBjb25zdHJ1Y3RvciBvbmx5IGFjY2VwdHMgYWJzb2x1dGUgVVJMcy5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyVXJsT2JqID0gbmV3IFVSTChsb2NhbFZhclBhdGgsIERVTU1ZX0JBU0VfVVJMKTtcbiAgICAgICAgICAgIGxldCBiYXNlT3B0aW9ucztcbiAgICAgICAgICAgIGlmIChjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgYmFzZU9wdGlvbnMgPSBjb25maWd1cmF0aW9uLmJhc2VPcHRpb25zO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclJlcXVlc3RPcHRpb25zID0geyBtZXRob2Q6ICdHRVQnLCAuLi5iYXNlT3B0aW9ucywgLi4ub3B0aW9uc307XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckhlYWRlclBhcmFtZXRlciA9IHt9IGFzIGFueTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG5cbiAgICAgICAgICAgIC8vIGF1dGhlbnRpY2F0aW9uIEF1eEFwaUtleSByZXF1aXJlZFxuICAgICAgICAgICAgYXdhaXQgc2V0QXBpS2V5VG9PYmplY3QobG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIsIFwiWC1BdXgtQXBpLUtleVwiLCBjb25maWd1cmF0aW9uKVxuXG5cbiAgICBcbiAgICAgICAgICAgIHNldFNlYXJjaFBhcmFtcyhsb2NhbFZhclVybE9iaiwgbG9jYWxWYXJRdWVyeVBhcmFtZXRlcik7XG4gICAgICAgICAgICBsZXQgaGVhZGVyc0Zyb21CYXNlT3B0aW9ucyA9IGJhc2VPcHRpb25zICYmIGJhc2VPcHRpb25zLmhlYWRlcnMgPyBiYXNlT3B0aW9ucy5oZWFkZXJzIDoge307XG4gICAgICAgICAgICBsb2NhbFZhclJlcXVlc3RPcHRpb25zLmhlYWRlcnMgPSB7Li4ubG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIsIC4uLmhlYWRlcnNGcm9tQmFzZU9wdGlvbnMsIC4uLm9wdGlvbnMuaGVhZGVyc307XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdXJsOiB0b1BhdGhTdHJpbmcobG9jYWxWYXJVcmxPYmopLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGV4YWN0IHRleHQgdGhlIHBhbmVsIG11c3QgZGlzcGxheSBiZWZvcmUgZW5hYmxpbmcgKERFVi0yKS4gIFNlcnZlZCByYXRoZXIgdGhhbiBoYXJkLWNvZGVkIGluIHRoZSBVSSBzbyB0aGUgd29yZGluZywgYW5kIHRoZSB2ZXJzaW9uIHRoZSBjbGllbnQgaGFzIHRvIGVjaG8gYmFjaywgaGF2ZSBvbmUgaG9tZS5cbiAgICAgICAgICogQHN1bW1hcnkgR2V0IERldiBNb2RlIFdhaXZlclxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0RGV2TW9kZVdhaXZlckRldk1vZGVXYWl2ZXJHZXQ6IGFzeW5jIChvcHRpb25zOiBSYXdBeGlvc1JlcXVlc3RDb25maWcgPSB7fSk6IFByb21pc2U8UmVxdWVzdEFyZ3M+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUGF0aCA9IGAvZGV2X21vZGUvd2FpdmVyYDtcbiAgICAgICAgICAgIC8vIHVzZSBkdW1teSBiYXNlIFVSTCBzdHJpbmcgYmVjYXVzZSB0aGUgVVJMIGNvbnN0cnVjdG9yIG9ubHkgYWNjZXB0cyBhYnNvbHV0ZSBVUkxzLlxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJVcmxPYmogPSBuZXcgVVJMKGxvY2FsVmFyUGF0aCwgRFVNTVlfQkFTRV9VUkwpO1xuICAgICAgICAgICAgbGV0IGJhc2VPcHRpb25zO1xuICAgICAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBiYXNlT3B0aW9ucyA9IGNvbmZpZ3VyYXRpb24uYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMgPSB7IG1ldGhvZDogJ0dFVCcsIC4uLmJhc2VPcHRpb25zLCAuLi5vcHRpb25zfTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFySGVhZGVyUGFyYW1ldGVyID0ge30gYXMgYW55O1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJRdWVyeVBhcmFtZXRlciA9IHt9IGFzIGFueTtcblxuICAgICAgICAgICAgLy8gYXV0aGVudGljYXRpb24gQXV4QXBpS2V5IHJlcXVpcmVkXG4gICAgICAgICAgICBhd2FpdCBzZXRBcGlLZXlUb09iamVjdChsb2NhbFZhckhlYWRlclBhcmFtZXRlciwgXCJYLUF1eC1BcGktS2V5XCIsIGNvbmZpZ3VyYXRpb24pXG5cblxuICAgIFxuICAgICAgICAgICAgc2V0U2VhcmNoUGFyYW1zKGxvY2FsVmFyVXJsT2JqLCBsb2NhbFZhclF1ZXJ5UGFyYW1ldGVyKTtcbiAgICAgICAgICAgIGxldCBoZWFkZXJzRnJvbUJhc2VPcHRpb25zID0gYmFzZU9wdGlvbnMgJiYgYmFzZU9wdGlvbnMuaGVhZGVycyA/IGJhc2VPcHRpb25zLmhlYWRlcnMgOiB7fTtcbiAgICAgICAgICAgIGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMuaGVhZGVycyA9IHsuLi5sb2NhbFZhckhlYWRlclBhcmFtZXRlciwgLi4uaGVhZGVyc0Zyb21CYXNlT3B0aW9ucywgLi4ub3B0aW9ucy5oZWFkZXJzfTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB1cmw6IHRvUGF0aFN0cmluZyhsb2NhbFZhclVybE9iaiksXG4gICAgICAgICAgICAgICAgb3B0aW9uczogbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGUgYSB0aW1lc3RhbXBlZCBiYWNrdXAgb2YgdGhlIGN1cnJlbnQgZGV2LW1vZGUgd29ya2luZyBkaXJlY3RvcnkuIE9ubHkgdmFsaWQgd2hpbGUgZGV2IG1vZGUgaXMgZW5hYmxlZC5cbiAgICAgICAgICogQHN1bW1hcnkgTWFudWFsIEJhY2t1cFxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgbWFudWFsQmFja3VwRGV2TW9kZUJhY2t1cFBvc3Q6IGFzeW5jIChvcHRpb25zOiBSYXdBeGlvc1JlcXVlc3RDb25maWcgPSB7fSk6IFByb21pc2U8UmVxdWVzdEFyZ3M+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUGF0aCA9IGAvZGV2X21vZGUvYmFja3VwYDtcbiAgICAgICAgICAgIC8vIHVzZSBkdW1teSBiYXNlIFVSTCBzdHJpbmcgYmVjYXVzZSB0aGUgVVJMIGNvbnN0cnVjdG9yIG9ubHkgYWNjZXB0cyBhYnNvbHV0ZSBVUkxzLlxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJVcmxPYmogPSBuZXcgVVJMKGxvY2FsVmFyUGF0aCwgRFVNTVlfQkFTRV9VUkwpO1xuICAgICAgICAgICAgbGV0IGJhc2VPcHRpb25zO1xuICAgICAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBiYXNlT3B0aW9ucyA9IGNvbmZpZ3VyYXRpb24uYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMgPSB7IG1ldGhvZDogJ1BPU1QnLCAuLi5iYXNlT3B0aW9ucywgLi4ub3B0aW9uc307XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckhlYWRlclBhcmFtZXRlciA9IHt9IGFzIGFueTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG5cbiAgICAgICAgICAgIC8vIGF1dGhlbnRpY2F0aW9uIEF1eEFwaUtleSByZXF1aXJlZFxuICAgICAgICAgICAgYXdhaXQgc2V0QXBpS2V5VG9PYmplY3QobG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIsIFwiWC1BdXgtQXBpLUtleVwiLCBjb25maWd1cmF0aW9uKVxuXG5cbiAgICBcbiAgICAgICAgICAgIHNldFNlYXJjaFBhcmFtcyhsb2NhbFZhclVybE9iaiwgbG9jYWxWYXJRdWVyeVBhcmFtZXRlcik7XG4gICAgICAgICAgICBsZXQgaGVhZGVyc0Zyb21CYXNlT3B0aW9ucyA9IGJhc2VPcHRpb25zICYmIGJhc2VPcHRpb25zLmhlYWRlcnMgPyBiYXNlT3B0aW9ucy5oZWFkZXJzIDoge307XG4gICAgICAgICAgICBsb2NhbFZhclJlcXVlc3RPcHRpb25zLmhlYWRlcnMgPSB7Li4ubG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIsIC4uLmhlYWRlcnNGcm9tQmFzZU9wdGlvbnMsIC4uLm9wdGlvbnMuaGVhZGVyc307XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdXJsOiB0b1BhdGhTdHJpbmcobG9jYWxWYXJVcmxPYmopLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogQXNrIHRoZSBvcGVyYXRvciwgYXQgdGhlIHByaW50ZXIsIHRvIGNvbmZpcm0gZW50ZXJpbmcgRGV2ZWxvcGVyIE1vZGUuICBSZXR1cm5zIGEgc2hvcnQtbGl2ZWQgc2luZ2xlLXVzZSBjaGFsbGVuZ2UgaWQuIFJlZGVlbSBpdCBieSBwYXNzaW5nIGBjaGFsbGVuZ2VfaWRgIHRvIGBQT1NUIC9kZXZfbW9kZSB7XFxcImVuYWJsZWRcXFwiOiB0cnVlfWAgb25jZSB0aGUgb3BlcmF0b3IgaGFzIGNvbmZpcm1lZCBvbiB0aGUgaGFyZHdhcmUuIE5vdGhpbmcgYWJvdXQgdGhlIHByaW50ZXIgY2hhbmdlcyBoZXJlLlxuICAgICAgICAgKiBAc3VtbWFyeSBPcGVuIERldiBNb2RlIENvbnNlbnRcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIG9wZW5EZXZNb2RlQ29uc2VudERldk1vZGVDb25zZW50UG9zdDogYXN5bmMgKG9wdGlvbnM6IFJhd0F4aW9zUmVxdWVzdENvbmZpZyA9IHt9KTogUHJvbWlzZTxSZXF1ZXN0QXJncz4gPT4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJQYXRoID0gYC9kZXZfbW9kZS9jb25zZW50YDtcbiAgICAgICAgICAgIC8vIHVzZSBkdW1teSBiYXNlIFVSTCBzdHJpbmcgYmVjYXVzZSB0aGUgVVJMIGNvbnN0cnVjdG9yIG9ubHkgYWNjZXB0cyBhYnNvbHV0ZSBVUkxzLlxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJVcmxPYmogPSBuZXcgVVJMKGxvY2FsVmFyUGF0aCwgRFVNTVlfQkFTRV9VUkwpO1xuICAgICAgICAgICAgbGV0IGJhc2VPcHRpb25zO1xuICAgICAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBiYXNlT3B0aW9ucyA9IGNvbmZpZ3VyYXRpb24uYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMgPSB7IG1ldGhvZDogJ1BPU1QnLCAuLi5iYXNlT3B0aW9ucywgLi4ub3B0aW9uc307XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckhlYWRlclBhcmFtZXRlciA9IHt9IGFzIGFueTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG5cbiAgICAgICAgICAgIC8vIGF1dGhlbnRpY2F0aW9uIEF1eEFwaUtleSByZXF1aXJlZFxuICAgICAgICAgICAgYXdhaXQgc2V0QXBpS2V5VG9PYmplY3QobG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIsIFwiWC1BdXgtQXBpLUtleVwiLCBjb25maWd1cmF0aW9uKVxuXG5cbiAgICBcbiAgICAgICAgICAgIHNldFNlYXJjaFBhcmFtcyhsb2NhbFZhclVybE9iaiwgbG9jYWxWYXJRdWVyeVBhcmFtZXRlcik7XG4gICAgICAgICAgICBsZXQgaGVhZGVyc0Zyb21CYXNlT3B0aW9ucyA9IGJhc2VPcHRpb25zICYmIGJhc2VPcHRpb25zLmhlYWRlcnMgPyBiYXNlT3B0aW9ucy5oZWFkZXJzIDoge307XG4gICAgICAgICAgICBsb2NhbFZhclJlcXVlc3RPcHRpb25zLmhlYWRlcnMgPSB7Li4ubG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIsIC4uLmhlYWRlcnNGcm9tQmFzZU9wdGlvbnMsIC4uLm9wdGlvbnMuaGVhZGVyc307XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdXJsOiB0b1BhdGhTdHJpbmcobG9jYWxWYXJVcmxPYmopLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogUmVmcmVzaCB0aGUgZGV2ZWxvcGVyLW1vZGUgd29ya2luZyBjb3B5IGZyb20gT0VNIGNvcmUuIE9ubHkgdmFsaWQgd2hpbGUgZGV2IG1vZGUgaXMgZW5hYmxlZC4gIFN0ZXBzOiAgICogYmFja3VwIERFVl9NT0RFX0RJUiB0byBiYWNrdXBzLzx0aW1lc3RhbXA+IChleGNsdWRpbmcgYmFja3VwcykgICAqIGNsZWFyIERFVl9NT0RFX0RJUiBleGNlcHQgXFwnYmFja3Vwc1xcJyAgICogY29weSBPRU1fQ09SRV9ESVIgaW50byBERVZfTU9ERV9ESVJcbiAgICAgICAgICogQHN1bW1hcnkgUmVmcmVzaCBEZXYgTW9kZSBDb25maWdcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIHJlZnJlc2hEZXZNb2RlQ29uZmlnRGV2TW9kZVJlZnJlc2hQb3N0OiBhc3luYyAob3B0aW9uczogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnID0ge30pOiBQcm9taXNlPFJlcXVlc3RBcmdzPiA9PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclBhdGggPSBgL2Rldl9tb2RlL3JlZnJlc2hgO1xuICAgICAgICAgICAgLy8gdXNlIGR1bW15IGJhc2UgVVJMIHN0cmluZyBiZWNhdXNlIHRoZSBVUkwgY29uc3RydWN0b3Igb25seSBhY2NlcHRzIGFic29sdXRlIFVSTHMuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclVybE9iaiA9IG5ldyBVUkwobG9jYWxWYXJQYXRoLCBEVU1NWV9CQVNFX1VSTCk7XG4gICAgICAgICAgICBsZXQgYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICBpZiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGJhc2VPcHRpb25zID0gY29uZmlndXJhdGlvbi5iYXNlT3B0aW9ucztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyA9IHsgbWV0aG9kOiAnUE9TVCcsIC4uLmJhc2VPcHRpb25zLCAuLi5vcHRpb25zfTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFySGVhZGVyUGFyYW1ldGVyID0ge30gYXMgYW55O1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJRdWVyeVBhcmFtZXRlciA9IHt9IGFzIGFueTtcblxuICAgICAgICAgICAgLy8gYXV0aGVudGljYXRpb24gQXV4QXBpS2V5IHJlcXVpcmVkXG4gICAgICAgICAgICBhd2FpdCBzZXRBcGlLZXlUb09iamVjdChsb2NhbFZhckhlYWRlclBhcmFtZXRlciwgXCJYLUF1eC1BcGktS2V5XCIsIGNvbmZpZ3VyYXRpb24pXG5cblxuICAgIFxuICAgICAgICAgICAgc2V0U2VhcmNoUGFyYW1zKGxvY2FsVmFyVXJsT2JqLCBsb2NhbFZhclF1ZXJ5UGFyYW1ldGVyKTtcbiAgICAgICAgICAgIGxldCBoZWFkZXJzRnJvbUJhc2VPcHRpb25zID0gYmFzZU9wdGlvbnMgJiYgYmFzZU9wdGlvbnMuaGVhZGVycyA/IGJhc2VPcHRpb25zLmhlYWRlcnMgOiB7fTtcbiAgICAgICAgICAgIGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMuaGVhZGVycyA9IHsuLi5sb2NhbFZhckhlYWRlclBhcmFtZXRlciwgLi4uaGVhZGVyc0Zyb21CYXNlT3B0aW9ucywgLi4ub3B0aW9ucy5oZWFkZXJzfTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB1cmw6IHRvUGF0aFN0cmluZyhsb2NhbFZhclVybE9iaiksXG4gICAgICAgICAgICAgICAgb3B0aW9uczogbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFbmFibGUvZGlzYWJsZSBEZXZlbG9wZXIgTW9kZS4gIC0gdHJ1ZSBmcm9tIGZhbHNlIChyZXF1aXJlcyBwaHlzaWNhbCBjb25maXJtYXRpb24sIHNlZSBkZXZfbW9kZV9jb25zZW50KTogICAgICogcmVkZWVtIHRoZSBvcGVyYXRvclxcJ3MgY29uZmlybWF0aW9uIGNoYWxsZW5nZSAgICAgKiBkdXJhYmx5IHJlY29yZCB0aGUgZW50cnkgKGZhaWxzIGNsb3NlZCwgc2VlIGRldl9tb2RlX3JlY29yZCkgICAgICogYmFja3VwIGV4aXN0aW5nIERFVl9NT0RFX0RJUiBpZiBpdCBleGlzdHMgICAgICogcmVmcmVzaCBERVZfTU9ERV9ESVIgZnJvbSBPRU1fQ09SRV9ESVIgICAgICogc2V0IENPUkVfQ0ZHIHRvIERFVl9NT0RFX0NPUkVfQ0ZHICAgICAqIHJlc3RhcnQga2xpcHBlciAtIGZhbHNlIGZyb20gdHJ1ZSAoZGVsaWJlcmF0ZWx5IHVuZ2F0ZWQpOiAgICAgKiBzZXQgQ09SRV9DRkcgdG8gT0VNX0NPUkVfQ0ZHICAgICAqIHJlc3RhcnQga2xpcHBlciAtIG5vIHN0YXRlIGNoYW5nZTogbm8tb3AgIE9ubHkgdGhlIGVuYWJsZSBkaXJlY3Rpb24gaXMgZ2F0ZWQuIEVuYWJsaW5nIHB1dHMgb3BlcmF0b3Itc3VwcGxpZWQgY29uZmlnIGluIGNoYXJnZSBvZiB0aGUgaGVhdGVyczsgZGlzYWJsaW5nIHB1dHMgdGhlIE9FTSBjb25maWcgYmFjay4gR2V0dGluZyAqb3V0KiBvZiBEZXZlbG9wZXIgTW9kZSBtdXN0IG5vdCBkZXBlbmQgb24gYSB3b3JraW5nIGtub2IsIGEgcmVhY2hhYmxlIG9wZXJhdG9yLCBvciBhbiBhdHRhY2tlclxcJ3MgY29vcGVyYXRpb24sIHNvIHJlY292ZXJ5IHN0YXlzIGEgcGxhaW4gdW5jb25kaXRpb25hbCBjYWxsLlxuICAgICAgICAgKiBAc3VtbWFyeSBTZXQgRGV2IE1vZGVcbiAgICAgICAgICogQHBhcmFtIHtEZXZNb2RlVG9nZ2xlfSBkZXZNb2RlVG9nZ2xlIFxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgc2V0RGV2TW9kZURldk1vZGVQb3N0OiBhc3luYyAoZGV2TW9kZVRvZ2dsZTogRGV2TW9kZVRvZ2dsZSwgb3B0aW9uczogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnID0ge30pOiBQcm9taXNlPFJlcXVlc3RBcmdzPiA9PiB7XG4gICAgICAgICAgICAvLyB2ZXJpZnkgcmVxdWlyZWQgcGFyYW1ldGVyICdkZXZNb2RlVG9nZ2xlJyBpcyBub3QgbnVsbCBvciB1bmRlZmluZWRcbiAgICAgICAgICAgIGFzc2VydFBhcmFtRXhpc3RzKCdzZXREZXZNb2RlRGV2TW9kZVBvc3QnLCAnZGV2TW9kZVRvZ2dsZScsIGRldk1vZGVUb2dnbGUpXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclBhdGggPSBgL2Rldl9tb2RlYDtcbiAgICAgICAgICAgIC8vIHVzZSBkdW1teSBiYXNlIFVSTCBzdHJpbmcgYmVjYXVzZSB0aGUgVVJMIGNvbnN0cnVjdG9yIG9ubHkgYWNjZXB0cyBhYnNvbHV0ZSBVUkxzLlxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJVcmxPYmogPSBuZXcgVVJMKGxvY2FsVmFyUGF0aCwgRFVNTVlfQkFTRV9VUkwpO1xuICAgICAgICAgICAgbGV0IGJhc2VPcHRpb25zO1xuICAgICAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBiYXNlT3B0aW9ucyA9IGNvbmZpZ3VyYXRpb24uYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMgPSB7IG1ldGhvZDogJ1BPU1QnLCAuLi5iYXNlT3B0aW9ucywgLi4ub3B0aW9uc307XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckhlYWRlclBhcmFtZXRlciA9IHt9IGFzIGFueTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG5cbiAgICAgICAgICAgIC8vIGF1dGhlbnRpY2F0aW9uIEF1eEFwaUtleSByZXF1aXJlZFxuICAgICAgICAgICAgYXdhaXQgc2V0QXBpS2V5VG9PYmplY3QobG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIsIFwiWC1BdXgtQXBpLUtleVwiLCBjb25maWd1cmF0aW9uKVxuXG5cbiAgICBcbiAgICAgICAgICAgIGxvY2FsVmFySGVhZGVyUGFyYW1ldGVyWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcblxuICAgICAgICAgICAgc2V0U2VhcmNoUGFyYW1zKGxvY2FsVmFyVXJsT2JqLCBsb2NhbFZhclF1ZXJ5UGFyYW1ldGVyKTtcbiAgICAgICAgICAgIGxldCBoZWFkZXJzRnJvbUJhc2VPcHRpb25zID0gYmFzZU9wdGlvbnMgJiYgYmFzZU9wdGlvbnMuaGVhZGVycyA/IGJhc2VPcHRpb25zLmhlYWRlcnMgOiB7fTtcbiAgICAgICAgICAgIGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMuaGVhZGVycyA9IHsuLi5sb2NhbFZhckhlYWRlclBhcmFtZXRlciwgLi4uaGVhZGVyc0Zyb21CYXNlT3B0aW9ucywgLi4ub3B0aW9ucy5oZWFkZXJzfTtcbiAgICAgICAgICAgIGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMuZGF0YSA9IHNlcmlhbGl6ZURhdGFJZk5lZWRlZChkZXZNb2RlVG9nZ2xlLCBsb2NhbFZhclJlcXVlc3RPcHRpb25zLCBjb25maWd1cmF0aW9uKVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHVybDogdG9QYXRoU3RyaW5nKGxvY2FsVmFyVXJsT2JqKSxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBsb2NhbFZhclJlcXVlc3RPcHRpb25zLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICB9XG59O1xuXG4vKipcbiAqIERldk1vZGVBcGkgLSBmdW5jdGlvbmFsIHByb2dyYW1taW5nIGludGVyZmFjZVxuICogQGV4cG9ydFxuICovXG5leHBvcnQgY29uc3QgRGV2TW9kZUFwaUZwID0gZnVuY3Rpb24oY29uZmlndXJhdGlvbj86IENvbmZpZ3VyYXRpb24pIHtcbiAgICBjb25zdCBsb2NhbFZhckF4aW9zUGFyYW1DcmVhdG9yID0gRGV2TW9kZUFwaUF4aW9zUGFyYW1DcmVhdG9yKGNvbmZpZ3VyYXRpb24pXG4gICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBvbGwgd2hldGhlciBhIGNoYWxsZW5nZSBoYXMgYmVlbiBjb25maXJtZWQgYXQgdGhlIHByaW50ZXIgeWV0LiAgUmVhZC1vbmx5OiBjb25maXJtaW5nIHN0aWxsIGhhcyB0byBoYXBwZW4gb24gdGhlIGhhcmR3YXJlLCBzbyBwb2xsaW5nIHRoaXMgY2FuIG5ldmVyIGFkdmFuY2UgdGhlIHN0YXRlIG9uIGl0cyBvd24uXG4gICAgICAgICAqIEBzdW1tYXJ5IEdldCBEZXYgTW9kZSBDb25zZW50XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjaGFsbGVuZ2VJZCBcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIGdldERldk1vZGVDb25zZW50RGV2TW9kZUNvbnNlbnRDaGFsbGVuZ2VJZEdldChjaGFsbGVuZ2VJZDogc3RyaW5nLCBvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogUHJvbWlzZTwoYXhpb3M/OiBBeGlvc0luc3RhbmNlLCBiYXNlUGF0aD86IHN0cmluZykgPT4gQXhpb3NQcm9taXNlPERldk1vZGVDb25zZW50U3RhdGU+PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckF4aW9zQXJncyA9IGF3YWl0IGxvY2FsVmFyQXhpb3NQYXJhbUNyZWF0b3IuZ2V0RGV2TW9kZUNvbnNlbnREZXZNb2RlQ29uc2VudENoYWxsZW5nZUlkR2V0KGNoYWxsZW5nZUlkLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXggPSBjb25maWd1cmF0aW9uPy5zZXJ2ZXJJbmRleCA/PyAwO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCA9IG9wZXJhdGlvblNlcnZlck1hcFsnRGV2TW9kZUFwaS5nZXREZXZNb2RlQ29uc2VudERldk1vZGVDb25zZW50Q2hhbGxlbmdlSWRHZXQnXT8uW2xvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXhdPy51cmw7XG4gICAgICAgICAgICByZXR1cm4gKGF4aW9zLCBiYXNlUGF0aCkgPT4gY3JlYXRlUmVxdWVzdEZ1bmN0aW9uKGxvY2FsVmFyQXhpb3NBcmdzLCBnbG9iYWxBeGlvcywgQkFTRV9QQVRILCBjb25maWd1cmF0aW9uKShheGlvcywgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCB8fCBiYXNlUGF0aCk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZXYgbW9kZSBpcyBUUlVFIGlmIENPUkVfQ0ZHID09IERFVl9NT0RFX0NPUkVfQ0ZHLCBGQUxTRSBpZiBDT1JFX0NGRyA9PSBPRU1fQ09SRV9DRkcsIEVSUk9SIG90aGVyd2lzZS5cbiAgICAgICAgICogQHN1bW1hcnkgR2V0IERldiBNb2RlIFN0YXR1c1xuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgZ2V0RGV2TW9kZVN0YXR1c0Rldk1vZGVHZXQob3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZyk6IFByb21pc2U8KGF4aW9zPzogQXhpb3NJbnN0YW5jZSwgYmFzZVBhdGg/OiBzdHJpbmcpID0+IEF4aW9zUHJvbWlzZTxEZXZNb2RlU3RhdHVzPj4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJBeGlvc0FyZ3MgPSBhd2FpdCBsb2NhbFZhckF4aW9zUGFyYW1DcmVhdG9yLmdldERldk1vZGVTdGF0dXNEZXZNb2RlR2V0KG9wdGlvbnMpO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleCA9IGNvbmZpZ3VyYXRpb24/LnNlcnZlckluZGV4ID8/IDA7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoID0gb3BlcmF0aW9uU2VydmVyTWFwWydEZXZNb2RlQXBpLmdldERldk1vZGVTdGF0dXNEZXZNb2RlR2V0J10/Lltsb2NhbFZhck9wZXJhdGlvblNlcnZlckluZGV4XT8udXJsO1xuICAgICAgICAgICAgcmV0dXJuIChheGlvcywgYmFzZVBhdGgpID0+IGNyZWF0ZVJlcXVlc3RGdW5jdGlvbihsb2NhbFZhckF4aW9zQXJncywgZ2xvYmFsQXhpb3MsIEJBU0VfUEFUSCwgY29uZmlndXJhdGlvbikoYXhpb3MsIGxvY2FsVmFyT3BlcmF0aW9uU2VydmVyQmFzZVBhdGggfHwgYmFzZVBhdGgpO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGV4YWN0IHRleHQgdGhlIHBhbmVsIG11c3QgZGlzcGxheSBiZWZvcmUgZW5hYmxpbmcgKERFVi0yKS4gIFNlcnZlZCByYXRoZXIgdGhhbiBoYXJkLWNvZGVkIGluIHRoZSBVSSBzbyB0aGUgd29yZGluZywgYW5kIHRoZSB2ZXJzaW9uIHRoZSBjbGllbnQgaGFzIHRvIGVjaG8gYmFjaywgaGF2ZSBvbmUgaG9tZS5cbiAgICAgICAgICogQHN1bW1hcnkgR2V0IERldiBNb2RlIFdhaXZlclxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgZ2V0RGV2TW9kZVdhaXZlckRldk1vZGVXYWl2ZXJHZXQob3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZyk6IFByb21pc2U8KGF4aW9zPzogQXhpb3NJbnN0YW5jZSwgYmFzZVBhdGg/OiBzdHJpbmcpID0+IEF4aW9zUHJvbWlzZTxEZXZNb2RlV2FpdmVyPj4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJBeGlvc0FyZ3MgPSBhd2FpdCBsb2NhbFZhckF4aW9zUGFyYW1DcmVhdG9yLmdldERldk1vZGVXYWl2ZXJEZXZNb2RlV2FpdmVyR2V0KG9wdGlvbnMpO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleCA9IGNvbmZpZ3VyYXRpb24/LnNlcnZlckluZGV4ID8/IDA7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoID0gb3BlcmF0aW9uU2VydmVyTWFwWydEZXZNb2RlQXBpLmdldERldk1vZGVXYWl2ZXJEZXZNb2RlV2FpdmVyR2V0J10/Lltsb2NhbFZhck9wZXJhdGlvblNlcnZlckluZGV4XT8udXJsO1xuICAgICAgICAgICAgcmV0dXJuIChheGlvcywgYmFzZVBhdGgpID0+IGNyZWF0ZVJlcXVlc3RGdW5jdGlvbihsb2NhbFZhckF4aW9zQXJncywgZ2xvYmFsQXhpb3MsIEJBU0VfUEFUSCwgY29uZmlndXJhdGlvbikoYXhpb3MsIGxvY2FsVmFyT3BlcmF0aW9uU2VydmVyQmFzZVBhdGggfHwgYmFzZVBhdGgpO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogQ3JlYXRlIGEgdGltZXN0YW1wZWQgYmFja3VwIG9mIHRoZSBjdXJyZW50IGRldi1tb2RlIHdvcmtpbmcgZGlyZWN0b3J5LiBPbmx5IHZhbGlkIHdoaWxlIGRldiBtb2RlIGlzIGVuYWJsZWQuXG4gICAgICAgICAqIEBzdW1tYXJ5IE1hbnVhbCBCYWNrdXBcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIG1hbnVhbEJhY2t1cERldk1vZGVCYWNrdXBQb3N0KG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpOiBQcm9taXNlPChheGlvcz86IEF4aW9zSW5zdGFuY2UsIGJhc2VQYXRoPzogc3RyaW5nKSA9PiBBeGlvc1Byb21pc2U8YW55Pj4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJBeGlvc0FyZ3MgPSBhd2FpdCBsb2NhbFZhckF4aW9zUGFyYW1DcmVhdG9yLm1hbnVhbEJhY2t1cERldk1vZGVCYWNrdXBQb3N0KG9wdGlvbnMpO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleCA9IGNvbmZpZ3VyYXRpb24/LnNlcnZlckluZGV4ID8/IDA7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoID0gb3BlcmF0aW9uU2VydmVyTWFwWydEZXZNb2RlQXBpLm1hbnVhbEJhY2t1cERldk1vZGVCYWNrdXBQb3N0J10/Lltsb2NhbFZhck9wZXJhdGlvblNlcnZlckluZGV4XT8udXJsO1xuICAgICAgICAgICAgcmV0dXJuIChheGlvcywgYmFzZVBhdGgpID0+IGNyZWF0ZVJlcXVlc3RGdW5jdGlvbihsb2NhbFZhckF4aW9zQXJncywgZ2xvYmFsQXhpb3MsIEJBU0VfUEFUSCwgY29uZmlndXJhdGlvbikoYXhpb3MsIGxvY2FsVmFyT3BlcmF0aW9uU2VydmVyQmFzZVBhdGggfHwgYmFzZVBhdGgpO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogQXNrIHRoZSBvcGVyYXRvciwgYXQgdGhlIHByaW50ZXIsIHRvIGNvbmZpcm0gZW50ZXJpbmcgRGV2ZWxvcGVyIE1vZGUuICBSZXR1cm5zIGEgc2hvcnQtbGl2ZWQgc2luZ2xlLXVzZSBjaGFsbGVuZ2UgaWQuIFJlZGVlbSBpdCBieSBwYXNzaW5nIGBjaGFsbGVuZ2VfaWRgIHRvIGBQT1NUIC9kZXZfbW9kZSB7XFxcImVuYWJsZWRcXFwiOiB0cnVlfWAgb25jZSB0aGUgb3BlcmF0b3IgaGFzIGNvbmZpcm1lZCBvbiB0aGUgaGFyZHdhcmUuIE5vdGhpbmcgYWJvdXQgdGhlIHByaW50ZXIgY2hhbmdlcyBoZXJlLlxuICAgICAgICAgKiBAc3VtbWFyeSBPcGVuIERldiBNb2RlIENvbnNlbnRcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIG9wZW5EZXZNb2RlQ29uc2VudERldk1vZGVDb25zZW50UG9zdChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogUHJvbWlzZTwoYXhpb3M/OiBBeGlvc0luc3RhbmNlLCBiYXNlUGF0aD86IHN0cmluZykgPT4gQXhpb3NQcm9taXNlPERldk1vZGVDb25zZW50Q2hhbGxlbmdlPj4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJBeGlvc0FyZ3MgPSBhd2FpdCBsb2NhbFZhckF4aW9zUGFyYW1DcmVhdG9yLm9wZW5EZXZNb2RlQ29uc2VudERldk1vZGVDb25zZW50UG9zdChvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXggPSBjb25maWd1cmF0aW9uPy5zZXJ2ZXJJbmRleCA/PyAwO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCA9IG9wZXJhdGlvblNlcnZlck1hcFsnRGV2TW9kZUFwaS5vcGVuRGV2TW9kZUNvbnNlbnREZXZNb2RlQ29uc2VudFBvc3QnXT8uW2xvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXhdPy51cmw7XG4gICAgICAgICAgICByZXR1cm4gKGF4aW9zLCBiYXNlUGF0aCkgPT4gY3JlYXRlUmVxdWVzdEZ1bmN0aW9uKGxvY2FsVmFyQXhpb3NBcmdzLCBnbG9iYWxBeGlvcywgQkFTRV9QQVRILCBjb25maWd1cmF0aW9uKShheGlvcywgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCB8fCBiYXNlUGF0aCk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZWZyZXNoIHRoZSBkZXZlbG9wZXItbW9kZSB3b3JraW5nIGNvcHkgZnJvbSBPRU0gY29yZS4gT25seSB2YWxpZCB3aGlsZSBkZXYgbW9kZSBpcyBlbmFibGVkLiAgU3RlcHM6ICAgKiBiYWNrdXAgREVWX01PREVfRElSIHRvIGJhY2t1cHMvPHRpbWVzdGFtcD4gKGV4Y2x1ZGluZyBiYWNrdXBzKSAgICogY2xlYXIgREVWX01PREVfRElSIGV4Y2VwdCBcXCdiYWNrdXBzXFwnICAgKiBjb3B5IE9FTV9DT1JFX0RJUiBpbnRvIERFVl9NT0RFX0RJUlxuICAgICAgICAgKiBAc3VtbWFyeSBSZWZyZXNoIERldiBNb2RlIENvbmZpZ1xuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgcmVmcmVzaERldk1vZGVDb25maWdEZXZNb2RlUmVmcmVzaFBvc3Qob3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZyk6IFByb21pc2U8KGF4aW9zPzogQXhpb3NJbnN0YW5jZSwgYmFzZVBhdGg/OiBzdHJpbmcpID0+IEF4aW9zUHJvbWlzZTxhbnk+PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckF4aW9zQXJncyA9IGF3YWl0IGxvY2FsVmFyQXhpb3NQYXJhbUNyZWF0b3IucmVmcmVzaERldk1vZGVDb25maWdEZXZNb2RlUmVmcmVzaFBvc3Qob3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckluZGV4ID0gY29uZmlndXJhdGlvbj8uc2VydmVySW5kZXggPz8gMDtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVyQmFzZVBhdGggPSBvcGVyYXRpb25TZXJ2ZXJNYXBbJ0Rldk1vZGVBcGkucmVmcmVzaERldk1vZGVDb25maWdEZXZNb2RlUmVmcmVzaFBvc3QnXT8uW2xvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXhdPy51cmw7XG4gICAgICAgICAgICByZXR1cm4gKGF4aW9zLCBiYXNlUGF0aCkgPT4gY3JlYXRlUmVxdWVzdEZ1bmN0aW9uKGxvY2FsVmFyQXhpb3NBcmdzLCBnbG9iYWxBeGlvcywgQkFTRV9QQVRILCBjb25maWd1cmF0aW9uKShheGlvcywgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCB8fCBiYXNlUGF0aCk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFbmFibGUvZGlzYWJsZSBEZXZlbG9wZXIgTW9kZS4gIC0gdHJ1ZSBmcm9tIGZhbHNlIChyZXF1aXJlcyBwaHlzaWNhbCBjb25maXJtYXRpb24sIHNlZSBkZXZfbW9kZV9jb25zZW50KTogICAgICogcmVkZWVtIHRoZSBvcGVyYXRvclxcJ3MgY29uZmlybWF0aW9uIGNoYWxsZW5nZSAgICAgKiBkdXJhYmx5IHJlY29yZCB0aGUgZW50cnkgKGZhaWxzIGNsb3NlZCwgc2VlIGRldl9tb2RlX3JlY29yZCkgICAgICogYmFja3VwIGV4aXN0aW5nIERFVl9NT0RFX0RJUiBpZiBpdCBleGlzdHMgICAgICogcmVmcmVzaCBERVZfTU9ERV9ESVIgZnJvbSBPRU1fQ09SRV9ESVIgICAgICogc2V0IENPUkVfQ0ZHIHRvIERFVl9NT0RFX0NPUkVfQ0ZHICAgICAqIHJlc3RhcnQga2xpcHBlciAtIGZhbHNlIGZyb20gdHJ1ZSAoZGVsaWJlcmF0ZWx5IHVuZ2F0ZWQpOiAgICAgKiBzZXQgQ09SRV9DRkcgdG8gT0VNX0NPUkVfQ0ZHICAgICAqIHJlc3RhcnQga2xpcHBlciAtIG5vIHN0YXRlIGNoYW5nZTogbm8tb3AgIE9ubHkgdGhlIGVuYWJsZSBkaXJlY3Rpb24gaXMgZ2F0ZWQuIEVuYWJsaW5nIHB1dHMgb3BlcmF0b3Itc3VwcGxpZWQgY29uZmlnIGluIGNoYXJnZSBvZiB0aGUgaGVhdGVyczsgZGlzYWJsaW5nIHB1dHMgdGhlIE9FTSBjb25maWcgYmFjay4gR2V0dGluZyAqb3V0KiBvZiBEZXZlbG9wZXIgTW9kZSBtdXN0IG5vdCBkZXBlbmQgb24gYSB3b3JraW5nIGtub2IsIGEgcmVhY2hhYmxlIG9wZXJhdG9yLCBvciBhbiBhdHRhY2tlclxcJ3MgY29vcGVyYXRpb24sIHNvIHJlY292ZXJ5IHN0YXlzIGEgcGxhaW4gdW5jb25kaXRpb25hbCBjYWxsLlxuICAgICAgICAgKiBAc3VtbWFyeSBTZXQgRGV2IE1vZGVcbiAgICAgICAgICogQHBhcmFtIHtEZXZNb2RlVG9nZ2xlfSBkZXZNb2RlVG9nZ2xlIFxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgc2V0RGV2TW9kZURldk1vZGVQb3N0KGRldk1vZGVUb2dnbGU6IERldk1vZGVUb2dnbGUsIG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpOiBQcm9taXNlPChheGlvcz86IEF4aW9zSW5zdGFuY2UsIGJhc2VQYXRoPzogc3RyaW5nKSA9PiBBeGlvc1Byb21pc2U8RGV2TW9kZVN0YXR1cz4+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyQXhpb3NBcmdzID0gYXdhaXQgbG9jYWxWYXJBeGlvc1BhcmFtQ3JlYXRvci5zZXREZXZNb2RlRGV2TW9kZVBvc3QoZGV2TW9kZVRvZ2dsZSwgb3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckluZGV4ID0gY29uZmlndXJhdGlvbj8uc2VydmVySW5kZXggPz8gMDtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVyQmFzZVBhdGggPSBvcGVyYXRpb25TZXJ2ZXJNYXBbJ0Rldk1vZGVBcGkuc2V0RGV2TW9kZURldk1vZGVQb3N0J10/Lltsb2NhbFZhck9wZXJhdGlvblNlcnZlckluZGV4XT8udXJsO1xuICAgICAgICAgICAgcmV0dXJuIChheGlvcywgYmFzZVBhdGgpID0+IGNyZWF0ZVJlcXVlc3RGdW5jdGlvbihsb2NhbFZhckF4aW9zQXJncywgZ2xvYmFsQXhpb3MsIEJBU0VfUEFUSCwgY29uZmlndXJhdGlvbikoYXhpb3MsIGxvY2FsVmFyT3BlcmF0aW9uU2VydmVyQmFzZVBhdGggfHwgYmFzZVBhdGgpO1xuICAgICAgICB9LFxuICAgIH1cbn07XG5cbi8qKlxuICogRGV2TW9kZUFwaSAtIGZhY3RvcnkgaW50ZXJmYWNlXG4gKiBAZXhwb3J0XG4gKi9cbmV4cG9ydCBjb25zdCBEZXZNb2RlQXBpRmFjdG9yeSA9IGZ1bmN0aW9uIChjb25maWd1cmF0aW9uPzogQ29uZmlndXJhdGlvbiwgYmFzZVBhdGg/OiBzdHJpbmcsIGF4aW9zPzogQXhpb3NJbnN0YW5jZSkge1xuICAgIGNvbnN0IGxvY2FsVmFyRnAgPSBEZXZNb2RlQXBpRnAoY29uZmlndXJhdGlvbilcbiAgICByZXR1cm4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogUG9sbCB3aGV0aGVyIGEgY2hhbGxlbmdlIGhhcyBiZWVuIGNvbmZpcm1lZCBhdCB0aGUgcHJpbnRlciB5ZXQuICBSZWFkLW9ubHk6IGNvbmZpcm1pbmcgc3RpbGwgaGFzIHRvIGhhcHBlbiBvbiB0aGUgaGFyZHdhcmUsIHNvIHBvbGxpbmcgdGhpcyBjYW4gbmV2ZXIgYWR2YW5jZSB0aGUgc3RhdGUgb24gaXRzIG93bi5cbiAgICAgICAgICogQHN1bW1hcnkgR2V0IERldiBNb2RlIENvbnNlbnRcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNoYWxsZW5nZUlkIFxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0RGV2TW9kZUNvbnNlbnREZXZNb2RlQ29uc2VudENoYWxsZW5nZUlkR2V0KGNoYWxsZW5nZUlkOiBzdHJpbmcsIG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpOiBBeGlvc1Byb21pc2U8RGV2TW9kZUNvbnNlbnRTdGF0ZT4ge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsVmFyRnAuZ2V0RGV2TW9kZUNvbnNlbnREZXZNb2RlQ29uc2VudENoYWxsZW5nZUlkR2V0KGNoYWxsZW5nZUlkLCBvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KGF4aW9zLCBiYXNlUGF0aCkpO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogRGV2IG1vZGUgaXMgVFJVRSBpZiBDT1JFX0NGRyA9PSBERVZfTU9ERV9DT1JFX0NGRywgRkFMU0UgaWYgQ09SRV9DRkcgPT0gT0VNX0NPUkVfQ0ZHLCBFUlJPUiBvdGhlcndpc2UuXG4gICAgICAgICAqIEBzdW1tYXJ5IEdldCBEZXYgTW9kZSBTdGF0dXNcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIGdldERldk1vZGVTdGF0dXNEZXZNb2RlR2V0KG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpOiBBeGlvc1Byb21pc2U8RGV2TW9kZVN0YXR1cz4ge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsVmFyRnAuZ2V0RGV2TW9kZVN0YXR1c0Rldk1vZGVHZXQob3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdChheGlvcywgYmFzZVBhdGgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBleGFjdCB0ZXh0IHRoZSBwYW5lbCBtdXN0IGRpc3BsYXkgYmVmb3JlIGVuYWJsaW5nIChERVYtMikuICBTZXJ2ZWQgcmF0aGVyIHRoYW4gaGFyZC1jb2RlZCBpbiB0aGUgVUkgc28gdGhlIHdvcmRpbmcsIGFuZCB0aGUgdmVyc2lvbiB0aGUgY2xpZW50IGhhcyB0byBlY2hvIGJhY2ssIGhhdmUgb25lIGhvbWUuXG4gICAgICAgICAqIEBzdW1tYXJ5IEdldCBEZXYgTW9kZSBXYWl2ZXJcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIGdldERldk1vZGVXYWl2ZXJEZXZNb2RlV2FpdmVyR2V0KG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpOiBBeGlvc1Byb21pc2U8RGV2TW9kZVdhaXZlcj4ge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsVmFyRnAuZ2V0RGV2TW9kZVdhaXZlckRldk1vZGVXYWl2ZXJHZXQob3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdChheGlvcywgYmFzZVBhdGgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZSBhIHRpbWVzdGFtcGVkIGJhY2t1cCBvZiB0aGUgY3VycmVudCBkZXYtbW9kZSB3b3JraW5nIGRpcmVjdG9yeS4gT25seSB2YWxpZCB3aGlsZSBkZXYgbW9kZSBpcyBlbmFibGVkLlxuICAgICAgICAgKiBAc3VtbWFyeSBNYW51YWwgQmFja3VwXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBtYW51YWxCYWNrdXBEZXZNb2RlQmFja3VwUG9zdChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogQXhpb3NQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsVmFyRnAubWFudWFsQmFja3VwRGV2TW9kZUJhY2t1cFBvc3Qob3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdChheGlvcywgYmFzZVBhdGgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFzayB0aGUgb3BlcmF0b3IsIGF0IHRoZSBwcmludGVyLCB0byBjb25maXJtIGVudGVyaW5nIERldmVsb3BlciBNb2RlLiAgUmV0dXJucyBhIHNob3J0LWxpdmVkIHNpbmdsZS11c2UgY2hhbGxlbmdlIGlkLiBSZWRlZW0gaXQgYnkgcGFzc2luZyBgY2hhbGxlbmdlX2lkYCB0byBgUE9TVCAvZGV2X21vZGUge1xcXCJlbmFibGVkXFxcIjogdHJ1ZX1gIG9uY2UgdGhlIG9wZXJhdG9yIGhhcyBjb25maXJtZWQgb24gdGhlIGhhcmR3YXJlLiBOb3RoaW5nIGFib3V0IHRoZSBwcmludGVyIGNoYW5nZXMgaGVyZS5cbiAgICAgICAgICogQHN1bW1hcnkgT3BlbiBEZXYgTW9kZSBDb25zZW50XG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBvcGVuRGV2TW9kZUNvbnNlbnREZXZNb2RlQ29uc2VudFBvc3Qob3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZyk6IEF4aW9zUHJvbWlzZTxEZXZNb2RlQ29uc2VudENoYWxsZW5nZT4ge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsVmFyRnAub3BlbkRldk1vZGVDb25zZW50RGV2TW9kZUNvbnNlbnRQb3N0KG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QoYXhpb3MsIGJhc2VQYXRoKSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZWZyZXNoIHRoZSBkZXZlbG9wZXItbW9kZSB3b3JraW5nIGNvcHkgZnJvbSBPRU0gY29yZS4gT25seSB2YWxpZCB3aGlsZSBkZXYgbW9kZSBpcyBlbmFibGVkLiAgU3RlcHM6ICAgKiBiYWNrdXAgREVWX01PREVfRElSIHRvIGJhY2t1cHMvPHRpbWVzdGFtcD4gKGV4Y2x1ZGluZyBiYWNrdXBzKSAgICogY2xlYXIgREVWX01PREVfRElSIGV4Y2VwdCBcXCdiYWNrdXBzXFwnICAgKiBjb3B5IE9FTV9DT1JFX0RJUiBpbnRvIERFVl9NT0RFX0RJUlxuICAgICAgICAgKiBAc3VtbWFyeSBSZWZyZXNoIERldiBNb2RlIENvbmZpZ1xuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgcmVmcmVzaERldk1vZGVDb25maWdEZXZNb2RlUmVmcmVzaFBvc3Qob3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZyk6IEF4aW9zUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgICAgIHJldHVybiBsb2NhbFZhckZwLnJlZnJlc2hEZXZNb2RlQ29uZmlnRGV2TW9kZVJlZnJlc2hQb3N0KG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QoYXhpb3MsIGJhc2VQYXRoKSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFbmFibGUvZGlzYWJsZSBEZXZlbG9wZXIgTW9kZS4gIC0gdHJ1ZSBmcm9tIGZhbHNlIChyZXF1aXJlcyBwaHlzaWNhbCBjb25maXJtYXRpb24sIHNlZSBkZXZfbW9kZV9jb25zZW50KTogICAgICogcmVkZWVtIHRoZSBvcGVyYXRvclxcJ3MgY29uZmlybWF0aW9uIGNoYWxsZW5nZSAgICAgKiBkdXJhYmx5IHJlY29yZCB0aGUgZW50cnkgKGZhaWxzIGNsb3NlZCwgc2VlIGRldl9tb2RlX3JlY29yZCkgICAgICogYmFja3VwIGV4aXN0aW5nIERFVl9NT0RFX0RJUiBpZiBpdCBleGlzdHMgICAgICogcmVmcmVzaCBERVZfTU9ERV9ESVIgZnJvbSBPRU1fQ09SRV9ESVIgICAgICogc2V0IENPUkVfQ0ZHIHRvIERFVl9NT0RFX0NPUkVfQ0ZHICAgICAqIHJlc3RhcnQga2xpcHBlciAtIGZhbHNlIGZyb20gdHJ1ZSAoZGVsaWJlcmF0ZWx5IHVuZ2F0ZWQpOiAgICAgKiBzZXQgQ09SRV9DRkcgdG8gT0VNX0NPUkVfQ0ZHICAgICAqIHJlc3RhcnQga2xpcHBlciAtIG5vIHN0YXRlIGNoYW5nZTogbm8tb3AgIE9ubHkgdGhlIGVuYWJsZSBkaXJlY3Rpb24gaXMgZ2F0ZWQuIEVuYWJsaW5nIHB1dHMgb3BlcmF0b3Itc3VwcGxpZWQgY29uZmlnIGluIGNoYXJnZSBvZiB0aGUgaGVhdGVyczsgZGlzYWJsaW5nIHB1dHMgdGhlIE9FTSBjb25maWcgYmFjay4gR2V0dGluZyAqb3V0KiBvZiBEZXZlbG9wZXIgTW9kZSBtdXN0IG5vdCBkZXBlbmQgb24gYSB3b3JraW5nIGtub2IsIGEgcmVhY2hhYmxlIG9wZXJhdG9yLCBvciBhbiBhdHRhY2tlclxcJ3MgY29vcGVyYXRpb24sIHNvIHJlY292ZXJ5IHN0YXlzIGEgcGxhaW4gdW5jb25kaXRpb25hbCBjYWxsLlxuICAgICAgICAgKiBAc3VtbWFyeSBTZXQgRGV2IE1vZGVcbiAgICAgICAgICogQHBhcmFtIHtEZXZNb2RlVG9nZ2xlfSBkZXZNb2RlVG9nZ2xlIFxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgc2V0RGV2TW9kZURldk1vZGVQb3N0KGRldk1vZGVUb2dnbGU6IERldk1vZGVUb2dnbGUsIG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpOiBBeGlvc1Byb21pc2U8RGV2TW9kZVN0YXR1cz4ge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsVmFyRnAuc2V0RGV2TW9kZURldk1vZGVQb3N0KGRldk1vZGVUb2dnbGUsIG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QoYXhpb3MsIGJhc2VQYXRoKSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn07XG5cbi8qKlxuICogRGV2TW9kZUFwaSAtIG9iamVjdC1vcmllbnRlZCBpbnRlcmZhY2VcbiAqIEBleHBvcnRcbiAqIEBjbGFzcyBEZXZNb2RlQXBpXG4gKiBAZXh0ZW5kcyB7QmFzZUFQSX1cbiAqL1xuZXhwb3J0IGNsYXNzIERldk1vZGVBcGkgZXh0ZW5kcyBCYXNlQVBJIHtcbiAgICAvKipcbiAgICAgKiBQb2xsIHdoZXRoZXIgYSBjaGFsbGVuZ2UgaGFzIGJlZW4gY29uZmlybWVkIGF0IHRoZSBwcmludGVyIHlldC4gIFJlYWQtb25seTogY29uZmlybWluZyBzdGlsbCBoYXMgdG8gaGFwcGVuIG9uIHRoZSBoYXJkd2FyZSwgc28gcG9sbGluZyB0aGlzIGNhbiBuZXZlciBhZHZhbmNlIHRoZSBzdGF0ZSBvbiBpdHMgb3duLlxuICAgICAqIEBzdW1tYXJ5IEdldCBEZXYgTW9kZSBDb25zZW50XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNoYWxsZW5nZUlkIFxuICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgKiBAbWVtYmVyb2YgRGV2TW9kZUFwaVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXREZXZNb2RlQ29uc2VudERldk1vZGVDb25zZW50Q2hhbGxlbmdlSWRHZXQoY2hhbGxlbmdlSWQ6IHN0cmluZywgb3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZykge1xuICAgICAgICByZXR1cm4gRGV2TW9kZUFwaUZwKHRoaXMuY29uZmlndXJhdGlvbikuZ2V0RGV2TW9kZUNvbnNlbnREZXZNb2RlQ29uc2VudENoYWxsZW5nZUlkR2V0KGNoYWxsZW5nZUlkLCBvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KHRoaXMuYXhpb3MsIHRoaXMuYmFzZVBhdGgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXYgbW9kZSBpcyBUUlVFIGlmIENPUkVfQ0ZHID09IERFVl9NT0RFX0NPUkVfQ0ZHLCBGQUxTRSBpZiBDT1JFX0NGRyA9PSBPRU1fQ09SRV9DRkcsIEVSUk9SIG90aGVyd2lzZS5cbiAgICAgKiBAc3VtbWFyeSBHZXQgRGV2IE1vZGUgU3RhdHVzXG4gICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAqIEBtZW1iZXJvZiBEZXZNb2RlQXBpXG4gICAgICovXG4gICAgcHVibGljIGdldERldk1vZGVTdGF0dXNEZXZNb2RlR2V0KG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpIHtcbiAgICAgICAgcmV0dXJuIERldk1vZGVBcGlGcCh0aGlzLmNvbmZpZ3VyYXRpb24pLmdldERldk1vZGVTdGF0dXNEZXZNb2RlR2V0KG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QodGhpcy5heGlvcywgdGhpcy5iYXNlUGF0aCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBleGFjdCB0ZXh0IHRoZSBwYW5lbCBtdXN0IGRpc3BsYXkgYmVmb3JlIGVuYWJsaW5nIChERVYtMikuICBTZXJ2ZWQgcmF0aGVyIHRoYW4gaGFyZC1jb2RlZCBpbiB0aGUgVUkgc28gdGhlIHdvcmRpbmcsIGFuZCB0aGUgdmVyc2lvbiB0aGUgY2xpZW50IGhhcyB0byBlY2hvIGJhY2ssIGhhdmUgb25lIGhvbWUuXG4gICAgICogQHN1bW1hcnkgR2V0IERldiBNb2RlIFdhaXZlclxuICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgKiBAbWVtYmVyb2YgRGV2TW9kZUFwaVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXREZXZNb2RlV2FpdmVyRGV2TW9kZVdhaXZlckdldChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKSB7XG4gICAgICAgIHJldHVybiBEZXZNb2RlQXBpRnAodGhpcy5jb25maWd1cmF0aW9uKS5nZXREZXZNb2RlV2FpdmVyRGV2TW9kZVdhaXZlckdldChvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KHRoaXMuYXhpb3MsIHRoaXMuYmFzZVBhdGgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSB0aW1lc3RhbXBlZCBiYWNrdXAgb2YgdGhlIGN1cnJlbnQgZGV2LW1vZGUgd29ya2luZyBkaXJlY3RvcnkuIE9ubHkgdmFsaWQgd2hpbGUgZGV2IG1vZGUgaXMgZW5hYmxlZC5cbiAgICAgKiBAc3VtbWFyeSBNYW51YWwgQmFja3VwXG4gICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAqIEBtZW1iZXJvZiBEZXZNb2RlQXBpXG4gICAgICovXG4gICAgcHVibGljIG1hbnVhbEJhY2t1cERldk1vZGVCYWNrdXBQb3N0KG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpIHtcbiAgICAgICAgcmV0dXJuIERldk1vZGVBcGlGcCh0aGlzLmNvbmZpZ3VyYXRpb24pLm1hbnVhbEJhY2t1cERldk1vZGVCYWNrdXBQb3N0KG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QodGhpcy5heGlvcywgdGhpcy5iYXNlUGF0aCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFzayB0aGUgb3BlcmF0b3IsIGF0IHRoZSBwcmludGVyLCB0byBjb25maXJtIGVudGVyaW5nIERldmVsb3BlciBNb2RlLiAgUmV0dXJucyBhIHNob3J0LWxpdmVkIHNpbmdsZS11c2UgY2hhbGxlbmdlIGlkLiBSZWRlZW0gaXQgYnkgcGFzc2luZyBgY2hhbGxlbmdlX2lkYCB0byBgUE9TVCAvZGV2X21vZGUge1xcXCJlbmFibGVkXFxcIjogdHJ1ZX1gIG9uY2UgdGhlIG9wZXJhdG9yIGhhcyBjb25maXJtZWQgb24gdGhlIGhhcmR3YXJlLiBOb3RoaW5nIGFib3V0IHRoZSBwcmludGVyIGNoYW5nZXMgaGVyZS5cbiAgICAgKiBAc3VtbWFyeSBPcGVuIERldiBNb2RlIENvbnNlbnRcbiAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICogQG1lbWJlcm9mIERldk1vZGVBcGlcbiAgICAgKi9cbiAgICBwdWJsaWMgb3BlbkRldk1vZGVDb25zZW50RGV2TW9kZUNvbnNlbnRQb3N0KG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpIHtcbiAgICAgICAgcmV0dXJuIERldk1vZGVBcGlGcCh0aGlzLmNvbmZpZ3VyYXRpb24pLm9wZW5EZXZNb2RlQ29uc2VudERldk1vZGVDb25zZW50UG9zdChvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KHRoaXMuYXhpb3MsIHRoaXMuYmFzZVBhdGgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWZyZXNoIHRoZSBkZXZlbG9wZXItbW9kZSB3b3JraW5nIGNvcHkgZnJvbSBPRU0gY29yZS4gT25seSB2YWxpZCB3aGlsZSBkZXYgbW9kZSBpcyBlbmFibGVkLiAgU3RlcHM6ICAgKiBiYWNrdXAgREVWX01PREVfRElSIHRvIGJhY2t1cHMvPHRpbWVzdGFtcD4gKGV4Y2x1ZGluZyBiYWNrdXBzKSAgICogY2xlYXIgREVWX01PREVfRElSIGV4Y2VwdCBcXCdiYWNrdXBzXFwnICAgKiBjb3B5IE9FTV9DT1JFX0RJUiBpbnRvIERFVl9NT0RFX0RJUlxuICAgICAqIEBzdW1tYXJ5IFJlZnJlc2ggRGV2IE1vZGUgQ29uZmlnXG4gICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAqIEBtZW1iZXJvZiBEZXZNb2RlQXBpXG4gICAgICovXG4gICAgcHVibGljIHJlZnJlc2hEZXZNb2RlQ29uZmlnRGV2TW9kZVJlZnJlc2hQb3N0KG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpIHtcbiAgICAgICAgcmV0dXJuIERldk1vZGVBcGlGcCh0aGlzLmNvbmZpZ3VyYXRpb24pLnJlZnJlc2hEZXZNb2RlQ29uZmlnRGV2TW9kZVJlZnJlc2hQb3N0KG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QodGhpcy5heGlvcywgdGhpcy5iYXNlUGF0aCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuYWJsZS9kaXNhYmxlIERldmVsb3BlciBNb2RlLiAgLSB0cnVlIGZyb20gZmFsc2UgKHJlcXVpcmVzIHBoeXNpY2FsIGNvbmZpcm1hdGlvbiwgc2VlIGRldl9tb2RlX2NvbnNlbnQpOiAgICAgKiByZWRlZW0gdGhlIG9wZXJhdG9yXFwncyBjb25maXJtYXRpb24gY2hhbGxlbmdlICAgICAqIGR1cmFibHkgcmVjb3JkIHRoZSBlbnRyeSAoZmFpbHMgY2xvc2VkLCBzZWUgZGV2X21vZGVfcmVjb3JkKSAgICAgKiBiYWNrdXAgZXhpc3RpbmcgREVWX01PREVfRElSIGlmIGl0IGV4aXN0cyAgICAgKiByZWZyZXNoIERFVl9NT0RFX0RJUiBmcm9tIE9FTV9DT1JFX0RJUiAgICAgKiBzZXQgQ09SRV9DRkcgdG8gREVWX01PREVfQ09SRV9DRkcgICAgICogcmVzdGFydCBrbGlwcGVyIC0gZmFsc2UgZnJvbSB0cnVlIChkZWxpYmVyYXRlbHkgdW5nYXRlZCk6ICAgICAqIHNldCBDT1JFX0NGRyB0byBPRU1fQ09SRV9DRkcgICAgICogcmVzdGFydCBrbGlwcGVyIC0gbm8gc3RhdGUgY2hhbmdlOiBuby1vcCAgT25seSB0aGUgZW5hYmxlIGRpcmVjdGlvbiBpcyBnYXRlZC4gRW5hYmxpbmcgcHV0cyBvcGVyYXRvci1zdXBwbGllZCBjb25maWcgaW4gY2hhcmdlIG9mIHRoZSBoZWF0ZXJzOyBkaXNhYmxpbmcgcHV0cyB0aGUgT0VNIGNvbmZpZyBiYWNrLiBHZXR0aW5nICpvdXQqIG9mIERldmVsb3BlciBNb2RlIG11c3Qgbm90IGRlcGVuZCBvbiBhIHdvcmtpbmcga25vYiwgYSByZWFjaGFibGUgb3BlcmF0b3IsIG9yIGFuIGF0dGFja2VyXFwncyBjb29wZXJhdGlvbiwgc28gcmVjb3Zlcnkgc3RheXMgYSBwbGFpbiB1bmNvbmRpdGlvbmFsIGNhbGwuXG4gICAgICogQHN1bW1hcnkgU2V0IERldiBNb2RlXG4gICAgICogQHBhcmFtIHtEZXZNb2RlVG9nZ2xlfSBkZXZNb2RlVG9nZ2xlIFxuICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgKiBAbWVtYmVyb2YgRGV2TW9kZUFwaVxuICAgICAqL1xuICAgIHB1YmxpYyBzZXREZXZNb2RlRGV2TW9kZVBvc3QoZGV2TW9kZVRvZ2dsZTogRGV2TW9kZVRvZ2dsZSwgb3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZykge1xuICAgICAgICByZXR1cm4gRGV2TW9kZUFwaUZwKHRoaXMuY29uZmlndXJhdGlvbikuc2V0RGV2TW9kZURldk1vZGVQb3N0KGRldk1vZGVUb2dnbGUsIG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QodGhpcy5heGlvcywgdGhpcy5iYXNlUGF0aCkpO1xuICAgIH1cbn1cblxuIl0sIm1hcHBpbmdzIjoiQUFpQkEsT0FBTyxpQkFBaUI7QUFHeEIsU0FBUyxnQkFBZ0IsbUJBQW1CLG1CQUFtQixzQkFBc0IsdUJBQXVCLGtCQUFrQixpQkFBaUIsdUJBQXVCLGNBQWMsNkJBQTZCO0FBRWpOLFNBQVMsV0FBVyxvQkFBc0MsU0FBUyxlQUFlLDBCQUEwQjtBQWlCckcsYUFBTSw4QkFBOEIsU0FBVSxlQUErQjtBQUNoRixTQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVFILCtDQUErQyxPQUFPLGFBQXFCLFVBQWlDLENBQUMsTUFBNEI7QUFFckksd0JBQWtCLGlEQUFpRCxlQUFlLFdBQVc7QUFDN0YsWUFBTSxlQUFlLG1DQUNoQixRQUFRLElBQUksY0FBYyxLQUFLLG1CQUFtQixPQUFPLFdBQVcsQ0FBQyxDQUFDO0FBRTNFLFlBQU0saUJBQWlCLElBQUksSUFBSSxjQUFjLGNBQWM7QUFDM0QsVUFBSTtBQUNKLFVBQUksZUFBZTtBQUNmLHNCQUFjLGNBQWM7QUFBQSxNQUNoQztBQUVBLFlBQU0seUJBQXlCLEVBQUUsUUFBUSxPQUFPLEdBQUcsYUFBYSxHQUFHLFFBQU87QUFDMUUsWUFBTSwwQkFBMEIsQ0FBQztBQUNqQyxZQUFNLHlCQUF5QixDQUFDO0FBR2hDLFlBQU0sa0JBQWtCLHlCQUF5Qixp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