const SentralSDK = require("../dist/SentralSDK.js");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

function deleteAssetsFolder() {
  if (fs.existsSync("assets")) {
    fs.rmSync("assets", { recursive: true });
  }
}

beforeEach(() => {
  deleteAssetsFolder();
});

describe("Check Credentials", () => {
  test("Check Credentials", () => {
    expect(process.env.SENTRAL_DOMAIN).toBeTruthy();
    expect(process.env.SENTRAL_TENANT_KEY).toBeTruthy();
    expect(process.env.SENTRAL_API_KEY).toBeTruthy();
  });
});

describe("SentralSDK Swagger File", () => {
  let SENTRAL_DOMAIN = process.env.SENTRAL_DOMAIN;
  let SENTRAL_TENANT_KEY = process.env.SENTRAL_TENANT_KEY;
  let SENTRAL_API_KEY = process.env.SENTRAL_API_KEY;

  let auth = {
    sentralAPIKey: SENTRAL_API_KEY,
    sentralTenantSchoolCode: SENTRAL_TENANT_KEY,
    domain: SENTRAL_DOMAIN,
  };

  test("Swagger File Still loads if its in root folder even if no folder is given", () => {
    // Initiate the SDK (this will inflate the SDK from the
    // open api json from development.sentral.com.au)
    let pathToOpenAPIJsonFileFromSentral = null;
    let assetsFolder = "./assets";
    expect(() => {
      let sentralSDK = SentralSDK(
        auth,
        pathToOpenAPIJsonFileFromSentral,
        assetsFolder,
        true
      ).getSDK();
    }).toThrow();
  });

  test("Swagger file missing", () => {
    // Initiate the SDK (this will inflate the SDK from the
    // open api json from development.sentral.com.au)
    let pathToOpenAPIJsonFileFromSentral = "./example";
    let assetsFolder = "./assets";
    expect(() => {
      let sentralSDK = SentralSDK(
        auth,
        pathToOpenAPIJsonFileFromSentral,
        assetsFolder,
        true
      ).getSDK();
    }).toThrow();
  });
});

describe("SentralSDK test Enrolments", () => {
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

  test("Test getting enrolment flags", async () => {
    let request = sentralSDK.getEnrolmentsFlag({ limit: 200 });
    return await expect(request).resolves.toBeTruthy();
  });

  test("Test getting sentral status", async () => {
    let request = sentralSDK.getSentralStatus();
    return await expect(request).resolves.toBeTruthy();
  });

  test("Test getting enrolment flags using Meta", async () => {
    let request = sentralSDK.getEnrolmentsFlag({ limit: 200 }, true);
    return await expect(request).resolves.toBeTruthy();
  });

  test("Test getting enrolments enrolment using Meta", async () => {
    let request = sentralSDK.getEnrolmentsFlag(
      { limit: 200, include: "school" },
      true
    );
    return await expect(request).resolves.toBeTruthy();
  });

  test("Test getting a rawresponse from request", async () => {
    let request = sentralSDK.getEnrolmentsStudent(
      { limit: 200 },
      true,
      null,
      true
    );

    // Check the length
    return await expect(request).resolves.toHaveProperty("data");
  });

  test("Test getting a photo of student on Core Student Endpoint", async () => {
    let request = sentralSDK.getCoreCoreStudentForIdPhoto(
      { width: 1024, height: 1024 },
      { id: 4 },
      true,
      null,
      true,
      null,
      {
        responseType: "arraybuffer",
      }
    );

    // Expect the request to be an image -- to be equal to typeof arraybuffer
    // <Buffer ff d8 ff e0 00 10 4a 46 49 46 00 01 01 01 00 60 00 60 00 00 ff fe
    return expect(Buffer.isBuffer((await request).data)).toBeTruthy();
  });

  test("Test getting a photo of student on Core Student Endpoint without Extra headers", async () => {
    let request = sentralSDK.getCoreCoreStudentForIdPhoto(
      { width: 1024, height: 1024 },
      { id: 4 },
      true,
      null,
      true
    );

    // Expect the request to be an image
    return expect(typeof (await request).data === "string").toBeTruthy();
  });
});
