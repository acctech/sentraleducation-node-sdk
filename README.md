# Sentral Education SIS - Node - SDK

#### About

Sentral Node SDK Implementation of documentation http://development.sentral.com.au/

### Description

This SDK initiates itself at runtime based on the endpoints found within the "Swagger.json" file that can be obtained from the Sentral API "http://development.sentral.com.au/" website.

Upon initiation, the endpoints get converted into function names for the API. After initiation an "assets" folder is created within the child project where the user can find endpoints.json and META.json files.

### Usage

#### Authentication

To authenticate the SDK will use the Sentral domain url which follows the format similar to "https://examplesentral.com".
Tenant school code will be the a alphanumeric 6 digit code representing the tenant.
Finally the api key will be the api key used to authenticate with the api.

A suggested Authentication method is to use dotenv to create a .env file to store the parts of authentication.

Package the three components into an auth object with the attribute names: sentralAPIKey, sentralTenantSchoolCode and domain.

e.g.

```javascript
let SENTRAL_DOMAIN = process.env.SENTRAL_DOMAIN;
let SENTRAL_TENANT_SCHOOLCODE = process.env.SENTRAL_TENANT_SCHOOLCODE;
let SENTRAL_API_KEY = process.env.SENTRAL_API_KEY;

let auth = {
  sentralAPIKey: SENTRAL_API_KEY,
  sentralTenantSchoolCode: SENTRAL_TENANT_SCHOOLCODE,
  domain: SENTRAL_DOMAIN,
};
```

... Then you can pass it to initiate the SDK.

import SentralSDK from 'sentraleducation-node-sdk';
SentralSDK(auth).initiateSDKFromSwagge...

#### Swagger File (OpenAPI specification file from "http://development.sentral.com.au/")

To intiate the SDK (inflate it) download the swagger specification file and place it within your project in a folder or root.
Pass the path to the `swagger.json` file to the `SentralSDK(auth).initiateSDKFromSwaggerFile("pathToSwaggerJSONFileHERE")`.
This method will generate an assets folder in the root of your project and save endpoint and META data of the SDK.

- Sentral instance available at the time of development only supports GET requests. So even though the POST, PATCH requests are included in the documentation and SDK, they are not supported nor implemented in the http requests engine (SentralFetch).

`getSDK()` returns the inflated objects with functions to call the endpoints.

```javascript
let pathToSwaggerJsonFile = "./";
let sentralSDK = SentralSDK(auth, pathToSwaggerJsonFile).getSDK();
sentralSDK.getEnrolmentsFlag().then((response) => console.log(response.length));
```

#### Functions

The function names can be queried at runtime using the querySDK or by looking at the META.json file.

General rule is if the endpoint is `restapi/v1/enrolments/students` and the http method is GET then the function will be getEnrolmentsStudents.
If there is an id insert in the endpoint such as `/v1/activities/activity-instance/{id}/responses` the function will be `getActivitiesActivityInstanceForIdResponses` with id as the argument of the function.

The META.json files also stores a `<endpointfunction>-about` object for each endpoint which returns the information about the endpoint function: "getActivitiesActivityInstanceForIdResponses-about".

Any additional query parameters are passed as an object into the arguments of the function after the inserts. For example: `/v1/activities/activity-instance/{id}/responses` contains a template string 'insert' and the endpoint contains query parameters such as "limit", "include", "offset". These parameters can be passed as an object for example: `{ limit: 200 }` to the function: `getActivitiesActivityInstanceForIdResponses(id, {limit: 200});`

#### META

When using meta, the included items get merged and the urls are calculated rather than using the links for pagination.
Set useMeta = true when reaching plural endpoints where the data returned requires pagination.

````
let useMeta = false;
// Inserts are the placeholders found in the url such as id in "/v1/endpoint/{id}/endpoint"

sentralSDK
  .getEnrolmentsStudentForId(anotherExtraParameters, inserts, useMeta)
  .then((response) => console.log(JSON.stringify(response, null, 2)));
```

#### Method Parameters
##### doesEndpointStringIncludeInserts? Then:

###### extraParameters: any,
- Extra Parameters to include in the url query
###### inserts: any,
Inserts are the keywords to be replaced in the url for example api/v1/users/:id/ will be replaced with value of inserts object { id: "123" }
###### useMeta: boolean, // default false
- If useMeta is false, it uses the next url in the links property of the response (means it needs to wait for next page before it knows the next url), if useMeta is true calculate the next links by using the total count. useMeta won't work for you if there is no total count returns. This is best for Get Many/All type of requests.
chunkSize?: number, // Only applies if Meta is true - it makes requests in chunks asynchronously default is 5
rawResponse?: boolean

##### Otherwise:

###### extraParameters: any,
- Extra Parameters to include in the url query
###### useMeta: boolean,
- If useMeta is false, it uses the next url in the links property of the response (means it needs to wait for next page before it knows the next url), if useMeta is true calculate the next links by using the total count. useMeta won't work for you if there is no total count returns. This is best for Get Many/All type of requests.
###### chunkSize: number,
- Only applies if Meta is true - it makes requests in chunks asynchronously default is 5
###### rawResponse?: boolean
- Returns a raw response

###### Promises

Functions return promises which the body of the response is the text returned.

For example:

```javascript
getActivitiesActivityInstanceForIdResponses(id, { limit: 200 })
.then((response) => console.log(response))
.catch(console.log);
````

```bash
[{
    id: ...,
    attributes: [...]
}]
```

## Further Readings

Recommended Reading:
https://raw.githubusercontent.com/acctech/kingjames.bible/master/kjv-src/kjv-1769.txt
