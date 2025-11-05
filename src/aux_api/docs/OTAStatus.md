# OTAStatus

Status of the OTA update service.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**state** | [**OTAState**](OTAState.md) |  | [default to undefined]
**error** | **string** |  | [optional] [default to undefined]
**configuration** | [**OTAConfiguration**](OTAConfiguration.md) |  | [optional] [default to undefined]
**build_info** | [**RugixBuildInfo**](RugixBuildInfo.md) |  | [optional] [default to undefined]
**system_info** | [**RugixSystemInfo**](RugixSystemInfo.md) |  | [optional] [default to undefined]
**target_version** | **string** |  | [optional] [default to undefined]
**current_version** | **string** |  | [optional] [default to undefined]
**update_available** | **boolean** |  | [optional] [default to false]
**requires_commit** | **boolean** |  | [optional] [default to false]
**progress** | **number** |  | [optional] [default to undefined]
**last_checked** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { OTAStatus } from './api';

const instance: OTAStatus = {
    state,
    error,
    configuration,
    build_info,
    system_info,
    target_version,
    current_version,
    update_available,
    requires_commit,
    progress,
    last_checked,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
