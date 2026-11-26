import globalAxios from "/.vite-e2e/4291/deps/axios.js?v=9b9fafc7";
import { DUMMY_BASE_URL, assertParamExists, setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, setSearchParams, serializeDataIfNeeded, toPathString, createRequestFunction } from "/src/aux_api/common.ts";
import { BASE_PATH, COLLECTION_FORMATS, BaseAPI, RequiredError, operationServerMap } from "/src/aux_api/base.ts";
export const UpdateApiAxiosParamCreator = function(configuration) {
  return {
    /**
     * Trigger a check for updates from server.
     * @summary Ota Check
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    otaCheckUpdateCheckServerPost: async (options = {}) => {
      const localVarPath = `/update/check_server`;
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
     * Commit to the installed update.
     * @summary Ota Commit
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    otaCommitUpdateCommitPost: async (options = {}) => {
      const localVarPath = `/update/commit`;
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
     * @summary Ota Set Progress
     * @param {OTASetProgressRequest} oTASetProgressRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    otaSetProgressUpdateSetProgressPost: async (oTASetProgressRequest, options = {}) => {
      assertParamExists("otaSetProgressUpdateSetProgressPost", "oTASetProgressRequest", oTASetProgressRequest);
      const localVarPath = `/update/set-progress`;
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
      localVarRequestOptions.data = serializeDataIfNeeded(oTASetProgressRequest, localVarRequestOptions, configuration);
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * 
     * @summary Ota Start
     * @param {OTAStartRequest} oTAStartRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    otaStartUpdateStartPost: async (oTAStartRequest, options = {}) => {
      assertParamExists("otaStartUpdateStartPost", "oTAStartRequest", oTAStartRequest);
      const localVarPath = `/update/start`;
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
      localVarRequestOptions.data = serializeDataIfNeeded(oTAStartRequest, localVarRequestOptions, configuration);
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * Get the current status of the OTA update service.
     * @summary Ota Status
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    otaStatusUpdateStatusGet: async (options = {}) => {
      const localVarPath = `/update/status`;
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
     * 
     * @summary Ota Verify And Commit
     * @param {VerifyRequest} [verifyRequest] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    otaVerifyAndCommitUpdateVerifyAndCommitPost: async (verifyRequest, options = {}) => {
      const localVarPath = `/update/verify-and-commit`;
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
      localVarRequestOptions.data = serializeDataIfNeeded(verifyRequest, localVarRequestOptions, configuration);
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * 
     * @summary Ota Verify And Commit
     * @param {VerifyRequest} [verifyRequest] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    otaVerifyAndCommitUpdateVerifyAndCommitPost_1: async (verifyRequest, options = {}) => {
      const localVarPath = `/update/verify-and-commit`;
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
      localVarRequestOptions.data = serializeDataIfNeeded(verifyRequest, localVarRequestOptions, configuration);
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * 
     * @summary Ota Verify
     * @param {VerifyRequest} [verifyRequest] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    otaVerifyUpdateVerifyPost: async (verifyRequest, options = {}) => {
      const localVarPath = `/update/verify`;
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
      localVarRequestOptions.data = serializeDataIfNeeded(verifyRequest, localVarRequestOptions, configuration);
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    },
    /**
     * 
     * @summary Ota Verify
     * @param {VerifyRequest} [verifyRequest] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    otaVerifyUpdateVerifyPost_2: async (verifyRequest, options = {}) => {
      const localVarPath = `/update/verify`;
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
      localVarRequestOptions.data = serializeDataIfNeeded(verifyRequest, localVarRequestOptions, configuration);
      return {
        url: toPathString(localVarUrlObj),
        options: localVarRequestOptions
      };
    }
  };
};
export const UpdateApiFp = function(configuration) {
  const localVarAxiosParamCreator = UpdateApiAxiosParamCreator(configuration);
  return {
    /**
     * Trigger a check for updates from server.
     * @summary Ota Check
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async otaCheckUpdateCheckServerPost(options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.otaCheckUpdateCheckServerPost(options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["UpdateApi.otaCheckUpdateCheckServerPost"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Commit to the installed update.
     * @summary Ota Commit
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async otaCommitUpdateCommitPost(options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.otaCommitUpdateCommitPost(options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["UpdateApi.otaCommitUpdateCommitPost"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * 
     * @summary Ota Set Progress
     * @param {OTASetProgressRequest} oTASetProgressRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async otaSetProgressUpdateSetProgressPost(oTASetProgressRequest, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.otaSetProgressUpdateSetProgressPost(oTASetProgressRequest, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["UpdateApi.otaSetProgressUpdateSetProgressPost"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * 
     * @summary Ota Start
     * @param {OTAStartRequest} oTAStartRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async otaStartUpdateStartPost(oTAStartRequest, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.otaStartUpdateStartPost(oTAStartRequest, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["UpdateApi.otaStartUpdateStartPost"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * Get the current status of the OTA update service.
     * @summary Ota Status
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async otaStatusUpdateStatusGet(options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.otaStatusUpdateStatusGet(options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["UpdateApi.otaStatusUpdateStatusGet"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * 
     * @summary Ota Verify And Commit
     * @param {VerifyRequest} [verifyRequest] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async otaVerifyAndCommitUpdateVerifyAndCommitPost(verifyRequest, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.otaVerifyAndCommitUpdateVerifyAndCommitPost(verifyRequest, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["UpdateApi.otaVerifyAndCommitUpdateVerifyAndCommitPost"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * 
     * @summary Ota Verify And Commit
     * @param {VerifyRequest} [verifyRequest] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async otaVerifyAndCommitUpdateVerifyAndCommitPost_1(verifyRequest, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.otaVerifyAndCommitUpdateVerifyAndCommitPost_1(verifyRequest, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["UpdateApi.otaVerifyAndCommitUpdateVerifyAndCommitPost_1"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * 
     * @summary Ota Verify
     * @param {VerifyRequest} [verifyRequest] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async otaVerifyUpdateVerifyPost(verifyRequest, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.otaVerifyUpdateVerifyPost(verifyRequest, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["UpdateApi.otaVerifyUpdateVerifyPost"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    },
    /**
     * 
     * @summary Ota Verify
     * @param {VerifyRequest} [verifyRequest] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async otaVerifyUpdateVerifyPost_2(verifyRequest, options) {
      const localVarAxiosArgs = await localVarAxiosParamCreator.otaVerifyUpdateVerifyPost_2(verifyRequest, options);
      const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
      const localVarOperationServerBasePath = operationServerMap["UpdateApi.otaVerifyUpdateVerifyPost_2"]?.[localVarOperationServerIndex]?.url;
      return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
    }
  };
};
export const UpdateApiFactory = function(configuration, basePath, axios) {
  const localVarFp = UpdateApiFp(configuration);
  return {
    /**
     * Trigger a check for updates from server.
     * @summary Ota Check
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    otaCheckUpdateCheckServerPost(options) {
      return localVarFp.otaCheckUpdateCheckServerPost(options).then((request) => request(axios, basePath));
    },
    /**
     * Commit to the installed update.
     * @summary Ota Commit
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    otaCommitUpdateCommitPost(options) {
      return localVarFp.otaCommitUpdateCommitPost(options).then((request) => request(axios, basePath));
    },
    /**
     * 
     * @summary Ota Set Progress
     * @param {OTASetProgressRequest} oTASetProgressRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    otaSetProgressUpdateSetProgressPost(oTASetProgressRequest, options) {
      return localVarFp.otaSetProgressUpdateSetProgressPost(oTASetProgressRequest, options).then((request) => request(axios, basePath));
    },
    /**
     * 
     * @summary Ota Start
     * @param {OTAStartRequest} oTAStartRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    otaStartUpdateStartPost(oTAStartRequest, options) {
      return localVarFp.otaStartUpdateStartPost(oTAStartRequest, options).then((request) => request(axios, basePath));
    },
    /**
     * Get the current status of the OTA update service.
     * @summary Ota Status
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    otaStatusUpdateStatusGet(options) {
      return localVarFp.otaStatusUpdateStatusGet(options).then((request) => request(axios, basePath));
    },
    /**
     * 
     * @summary Ota Verify And Commit
     * @param {VerifyRequest} [verifyRequest] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    otaVerifyAndCommitUpdateVerifyAndCommitPost(verifyRequest, options) {
      return localVarFp.otaVerifyAndCommitUpdateVerifyAndCommitPost(verifyRequest, options).then((request) => request(axios, basePath));
    },
    /**
     * 
     * @summary Ota Verify And Commit
     * @param {VerifyRequest} [verifyRequest] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    otaVerifyAndCommitUpdateVerifyAndCommitPost_1(verifyRequest, options) {
      return localVarFp.otaVerifyAndCommitUpdateVerifyAndCommitPost_1(verifyRequest, options).then((request) => request(axios, basePath));
    },
    /**
     * 
     * @summary Ota Verify
     * @param {VerifyRequest} [verifyRequest] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    otaVerifyUpdateVerifyPost(verifyRequest, options) {
      return localVarFp.otaVerifyUpdateVerifyPost(verifyRequest, options).then((request) => request(axios, basePath));
    },
    /**
     * 
     * @summary Ota Verify
     * @param {VerifyRequest} [verifyRequest] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    otaVerifyUpdateVerifyPost_2(verifyRequest, options) {
      return localVarFp.otaVerifyUpdateVerifyPost_2(verifyRequest, options).then((request) => request(axios, basePath));
    }
  };
};
export class UpdateApi extends BaseAPI {
  /**
   * Trigger a check for updates from server.
   * @summary Ota Check
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof UpdateApi
   */
  otaCheckUpdateCheckServerPost(options) {
    return UpdateApiFp(this.configuration).otaCheckUpdateCheckServerPost(options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Commit to the installed update.
   * @summary Ota Commit
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof UpdateApi
   */
  otaCommitUpdateCommitPost(options) {
    return UpdateApiFp(this.configuration).otaCommitUpdateCommitPost(options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * 
   * @summary Ota Set Progress
   * @param {OTASetProgressRequest} oTASetProgressRequest 
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof UpdateApi
   */
  otaSetProgressUpdateSetProgressPost(oTASetProgressRequest, options) {
    return UpdateApiFp(this.configuration).otaSetProgressUpdateSetProgressPost(oTASetProgressRequest, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * 
   * @summary Ota Start
   * @param {OTAStartRequest} oTAStartRequest 
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof UpdateApi
   */
  otaStartUpdateStartPost(oTAStartRequest, options) {
    return UpdateApiFp(this.configuration).otaStartUpdateStartPost(oTAStartRequest, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * Get the current status of the OTA update service.
   * @summary Ota Status
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof UpdateApi
   */
  otaStatusUpdateStatusGet(options) {
    return UpdateApiFp(this.configuration).otaStatusUpdateStatusGet(options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * 
   * @summary Ota Verify And Commit
   * @param {VerifyRequest} [verifyRequest] 
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof UpdateApi
   */
  otaVerifyAndCommitUpdateVerifyAndCommitPost(verifyRequest, options) {
    return UpdateApiFp(this.configuration).otaVerifyAndCommitUpdateVerifyAndCommitPost(verifyRequest, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * 
   * @summary Ota Verify And Commit
   * @param {VerifyRequest} [verifyRequest] 
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof UpdateApi
   */
  otaVerifyAndCommitUpdateVerifyAndCommitPost_1(verifyRequest, options) {
    return UpdateApiFp(this.configuration).otaVerifyAndCommitUpdateVerifyAndCommitPost_1(verifyRequest, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * 
   * @summary Ota Verify
   * @param {VerifyRequest} [verifyRequest] 
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof UpdateApi
   */
  otaVerifyUpdateVerifyPost(verifyRequest, options) {
    return UpdateApiFp(this.configuration).otaVerifyUpdateVerifyPost(verifyRequest, options).then((request) => request(this.axios, this.basePath));
  }
  /**
   * 
   * @summary Ota Verify
   * @param {VerifyRequest} [verifyRequest] 
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof UpdateApi
   */
  otaVerifyUpdateVerifyPost_2(verifyRequest, options) {
    return UpdateApiFp(this.configuration).otaVerifyUpdateVerifyPost_2(verifyRequest, options).then((request) => request(this.axios, this.basePath));
  }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVwZGF0ZS1hcGkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogdHNsaW50OmRpc2FibGUgKi9cbi8qIGVzbGludC1kaXNhYmxlICovXG4vKipcbiAqIFNtYXJ0S25vYiBBVVggSFRUUCBBUElcbiAqIE5vIGRlc2NyaXB0aW9uIHByb3ZpZGVkIChnZW5lcmF0ZWQgYnkgT3BlbmFwaSBHZW5lcmF0b3IgaHR0cHM6Ly9naXRodWIuY29tL29wZW5hcGl0b29scy9vcGVuYXBpLWdlbmVyYXRvcilcbiAqXG4gKiBUaGUgdmVyc2lvbiBvZiB0aGUgT3BlbkFQSSBkb2N1bWVudDogMC4xLjBcbiAqIFxuICpcbiAqIE5PVEU6IFRoaXMgY2xhc3MgaXMgYXV0byBnZW5lcmF0ZWQgYnkgT3BlbkFQSSBHZW5lcmF0b3IgKGh0dHBzOi8vb3BlbmFwaS1nZW5lcmF0b3IudGVjaCkuXG4gKiBodHRwczovL29wZW5hcGktZ2VuZXJhdG9yLnRlY2hcbiAqIERvIG5vdCBlZGl0IHRoZSBjbGFzcyBtYW51YWxseS5cbiAqL1xuXG5cbmltcG9ydCB0eXBlIHsgQ29uZmlndXJhdGlvbiB9IGZyb20gJy4uL2NvbmZpZ3VyYXRpb24nO1xuaW1wb3J0IHR5cGUgeyBBeGlvc1Byb21pc2UsIEF4aW9zSW5zdGFuY2UsIFJhd0F4aW9zUmVxdWVzdENvbmZpZyB9IGZyb20gJ2F4aW9zJztcbmltcG9ydCBnbG9iYWxBeGlvcyBmcm9tICdheGlvcyc7XG4vLyBTb21lIGltcG9ydHMgbm90IHVzZWQgZGVwZW5kaW5nIG9uIHRlbXBsYXRlIGNvbmRpdGlvbnNcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCB7IERVTU1ZX0JBU0VfVVJMLCBhc3NlcnRQYXJhbUV4aXN0cywgc2V0QXBpS2V5VG9PYmplY3QsIHNldEJhc2ljQXV0aFRvT2JqZWN0LCBzZXRCZWFyZXJBdXRoVG9PYmplY3QsIHNldE9BdXRoVG9PYmplY3QsIHNldFNlYXJjaFBhcmFtcywgc2VyaWFsaXplRGF0YUlmTmVlZGVkLCB0b1BhdGhTdHJpbmcsIGNyZWF0ZVJlcXVlc3RGdW5jdGlvbiB9IGZyb20gJy4uL2NvbW1vbic7XG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgeyBCQVNFX1BBVEgsIENPTExFQ1RJT05fRk9STUFUUywgdHlwZSBSZXF1ZXN0QXJncywgQmFzZUFQSSwgUmVxdWlyZWRFcnJvciwgb3BlcmF0aW9uU2VydmVyTWFwIH0gZnJvbSAnLi4vYmFzZSc7XG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgdHlwZSB7IEhUVFBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuLi9tb2RlbHMnO1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IHR5cGUgeyBPVEFTZXRQcm9ncmVzc1JlcXVlc3QgfSBmcm9tICcuLi9tb2RlbHMnO1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IHR5cGUgeyBPVEFTdGFydFJlcXVlc3QgfSBmcm9tICcuLi9tb2RlbHMnO1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IHR5cGUgeyBPVEFTdGF0dXMgfSBmcm9tICcuLi9tb2RlbHMnO1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IHR5cGUgeyBWZXJpZnlSZXF1ZXN0IH0gZnJvbSAnLi4vbW9kZWxzJztcbi8qKlxuICogVXBkYXRlQXBpIC0gYXhpb3MgcGFyYW1ldGVyIGNyZWF0b3JcbiAqIEBleHBvcnRcbiAqL1xuZXhwb3J0IGNvbnN0IFVwZGF0ZUFwaUF4aW9zUGFyYW1DcmVhdG9yID0gZnVuY3Rpb24gKGNvbmZpZ3VyYXRpb24/OiBDb25maWd1cmF0aW9uKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyaWdnZXIgYSBjaGVjayBmb3IgdXBkYXRlcyBmcm9tIHNlcnZlci5cbiAgICAgICAgICogQHN1bW1hcnkgT3RhIENoZWNrXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBvdGFDaGVja1VwZGF0ZUNoZWNrU2VydmVyUG9zdDogYXN5bmMgKG9wdGlvbnM6IFJhd0F4aW9zUmVxdWVzdENvbmZpZyA9IHt9KTogUHJvbWlzZTxSZXF1ZXN0QXJncz4gPT4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJQYXRoID0gYC91cGRhdGUvY2hlY2tfc2VydmVyYDtcbiAgICAgICAgICAgIC8vIHVzZSBkdW1teSBiYXNlIFVSTCBzdHJpbmcgYmVjYXVzZSB0aGUgVVJMIGNvbnN0cnVjdG9yIG9ubHkgYWNjZXB0cyBhYnNvbHV0ZSBVUkxzLlxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJVcmxPYmogPSBuZXcgVVJMKGxvY2FsVmFyUGF0aCwgRFVNTVlfQkFTRV9VUkwpO1xuICAgICAgICAgICAgbGV0IGJhc2VPcHRpb25zO1xuICAgICAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBiYXNlT3B0aW9ucyA9IGNvbmZpZ3VyYXRpb24uYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMgPSB7IG1ldGhvZDogJ1BPU1QnLCAuLi5iYXNlT3B0aW9ucywgLi4ub3B0aW9uc307XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckhlYWRlclBhcmFtZXRlciA9IHt9IGFzIGFueTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG5cblxuICAgIFxuICAgICAgICAgICAgc2V0U2VhcmNoUGFyYW1zKGxvY2FsVmFyVXJsT2JqLCBsb2NhbFZhclF1ZXJ5UGFyYW1ldGVyKTtcbiAgICAgICAgICAgIGxldCBoZWFkZXJzRnJvbUJhc2VPcHRpb25zID0gYmFzZU9wdGlvbnMgJiYgYmFzZU9wdGlvbnMuaGVhZGVycyA/IGJhc2VPcHRpb25zLmhlYWRlcnMgOiB7fTtcbiAgICAgICAgICAgIGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMuaGVhZGVycyA9IHsuLi5sb2NhbFZhckhlYWRlclBhcmFtZXRlciwgLi4uaGVhZGVyc0Zyb21CYXNlT3B0aW9ucywgLi4ub3B0aW9ucy5oZWFkZXJzfTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB1cmw6IHRvUGF0aFN0cmluZyhsb2NhbFZhclVybE9iaiksXG4gICAgICAgICAgICAgICAgb3B0aW9uczogbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb21taXQgdG8gdGhlIGluc3RhbGxlZCB1cGRhdGUuXG4gICAgICAgICAqIEBzdW1tYXJ5IE90YSBDb21taXRcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIG90YUNvbW1pdFVwZGF0ZUNvbW1pdFBvc3Q6IGFzeW5jIChvcHRpb25zOiBSYXdBeGlvc1JlcXVlc3RDb25maWcgPSB7fSk6IFByb21pc2U8UmVxdWVzdEFyZ3M+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUGF0aCA9IGAvdXBkYXRlL2NvbW1pdGA7XG4gICAgICAgICAgICAvLyB1c2UgZHVtbXkgYmFzZSBVUkwgc3RyaW5nIGJlY2F1c2UgdGhlIFVSTCBjb25zdHJ1Y3RvciBvbmx5IGFjY2VwdHMgYWJzb2x1dGUgVVJMcy5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyVXJsT2JqID0gbmV3IFVSTChsb2NhbFZhclBhdGgsIERVTU1ZX0JBU0VfVVJMKTtcbiAgICAgICAgICAgIGxldCBiYXNlT3B0aW9ucztcbiAgICAgICAgICAgIGlmIChjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgYmFzZU9wdGlvbnMgPSBjb25maWd1cmF0aW9uLmJhc2VPcHRpb25zO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclJlcXVlc3RPcHRpb25zID0geyBtZXRob2Q6ICdQT1NUJywgLi4uYmFzZU9wdGlvbnMsIC4uLm9wdGlvbnN9O1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclF1ZXJ5UGFyYW1ldGVyID0ge30gYXMgYW55O1xuXG5cbiAgICBcbiAgICAgICAgICAgIHNldFNlYXJjaFBhcmFtcyhsb2NhbFZhclVybE9iaiwgbG9jYWxWYXJRdWVyeVBhcmFtZXRlcik7XG4gICAgICAgICAgICBsZXQgaGVhZGVyc0Zyb21CYXNlT3B0aW9ucyA9IGJhc2VPcHRpb25zICYmIGJhc2VPcHRpb25zLmhlYWRlcnMgPyBiYXNlT3B0aW9ucy5oZWFkZXJzIDoge307XG4gICAgICAgICAgICBsb2NhbFZhclJlcXVlc3RPcHRpb25zLmhlYWRlcnMgPSB7Li4ubG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIsIC4uLmhlYWRlcnNGcm9tQmFzZU9wdGlvbnMsIC4uLm9wdGlvbnMuaGVhZGVyc307XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdXJsOiB0b1BhdGhTdHJpbmcobG9jYWxWYXJVcmxPYmopLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogXG4gICAgICAgICAqIEBzdW1tYXJ5IE90YSBTZXQgUHJvZ3Jlc3NcbiAgICAgICAgICogQHBhcmFtIHtPVEFTZXRQcm9ncmVzc1JlcXVlc3R9IG9UQVNldFByb2dyZXNzUmVxdWVzdCBcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIG90YVNldFByb2dyZXNzVXBkYXRlU2V0UHJvZ3Jlc3NQb3N0OiBhc3luYyAob1RBU2V0UHJvZ3Jlc3NSZXF1ZXN0OiBPVEFTZXRQcm9ncmVzc1JlcXVlc3QsIG9wdGlvbnM6IFJhd0F4aW9zUmVxdWVzdENvbmZpZyA9IHt9KTogUHJvbWlzZTxSZXF1ZXN0QXJncz4gPT4ge1xuICAgICAgICAgICAgLy8gdmVyaWZ5IHJlcXVpcmVkIHBhcmFtZXRlciAnb1RBU2V0UHJvZ3Jlc3NSZXF1ZXN0JyBpcyBub3QgbnVsbCBvciB1bmRlZmluZWRcbiAgICAgICAgICAgIGFzc2VydFBhcmFtRXhpc3RzKCdvdGFTZXRQcm9ncmVzc1VwZGF0ZVNldFByb2dyZXNzUG9zdCcsICdvVEFTZXRQcm9ncmVzc1JlcXVlc3QnLCBvVEFTZXRQcm9ncmVzc1JlcXVlc3QpXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclBhdGggPSBgL3VwZGF0ZS9zZXQtcHJvZ3Jlc3NgO1xuICAgICAgICAgICAgLy8gdXNlIGR1bW15IGJhc2UgVVJMIHN0cmluZyBiZWNhdXNlIHRoZSBVUkwgY29uc3RydWN0b3Igb25seSBhY2NlcHRzIGFic29sdXRlIFVSTHMuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclVybE9iaiA9IG5ldyBVUkwobG9jYWxWYXJQYXRoLCBEVU1NWV9CQVNFX1VSTCk7XG4gICAgICAgICAgICBsZXQgYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICBpZiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGJhc2VPcHRpb25zID0gY29uZmlndXJhdGlvbi5iYXNlT3B0aW9ucztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyA9IHsgbWV0aG9kOiAnUE9TVCcsIC4uLmJhc2VPcHRpb25zLCAuLi5vcHRpb25zfTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFySGVhZGVyUGFyYW1ldGVyID0ge30gYXMgYW55O1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJRdWVyeVBhcmFtZXRlciA9IHt9IGFzIGFueTtcblxuXG4gICAgXG4gICAgICAgICAgICBsb2NhbFZhckhlYWRlclBhcmFtZXRlclsnQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG5cbiAgICAgICAgICAgIHNldFNlYXJjaFBhcmFtcyhsb2NhbFZhclVybE9iaiwgbG9jYWxWYXJRdWVyeVBhcmFtZXRlcik7XG4gICAgICAgICAgICBsZXQgaGVhZGVyc0Zyb21CYXNlT3B0aW9ucyA9IGJhc2VPcHRpb25zICYmIGJhc2VPcHRpb25zLmhlYWRlcnMgPyBiYXNlT3B0aW9ucy5oZWFkZXJzIDoge307XG4gICAgICAgICAgICBsb2NhbFZhclJlcXVlc3RPcHRpb25zLmhlYWRlcnMgPSB7Li4ubG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIsIC4uLmhlYWRlcnNGcm9tQmFzZU9wdGlvbnMsIC4uLm9wdGlvbnMuaGVhZGVyc307XG4gICAgICAgICAgICBsb2NhbFZhclJlcXVlc3RPcHRpb25zLmRhdGEgPSBzZXJpYWxpemVEYXRhSWZOZWVkZWQob1RBU2V0UHJvZ3Jlc3NSZXF1ZXN0LCBsb2NhbFZhclJlcXVlc3RPcHRpb25zLCBjb25maWd1cmF0aW9uKVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHVybDogdG9QYXRoU3RyaW5nKGxvY2FsVmFyVXJsT2JqKSxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBsb2NhbFZhclJlcXVlc3RPcHRpb25zLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFxuICAgICAgICAgKiBAc3VtbWFyeSBPdGEgU3RhcnRcbiAgICAgICAgICogQHBhcmFtIHtPVEFTdGFydFJlcXVlc3R9IG9UQVN0YXJ0UmVxdWVzdCBcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIG90YVN0YXJ0VXBkYXRlU3RhcnRQb3N0OiBhc3luYyAob1RBU3RhcnRSZXF1ZXN0OiBPVEFTdGFydFJlcXVlc3QsIG9wdGlvbnM6IFJhd0F4aW9zUmVxdWVzdENvbmZpZyA9IHt9KTogUHJvbWlzZTxSZXF1ZXN0QXJncz4gPT4ge1xuICAgICAgICAgICAgLy8gdmVyaWZ5IHJlcXVpcmVkIHBhcmFtZXRlciAnb1RBU3RhcnRSZXF1ZXN0JyBpcyBub3QgbnVsbCBvciB1bmRlZmluZWRcbiAgICAgICAgICAgIGFzc2VydFBhcmFtRXhpc3RzKCdvdGFTdGFydFVwZGF0ZVN0YXJ0UG9zdCcsICdvVEFTdGFydFJlcXVlc3QnLCBvVEFTdGFydFJlcXVlc3QpXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclBhdGggPSBgL3VwZGF0ZS9zdGFydGA7XG4gICAgICAgICAgICAvLyB1c2UgZHVtbXkgYmFzZSBVUkwgc3RyaW5nIGJlY2F1c2UgdGhlIFVSTCBjb25zdHJ1Y3RvciBvbmx5IGFjY2VwdHMgYWJzb2x1dGUgVVJMcy5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyVXJsT2JqID0gbmV3IFVSTChsb2NhbFZhclBhdGgsIERVTU1ZX0JBU0VfVVJMKTtcbiAgICAgICAgICAgIGxldCBiYXNlT3B0aW9ucztcbiAgICAgICAgICAgIGlmIChjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgYmFzZU9wdGlvbnMgPSBjb25maWd1cmF0aW9uLmJhc2VPcHRpb25zO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclJlcXVlc3RPcHRpb25zID0geyBtZXRob2Q6ICdQT1NUJywgLi4uYmFzZU9wdGlvbnMsIC4uLm9wdGlvbnN9O1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclF1ZXJ5UGFyYW1ldGVyID0ge30gYXMgYW55O1xuXG5cbiAgICBcbiAgICAgICAgICAgIGxvY2FsVmFySGVhZGVyUGFyYW1ldGVyWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9qc29uJztcblxuICAgICAgICAgICAgc2V0U2VhcmNoUGFyYW1zKGxvY2FsVmFyVXJsT2JqLCBsb2NhbFZhclF1ZXJ5UGFyYW1ldGVyKTtcbiAgICAgICAgICAgIGxldCBoZWFkZXJzRnJvbUJhc2VPcHRpb25zID0gYmFzZU9wdGlvbnMgJiYgYmFzZU9wdGlvbnMuaGVhZGVycyA/IGJhc2VPcHRpb25zLmhlYWRlcnMgOiB7fTtcbiAgICAgICAgICAgIGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMuaGVhZGVycyA9IHsuLi5sb2NhbFZhckhlYWRlclBhcmFtZXRlciwgLi4uaGVhZGVyc0Zyb21CYXNlT3B0aW9ucywgLi4ub3B0aW9ucy5oZWFkZXJzfTtcbiAgICAgICAgICAgIGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMuZGF0YSA9IHNlcmlhbGl6ZURhdGFJZk5lZWRlZChvVEFTdGFydFJlcXVlc3QsIGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsIGNvbmZpZ3VyYXRpb24pXG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdXJsOiB0b1BhdGhTdHJpbmcobG9jYWxWYXJVcmxPYmopLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgT1RBIHVwZGF0ZSBzZXJ2aWNlLlxuICAgICAgICAgKiBAc3VtbWFyeSBPdGEgU3RhdHVzXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBvdGFTdGF0dXNVcGRhdGVTdGF0dXNHZXQ6IGFzeW5jIChvcHRpb25zOiBSYXdBeGlvc1JlcXVlc3RDb25maWcgPSB7fSk6IFByb21pc2U8UmVxdWVzdEFyZ3M+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUGF0aCA9IGAvdXBkYXRlL3N0YXR1c2A7XG4gICAgICAgICAgICAvLyB1c2UgZHVtbXkgYmFzZSBVUkwgc3RyaW5nIGJlY2F1c2UgdGhlIFVSTCBjb25zdHJ1Y3RvciBvbmx5IGFjY2VwdHMgYWJzb2x1dGUgVVJMcy5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyVXJsT2JqID0gbmV3IFVSTChsb2NhbFZhclBhdGgsIERVTU1ZX0JBU0VfVVJMKTtcbiAgICAgICAgICAgIGxldCBiYXNlT3B0aW9ucztcbiAgICAgICAgICAgIGlmIChjb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgYmFzZU9wdGlvbnMgPSBjb25maWd1cmF0aW9uLmJhc2VPcHRpb25zO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclJlcXVlc3RPcHRpb25zID0geyBtZXRob2Q6ICdHRVQnLCAuLi5iYXNlT3B0aW9ucywgLi4ub3B0aW9uc307XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckhlYWRlclBhcmFtZXRlciA9IHt9IGFzIGFueTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG5cblxuICAgIFxuICAgICAgICAgICAgc2V0U2VhcmNoUGFyYW1zKGxvY2FsVmFyVXJsT2JqLCBsb2NhbFZhclF1ZXJ5UGFyYW1ldGVyKTtcbiAgICAgICAgICAgIGxldCBoZWFkZXJzRnJvbUJhc2VPcHRpb25zID0gYmFzZU9wdGlvbnMgJiYgYmFzZU9wdGlvbnMuaGVhZGVycyA/IGJhc2VPcHRpb25zLmhlYWRlcnMgOiB7fTtcbiAgICAgICAgICAgIGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMuaGVhZGVycyA9IHsuLi5sb2NhbFZhckhlYWRlclBhcmFtZXRlciwgLi4uaGVhZGVyc0Zyb21CYXNlT3B0aW9ucywgLi4ub3B0aW9ucy5oZWFkZXJzfTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB1cmw6IHRvUGF0aFN0cmluZyhsb2NhbFZhclVybE9iaiksXG4gICAgICAgICAgICAgICAgb3B0aW9uczogbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBcbiAgICAgICAgICogQHN1bW1hcnkgT3RhIFZlcmlmeSBBbmQgQ29tbWl0XG4gICAgICAgICAqIEBwYXJhbSB7VmVyaWZ5UmVxdWVzdH0gW3ZlcmlmeVJlcXVlc3RdIFxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgb3RhVmVyaWZ5QW5kQ29tbWl0VXBkYXRlVmVyaWZ5QW5kQ29tbWl0UG9zdDogYXN5bmMgKHZlcmlmeVJlcXVlc3Q/OiBWZXJpZnlSZXF1ZXN0LCBvcHRpb25zOiBSYXdBeGlvc1JlcXVlc3RDb25maWcgPSB7fSk6IFByb21pc2U8UmVxdWVzdEFyZ3M+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUGF0aCA9IGAvdXBkYXRlL3ZlcmlmeS1hbmQtY29tbWl0YDtcbiAgICAgICAgICAgIC8vIHVzZSBkdW1teSBiYXNlIFVSTCBzdHJpbmcgYmVjYXVzZSB0aGUgVVJMIGNvbnN0cnVjdG9yIG9ubHkgYWNjZXB0cyBhYnNvbHV0ZSBVUkxzLlxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJVcmxPYmogPSBuZXcgVVJMKGxvY2FsVmFyUGF0aCwgRFVNTVlfQkFTRV9VUkwpO1xuICAgICAgICAgICAgbGV0IGJhc2VPcHRpb25zO1xuICAgICAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBiYXNlT3B0aW9ucyA9IGNvbmZpZ3VyYXRpb24uYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMgPSB7IG1ldGhvZDogJ1BPU1QnLCAuLi5iYXNlT3B0aW9ucywgLi4ub3B0aW9uc307XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckhlYWRlclBhcmFtZXRlciA9IHt9IGFzIGFueTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG5cblxuICAgIFxuICAgICAgICAgICAgbG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXJbJ0NvbnRlbnQtVHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuXG4gICAgICAgICAgICBzZXRTZWFyY2hQYXJhbXMobG9jYWxWYXJVcmxPYmosIGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIpO1xuICAgICAgICAgICAgbGV0IGhlYWRlcnNGcm9tQmFzZU9wdGlvbnMgPSBiYXNlT3B0aW9ucyAmJiBiYXNlT3B0aW9ucy5oZWFkZXJzID8gYmFzZU9wdGlvbnMuaGVhZGVycyA6IHt9O1xuICAgICAgICAgICAgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucy5oZWFkZXJzID0gey4uLmxvY2FsVmFySGVhZGVyUGFyYW1ldGVyLCAuLi5oZWFkZXJzRnJvbUJhc2VPcHRpb25zLCAuLi5vcHRpb25zLmhlYWRlcnN9O1xuICAgICAgICAgICAgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucy5kYXRhID0gc2VyaWFsaXplRGF0YUlmTmVlZGVkKHZlcmlmeVJlcXVlc3QsIGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsIGNvbmZpZ3VyYXRpb24pXG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdXJsOiB0b1BhdGhTdHJpbmcobG9jYWxWYXJVcmxPYmopLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogXG4gICAgICAgICAqIEBzdW1tYXJ5IE90YSBWZXJpZnkgQW5kIENvbW1pdFxuICAgICAgICAgKiBAcGFyYW0ge1ZlcmlmeVJlcXVlc3R9IFt2ZXJpZnlSZXF1ZXN0XSBcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIG90YVZlcmlmeUFuZENvbW1pdFVwZGF0ZVZlcmlmeUFuZENvbW1pdFBvc3RfMTogYXN5bmMgKHZlcmlmeVJlcXVlc3Q/OiBWZXJpZnlSZXF1ZXN0LCBvcHRpb25zOiBSYXdBeGlvc1JlcXVlc3RDb25maWcgPSB7fSk6IFByb21pc2U8UmVxdWVzdEFyZ3M+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUGF0aCA9IGAvdXBkYXRlL3ZlcmlmeS1hbmQtY29tbWl0YDtcbiAgICAgICAgICAgIC8vIHVzZSBkdW1teSBiYXNlIFVSTCBzdHJpbmcgYmVjYXVzZSB0aGUgVVJMIGNvbnN0cnVjdG9yIG9ubHkgYWNjZXB0cyBhYnNvbHV0ZSBVUkxzLlxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJVcmxPYmogPSBuZXcgVVJMKGxvY2FsVmFyUGF0aCwgRFVNTVlfQkFTRV9VUkwpO1xuICAgICAgICAgICAgbGV0IGJhc2VPcHRpb25zO1xuICAgICAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBiYXNlT3B0aW9ucyA9IGNvbmZpZ3VyYXRpb24uYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMgPSB7IG1ldGhvZDogJ1BPU1QnLCAuLi5iYXNlT3B0aW9ucywgLi4ub3B0aW9uc307XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckhlYWRlclBhcmFtZXRlciA9IHt9IGFzIGFueTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG5cblxuICAgIFxuICAgICAgICAgICAgbG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXJbJ0NvbnRlbnQtVHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuXG4gICAgICAgICAgICBzZXRTZWFyY2hQYXJhbXMobG9jYWxWYXJVcmxPYmosIGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIpO1xuICAgICAgICAgICAgbGV0IGhlYWRlcnNGcm9tQmFzZU9wdGlvbnMgPSBiYXNlT3B0aW9ucyAmJiBiYXNlT3B0aW9ucy5oZWFkZXJzID8gYmFzZU9wdGlvbnMuaGVhZGVycyA6IHt9O1xuICAgICAgICAgICAgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucy5oZWFkZXJzID0gey4uLmxvY2FsVmFySGVhZGVyUGFyYW1ldGVyLCAuLi5oZWFkZXJzRnJvbUJhc2VPcHRpb25zLCAuLi5vcHRpb25zLmhlYWRlcnN9O1xuICAgICAgICAgICAgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucy5kYXRhID0gc2VyaWFsaXplRGF0YUlmTmVlZGVkKHZlcmlmeVJlcXVlc3QsIGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsIGNvbmZpZ3VyYXRpb24pXG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdXJsOiB0b1BhdGhTdHJpbmcobG9jYWxWYXJVcmxPYmopLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogXG4gICAgICAgICAqIEBzdW1tYXJ5IE90YSBWZXJpZnlcbiAgICAgICAgICogQHBhcmFtIHtWZXJpZnlSZXF1ZXN0fSBbdmVyaWZ5UmVxdWVzdF0gXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBvdGFWZXJpZnlVcGRhdGVWZXJpZnlQb3N0OiBhc3luYyAodmVyaWZ5UmVxdWVzdD86IFZlcmlmeVJlcXVlc3QsIG9wdGlvbnM6IFJhd0F4aW9zUmVxdWVzdENvbmZpZyA9IHt9KTogUHJvbWlzZTxSZXF1ZXN0QXJncz4gPT4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJQYXRoID0gYC91cGRhdGUvdmVyaWZ5YDtcbiAgICAgICAgICAgIC8vIHVzZSBkdW1teSBiYXNlIFVSTCBzdHJpbmcgYmVjYXVzZSB0aGUgVVJMIGNvbnN0cnVjdG9yIG9ubHkgYWNjZXB0cyBhYnNvbHV0ZSBVUkxzLlxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJVcmxPYmogPSBuZXcgVVJMKGxvY2FsVmFyUGF0aCwgRFVNTVlfQkFTRV9VUkwpO1xuICAgICAgICAgICAgbGV0IGJhc2VPcHRpb25zO1xuICAgICAgICAgICAgaWYgKGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBiYXNlT3B0aW9ucyA9IGNvbmZpZ3VyYXRpb24uYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMgPSB7IG1ldGhvZDogJ1BPU1QnLCAuLi5iYXNlT3B0aW9ucywgLi4ub3B0aW9uc307XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckhlYWRlclBhcmFtZXRlciA9IHt9IGFzIGFueTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIgPSB7fSBhcyBhbnk7XG5cblxuICAgIFxuICAgICAgICAgICAgbG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXJbJ0NvbnRlbnQtVHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuXG4gICAgICAgICAgICBzZXRTZWFyY2hQYXJhbXMobG9jYWxWYXJVcmxPYmosIGxvY2FsVmFyUXVlcnlQYXJhbWV0ZXIpO1xuICAgICAgICAgICAgbGV0IGhlYWRlcnNGcm9tQmFzZU9wdGlvbnMgPSBiYXNlT3B0aW9ucyAmJiBiYXNlT3B0aW9ucy5oZWFkZXJzID8gYmFzZU9wdGlvbnMuaGVhZGVycyA6IHt9O1xuICAgICAgICAgICAgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucy5oZWFkZXJzID0gey4uLmxvY2FsVmFySGVhZGVyUGFyYW1ldGVyLCAuLi5oZWFkZXJzRnJvbUJhc2VPcHRpb25zLCAuLi5vcHRpb25zLmhlYWRlcnN9O1xuICAgICAgICAgICAgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucy5kYXRhID0gc2VyaWFsaXplRGF0YUlmTmVlZGVkKHZlcmlmeVJlcXVlc3QsIGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsIGNvbmZpZ3VyYXRpb24pXG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdXJsOiB0b1BhdGhTdHJpbmcobG9jYWxWYXJVcmxPYmopLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IGxvY2FsVmFyUmVxdWVzdE9wdGlvbnMsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogXG4gICAgICAgICAqIEBzdW1tYXJ5IE90YSBWZXJpZnlcbiAgICAgICAgICogQHBhcmFtIHtWZXJpZnlSZXF1ZXN0fSBbdmVyaWZ5UmVxdWVzdF0gXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBvdGFWZXJpZnlVcGRhdGVWZXJpZnlQb3N0XzI6IGFzeW5jICh2ZXJpZnlSZXF1ZXN0PzogVmVyaWZ5UmVxdWVzdCwgb3B0aW9uczogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnID0ge30pOiBQcm9taXNlPFJlcXVlc3RBcmdzPiA9PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclBhdGggPSBgL3VwZGF0ZS92ZXJpZnlgO1xuICAgICAgICAgICAgLy8gdXNlIGR1bW15IGJhc2UgVVJMIHN0cmluZyBiZWNhdXNlIHRoZSBVUkwgY29uc3RydWN0b3Igb25seSBhY2NlcHRzIGFic29sdXRlIFVSTHMuXG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhclVybE9iaiA9IG5ldyBVUkwobG9jYWxWYXJQYXRoLCBEVU1NWV9CQVNFX1VSTCk7XG4gICAgICAgICAgICBsZXQgYmFzZU9wdGlvbnM7XG4gICAgICAgICAgICBpZiAoY29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgIGJhc2VPcHRpb25zID0gY29uZmlndXJhdGlvbi5iYXNlT3B0aW9ucztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyA9IHsgbWV0aG9kOiAnUE9TVCcsIC4uLmJhc2VPcHRpb25zLCAuLi5vcHRpb25zfTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFySGVhZGVyUGFyYW1ldGVyID0ge30gYXMgYW55O1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJRdWVyeVBhcmFtZXRlciA9IHt9IGFzIGFueTtcblxuXG4gICAgXG4gICAgICAgICAgICBsb2NhbFZhckhlYWRlclBhcmFtZXRlclsnQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG5cbiAgICAgICAgICAgIHNldFNlYXJjaFBhcmFtcyhsb2NhbFZhclVybE9iaiwgbG9jYWxWYXJRdWVyeVBhcmFtZXRlcik7XG4gICAgICAgICAgICBsZXQgaGVhZGVyc0Zyb21CYXNlT3B0aW9ucyA9IGJhc2VPcHRpb25zICYmIGJhc2VPcHRpb25zLmhlYWRlcnMgPyBiYXNlT3B0aW9ucy5oZWFkZXJzIDoge307XG4gICAgICAgICAgICBsb2NhbFZhclJlcXVlc3RPcHRpb25zLmhlYWRlcnMgPSB7Li4ubG9jYWxWYXJIZWFkZXJQYXJhbWV0ZXIsIC4uLmhlYWRlcnNGcm9tQmFzZU9wdGlvbnMsIC4uLm9wdGlvbnMuaGVhZGVyc307XG4gICAgICAgICAgICBsb2NhbFZhclJlcXVlc3RPcHRpb25zLmRhdGEgPSBzZXJpYWxpemVEYXRhSWZOZWVkZWQodmVyaWZ5UmVxdWVzdCwgbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucywgY29uZmlndXJhdGlvbilcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB1cmw6IHRvUGF0aFN0cmluZyhsb2NhbFZhclVybE9iaiksXG4gICAgICAgICAgICAgICAgb3B0aW9uczogbG9jYWxWYXJSZXF1ZXN0T3B0aW9ucyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgfVxufTtcblxuLyoqXG4gKiBVcGRhdGVBcGkgLSBmdW5jdGlvbmFsIHByb2dyYW1taW5nIGludGVyZmFjZVxuICogQGV4cG9ydFxuICovXG5leHBvcnQgY29uc3QgVXBkYXRlQXBpRnAgPSBmdW5jdGlvbihjb25maWd1cmF0aW9uPzogQ29uZmlndXJhdGlvbikge1xuICAgIGNvbnN0IGxvY2FsVmFyQXhpb3NQYXJhbUNyZWF0b3IgPSBVcGRhdGVBcGlBeGlvc1BhcmFtQ3JlYXRvcihjb25maWd1cmF0aW9uKVxuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmlnZ2VyIGEgY2hlY2sgZm9yIHVwZGF0ZXMgZnJvbSBzZXJ2ZXIuXG4gICAgICAgICAqIEBzdW1tYXJ5IE90YSBDaGVja1xuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgb3RhQ2hlY2tVcGRhdGVDaGVja1NlcnZlclBvc3Qob3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZyk6IFByb21pc2U8KGF4aW9zPzogQXhpb3NJbnN0YW5jZSwgYmFzZVBhdGg/OiBzdHJpbmcpID0+IEF4aW9zUHJvbWlzZTxhbnk+PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckF4aW9zQXJncyA9IGF3YWl0IGxvY2FsVmFyQXhpb3NQYXJhbUNyZWF0b3Iub3RhQ2hlY2tVcGRhdGVDaGVja1NlcnZlclBvc3Qob3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckluZGV4ID0gY29uZmlndXJhdGlvbj8uc2VydmVySW5kZXggPz8gMDtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVyQmFzZVBhdGggPSBvcGVyYXRpb25TZXJ2ZXJNYXBbJ1VwZGF0ZUFwaS5vdGFDaGVja1VwZGF0ZUNoZWNrU2VydmVyUG9zdCddPy5bbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleF0/LnVybDtcbiAgICAgICAgICAgIHJldHVybiAoYXhpb3MsIGJhc2VQYXRoKSA9PiBjcmVhdGVSZXF1ZXN0RnVuY3Rpb24obG9jYWxWYXJBeGlvc0FyZ3MsIGdsb2JhbEF4aW9zLCBCQVNFX1BBVEgsIGNvbmZpZ3VyYXRpb24pKGF4aW9zLCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoIHx8IGJhc2VQYXRoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbW1pdCB0byB0aGUgaW5zdGFsbGVkIHVwZGF0ZS5cbiAgICAgICAgICogQHN1bW1hcnkgT3RhIENvbW1pdFxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgb3RhQ29tbWl0VXBkYXRlQ29tbWl0UG9zdChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogUHJvbWlzZTwoYXhpb3M/OiBBeGlvc0luc3RhbmNlLCBiYXNlUGF0aD86IHN0cmluZykgPT4gQXhpb3NQcm9taXNlPGFueT4+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyQXhpb3NBcmdzID0gYXdhaXQgbG9jYWxWYXJBeGlvc1BhcmFtQ3JlYXRvci5vdGFDb21taXRVcGRhdGVDb21taXRQb3N0KG9wdGlvbnMpO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleCA9IGNvbmZpZ3VyYXRpb24/LnNlcnZlckluZGV4ID8/IDA7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoID0gb3BlcmF0aW9uU2VydmVyTWFwWydVcGRhdGVBcGkub3RhQ29tbWl0VXBkYXRlQ29tbWl0UG9zdCddPy5bbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleF0/LnVybDtcbiAgICAgICAgICAgIHJldHVybiAoYXhpb3MsIGJhc2VQYXRoKSA9PiBjcmVhdGVSZXF1ZXN0RnVuY3Rpb24obG9jYWxWYXJBeGlvc0FyZ3MsIGdsb2JhbEF4aW9zLCBCQVNFX1BBVEgsIGNvbmZpZ3VyYXRpb24pKGF4aW9zLCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoIHx8IGJhc2VQYXRoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFxuICAgICAgICAgKiBAc3VtbWFyeSBPdGEgU2V0IFByb2dyZXNzXG4gICAgICAgICAqIEBwYXJhbSB7T1RBU2V0UHJvZ3Jlc3NSZXF1ZXN0fSBvVEFTZXRQcm9ncmVzc1JlcXVlc3QgXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBvdGFTZXRQcm9ncmVzc1VwZGF0ZVNldFByb2dyZXNzUG9zdChvVEFTZXRQcm9ncmVzc1JlcXVlc3Q6IE9UQVNldFByb2dyZXNzUmVxdWVzdCwgb3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZyk6IFByb21pc2U8KGF4aW9zPzogQXhpb3NJbnN0YW5jZSwgYmFzZVBhdGg/OiBzdHJpbmcpID0+IEF4aW9zUHJvbWlzZTxhbnk+PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckF4aW9zQXJncyA9IGF3YWl0IGxvY2FsVmFyQXhpb3NQYXJhbUNyZWF0b3Iub3RhU2V0UHJvZ3Jlc3NVcGRhdGVTZXRQcm9ncmVzc1Bvc3Qob1RBU2V0UHJvZ3Jlc3NSZXF1ZXN0LCBvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXggPSBjb25maWd1cmF0aW9uPy5zZXJ2ZXJJbmRleCA/PyAwO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCA9IG9wZXJhdGlvblNlcnZlck1hcFsnVXBkYXRlQXBpLm90YVNldFByb2dyZXNzVXBkYXRlU2V0UHJvZ3Jlc3NQb3N0J10/Lltsb2NhbFZhck9wZXJhdGlvblNlcnZlckluZGV4XT8udXJsO1xuICAgICAgICAgICAgcmV0dXJuIChheGlvcywgYmFzZVBhdGgpID0+IGNyZWF0ZVJlcXVlc3RGdW5jdGlvbihsb2NhbFZhckF4aW9zQXJncywgZ2xvYmFsQXhpb3MsIEJBU0VfUEFUSCwgY29uZmlndXJhdGlvbikoYXhpb3MsIGxvY2FsVmFyT3BlcmF0aW9uU2VydmVyQmFzZVBhdGggfHwgYmFzZVBhdGgpO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogXG4gICAgICAgICAqIEBzdW1tYXJ5IE90YSBTdGFydFxuICAgICAgICAgKiBAcGFyYW0ge09UQVN0YXJ0UmVxdWVzdH0gb1RBU3RhcnRSZXF1ZXN0IFxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgb3RhU3RhcnRVcGRhdGVTdGFydFBvc3Qob1RBU3RhcnRSZXF1ZXN0OiBPVEFTdGFydFJlcXVlc3QsIG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpOiBQcm9taXNlPChheGlvcz86IEF4aW9zSW5zdGFuY2UsIGJhc2VQYXRoPzogc3RyaW5nKSA9PiBBeGlvc1Byb21pc2U8YW55Pj4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJBeGlvc0FyZ3MgPSBhd2FpdCBsb2NhbFZhckF4aW9zUGFyYW1DcmVhdG9yLm90YVN0YXJ0VXBkYXRlU3RhcnRQb3N0KG9UQVN0YXJ0UmVxdWVzdCwgb3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckluZGV4ID0gY29uZmlndXJhdGlvbj8uc2VydmVySW5kZXggPz8gMDtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVyQmFzZVBhdGggPSBvcGVyYXRpb25TZXJ2ZXJNYXBbJ1VwZGF0ZUFwaS5vdGFTdGFydFVwZGF0ZVN0YXJ0UG9zdCddPy5bbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleF0/LnVybDtcbiAgICAgICAgICAgIHJldHVybiAoYXhpb3MsIGJhc2VQYXRoKSA9PiBjcmVhdGVSZXF1ZXN0RnVuY3Rpb24obG9jYWxWYXJBeGlvc0FyZ3MsIGdsb2JhbEF4aW9zLCBCQVNFX1BBVEgsIGNvbmZpZ3VyYXRpb24pKGF4aW9zLCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoIHx8IGJhc2VQYXRoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB0aGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE9UQSB1cGRhdGUgc2VydmljZS5cbiAgICAgICAgICogQHN1bW1hcnkgT3RhIFN0YXR1c1xuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgb3RhU3RhdHVzVXBkYXRlU3RhdHVzR2V0KG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpOiBQcm9taXNlPChheGlvcz86IEF4aW9zSW5zdGFuY2UsIGJhc2VQYXRoPzogc3RyaW5nKSA9PiBBeGlvc1Byb21pc2U8T1RBU3RhdHVzPj4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJBeGlvc0FyZ3MgPSBhd2FpdCBsb2NhbFZhckF4aW9zUGFyYW1DcmVhdG9yLm90YVN0YXR1c1VwZGF0ZVN0YXR1c0dldChvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXggPSBjb25maWd1cmF0aW9uPy5zZXJ2ZXJJbmRleCA/PyAwO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCA9IG9wZXJhdGlvblNlcnZlck1hcFsnVXBkYXRlQXBpLm90YVN0YXR1c1VwZGF0ZVN0YXR1c0dldCddPy5bbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleF0/LnVybDtcbiAgICAgICAgICAgIHJldHVybiAoYXhpb3MsIGJhc2VQYXRoKSA9PiBjcmVhdGVSZXF1ZXN0RnVuY3Rpb24obG9jYWxWYXJBeGlvc0FyZ3MsIGdsb2JhbEF4aW9zLCBCQVNFX1BBVEgsIGNvbmZpZ3VyYXRpb24pKGF4aW9zLCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoIHx8IGJhc2VQYXRoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFxuICAgICAgICAgKiBAc3VtbWFyeSBPdGEgVmVyaWZ5IEFuZCBDb21taXRcbiAgICAgICAgICogQHBhcmFtIHtWZXJpZnlSZXF1ZXN0fSBbdmVyaWZ5UmVxdWVzdF0gXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBvdGFWZXJpZnlBbmRDb21taXRVcGRhdGVWZXJpZnlBbmRDb21taXRQb3N0KHZlcmlmeVJlcXVlc3Q/OiBWZXJpZnlSZXF1ZXN0LCBvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogUHJvbWlzZTwoYXhpb3M/OiBBeGlvc0luc3RhbmNlLCBiYXNlUGF0aD86IHN0cmluZykgPT4gQXhpb3NQcm9taXNlPGFueT4+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyQXhpb3NBcmdzID0gYXdhaXQgbG9jYWxWYXJBeGlvc1BhcmFtQ3JlYXRvci5vdGFWZXJpZnlBbmRDb21taXRVcGRhdGVWZXJpZnlBbmRDb21taXRQb3N0KHZlcmlmeVJlcXVlc3QsIG9wdGlvbnMpO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleCA9IGNvbmZpZ3VyYXRpb24/LnNlcnZlckluZGV4ID8/IDA7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoID0gb3BlcmF0aW9uU2VydmVyTWFwWydVcGRhdGVBcGkub3RhVmVyaWZ5QW5kQ29tbWl0VXBkYXRlVmVyaWZ5QW5kQ29tbWl0UG9zdCddPy5bbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleF0/LnVybDtcbiAgICAgICAgICAgIHJldHVybiAoYXhpb3MsIGJhc2VQYXRoKSA9PiBjcmVhdGVSZXF1ZXN0RnVuY3Rpb24obG9jYWxWYXJBeGlvc0FyZ3MsIGdsb2JhbEF4aW9zLCBCQVNFX1BBVEgsIGNvbmZpZ3VyYXRpb24pKGF4aW9zLCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoIHx8IGJhc2VQYXRoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFxuICAgICAgICAgKiBAc3VtbWFyeSBPdGEgVmVyaWZ5IEFuZCBDb21taXRcbiAgICAgICAgICogQHBhcmFtIHtWZXJpZnlSZXF1ZXN0fSBbdmVyaWZ5UmVxdWVzdF0gXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBvdGFWZXJpZnlBbmRDb21taXRVcGRhdGVWZXJpZnlBbmRDb21taXRQb3N0XzEodmVyaWZ5UmVxdWVzdD86IFZlcmlmeVJlcXVlc3QsIG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpOiBQcm9taXNlPChheGlvcz86IEF4aW9zSW5zdGFuY2UsIGJhc2VQYXRoPzogc3RyaW5nKSA9PiBBeGlvc1Byb21pc2U8YW55Pj4ge1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJBeGlvc0FyZ3MgPSBhd2FpdCBsb2NhbFZhckF4aW9zUGFyYW1DcmVhdG9yLm90YVZlcmlmeUFuZENvbW1pdFVwZGF0ZVZlcmlmeUFuZENvbW1pdFBvc3RfMSh2ZXJpZnlSZXF1ZXN0LCBvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXggPSBjb25maWd1cmF0aW9uPy5zZXJ2ZXJJbmRleCA/PyAwO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCA9IG9wZXJhdGlvblNlcnZlck1hcFsnVXBkYXRlQXBpLm90YVZlcmlmeUFuZENvbW1pdFVwZGF0ZVZlcmlmeUFuZENvbW1pdFBvc3RfMSddPy5bbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleF0/LnVybDtcbiAgICAgICAgICAgIHJldHVybiAoYXhpb3MsIGJhc2VQYXRoKSA9PiBjcmVhdGVSZXF1ZXN0RnVuY3Rpb24obG9jYWxWYXJBeGlvc0FyZ3MsIGdsb2JhbEF4aW9zLCBCQVNFX1BBVEgsIGNvbmZpZ3VyYXRpb24pKGF4aW9zLCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoIHx8IGJhc2VQYXRoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFxuICAgICAgICAgKiBAc3VtbWFyeSBPdGEgVmVyaWZ5XG4gICAgICAgICAqIEBwYXJhbSB7VmVyaWZ5UmVxdWVzdH0gW3ZlcmlmeVJlcXVlc3RdIFxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgb3RhVmVyaWZ5VXBkYXRlVmVyaWZ5UG9zdCh2ZXJpZnlSZXF1ZXN0PzogVmVyaWZ5UmVxdWVzdCwgb3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZyk6IFByb21pc2U8KGF4aW9zPzogQXhpb3NJbnN0YW5jZSwgYmFzZVBhdGg/OiBzdHJpbmcpID0+IEF4aW9zUHJvbWlzZTxhbnk+PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckF4aW9zQXJncyA9IGF3YWl0IGxvY2FsVmFyQXhpb3NQYXJhbUNyZWF0b3Iub3RhVmVyaWZ5VXBkYXRlVmVyaWZ5UG9zdCh2ZXJpZnlSZXF1ZXN0LCBvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXggPSBjb25maWd1cmF0aW9uPy5zZXJ2ZXJJbmRleCA/PyAwO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCA9IG9wZXJhdGlvblNlcnZlck1hcFsnVXBkYXRlQXBpLm90YVZlcmlmeVVwZGF0ZVZlcmlmeVBvc3QnXT8uW2xvY2FsVmFyT3BlcmF0aW9uU2VydmVySW5kZXhdPy51cmw7XG4gICAgICAgICAgICByZXR1cm4gKGF4aW9zLCBiYXNlUGF0aCkgPT4gY3JlYXRlUmVxdWVzdEZ1bmN0aW9uKGxvY2FsVmFyQXhpb3NBcmdzLCBnbG9iYWxBeGlvcywgQkFTRV9QQVRILCBjb25maWd1cmF0aW9uKShheGlvcywgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJCYXNlUGF0aCB8fCBiYXNlUGF0aCk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBcbiAgICAgICAgICogQHN1bW1hcnkgT3RhIFZlcmlmeVxuICAgICAgICAgKiBAcGFyYW0ge1ZlcmlmeVJlcXVlc3R9IFt2ZXJpZnlSZXF1ZXN0XSBcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIGFzeW5jIG90YVZlcmlmeVVwZGF0ZVZlcmlmeVBvc3RfMih2ZXJpZnlSZXF1ZXN0PzogVmVyaWZ5UmVxdWVzdCwgb3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZyk6IFByb21pc2U8KGF4aW9zPzogQXhpb3NJbnN0YW5jZSwgYmFzZVBhdGg/OiBzdHJpbmcpID0+IEF4aW9zUHJvbWlzZTxhbnk+PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhckF4aW9zQXJncyA9IGF3YWl0IGxvY2FsVmFyQXhpb3NQYXJhbUNyZWF0b3Iub3RhVmVyaWZ5VXBkYXRlVmVyaWZ5UG9zdF8yKHZlcmlmeVJlcXVlc3QsIG9wdGlvbnMpO1xuICAgICAgICAgICAgY29uc3QgbG9jYWxWYXJPcGVyYXRpb25TZXJ2ZXJJbmRleCA9IGNvbmZpZ3VyYXRpb24/LnNlcnZlckluZGV4ID8/IDA7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFZhck9wZXJhdGlvblNlcnZlckJhc2VQYXRoID0gb3BlcmF0aW9uU2VydmVyTWFwWydVcGRhdGVBcGkub3RhVmVyaWZ5VXBkYXRlVmVyaWZ5UG9zdF8yJ10/Lltsb2NhbFZhck9wZXJhdGlvblNlcnZlckluZGV4XT8udXJsO1xuICAgICAgICAgICAgcmV0dXJuIChheGlvcywgYmFzZVBhdGgpID0+IGNyZWF0ZVJlcXVlc3RGdW5jdGlvbihsb2NhbFZhckF4aW9zQXJncywgZ2xvYmFsQXhpb3MsIEJBU0VfUEFUSCwgY29uZmlndXJhdGlvbikoYXhpb3MsIGxvY2FsVmFyT3BlcmF0aW9uU2VydmVyQmFzZVBhdGggfHwgYmFzZVBhdGgpO1xuICAgICAgICB9LFxuICAgIH1cbn07XG5cbi8qKlxuICogVXBkYXRlQXBpIC0gZmFjdG9yeSBpbnRlcmZhY2VcbiAqIEBleHBvcnRcbiAqL1xuZXhwb3J0IGNvbnN0IFVwZGF0ZUFwaUZhY3RvcnkgPSBmdW5jdGlvbiAoY29uZmlndXJhdGlvbj86IENvbmZpZ3VyYXRpb24sIGJhc2VQYXRoPzogc3RyaW5nLCBheGlvcz86IEF4aW9zSW5zdGFuY2UpIHtcbiAgICBjb25zdCBsb2NhbFZhckZwID0gVXBkYXRlQXBpRnAoY29uZmlndXJhdGlvbilcbiAgICByZXR1cm4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogVHJpZ2dlciBhIGNoZWNrIGZvciB1cGRhdGVzIGZyb20gc2VydmVyLlxuICAgICAgICAgKiBAc3VtbWFyeSBPdGEgQ2hlY2tcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIG90YUNoZWNrVXBkYXRlQ2hlY2tTZXJ2ZXJQb3N0KG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpOiBBeGlvc1Byb21pc2U8YW55PiB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxWYXJGcC5vdGFDaGVja1VwZGF0ZUNoZWNrU2VydmVyUG9zdChvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KGF4aW9zLCBiYXNlUGF0aCkpO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogQ29tbWl0IHRvIHRoZSBpbnN0YWxsZWQgdXBkYXRlLlxuICAgICAgICAgKiBAc3VtbWFyeSBPdGEgQ29tbWl0XG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBvdGFDb21taXRVcGRhdGVDb21taXRQb3N0KG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpOiBBeGlvc1Byb21pc2U8YW55PiB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxWYXJGcC5vdGFDb21taXRVcGRhdGVDb21taXRQb3N0KG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QoYXhpb3MsIGJhc2VQYXRoKSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBcbiAgICAgICAgICogQHN1bW1hcnkgT3RhIFNldCBQcm9ncmVzc1xuICAgICAgICAgKiBAcGFyYW0ge09UQVNldFByb2dyZXNzUmVxdWVzdH0gb1RBU2V0UHJvZ3Jlc3NSZXF1ZXN0IFxuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgb3RhU2V0UHJvZ3Jlc3NVcGRhdGVTZXRQcm9ncmVzc1Bvc3Qob1RBU2V0UHJvZ3Jlc3NSZXF1ZXN0OiBPVEFTZXRQcm9ncmVzc1JlcXVlc3QsIG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpOiBBeGlvc1Byb21pc2U8YW55PiB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxWYXJGcC5vdGFTZXRQcm9ncmVzc1VwZGF0ZVNldFByb2dyZXNzUG9zdChvVEFTZXRQcm9ncmVzc1JlcXVlc3QsIG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QoYXhpb3MsIGJhc2VQYXRoKSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBcbiAgICAgICAgICogQHN1bW1hcnkgT3RhIFN0YXJ0XG4gICAgICAgICAqIEBwYXJhbSB7T1RBU3RhcnRSZXF1ZXN0fSBvVEFTdGFydFJlcXVlc3QgXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBvdGFTdGFydFVwZGF0ZVN0YXJ0UG9zdChvVEFTdGFydFJlcXVlc3Q6IE9UQVN0YXJ0UmVxdWVzdCwgb3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZyk6IEF4aW9zUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgICAgIHJldHVybiBsb2NhbFZhckZwLm90YVN0YXJ0VXBkYXRlU3RhcnRQb3N0KG9UQVN0YXJ0UmVxdWVzdCwgb3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdChheGlvcywgYmFzZVBhdGgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB0aGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE9UQSB1cGRhdGUgc2VydmljZS5cbiAgICAgICAgICogQHN1bW1hcnkgT3RhIFN0YXR1c1xuICAgICAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAgICAgKi9cbiAgICAgICAgb3RhU3RhdHVzVXBkYXRlU3RhdHVzR2V0KG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpOiBBeGlvc1Byb21pc2U8T1RBU3RhdHVzPiB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxWYXJGcC5vdGFTdGF0dXNVcGRhdGVTdGF0dXNHZXQob3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdChheGlvcywgYmFzZVBhdGgpKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFxuICAgICAgICAgKiBAc3VtbWFyeSBPdGEgVmVyaWZ5IEFuZCBDb21taXRcbiAgICAgICAgICogQHBhcmFtIHtWZXJpZnlSZXF1ZXN0fSBbdmVyaWZ5UmVxdWVzdF0gXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBvdGFWZXJpZnlBbmRDb21taXRVcGRhdGVWZXJpZnlBbmRDb21taXRQb3N0KHZlcmlmeVJlcXVlc3Q/OiBWZXJpZnlSZXF1ZXN0LCBvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogQXhpb3NQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsVmFyRnAub3RhVmVyaWZ5QW5kQ29tbWl0VXBkYXRlVmVyaWZ5QW5kQ29tbWl0UG9zdCh2ZXJpZnlSZXF1ZXN0LCBvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KGF4aW9zLCBiYXNlUGF0aCkpO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogXG4gICAgICAgICAqIEBzdW1tYXJ5IE90YSBWZXJpZnkgQW5kIENvbW1pdFxuICAgICAgICAgKiBAcGFyYW0ge1ZlcmlmeVJlcXVlc3R9IFt2ZXJpZnlSZXF1ZXN0XSBcbiAgICAgICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgICAgICovXG4gICAgICAgIG90YVZlcmlmeUFuZENvbW1pdFVwZGF0ZVZlcmlmeUFuZENvbW1pdFBvc3RfMSh2ZXJpZnlSZXF1ZXN0PzogVmVyaWZ5UmVxdWVzdCwgb3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZyk6IEF4aW9zUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgICAgIHJldHVybiBsb2NhbFZhckZwLm90YVZlcmlmeUFuZENvbW1pdFVwZGF0ZVZlcmlmeUFuZENvbW1pdFBvc3RfMSh2ZXJpZnlSZXF1ZXN0LCBvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KGF4aW9zLCBiYXNlUGF0aCkpO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogXG4gICAgICAgICAqIEBzdW1tYXJ5IE90YSBWZXJpZnlcbiAgICAgICAgICogQHBhcmFtIHtWZXJpZnlSZXF1ZXN0fSBbdmVyaWZ5UmVxdWVzdF0gXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBvdGFWZXJpZnlVcGRhdGVWZXJpZnlQb3N0KHZlcmlmeVJlcXVlc3Q/OiBWZXJpZnlSZXF1ZXN0LCBvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKTogQXhpb3NQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsVmFyRnAub3RhVmVyaWZ5VXBkYXRlVmVyaWZ5UG9zdCh2ZXJpZnlSZXF1ZXN0LCBvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KGF4aW9zLCBiYXNlUGF0aCkpO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogXG4gICAgICAgICAqIEBzdW1tYXJ5IE90YSBWZXJpZnlcbiAgICAgICAgICogQHBhcmFtIHtWZXJpZnlSZXF1ZXN0fSBbdmVyaWZ5UmVxdWVzdF0gXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICAgICAqL1xuICAgICAgICBvdGFWZXJpZnlVcGRhdGVWZXJpZnlQb3N0XzIodmVyaWZ5UmVxdWVzdD86IFZlcmlmeVJlcXVlc3QsIG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpOiBBeGlvc1Byb21pc2U8YW55PiB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxWYXJGcC5vdGFWZXJpZnlVcGRhdGVWZXJpZnlQb3N0XzIodmVyaWZ5UmVxdWVzdCwgb3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdChheGlvcywgYmFzZVBhdGgpKTtcbiAgICAgICAgfSxcbiAgICB9O1xufTtcblxuLyoqXG4gKiBVcGRhdGVBcGkgLSBvYmplY3Qtb3JpZW50ZWQgaW50ZXJmYWNlXG4gKiBAZXhwb3J0XG4gKiBAY2xhc3MgVXBkYXRlQXBpXG4gKiBAZXh0ZW5kcyB7QmFzZUFQSX1cbiAqL1xuZXhwb3J0IGNsYXNzIFVwZGF0ZUFwaSBleHRlbmRzIEJhc2VBUEkge1xuICAgIC8qKlxuICAgICAqIFRyaWdnZXIgYSBjaGVjayBmb3IgdXBkYXRlcyBmcm9tIHNlcnZlci5cbiAgICAgKiBAc3VtbWFyeSBPdGEgQ2hlY2tcbiAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICogQG1lbWJlcm9mIFVwZGF0ZUFwaVxuICAgICAqL1xuICAgIHB1YmxpYyBvdGFDaGVja1VwZGF0ZUNoZWNrU2VydmVyUG9zdChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKSB7XG4gICAgICAgIHJldHVybiBVcGRhdGVBcGlGcCh0aGlzLmNvbmZpZ3VyYXRpb24pLm90YUNoZWNrVXBkYXRlQ2hlY2tTZXJ2ZXJQb3N0KG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QodGhpcy5heGlvcywgdGhpcy5iYXNlUGF0aCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbW1pdCB0byB0aGUgaW5zdGFsbGVkIHVwZGF0ZS5cbiAgICAgKiBAc3VtbWFyeSBPdGEgQ29tbWl0XG4gICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAqIEBtZW1iZXJvZiBVcGRhdGVBcGlcbiAgICAgKi9cbiAgICBwdWJsaWMgb3RhQ29tbWl0VXBkYXRlQ29tbWl0UG9zdChvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKSB7XG4gICAgICAgIHJldHVybiBVcGRhdGVBcGlGcCh0aGlzLmNvbmZpZ3VyYXRpb24pLm90YUNvbW1pdFVwZGF0ZUNvbW1pdFBvc3Qob3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdCh0aGlzLmF4aW9zLCB0aGlzLmJhc2VQYXRoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHN1bW1hcnkgT3RhIFNldCBQcm9ncmVzc1xuICAgICAqIEBwYXJhbSB7T1RBU2V0UHJvZ3Jlc3NSZXF1ZXN0fSBvVEFTZXRQcm9ncmVzc1JlcXVlc3QgXG4gICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAqIEBtZW1iZXJvZiBVcGRhdGVBcGlcbiAgICAgKi9cbiAgICBwdWJsaWMgb3RhU2V0UHJvZ3Jlc3NVcGRhdGVTZXRQcm9ncmVzc1Bvc3Qob1RBU2V0UHJvZ3Jlc3NSZXF1ZXN0OiBPVEFTZXRQcm9ncmVzc1JlcXVlc3QsIG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpIHtcbiAgICAgICAgcmV0dXJuIFVwZGF0ZUFwaUZwKHRoaXMuY29uZmlndXJhdGlvbikub3RhU2V0UHJvZ3Jlc3NVcGRhdGVTZXRQcm9ncmVzc1Bvc3Qob1RBU2V0UHJvZ3Jlc3NSZXF1ZXN0LCBvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KHRoaXMuYXhpb3MsIHRoaXMuYmFzZVBhdGgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAc3VtbWFyeSBPdGEgU3RhcnRcbiAgICAgKiBAcGFyYW0ge09UQVN0YXJ0UmVxdWVzdH0gb1RBU3RhcnRSZXF1ZXN0IFxuICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgKiBAbWVtYmVyb2YgVXBkYXRlQXBpXG4gICAgICovXG4gICAgcHVibGljIG90YVN0YXJ0VXBkYXRlU3RhcnRQb3N0KG9UQVN0YXJ0UmVxdWVzdDogT1RBU3RhcnRSZXF1ZXN0LCBvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKSB7XG4gICAgICAgIHJldHVybiBVcGRhdGVBcGlGcCh0aGlzLmNvbmZpZ3VyYXRpb24pLm90YVN0YXJ0VXBkYXRlU3RhcnRQb3N0KG9UQVN0YXJ0UmVxdWVzdCwgb3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdCh0aGlzLmF4aW9zLCB0aGlzLmJhc2VQYXRoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgT1RBIHVwZGF0ZSBzZXJ2aWNlLlxuICAgICAqIEBzdW1tYXJ5IE90YSBTdGF0dXNcbiAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSBPdmVycmlkZSBodHRwIHJlcXVlc3Qgb3B0aW9uLlxuICAgICAqIEB0aHJvd3Mge1JlcXVpcmVkRXJyb3J9XG4gICAgICogQG1lbWJlcm9mIFVwZGF0ZUFwaVxuICAgICAqL1xuICAgIHB1YmxpYyBvdGFTdGF0dXNVcGRhdGVTdGF0dXNHZXQob3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZykge1xuICAgICAgICByZXR1cm4gVXBkYXRlQXBpRnAodGhpcy5jb25maWd1cmF0aW9uKS5vdGFTdGF0dXNVcGRhdGVTdGF0dXNHZXQob3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdCh0aGlzLmF4aW9zLCB0aGlzLmJhc2VQYXRoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHN1bW1hcnkgT3RhIFZlcmlmeSBBbmQgQ29tbWl0XG4gICAgICogQHBhcmFtIHtWZXJpZnlSZXF1ZXN0fSBbdmVyaWZ5UmVxdWVzdF0gXG4gICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAqIEBtZW1iZXJvZiBVcGRhdGVBcGlcbiAgICAgKi9cbiAgICBwdWJsaWMgb3RhVmVyaWZ5QW5kQ29tbWl0VXBkYXRlVmVyaWZ5QW5kQ29tbWl0UG9zdCh2ZXJpZnlSZXF1ZXN0PzogVmVyaWZ5UmVxdWVzdCwgb3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZykge1xuICAgICAgICByZXR1cm4gVXBkYXRlQXBpRnAodGhpcy5jb25maWd1cmF0aW9uKS5vdGFWZXJpZnlBbmRDb21taXRVcGRhdGVWZXJpZnlBbmRDb21taXRQb3N0KHZlcmlmeVJlcXVlc3QsIG9wdGlvbnMpLnRoZW4oKHJlcXVlc3QpID0+IHJlcXVlc3QodGhpcy5heGlvcywgdGhpcy5iYXNlUGF0aCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBzdW1tYXJ5IE90YSBWZXJpZnkgQW5kIENvbW1pdFxuICAgICAqIEBwYXJhbSB7VmVyaWZ5UmVxdWVzdH0gW3ZlcmlmeVJlcXVlc3RdIFxuICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgKiBAbWVtYmVyb2YgVXBkYXRlQXBpXG4gICAgICovXG4gICAgcHVibGljIG90YVZlcmlmeUFuZENvbW1pdFVwZGF0ZVZlcmlmeUFuZENvbW1pdFBvc3RfMSh2ZXJpZnlSZXF1ZXN0PzogVmVyaWZ5UmVxdWVzdCwgb3B0aW9ucz86IFJhd0F4aW9zUmVxdWVzdENvbmZpZykge1xuICAgICAgICByZXR1cm4gVXBkYXRlQXBpRnAodGhpcy5jb25maWd1cmF0aW9uKS5vdGFWZXJpZnlBbmRDb21taXRVcGRhdGVWZXJpZnlBbmRDb21taXRQb3N0XzEodmVyaWZ5UmVxdWVzdCwgb3B0aW9ucykudGhlbigocmVxdWVzdCkgPT4gcmVxdWVzdCh0aGlzLmF4aW9zLCB0aGlzLmJhc2VQYXRoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHN1bW1hcnkgT3RhIFZlcmlmeVxuICAgICAqIEBwYXJhbSB7VmVyaWZ5UmVxdWVzdH0gW3ZlcmlmeVJlcXVlc3RdIFxuICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIE92ZXJyaWRlIGh0dHAgcmVxdWVzdCBvcHRpb24uXG4gICAgICogQHRocm93cyB7UmVxdWlyZWRFcnJvcn1cbiAgICAgKiBAbWVtYmVyb2YgVXBkYXRlQXBpXG4gICAgICovXG4gICAgcHVibGljIG90YVZlcmlmeVVwZGF0ZVZlcmlmeVBvc3QodmVyaWZ5UmVxdWVzdD86IFZlcmlmeVJlcXVlc3QsIG9wdGlvbnM/OiBSYXdBeGlvc1JlcXVlc3RDb25maWcpIHtcbiAgICAgICAgcmV0dXJuIFVwZGF0ZUFwaUZwKHRoaXMuY29uZmlndXJhdGlvbikub3RhVmVyaWZ5VXBkYXRlVmVyaWZ5UG9zdCh2ZXJpZnlSZXF1ZXN0LCBvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KHRoaXMuYXhpb3MsIHRoaXMuYmFzZVBhdGgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAc3VtbWFyeSBPdGEgVmVyaWZ5XG4gICAgICogQHBhcmFtIHtWZXJpZnlSZXF1ZXN0fSBbdmVyaWZ5UmVxdWVzdF0gXG4gICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gT3ZlcnJpZGUgaHR0cCByZXF1ZXN0IG9wdGlvbi5cbiAgICAgKiBAdGhyb3dzIHtSZXF1aXJlZEVycm9yfVxuICAgICAqIEBtZW1iZXJvZiBVcGRhdGVBcGlcbiAgICAgKi9cbiAgICBwdWJsaWMgb3RhVmVyaWZ5VXBkYXRlVmVyaWZ5UG9zdF8yKHZlcmlmeVJlcXVlc3Q/OiBWZXJpZnlSZXF1ZXN0LCBvcHRpb25zPzogUmF3QXhpb3NSZXF1ZXN0Q29uZmlnKSB7XG4gICAgICAgIHJldHVybiBVcGRhdGVBcGlGcCh0aGlzLmNvbmZpZ3VyYXRpb24pLm90YVZlcmlmeVVwZGF0ZVZlcmlmeVBvc3RfMih2ZXJpZnlSZXF1ZXN0LCBvcHRpb25zKS50aGVuKChyZXF1ZXN0KSA9PiByZXF1ZXN0KHRoaXMuYXhpb3MsIHRoaXMuYmFzZVBhdGgpKTtcbiAgICB9XG59XG5cbiJdLCJtYXBwaW5ncyI6IkFBaUJBLE9BQU8saUJBQWlCO0FBR3hCLFNBQVMsZ0JBQWdCLG1CQUFtQixtQkFBbUIsc0JBQXNCLHVCQUF1QixrQkFBa0IsaUJBQWlCLHVCQUF1QixjQUFjLDZCQUE2QjtBQUVqTixTQUFTLFdBQVcsb0JBQXNDLFNBQVMsZUFBZSwwQkFBMEI7QUFlckcsYUFBTSw2QkFBNkIsU0FBVSxlQUErQjtBQUMvRSxTQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFPSCwrQkFBK0IsT0FBTyxVQUFpQyxDQUFDLE1BQTRCO0FBQ2hHLFlBQU0sZUFBZTtBQUVyQixZQUFNLGlCQUFpQixJQUFJLElBQUksY0FBYyxjQUFjO0FBQzNELFVBQUk7QUFDSixVQUFJLGVBQWU7QUFDZixzQkFBYyxjQUFjO0FBQUEsTUFDaEM7QUFFQSxZQUFNLHlCQUF5QixFQUFFLFFBQVEsUUFBUSxHQUFHLGFBQWEsR0FBRyxRQUFPO0FBQzNFLFlBQU0sMEJBQTBCLENBQUM7QUFDakMsWUFBTSx5QkFBeUIsQ0FBQztBQUloQyxzQkFBZ0IsZ0JBQWdCLHNCQUFzQjtBQUN0RCxVQUFJLHlCQUF5QixlQUFlLFlBQVksVUFBVSxZQUFZLFVBQVUsQ0FBQztBQUN6Riw2QkFBdUIsVUFBVSxFQUFDLEdBQUcseUJBQXlCLEdBQUcsd0JBQXdCLEdBQUcsUUFBUSxRQUFPO0FB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