import SentralSDK from '../src/SentralSDK.js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

describe("SentralSDK test Enrolments", () => {

    const SENTRAL_DOMAIN = process.env.SENTRAL_DOMAIN;
    const SENTRAL_TENANT_SCHOOLCODE = process.env.SENTRAL_TENANT_SCHOOLCODE;
    const SENTRAL_API_KEY = process.env.SENTRAL_API_KEY;

    const auth = {
        sentralAPIKey: SENTRAL_API_KEY,
        sentralTenantSchoolCode: SENTRAL_TENANT_SCHOOLCODE,
        domain: SENTRAL_DOMAIN
    }

    const pathToSwaggerJsonFile = "./";
    const sentralSDK = SentralSDK(auth).initiateSDKFromSwaggerFile(pathToSwaggerJsonFile).getSDK();

    test("Test getting enrolment flags", () => {  
        let request = sentralSDK.getEnrolmentsFlag({limit:200});
        return expect(request).resolves.toBeTruthy();
    });

    test("Test getting sentral status", () => {
        let request = sentralSDK.getSentralStatus();
        return expect(request).resolves.toBeTruthy();
    });
      
});