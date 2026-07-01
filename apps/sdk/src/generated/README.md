# gten-internal@1.0.0

A TypeScript SDK client for the localhost API.

## Usage

First, install the SDK from npm.

```bash
npm install gten-internal --save
```

Next, try it out.


```ts
import {
  Configuration,
  AuthApi,
} from 'gten-internal';
import type { CreateUserApiV1AuthUsersPostRequest } from 'gten-internal';

async function example() {
  console.log("🚀 Testing gten-internal SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: OAuth2PasswordBearer password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new AuthApi(config);

  const body = {
    // UserCreate
    userCreate: ...,
  } satisfies CreateUserApiV1AuthUsersPostRequest;

  try {
    const data = await api.createUserApiV1AuthUsersPost(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```


## Documentation

### API Endpoints

All URIs are relative to *http://localhost*

| Class | Method | HTTP request | Description
| ----- | ------ | ------------ | -------------
*AuthApi* | [**createUserApiV1AuthUsersPost**](docs/AuthApi.md#createuserapiv1authuserspost) | **POST** /api/v1/auth/users | Create User
*AuthApi* | [**deleteUserApiV1AuthUsersUserIdDelete**](docs/AuthApi.md#deleteuserapiv1authusersuseriddelete) | **DELETE** /api/v1/auth/users/{user_id} | Delete User
*AuthApi* | [**generate2faApiV1Auth2faGeneratePost**](docs/AuthApi.md#generate2faapiv1auth2fageneratepost) | **POST** /api/v1/auth/2fa/generate | Generate 2Fa
*AuthApi* | [**getInvestigatorsApiV1AuthUsersInvestigatorsGet**](docs/AuthApi.md#getinvestigatorsapiv1authusersinvestigatorsget) | **GET** /api/v1/auth/users/investigators | Get Investigators
*AuthApi* | [**loginForAccessTokenApiV1AuthLoginPost**](docs/AuthApi.md#loginforaccesstokenapiv1authloginpost) | **POST** /api/v1/auth/login | Login For Access Token
*AuthApi* | [**readUsersMeApiV1AuthMeGet**](docs/AuthApi.md#readusersmeapiv1authmeget) | **GET** /api/v1/auth/me | Read Users Me
*AuthApi* | [**updateUserPasswordApiV1AuthUsersUserIdPasswordPatch**](docs/AuthApi.md#updateuserpasswordapiv1authusersuseridpasswordpatch) | **PATCH** /api/v1/auth/users/{user_id}/password | Update User Password
*AuthApi* | [**verify2faApiV1Auth2faVerifyPost**](docs/AuthApi.md#verify2faapiv1auth2faverifypost) | **POST** /api/v1/auth/2fa/verify | Verify 2Fa
*BranchesApi* | [**createBranchApiV1BranchesPost**](docs/BranchesApi.md#createbranchapiv1branchespost) | **POST** /api/v1/branches | Create Branch
*BranchesApi* | [**deleteBranchApiV1BranchesBranchIdDelete**](docs/BranchesApi.md#deletebranchapiv1branchesbranchiddelete) | **DELETE** /api/v1/branches/{branch_id} | Delete Branch
*BranchesApi* | [**getBranchesApiV1BranchesGet**](docs/BranchesApi.md#getbranchesapiv1branchesget) | **GET** /api/v1/branches | Get Branches
*BranchesApi* | [**updateBranchApiV1BranchesBranchIdPatch**](docs/BranchesApi.md#updatebranchapiv1branchesbranchidpatch) | **PATCH** /api/v1/branches/{branch_id} | Update Branch
*ChatApi* | [**handleChatApiV1ChatPost**](docs/ChatApi.md#handlechatapiv1chatpost) | **POST** /api/v1/chat/ | Handle Chat
*DataApi* | [**addAccountNoteApiV1AccountsAccountIdNotesPost**](docs/DataApi.md#addaccountnoteapiv1accountsaccountidnotespost) | **POST** /api/v1/accounts/{account_id}/notes | Add Account Note
*DataApi* | [**getAccountApiV1AccountsAccountIdGet**](docs/DataApi.md#getaccountapiv1accountsaccountidget) | **GET** /api/v1/accounts/{account_id} | Get Account
*DataApi* | [**getAccountNotesApiV1AccountsAccountIdNotesGet**](docs/DataApi.md#getaccountnotesapiv1accountsaccountidnotesget) | **GET** /api/v1/accounts/{account_id}/notes | Get Account Notes
*DataApi* | [**getAllAccountsApiV1AccountsGet**](docs/DataApi.md#getallaccountsapiv1accountsget) | **GET** /api/v1/accounts | Get All Accounts
*DataApi* | [**getAllTransactionsApiV1TransactionsGet**](docs/DataApi.md#getalltransactionsapiv1transactionsget) | **GET** /api/v1/transactions | Get All Transactions
*DataApi* | [**getTransactionApiV1TransactionsTxnIdGet**](docs/DataApi.md#gettransactionapiv1transactionstxnidget) | **GET** /api/v1/transactions/{txn_id} | Get Transaction
*DefaultApi* | [**configStreamApiV1StreamConfigPost**](docs/DefaultApi.md#configstreamapiv1streamconfigpost) | **POST** /api/v1/stream/config | Config Stream
*DefaultApi* | [**injectFraudApiV1StreamInjectPost**](docs/DefaultApi.md#injectfraudapiv1streaminjectpost) | **POST** /api/v1/stream/inject | Inject Fraud
*DefaultApi* | [**readRootGet**](docs/DefaultApi.md#readrootget) | **GET** / | Read Root
*DefaultApi* | [**resetDemoDataApiV1StreamResetDelete**](docs/DefaultApi.md#resetdemodataapiv1streamresetdelete) | **DELETE** /api/v1/stream/reset | Reset Demo Data
*DefaultApi* | [**startStreamApiV1StreamStartPost**](docs/DefaultApi.md#startstreamapiv1streamstartpost) | **POST** /api/v1/stream/start | Start Stream
*DefaultApi* | [**stopStreamApiV1StreamStopPost**](docs/DefaultApi.md#stopstreamapiv1streamstoppost) | **POST** /api/v1/stream/stop | Stop Stream
*DefaultApi* | [**streamStatusApiV1StreamStatusGet**](docs/DefaultApi.md#streamstatusapiv1streamstatusget) | **GET** /api/v1/stream/status | Stream Status
*DemoApi* | [**cleanupDemoApiV1DemoCleanupDelete**](docs/DemoApi.md#cleanupdemoapiv1democleanupdelete) | **DELETE** /api/v1/demo/cleanup | Cleanup Demo
*DemoApi* | [**injectDemoApiV1DemoInjectPost**](docs/DemoApi.md#injectdemoapiv1demoinjectpost) | **POST** /api/v1/demo/inject | Inject Demo
*FraudApi* | [**createAccountApiV1AccountsPost**](docs/FraudApi.md#createaccountapiv1accountspost) | **POST** /api/v1/accounts | Create Account
*FraudApi* | [**createTransactionApiV1TransactionsPost**](docs/FraudApi.md#createtransactionapiv1transactionspost) | **POST** /api/v1/transactions | Create Transaction
*FraudApi* | [**getAlertDetailsApiV1AlertsAlertIdGet**](docs/FraudApi.md#getalertdetailsapiv1alertsalertidget) | **GET** /api/v1/alerts/{alert_id} | Get Alert Details
*FraudApi* | [**getAlertsQuickApiV1AlertsQuickGet**](docs/FraudApi.md#getalertsquickapiv1alertsquickget) | **GET** /api/v1/alerts/quick | Get Alerts Quick
*FraudApi* | [**getBranchChannelAnalyticsApiV1AnalyticsBranchChannelGet**](docs/FraudApi.md#getbranchchannelanalyticsapiv1analyticsbranchchannelget) | **GET** /api/v1/analytics/branch-channel | Get Branch Channel Analytics
*FraudApi* | [**getDormantExplanationApiV1ExplainAccountIdDormantGet**](docs/FraudApi.md#getdormantexplanationapiv1explainaccountiddormantget) | **GET** /api/v1/explain/{account_id}/dormant | Get Dormant Explanation
*FraudApi* | [**getDormantExplanationApiV1ExplainDormantAccountIdGet**](docs/FraudApi.md#getdormantexplanationapiv1explaindormantaccountidget) | **GET** /api/v1/explain/dormant/{account_id} | Get Dormant Explanation
*FraudApi* | [**getFullExplanationApiV1ExplainAccountIdGet**](docs/FraudApi.md#getfullexplanationapiv1explainaccountidget) | **GET** /api/v1/explain/{account_id} | Get Full Explanation
*FraudApi* | [**getKycExplanationApiV1ExplainAccountIdKycGet**](docs/FraudApi.md#getkycexplanationapiv1explainaccountidkycget) | **GET** /api/v1/explain/{account_id}/kyc | Get Kyc Explanation
*FraudApi* | [**getKycMismatchExplanationApiV1ExplainKycMismatchAccountIdGet**](docs/FraudApi.md#getkycmismatchexplanationapiv1explainkycmismatchaccountidget) | **GET** /api/v1/explain/kyc_mismatch/{account_id} | Get Kyc Mismatch Explanation
*FraudApi* | [**getLiveFeedApiV1FeedGet**](docs/FraudApi.md#getlivefeedapiv1feedget) | **GET** /api/v1/feed | Get Live Feed
*FraudApi* | [**getNarrativeApiV1NarrativeAccountIdPost**](docs/FraudApi.md#getnarrativeapiv1narrativeaccountidpost) | **POST** /api/v1/narrative/{account_id} | Get Narrative
*FraudApi* | [**getReportApiV1ReportAccountIdGet**](docs/FraudApi.md#getreportapiv1reportaccountidget) | **GET** /api/v1/report/{account_id} | Get Report
*FraudApi* | [**getScoreApiV1ScoreAccountIdGet**](docs/FraudApi.md#getscoreapiv1scoreaccountidget) | **GET** /api/v1/score/{account_id} | Get Score
*FraudApi* | [**getSmurfingExplanationApiV1ExplainAccountIdSmurfingGet**](docs/FraudApi.md#getsmurfingexplanationapiv1explainaccountidsmurfingget) | **GET** /api/v1/explain/{account_id}/smurfing | Get Smurfing Explanation
*FraudApi* | [**getSmurfingExplanationApiV1ExplainSmurfingAccountIdGet**](docs/FraudApi.md#getsmurfingexplanationapiv1explainsmurfingaccountidget) | **GET** /api/v1/explain/smurfing/{account_id} | Get Smurfing Explanation
*FraudApi* | [**getStatsApiV1StatsGet**](docs/FraudApi.md#getstatsapiv1statsget) | **GET** /api/v1/stats | Get Stats
*FraudApi* | [**getTraceApiV1TraceAccountIdGet**](docs/FraudApi.md#gettraceapiv1traceaccountidget) | **GET** /api/v1/trace/{account_id} | Get Trace
*FraudApi* | [**updateAlertStatusApiV1AlertsAlertIdStatusPatch**](docs/FraudApi.md#updatealertstatusapiv1alertsalertidstatuspatch) | **PATCH** /api/v1/alerts/{alert_id}/status | Update Alert Status
*HealthApi* | [**healthCheckApiV1HealthGet**](docs/HealthApi.md#healthcheckapiv1healthget) | **GET** /api/v1/health | Health Check
*SchemaApi* | [**setupSchemaApiV1SchemaSetupPost**](docs/SchemaApi.md#setupschemaapiv1schemasetuppost) | **POST** /api/v1/schema/setup | Setup Schema
*WorkflowApi* | [**approveStrApiV1AlertsAlertIdApproveStrPost**](docs/WorkflowApi.md#approvestrapiv1alertsalertidapprovestrpost) | **POST** /api/v1/alerts/{alert_id}/approve-str | Approve Str
*WorkflowApi* | [**assignAlertApiV1AlertsAlertIdAssignPost**](docs/WorkflowApi.md#assignalertapiv1alertsalertidassignpost) | **POST** /api/v1/alerts/{alert_id}/assign | Assign Alert
*WorkflowApi* | [**draftStrApiV1AlertsAlertIdDraftStrPost**](docs/WorkflowApi.md#draftstrapiv1alertsalertiddraftstrpost) | **POST** /api/v1/alerts/{alert_id}/draft-str | Draft Str
*WorkflowApi* | [**getAuditTrailApiV1AlertsAlertIdAuditGet**](docs/WorkflowApi.md#getaudittrailapiv1alertsalertidauditget) | **GET** /api/v1/alerts/{alert_id}/audit | Get Audit Trail
*WorkflowApi* | [**rejectStrApiV1AlertsAlertIdRejectStrPost**](docs/WorkflowApi.md#rejectstrapiv1alertsalertidrejectstrpost) | **POST** /api/v1/alerts/{alert_id}/reject-str | Reject Str


### Models

- [Account](docs/Account.md)
- [AlertStatusUpdate](docs/AlertStatusUpdate.md)
- [AssignRequest](docs/AssignRequest.md)
- [BranchCreate](docs/BranchCreate.md)
- [BranchUpdate](docs/BranchUpdate.md)
- [ChatRequest](docs/ChatRequest.md)
- [ChatResponse](docs/ChatResponse.md)
- [HTTPValidationError](docs/HTTPValidationError.md)
- [HistoryTurn](docs/HistoryTurn.md)
- [InjectPatternRequest](docs/InjectPatternRequest.md)
- [LocationInner](docs/LocationInner.md)
- [NarrativeRequest](docs/NarrativeRequest.md)
- [NoteCreate](docs/NoteCreate.md)
- [PasswordUpdate](docs/PasswordUpdate.md)
- [StreamConfigRequest](docs/StreamConfigRequest.md)
- [Token](docs/Token.md)
- [Transaction](docs/Transaction.md)
- [UserCreate](docs/UserCreate.md)
- [UserOut](docs/UserOut.md)
- [ValidationError](docs/ValidationError.md)

### Authorization


Authentication schemes defined for the API:
<a id="OAuth2PasswordBearer-password"></a>
#### OAuth2PasswordBearer password


- **Type**: OAuth
- **Flow**: password
- **Authorization URL**: 
- **Scopes**: N/A

## About

This TypeScript SDK client supports the [Fetch API](https://fetch.spec.whatwg.org/)
and is automatically generated by the
[OpenAPI Generator](https://openapi-generator.tech) project:

- API version: `0.1.0`
- Package version: `1.0.0`
- Generator version: `7.23.0`
- Build package: `org.openapitools.codegen.languages.TypeScriptFetchClientCodegen`

The generated npm module supports the following:

- Environments
  * Node.js
  * Webpack
  * Browserify
- Language levels
  * ES5 - you must have a Promises/A+ library installed
  * ES6
- Module systems
  * CommonJS
  * ES6 module system


## Development

### Building

To build the TypeScript source code, you need to have Node.js and npm installed.
After cloning the repository, navigate to the project directory and run:

```bash
npm install
npm run build
```

### Publishing

Once you've built the package, you can publish it to npm:

```bash
npm publish
```

## License

[]()
