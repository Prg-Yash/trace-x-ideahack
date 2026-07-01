# gten_internal.AuthApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**create_user_api_v1_auth_users_post**](AuthApi.md#create_user_api_v1_auth_users_post) | **POST** /api/v1/auth/users | Create User
[**delete_user_api_v1_auth_users_user_id_delete**](AuthApi.md#delete_user_api_v1_auth_users_user_id_delete) | **DELETE** /api/v1/auth/users/{user_id} | Delete User
[**generate2fa_api_v1_auth2fa_generate_post**](AuthApi.md#generate2fa_api_v1_auth2fa_generate_post) | **POST** /api/v1/auth/2fa/generate | Generate 2Fa
[**get_investigators_api_v1_auth_users_investigators_get**](AuthApi.md#get_investigators_api_v1_auth_users_investigators_get) | **GET** /api/v1/auth/users/investigators | Get Investigators
[**login_for_access_token_api_v1_auth_login_post**](AuthApi.md#login_for_access_token_api_v1_auth_login_post) | **POST** /api/v1/auth/login | Login For Access Token
[**read_users_me_api_v1_auth_me_get**](AuthApi.md#read_users_me_api_v1_auth_me_get) | **GET** /api/v1/auth/me | Read Users Me
[**update_user_password_api_v1_auth_users_user_id_password_patch**](AuthApi.md#update_user_password_api_v1_auth_users_user_id_password_patch) | **PATCH** /api/v1/auth/users/{user_id}/password | Update User Password
[**verify2fa_api_v1_auth2fa_verify_post**](AuthApi.md#verify2fa_api_v1_auth2fa_verify_post) | **POST** /api/v1/auth/2fa/verify | Verify 2Fa


# **create_user_api_v1_auth_users_post**
> object create_user_api_v1_auth_users_post(user_create)

Create User

### Example

* OAuth Authentication (OAuth2PasswordBearer):

```python
import gten_internal
from gten_internal.models.user_create import UserCreate
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.AuthApi(api_client)
    user_create = gten_internal.UserCreate() # UserCreate | 

    try:
        # Create User
        api_response = api_instance.create_user_api_v1_auth_users_post(user_create)
        print("The response of AuthApi->create_user_api_v1_auth_users_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AuthApi->create_user_api_v1_auth_users_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **user_create** | [**UserCreate**](UserCreate.md)|  | 

### Return type

**object**

### Authorization

[OAuth2PasswordBearer](../README.md#OAuth2PasswordBearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **delete_user_api_v1_auth_users_user_id_delete**
> object delete_user_api_v1_auth_users_user_id_delete(user_id)

Delete User

### Example

* OAuth Authentication (OAuth2PasswordBearer):

```python
import gten_internal
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.AuthApi(api_client)
    user_id = 'user_id_example' # str | 

    try:
        # Delete User
        api_response = api_instance.delete_user_api_v1_auth_users_user_id_delete(user_id)
        print("The response of AuthApi->delete_user_api_v1_auth_users_user_id_delete:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AuthApi->delete_user_api_v1_auth_users_user_id_delete: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **user_id** | **str**|  | 

### Return type

**object**

### Authorization

[OAuth2PasswordBearer](../README.md#OAuth2PasswordBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **generate2fa_api_v1_auth2fa_generate_post**
> object generate2fa_api_v1_auth2fa_generate_post()

Generate 2Fa

### Example

* OAuth Authentication (OAuth2PasswordBearer):

```python
import gten_internal
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.AuthApi(api_client)

    try:
        # Generate 2Fa
        api_response = api_instance.generate2fa_api_v1_auth2fa_generate_post()
        print("The response of AuthApi->generate2fa_api_v1_auth2fa_generate_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AuthApi->generate2fa_api_v1_auth2fa_generate_post: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

**object**

### Authorization

[OAuth2PasswordBearer](../README.md#OAuth2PasswordBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_investigators_api_v1_auth_users_investigators_get**
> object get_investigators_api_v1_auth_users_investigators_get()

Get Investigators

### Example

* OAuth Authentication (OAuth2PasswordBearer):

```python
import gten_internal
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.AuthApi(api_client)

    try:
        # Get Investigators
        api_response = api_instance.get_investigators_api_v1_auth_users_investigators_get()
        print("The response of AuthApi->get_investigators_api_v1_auth_users_investigators_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AuthApi->get_investigators_api_v1_auth_users_investigators_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

**object**

### Authorization

[OAuth2PasswordBearer](../README.md#OAuth2PasswordBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **login_for_access_token_api_v1_auth_login_post**
> Token login_for_access_token_api_v1_auth_login_post(username, password, totp_code=totp_code, grant_type=grant_type, scope=scope, client_id=client_id, client_secret=client_secret)

Login For Access Token

### Example


```python
import gten_internal
from gten_internal.models.token import Token
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.AuthApi(api_client)
    username = 'username_example' # str | 
    password = 'password_example' # str | 
    totp_code = 'totp_code_example' # str |  (optional)
    grant_type = 'grant_type_example' # str |  (optional)
    scope = '' # str |  (optional) (default to '')
    client_id = 'client_id_example' # str |  (optional)
    client_secret = 'client_secret_example' # str |  (optional)

    try:
        # Login For Access Token
        api_response = api_instance.login_for_access_token_api_v1_auth_login_post(username, password, totp_code=totp_code, grant_type=grant_type, scope=scope, client_id=client_id, client_secret=client_secret)
        print("The response of AuthApi->login_for_access_token_api_v1_auth_login_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AuthApi->login_for_access_token_api_v1_auth_login_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **username** | **str**|  | 
 **password** | **str**|  | 
 **totp_code** | **str**|  | [optional] 
 **grant_type** | **str**|  | [optional] 
 **scope** | **str**|  | [optional] [default to &#39;&#39;]
 **client_id** | **str**|  | [optional] 
 **client_secret** | **str**|  | [optional] 

### Return type

[**Token**](Token.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/x-www-form-urlencoded
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **read_users_me_api_v1_auth_me_get**
> UserOut read_users_me_api_v1_auth_me_get()

Read Users Me

### Example

* OAuth Authentication (OAuth2PasswordBearer):

```python
import gten_internal
from gten_internal.models.user_out import UserOut
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.AuthApi(api_client)

    try:
        # Read Users Me
        api_response = api_instance.read_users_me_api_v1_auth_me_get()
        print("The response of AuthApi->read_users_me_api_v1_auth_me_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AuthApi->read_users_me_api_v1_auth_me_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**UserOut**](UserOut.md)

### Authorization

[OAuth2PasswordBearer](../README.md#OAuth2PasswordBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **update_user_password_api_v1_auth_users_user_id_password_patch**
> object update_user_password_api_v1_auth_users_user_id_password_patch(user_id, password_update)

Update User Password

### Example

* OAuth Authentication (OAuth2PasswordBearer):

```python
import gten_internal
from gten_internal.models.password_update import PasswordUpdate
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.AuthApi(api_client)
    user_id = 'user_id_example' # str | 
    password_update = gten_internal.PasswordUpdate() # PasswordUpdate | 

    try:
        # Update User Password
        api_response = api_instance.update_user_password_api_v1_auth_users_user_id_password_patch(user_id, password_update)
        print("The response of AuthApi->update_user_password_api_v1_auth_users_user_id_password_patch:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AuthApi->update_user_password_api_v1_auth_users_user_id_password_patch: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **user_id** | **str**|  | 
 **password_update** | [**PasswordUpdate**](PasswordUpdate.md)|  | 

### Return type

**object**

### Authorization

[OAuth2PasswordBearer](../README.md#OAuth2PasswordBearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **verify2fa_api_v1_auth2fa_verify_post**
> object verify2fa_api_v1_auth2fa_verify_post(totp_code)

Verify 2Fa

### Example

* OAuth Authentication (OAuth2PasswordBearer):

```python
import gten_internal
from gten_internal.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = gten_internal.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with gten_internal.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = gten_internal.AuthApi(api_client)
    totp_code = 'totp_code_example' # str | 

    try:
        # Verify 2Fa
        api_response = api_instance.verify2fa_api_v1_auth2fa_verify_post(totp_code)
        print("The response of AuthApi->verify2fa_api_v1_auth2fa_verify_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AuthApi->verify2fa_api_v1_auth2fa_verify_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **totp_code** | **str**|  | 

### Return type

**object**

### Authorization

[OAuth2PasswordBearer](../README.md#OAuth2PasswordBearer)

### HTTP request headers

 - **Content-Type**: application/x-www-form-urlencoded
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

