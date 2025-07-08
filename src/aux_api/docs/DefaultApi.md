# DefaultApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apDownWifiApDownPost**](#apdownwifiapdownpost) | **POST** /wifi/ap/down | Ap Down|
|[**apModifyWifiApModifyPatch**](#apmodifywifiapmodifypatch) | **PATCH** /wifi/ap/modify | Ap Modify|
|[**apShowCredentialsWifiApShowGet**](#apshowcredentialswifiapshowget) | **GET** /wifi/ap/show | Ap Show Credentials|
|[**apUpWifiApUpPost**](#apupwifiapuppost) | **POST** /wifi/ap/up | Ap Up|
|[**getDetailsWifiShowGet**](#getdetailswifishowget) | **GET** /wifi/show | Get Details|
|[**wifiConnectWifiConnectPost**](#wificonnectwificonnectpost) | **POST** /wifi/connect | Wifi Connect|
|[**wifiCurrentWifiCurrentGet**](#wificurrentwificurrentget) | **GET** /wifi/current | Wifi Current|
|[**wifiDisconnectWifiDisconnectPost**](#wifidisconnectwifidisconnectpost) | **POST** /wifi/disconnect | Wifi Disconnect|
|[**wifiForgetWifiForgetDelete**](#wififorgetwififorgetdelete) | **DELETE** /wifi/forget | Wifi Forget|
|[**wifiScanWifiScanGet**](#wifiscanwifiscanget) | **GET** /wifi/scan | Wifi Scan|
|[**wifiStatusWifiApDeviceStatusGet**](#wifistatuswifiapdevicestatusget) | **GET** /wifi/ap/device_status | Wifi Status|
|[**wifiStatusWifiDeviceStatusGet**](#wifistatuswifidevicestatusget) | **GET** /wifi/device_status | Wifi Status|
|[**wifiSwitchWifiUpPost**](#wifiswitchwifiuppost) | **POST** /wifi/up | Wifi Switch|

# **apDownWifiApDownPost**
> any apDownWifiApDownPost()

Bring the AP connection down.

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

const { status, data } = await apiInstance.apDownWifiApDownPost();
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

# **apModifyWifiApModifyPatch**
> any apModifyWifiApModifyPatch(aPCredentials)

Modify AP settings: SSID, optional WPA2 PSK, and autoconnect flag.

### Example

```typescript
import {
    DefaultApi,
    Configuration,
    APCredentials
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let aPCredentials: APCredentials; //

const { status, data } = await apiInstance.apModifyWifiApModifyPatch(
    aPCredentials
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **aPCredentials** | **APCredentials**|  | |


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

# **apShowCredentialsWifiApShowGet**
> APCredentials apShowCredentialsWifiApShowGet()

Get just the SSID, PSK (if any), and autoconnect flag from the AP profile.

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

const { status, data } = await apiInstance.apShowCredentialsWifiApShowGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**APCredentials**

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

# **apUpWifiApUpPost**
> any apUpWifiApUpPost()

Bring the AP connection up; optionally modify parameters first.

### Example

```typescript
import {
    DefaultApi,
    Configuration,
    APCredentials
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let aPCredentials: APCredentials; // (optional)

const { status, data } = await apiInstance.apUpWifiApUpPost(
    aPCredentials
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **aPCredentials** | **APCredentials**|  | |


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

# **getDetailsWifiShowGet**
> { [key: string]: ResponseGetDetailsWifiShowGetValue; } getDetailsWifiShowGet()

Show all connection profiles

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

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
    DefaultApi,
    Configuration,
    Credentials
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

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
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

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

# **wifiDisconnectWifiDisconnectPost**
> any wifiDisconnectWifiDisconnectPost()

Disconnect from the current Wi-Fi network.

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

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
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

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

Scan for available Wi-Fi networks. Set ?rescan=true to force a fresh scan.

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

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

# **wifiStatusWifiApDeviceStatusGet**
> Device wifiStatusWifiApDeviceStatusGet()


### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

const { status, data } = await apiInstance.wifiStatusWifiApDeviceStatusGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Device**

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

# **wifiStatusWifiDeviceStatusGet**
> Device wifiStatusWifiDeviceStatusGet()


### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

const { status, data } = await apiInstance.wifiStatusWifiDeviceStatusGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Device**

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
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

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

