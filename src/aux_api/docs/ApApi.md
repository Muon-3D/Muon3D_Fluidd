# ApApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apDownWifiApDownPost**](#apdownwifiapdownpost) | **POST** /wifi/ap/down | Ap Down|
|[**apModifyWifiApModifyPost**](#apmodifywifiapmodifypost) | **POST** /wifi/ap/modify | Ap Modify|
|[**apShowCredentialsWifiApShowGet**](#apshowcredentialswifiapshowget) | **GET** /wifi/ap/show | Ap Show Credentials|
|[**apUpWifiApUpPost**](#apupwifiapuppost) | **POST** /wifi/ap/up | Ap Up|
|[**countStationsWifiApCountPost**](#countstationswifiapcountpost) | **POST** /wifi/ap/count | Count Stations|
|[**wifiStatusWifiApDeviceStatusGet**](#wifistatuswifiapdevicestatusget) | **GET** /wifi/ap/device/status | Wifi Status|

# **apDownWifiApDownPost**
> any apDownWifiApDownPost()

Bring the AP connection down.

### Example

```typescript
import {
    ApApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApApi(configuration);

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

# **apModifyWifiApModifyPost**
> any apModifyWifiApModifyPost(aPCredentials)

Modify AP settings: SSID, optional WPA2 PSK, and autoconnect flag.

### Example

```typescript
import {
    ApApi,
    Configuration,
    APCredentials
} from './api';

const configuration = new Configuration();
const apiInstance = new ApApi(configuration);

let aPCredentials: APCredentials; //

const { status, data } = await apiInstance.apModifyWifiApModifyPost(
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
    ApApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApApi(configuration);

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
    ApApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApApi(configuration);

const { status, data } = await apiInstance.apUpWifiApUpPost();
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

# **countStationsWifiApCountPost**
> number countStationsWifiApCountPost()


### Example

```typescript
import {
    ApApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApApi(configuration);

const { status, data } = await apiInstance.countStationsWifiApCountPost();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**number**

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

# **wifiStatusWifiApDeviceStatusGet**
> Device wifiStatusWifiApDeviceStatusGet()


### Example

```typescript
import {
    ApApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApApi(configuration);

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

