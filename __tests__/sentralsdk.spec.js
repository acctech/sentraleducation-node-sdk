const SentralSDK = require("../dist/SentralSDK.js");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

jest.setTimeout(20000);

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
  let SENTRAL_TENANT_NUMBERCODE_FOR_TESTING =
    process.env.SENTRAL_TENANT_NUMBERCODE_FOR_TESTING;

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
    let request = sentralSDK.getEnrolmentsFlag({
      extraParameters: { limit: 200 },
    });
    return await expect(request).resolves.toBeTruthy();
  });

  test("Test getting sentral status", async () => {
    let request = sentralSDK.getSentralStatus();
    return await expect(request).resolves.toBeTruthy();
  });

  test("Test getting enrolment flags using Meta > Calculating next page", async () => {
    let request = sentralSDK.getEnrolmentsFlag({
      extraParameters: { limit: 200 },
      useMeta: true,
    });
    return await expect(request).resolves.toBeTruthy();
  });

  test("Test getting enrolments enrolment using Meta > Calculating next page", async () => {
    let request = sentralSDK.getEnrolmentsFlag({
      extraParameters: { limit: 200, include: "school" },
      useMeta: true,
    });
    return await expect(request).resolves.toBeTruthy();
  });

  test("Test getting enrolments using Meta > Calculating next page", async () => {
    let request = sentralSDK.getEnrolmentsStudent({
      extraParameters: {
        limit: 50,
        tenant: SENTRAL_TENANT_NUMBERCODE_FOR_TESTING,
      },
      useMeta: true,
      chunkSize: 5,
      rawResponse: false,
    });

    // Check the length to be greater than 50 which means pagination worked.
    return expect((await request).length).toBeGreaterThan(50);
  });

  test("Test getting a rawResponse from request using Meta > Calculating next page does not paginate and returns the first page", async () => {
    let request = sentralSDK.getEnrolmentsStudent({
      extraParameters: { limit: 200 },
      useMeta: true,
      chunkSize: 5,
      rawResponse: true,
    });

    // Check that there's data property and did not paginate as we are using rawResponse (normal behaviour is not to paginate)
    return await expect(request).resolves.toHaveProperty("data");
  });

  test("Test pagination request using links returns an array of items larger than limit for expected school", async () => {
    let request = sentralSDK.getEnrolmentsStudent({
      extraParameters: {
        limit: 200,
        tenant: SENTRAL_TENANT_NUMBERCODE_FOR_TESTING,
      },
      useMeta: false,
      rawResponse: false,
    });

    // Check the length
    return expect((await request).length).toBeGreaterThan(200);
  });

  test("Test getting a photo of student on Core Student Endpoint using Meta > Calculating next page", async () => {
    let request = sentralSDK.getCoreCoreStudentForIdPhoto({
      extraParameters: { width: 1024, height: 1024 },
      inserts: { id: 4 },
      useMeta: true,
      chunkSize: 5,
      rawResponse: true,
      extraHeaders: null,
      extraAxiosSettings: {
        responseType: "arraybuffer",
      },
    });

    // Expect the request to be an image -- to be equal to typeof arraybuffer
    // <Buffer ff d8 ff e0 00 10 4a 46 49 46 00 01 01 01 00 60 00 60 00 00 ff fe
    return expect(Buffer.isBuffer((await request).data)).toBeTruthy();
  });

  test("Test getting a photo of student on Core Student Endpoint without Extra headers using Meta > Calculating next page", async () => {
    let request = sentralSDK.getCoreCoreStudentForIdPhoto({
      extraParameters: { width: 1024, height: 1024 },
      inserts: { id: 4 },
      useMeta: true,
      chunkSize: 5,
      rawResponse: true,
    });

    // Expect the request to be an image
    return expect(typeof (await request).data === "string").toBeTruthy();
  });

  // Test without using meta
  test("Test getting enrolment flags using links for pagination", async () => {
    let request = sentralSDK.getEnrolmentsFlag({
      extraParameters: { limit: 50 },
      useMeta: false,
    });
    return await expect(request).resolves.toBeTruthy();
  });

  test("Test getting enrolments enrolment using links for pagination", async () => {
    let request = sentralSDK.getEnrolmentsFlag({
      extraParameters: { limit: 50, include: "school" },
      useMeta: false,
    });

    return await expect(request).resolves.toBeTruthy();
  });

  // With out meta and raw response on
  test("Test getting a rawResponse from request using links for pagination", async () => {
    let request = sentralSDK.getEnrolmentsStudent({
      extraParameters: {
        limit: 50,
        tenant: SENTRAL_TENANT_NUMBERCODE_FOR_TESTING,
      },
      useMeta: false,
      rawResponse: true,
      verbose: true,
    });

    let response = await request;

    let count = JSON.parse(response[0].data).meta.count;
    let pages = Math.ceil(count / 50);

    console.table({
      count,
      expectedPages: pages,
      actualPages: response.length,
    });

    // Check the length
    return (
      expect(typeof response[0].data === "string").toBeTruthy() &&
      expect(response.length).toBe(pages) &&
      expect(pages).toBeGreaterThan(1)
    );
  });

  // Testing that its a rawResponse, with no links (e.g. photo) using links for pagination
  test("Test getting a rawResponse from request using links for pagination when there are none", async () => {
    let request = sentralSDK.getCoreCoreStudentForIdPhoto({
      extraParameters: { width: 1024, height: 1024 },
      inserts: { id: 4 },
      useMeta: false,
      rawResponse: true,
    });

    // Expect the request to be string testing that pagination is not used without error
    return expect(typeof (await request)[0].data === "string").toBeTruthy();
  });

  // Testing not a raw response, with no links (e.g. photo) using links for pagination
  test("Test getting a normal response from request using links for pagination when there are none", async () => {
    let request = sentralSDK.getCoreCoreStudentForIdPhoto({
      extraParameters: { width: 1024, height: 1024 },
      inserts: { id: 4 },
      useMeta: false,
      rawResponse: false,
    });

    // Expect the request to be string testing that pagination is not used without error
    return expect(typeof (await request) === "object").toBeTruthy();
  });
});
