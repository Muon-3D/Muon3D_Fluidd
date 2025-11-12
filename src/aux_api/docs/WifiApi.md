# WifiApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getDetailsWifiShowGet**](#getdetailswifishowget) | **GET** /wifi/show | Get Details|
|[**wifiConnectWifiConnectPost**](#wificonnectwificonnectpost) | **POST** /wifi/connect | Wifi Connect|
|[**wifiCurrentWifiCurrentGet**](#wificurrentwificurrentget) | **GET** /wifi/current | Wifi Current|
|[**wifiDeviceDownWifiDeviceDownPost**](#wifidevicedownwifidevicedownpost) | **POST** /wifi/device/down | Wifi Device Down|
|[**wifiDeviceUpWifiDeviceUpPost**](#wifideviceupwifideviceuppost) | **POST** /wifi/device/up | Wifi Device Up|
|[**wifiDisconnectWifiDisconnectPost**](#wifidisconnectwifidisconnectpost) | **POST** /wifi/disconnect | Wifi Disconnect|
|[**wifiForgetWifiForgetDelete**](#wififorgetwififorgetdelete) | **DELETE** /wifi/forget | Wifi Forget|
|[**wifiScanWifiScanGet**](#wifiscanwifiscanget) | **GET** /wifi/scan | Wifi Scan|
|[**wifiStatusWifiDeviceStatusGet**](#wifistatuswifidevicestatusget) | **GET** /wifi/device/status | Wifi Status|
|[**wifiSwitchWifiUpPost**](#wifiswitchwifiuppost) | **POST** /wifi/up | Wifi Switch|

# **getDetailsWifiShowGet**
> { [key: string]: ResponseGetDetailsWifiShowGetValue; } getDetailsWifiShowGet()

Show all connection profiles

### Example

```typescript
import {
    WifiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WifiApi(configuration);

let ssid: string; // (default to undefined)

const { status, data } = await apiInstance.getDetailsWifiShowGet(
    ssid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ssid** | [**string**] |  | defaults to undefined|


### Return type

**{ [key: string]: ResponseGetDetailsWifiShowGetValue; }**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **wifiConnectWifiConnectPost**
> any wifiConnectWifiConnectPost(credentials)

Connect to an SSID (with optional password).

### Example

```typescript
import {
    WifiApi,
    Configuration,
    Credentials
} from './api';

const configuration = new Configuration();
const apiInstance = new WifiApi(configuration);

let credentials: Credentials; //

const { status, data } = await apiInstance.wifiConnectWifiConnectPost(
    credentials
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **credentials** | **Credentials**|  | |


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

# **wifiCurrentWifiCurrentGet**
> DeviceWifi wifiCurrentWifiCurrentGet()

Return the currently active Wi-Fi connection, or null if none.

### Example

```typescript
import {
    WifiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WifiApi(configuration);

let update: boolean; // (optional) (default to true)

const { status, data } = await apiInstance.wifiCurrentWifiCurrentGet(
    update
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **update** | [**boolean**] |  | (optional) defaults to true|


### Return type

**DeviceWifi**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **wifiDeviceDownWifiDeviceDownPost**
> any wifiDeviceDownWifiDeviceDownPost()

Bring the wifi device down.

### Example

```typescript
import {
    WifiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WifiApi(configuration);

const { status, data } = await apiInstance.wifiDeviceDownWifiDeviceDownPost();
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

# **wifiDeviceUpWifiDeviceUpPost**
> any wifiDeviceUpWifiDeviceUpPost()

Bring the  wifi device up.

### Example

```typescript
import {
    WifiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WifiApi(configuration);

const { status, data } = await apiInstance.wifiDeviceUpWifiDeviceUpPost();
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

# **wifiDisconnectWifiDisconnectPost**
> any wifiDisconnectWifiDisconnectPost()

Disconnect from the current Wi-Fi network.

### Example

```typescript
import {
    WifiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WifiApi(configuration);

const { status, data } = await apiInstance.wifiDisconnectWifiDisconnectPost();
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

# **wifiForgetWifiForgetDelete**
> any wifiForgetWifiForgetDelete()

Permanently delete the current Wi-Fi connection profile.

### Example

```typescript
import {
    WifiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WifiApi(configuration);

let ssid: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.wifiForgetWifiForgetDelete(
    ssid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ssid** | [**string**] |  | (optional) defaults to undefined|


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
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **wifiScanWifiScanGet**
> Array<DeviceWifi> wifiScanWifiScanGet()

Scan for available Wi-Fi networks. Only performs a fresh scan if `rescan` is True and it hasn\'t rescanned in the last SCAN_TTL seconds.

### Example

```typescript
import {
    WifiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WifiApi(configuration);

let rescan: boolean; // (optional) (default to true)

const { status, data } = await apiInstance.wifiScanWifiScanGet(
    rescan
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **rescan** | [**boolean**] |  | (optional) defaults to true|


### Return type

**Array<DeviceWifi>**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **wifiStatusWifiDeviceStatusGet**
> DeviceStatus wifiStatusWifiDeviceStatusGet()


### Example

```typescript
import {
    WifiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WifiApi(configuration);

const { status, data } = await apiInstance.wifiStatusWifiDeviceStatusGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**DeviceStatus**

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

# **wifiSwitchWifiUpPost**
> any wifiSwitchWifiUpPost()

Start or switch to a known connection by its SSID.

### Example

```typescript
import {
    WifiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WifiApi(configuration);

let ssid: string; // (default to undefined)

const { status, data } = await apiInstance.wifiSwitchWifiUpPost(
    ssid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ssid** | [**string**] |  | defaults to undefined|


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
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

