import dotenv from 'dotenv';
dotenv.config();
import SentralSDK from '../src/SentralSDK.js'

(function Program(){
    getStudents();
})();

function getStudents(){
    let SENTRAL_DOMAIN = process.env.SENTRAL_DOMAIN;
    let SENTRAL_TENANT_SCHOOLCODE = process.env.SENTRAL_TENANT_SCHOOLCODE;
    let SENTRAL_API_KEY = process.env.SENTRAL_API_KEY;

    let auth = {
        sentralAPIKey: SENTRAL_API_KEY,
        sentralTenantSchoolCode: SENTRAL_TENANT_SCHOOLCODE,
        domain: SENTRAL_DOMAIN
    }

    let pathToSwaggerJsonFile = "./";
    let sentralSDK = SentralSDK(auth).initiateSDKFromSwaggerFile(pathToSwaggerJsonFile).getSDK();
    sentralSDK.getEnrolmentsFlag().then((response)=>console.log(response.length));
}

/**
 * https://raw.githubusercontent.com/acctech/kingjames.bible/master/kjv-src/kjv-1769.txt
 */
