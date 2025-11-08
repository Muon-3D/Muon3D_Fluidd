# DevModeApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getDevModeStatusDevModeGet**](#getdevmodestatusdevmodeget) | **GET** /dev_mode | Get Dev Mode Status|
|[**manualBackupDevModeBackupPost**](#manualbackupdevmodebackuppost) | **POST** /dev_mode/backup | Manual Backup|
|[**refreshDevModeConfigDevModeRefreshPost**](#refreshdevmodeconfigdevmoderefreshpost) | **POST** /dev_mode/refresh | Refresh Dev Mode Config|
|[**setDevModeDevModePost**](#setdevmodedevmodepost) | **POST** /dev_mode | Set Dev Mode|

# **getDevModeStatusDevModeGet**
> DevModeStatus getDevModeStatusDevModeGet()

Dev mode is TRUE if CORE_CFG == DEV_MODE_CORE_CFG, FALSE if CORE_CFG == OEM_CORE_CFG, ERROR otherwise.

### Example

```typescript
import {
    DevModeApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DevModeApi(configuration);

const { status, data } = await apiInstance.getDevModeStatusDevModeGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**DevModeStatus**

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

# **manualBackupDevModeBackupPost**
> any manualBackupDevModeBackupPost()

Create a timestamped backup of the current dev-mode working directory. Only valid while dev mode is enabled.

### Example

```typescript
import {
    DevModeApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DevModeApi(configuration);

const { status, data } = await apiInstance.manualBackupDevModeBackupPost();
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

# **refreshDevModeConfigDevModeRefreshPost**
> any refreshDevModeConfigDevModeRefreshPost()

Refresh the developer-mode working copy from OEM core. Only valid while dev mode is enabled.  Steps:   * backup DEV_MODE_DIR to backups/<timestamp> (excluding backups)   * clear DEV_MODE_DIR except \'backups\'   * copy OEM_CORE_DIR into DEV_MODE_DIR

### Example

```typescript
import {
    DevModeApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DevModeApi(configuration);

const { status, data } = await apiInstance.refreshDevModeConfigDevModeRefreshPost();
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

# **setDevModeDevModePost**
> DevModeStatus setDevModeDevModePost(devModeToggle)

Enable/disable Developer Mode.  - true from false:     * backup existing DEV_MODE_DIR if it exists     * refresh DEV_MODE_DIR from OEM_CORE_DIR     * set cm4 flag     * set CORE_CFG to DEV_MODE_CORE_CFG     * restart klipper - false from true:     * set CORE_CFG to OEM_CORE_CFG     * restart klipper - no state change: no-op

### Example

```typescript
import {
    DevModeApi,
    Configuration,
    DevModeToggle
} from './api';

const configuration = new Configuration();
const apiInstance = new DevModeApi(configuration);

let devModeToggle: DevModeToggle; //

const { status, data } = await apiInstance.setDevModeDevModePost(
    devModeToggle
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **devModeToggle** | **DevModeToggle**|  | |


### Return type

**DevModeStatus**

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

