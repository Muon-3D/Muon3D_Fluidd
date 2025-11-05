# UpdateApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**otaCheckUpdateCheckServerPost**](#otacheckupdatecheckserverpost) | **POST** /update/check_server | Ota Check|
|[**otaCommitUpdateCommitPost**](#otacommitupdatecommitpost) | **POST** /update/commit | Ota Commit|
|[**otaSetProgressUpdateSetProgressPost**](#otasetprogressupdatesetprogresspost) | **POST** /update/set-progress | Ota Set Progress|
|[**otaStartUpdateStartPost**](#otastartupdatestartpost) | **POST** /update/start | Ota Start|
|[**otaStatusUpdateStatusGet**](#otastatusupdatestatusget) | **GET** /update/status | Ota Status|

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

