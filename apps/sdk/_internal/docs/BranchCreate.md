# BranchCreate


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**branch_code** | **str** |  | 
**name** | **str** |  | 
**city** | **str** |  | [optional] 

## Example

```python
from gten_internal.models.branch_create import BranchCreate

# TODO update the JSON string below
json = "{}"
# create an instance of BranchCreate from a JSON string
branch_create_instance = BranchCreate.from_json(json)
# print the JSON string representation of the object
print(BranchCreate.to_json())

# convert the object into a dict
branch_create_dict = branch_create_instance.to_dict()
# create an instance of BranchCreate from a dict
branch_create_from_dict = BranchCreate.from_dict(branch_create_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


