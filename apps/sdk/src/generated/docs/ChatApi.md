# ChatApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**handleChatApiV1ChatPost**](ChatApi.md#handlechatapiv1chatpost) | **POST** /api/v1/chat/ | Handle Chat |



## handleChatApiV1ChatPost

> ChatResponse handleChatApiV1ChatPost(chatRequest)

Handle Chat

### Example

```ts
import {
  Configuration,
  ChatApi,
} from 'gten-internal';
import type { HandleChatApiV1ChatPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const api = new ChatApi();

  const body = {
    // ChatRequest
    chatRequest: ...,
  } satisfies HandleChatApiV1ChatPostRequest;

  try {
    const data = await api.handleChatApiV1ChatPost(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **chatRequest** | [ChatRequest](ChatRequest.md) |  | |

### Return type

[**ChatResponse**](ChatResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful Response |  -  |
| **422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

