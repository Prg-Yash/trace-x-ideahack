# PasswordUpdate


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**new_password** | **str** |  | 

## Example

```python
from gten_internal.models.password_update import PasswordUpdate

# TODO update the JSON string below
json = "{}"
# create an instance of PasswordUpdate from a JSON string
password_update_instance = PasswordUpdate.from_json(json)
# print the JSON string representation of the object
print(PasswordUpdate.to_json())

# convert the object into a dict
password_update_dict = password_update_instance.to_dict()
# create an instance of PasswordUpdate from a dict
password_update_from_dict = PasswordUpdate.from_dict(password_update_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


