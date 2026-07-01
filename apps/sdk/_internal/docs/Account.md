# Account


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**account_id** | **str** |  | 
**entity_id** | **str** |  | 
**account_type** | **str** |  | 
**kyc_tier** | **int** |  | 
**status** | **str** |  | 
**opened_on** | **date** |  | 
**risk_category** | **str** |  | 
**declared_annual_income** | **float** |  | [optional] 
**txn_count_7d** | **int** |  | [optional] [default to 0]
**txn_count_30d** | **int** |  | [optional] [default to 0]
**volume_7d** | **float** |  | [optional] [default to 0.0]
**volume_30d** | **float** |  | [optional] [default to 0.0]
**avg_monthly_volume** | **float** |  | [optional] [default to 0.0]
**avg_monthly_count** | **float** |  | [optional] [default to 0.0]
**unique_counterparties_30d** | **int** |  | [optional] [default to 0]
**last_active_ts** | **datetime** |  | [optional] 

## Example

```python
from gten_internal.models.account import Account

# TODO update the JSON string below
json = "{}"
# create an instance of Account from a JSON string
account_instance = Account.from_json(json)
# print the JSON string representation of the object
print(Account.to_json())

# convert the object into a dict
account_dict = account_instance.to_dict()
# create an instance of Account from a dict
account_from_dict = Account.from_dict(account_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


