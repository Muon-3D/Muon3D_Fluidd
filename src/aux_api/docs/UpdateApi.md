# UpdateApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**otaCheckUpdateCheckServerPost**](#otacheckupdatecheckserverpost) | **POST** /update/check_server | Ota Check|
|[**otaCommitUpdateCommitPost**](#otacommitupdatecommitpost) | **POST** /update/commit | Ota Commit|
|[**otaSetProgressUpdateSetProgressPost**](#otasetprogressupdatesetprogresspost) | **POST** /update/set-progress | Ota Set Progress|
|[**otaStartUpdateStartPost**](#otastartupdatestartpost) | **POST** /update/start | Ota Start|
|[**otaStatusUpdateStatusGet**](#otastatusupdatestatusget) | **GET** /update/status | Ota Status|
|[**otaVerifyAndCommitUpdateVerifyAndCommitPost**](#otaverifyandcommitupdateverifyandcommitpost) | **POST** /update/verify-and-commit | Ota Verify And Commit|
|[**otaVerifyAndCommitUpdateVerifyAndCommitPost_0**](#otaverifyandcommitupdateverifyandcommitpost_0) | **POST** /update/verify-and-commit | Ota Verify And Commit|
|[**otaVerifyUpdateVerifyPost**](#otaverifyupdateverifypost) | **POST** /update/verify | Ota Verify|
|[**otaVerifyUpdateVerifyPost_0**](#otaverifyupdateverifypost_0) | **POST** /update/verify | Ota Verify|

# **otaCheckUpdateCheckServerPost**
> any otaCheckUpdateCheckServerPost()

Trigger a check for updates from server.

### Example

```typescript
import {
    UpdateApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UpdateApi(configuration);

const { status, data } = await apiInstance.otaCheckUpdateCheckServerPost();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**any**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **otaCommitUpdateCommitPost**
> any otaCommitUpdateCommitPost()

Commit to the installed update.

### Example

```typescript
import {
    UpdateApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UpdateApi(configuration);

const { status, data } = await apiInstance.otaCommitUpdateCommitPost();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**any**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **otaSetProgressUpdateSetProgressPost**
> any otaSetProgressUpdateSetProgressPost(oTASetProgressRequest)


### Example

```typescript
import {
    UpdateApi,
    Configuration,
    OTASetProgressRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UpdateApi(configuration);

let oTASetProgressRequest: OTASetProgressRequest; //

const { status, data } = await apiInstance.otaSetProgressUpdateSetProgressPost(
    oTASetProgressRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **oTASetProgressRequest** | **OTASetProgressRequest**|  | |


### Return type

**any**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **otaStartUpdateStartPost**
> any otaStartUpdateStartPost(oTAStartRequest)


### Example

```typescript
import {
    UpdateApi,
    Configuration,
    OTAStartRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UpdateApi(configuration);

let oTAStartRequest: OTAStartRequest; //

const { status, data } = await apiInstance.otaStartUpdateStartPost(
    oTAStartRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **oTAStartRequest** | **OTAStartRequest**|  | |


### Return type

**any**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **otaStatusUpdateStatusGet**
> OTAStatus otaStatusUpdateStatusGet()

Get the current status of the OTA update service.

### Example

```typescript
import {
    UpdateApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UpdateApi(configuration);

const { status, data } = await apiInstance.otaStatusUpdateStatusGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**OTAStatus**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **otaVerifyAndCommitUpdateVerifyAndCommitPost**
> any otaVerifyAndCommitUpdateVerifyAndCommitPost()


### Example

```typescript
import {
    UpdateApi,
    Configuration,
    VerifyRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UpdateApi(configuration);

let verifyRequest: VerifyRequest; // (optional)

const { status, data } = await apiInstance.otaVerifyAndCommitUpdateVerifyAndCommitPost(
    verifyRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **verifyRequest** | **VerifyRequest**|  | |


### Return type

**any**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **otaVerifyAndCommitUpdateVerifyAndCommitPost_0**
> any otaVerifyAndCommitUpdateVerifyAndCommitPost_0()


### Example

```typescript
import {
    UpdateApi,
    Configuration,
    VerifyRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UpdateApi(configuration);

let verifyRequest: VerifyRequest; // (optional)

const { status, data } = await apiInstance.otaVerifyAndCommitUpdateVerifyAndCommitPost_0(
    verifyRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **verifyRequest** | **VerifyRequest**|  | |


### Return type

**any**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **otaVerifyUpdateVerifyPost**
> any otaVerifyUpdateVerifyPost()


### Example

```typescript
import {
    UpdateApi,
    Configuration,
    VerifyRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UpdateApi(configuration);

let verifyRequest: VerifyRequest; // (optional)

const { status, data } = await apiInstance.otaVerifyUpdateVerifyPost(
    verifyRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **verifyRequest** | **VerifyRequest**|  | |


### Return type

**any**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **otaVerifyUpdateVerifyPost_0**
> any otaVerifyUpdateVerifyPost_0()


### Example

```typescript
import {
    UpdateApi,
    Configuration,
    VerifyRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UpdateApi(configuration);

let verifyRequest: VerifyRequest; // (optional)

const { status, data } = await apiInstance.otaVerifyUpdateVerifyPost_0(
    verifyRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **verifyRequest** | **VerifyRequest**|  | |


### Return type

**any**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

