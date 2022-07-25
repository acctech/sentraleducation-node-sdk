import dotenv from "dotenv";
dotenv.config();
import SentralSDK from "../src/SentralSDK.js";

(function Program() {
  getStudents();
})();

function getStudents() {
  let SENTRAL_DOMAIN = process.env.SENTRAL_DOMAIN;
  let SENTRAL_TENANT_KEY = process.env.SENTRAL_TENANT_KEY;
  let SENTRAL_API_KEY = process.env.SENTRAL_API_KEY;

  let auth = {
    sentralAPIKey: SENTRAL_API_KEY,
    sentralTenantSchoolCode: SENTRAL_TENANT_KEY,
    domain: SENTRAL_DOMAIN,
  };

  // Initiate the SDK (this will inflate the SDK from the
  // open api json from development.sentral.com.au)
  let pathToOpenAPIJsonFileFromSentral = "./";
  let assetsFolder = "./assets";
  let sentralSDK = SentralSDK(
    auth,
    pathToOpenAPIJsonFileFromSentral,
    assetsFolder,
    true
  ).getSDK();

  /**
   * Functions will be automatically created from the endpoints
   * An endpoint that has inserts will create a function with two arguments
   * queryParameters object and inserts object. The object keys correspond with
   * the queryParameter key or insert placeholder name.
   */

  // Extra Parameters are the url query parameters
  let currentExtraParameters = { limit: 100, include: "person" };

  // // Default not using metadata
  // sentralSDK
  //   .getEnrolmentsStudent(currentExtraParameters)
  //   .then((response) => console.log(JSON.stringify(response, null, 2)));

  // Using Metadata
  sentralSDK
    .getEnrolmentsStudent(currentExtraParameters, true)
    .then((response) => console.log(JSON.stringify(response.length, null, 2)));

  // Inserts are the placeholders found in the url such as id in "/v1/endpoint/{id}/endpoint"
  // let anotherExtraParameters = { include: "person" };
  // let inserts = { id: 1 };
  // sentralSDK
  //   .getEnrolmentsStudentForId(anotherExtraParameters, inserts, false)
  //   .then((response) => console.log(JSON.stringify(response, null, 2)));

  // When using meta, the included items get merged and the urls are calculated rather than using the links for pagination
  // let useMeta = false;
  // // Inserts are the placeholders found in the url such as id in "/v1/endpoint/{id}/endpoint"
  // sentralSDK
  //   .getEnrolmentsStudentForId(anotherExtraParameters, inserts, useMeta)
  //   .then((response) => console.log(JSON.stringify(response, null, 2)));

  // Including Student for person - expected behaviour that some person objects will not have students.
  // sentralSDK
  //   .getEnrolmentsPerson({ limit: 100, include: "student" }, true)
  //   .then((response) => console.log(JSON.stringify(response, null, 2)));
}

/**
 * https://raw.githubusercontent.com/acctech/kingjames.bible/master/kjv-src/kjv-1769.txt
 */
