# BranchUpdate


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **str** |  | [optional] 
**city** | **str** |  | [optional] 

## Example

```python
from gten_internal.models.branch_update import BranchUpdate

# TODO update the JSON string below
json = "{}"
# create an instance of BranchUpdate from a JSON string
branch_update_instance = BranchUpdate.from_json(json)
# print the JSON string representation of the object
print(BranchUpdate.to_json())

# convert the object into a dict
branch_update_dict = branch_update_instance.to_dict()
# create an instance of BranchUpdate from a dict
branch_update_from_dict = BranchUpdate.from_dict(branch_update_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


