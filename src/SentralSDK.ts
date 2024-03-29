/**
 * @author Danny Falero
 * @copyright Copyright 2021 Christian Education Ministries, all rights reserved.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * https://raw.githubusercontent.com/acctech/kingjames.bible/master/kjv-src/kjv-1769.txt
 */

import SentralFetchRateLimited from "./SentralFetch.js";
import fetchAllWithMeta from "./SentralFetchUseMeta.js";
import Cacher from "simple-object-to-json-cacher";
import SwaggerFileImporter from "./SwaggerFileImporter.js";
import fs from "fs";
import path from "path";
import { AxiosHeaders, AxiosRequestConfig } from "axios";

// Create a typescript definition for the endpoing config
interface EndpointConfig {
  endpoint: string;
  extraParameters: any;
  inserts: any;
  useMeta: boolean;
  chunkSize: number;
  rawResponse: boolean;
  extraHeaders: AxiosHeaders;
  extraAxiosSettings: AxiosRequestConfig;
  verbose: boolean;
}

export = async function SentralSDK(
  this: any,
  auth: {
    sentralAPIKey: string;
    sentralTenantSchoolCode: string;
    domain: string;
  },
  swaggerFolder: string,
  assetsFolderPath: string,
  verbose = false
) {
  /**
   * https://raw.githubusercontent.com/acctech/kingjames.bible/master/kjv-src/kjv-1769.txt
   */
  const apiKey = auth.sentralAPIKey;
  const tenantCode = auth.sentralTenantSchoolCode;
  const domain = auth.domain;
  let SDK: any = {};
  let ASSETSFOLDERPATH: string = "";
  let isVERBOSE: boolean = false;
  const sentralSDKInstance = this;

  /**
   * Initiate SDK from Swagger.json documentation.
   * @param {String} assetsFolderPath optional, Folder to copy the output processed JSON to.
   * @param {String} swaggerFolder Folder to read the swagger.json documentation from.
   * @returns
   */
  async function initiateSDKFromSwaggerFile(
    swaggerFolder: string,
    assetsFolderPath: string,
    verbose = false
  ) {
    console.log("Initiating SDK");
    isVERBOSE = verbose;
    ASSETSFOLDERPATH = assetsFolderPath ?? "./assets";
    let sdkMetaCache = Cacher(ASSETSFOLDERPATH);
    try {
      if (!fs.existsSync(path.join(ASSETSFOLDERPATH, "endpoints.json"))) {
        await generateEndpointsFile(Cacher(ASSETSFOLDERPATH), swaggerFolder);
      }
      let endpointMetaDataFull: any = await sdkMetaCache.load("endpoints");
      let endpoints = Object.keys(endpointMetaDataFull);
      for (let i = 0; i < endpoints.length; i++) {
        let endpoint = endpoints[i];
        let endpointMetaData = endpointMetaDataFull[endpoint];
        try {
          let availableMethods = Object.keys(endpointMetaData).map(
            (methodName) => methodName.toLowerCase()
          );
          for (let mIndex = 0; mIndex < availableMethods.length; mIndex++) {
            let methodKey = availableMethods[mIndex];
            // Available Inserts
            let availableInserts =
              helperFunctions.retrieveInsertsNames(endpoint);
            // Check and Retrieve Query Parameters
            let availableParams = null;
            if (endpointMetaData[methodKey].parameters) {
              availableParams = endpointMetaData[methodKey].parameters.map(
                function (queryParam: { name: string }) {
                  return queryParam.name;
                }
              );
            }
            // Nominate a function name
            let candidateNameForFunction =
              helperFunctions.prepareCandidateFunctionNameForEndpoint(
                methodKey,
                endpoint
              );
            //Add an about object for the endpoint.
            SDK[candidateNameForFunction + "-about"] = {
              endpoint,
              availableMethods,
              availableInserts,
              availableParams,
              method: methodKey,
            };
            //Add the method function
            if (methodKey.toLowerCase() === "get") {
              SDK[candidateNameForFunction] = function (
                config: EndpointConfig
              ) {
                return helperFunctions.runGetEndpointWithInsertsAndParams({
                  ...config,
                  endpoint,
                });
              };
            }
          }
        } catch (couldntInitiateEndpoint) {
          console.log(couldntInitiateEndpoint, endpoint, endpointMetaData);
        }
      }
      //Save SDK meta.
      await saveSDKMeta(endpoints, SDK);
      console.log("SDK Loaded");
      //Return this for chaining.
      return sentralSDKInstance;
    } catch (err) {
      throw "Couldn't load endpoints to create SDK Meta";
    }
  }

  const helperFunctions = {
    retrieveInsertsNames: function (endpointString: string) {
      let inserts: any = endpointString.match(/{([^}]*)}/g);
      if (inserts) {
        inserts = inserts.map((insert: any) => insert.replace(/[{}]/g, ""));
      }
      return inserts;
    },
    processQueryParamaters: function (url: string, queryParametersObj: any) {
      let urlQueryParameters = "";
      if (queryParametersObj) {
        urlQueryParameters = "?";
        let parametersKeys = Object.keys(queryParametersObj);
        parametersKeys.forEach(function (parametersKey, index) {
          let queryPair =
            parametersKey + "=" + queryParametersObj[parametersKey] + "&";
          urlQueryParameters += queryPair;
        });
        urlQueryParameters = urlQueryParameters.replace(/&$/, "");
      }
      if (verbose) {
        console.log("Query Parameter String:", urlQueryParameters);
      }
      //Make it Safe
      let encURI = encodeURI(
        url + (urlQueryParameters === "?" ? "" : urlQueryParameters)
      );
      return encURI;
    },
    doesEndpointStringIncludeInserts: function (endpoint: string) {
      return endpoint.includes("/{") && endpoint.includes("}");
    },
    /**
     * Prepares a function name from an endpoint string.
     * Both function params are required.
     * @param method GET, POST, PATCH, PUT, etc
     * @param endpointString "/v1/api/endpoing/myendpoint{1}"
     * @returns {string}
     */
    prepareCandidateFunctionNameForEndpoint: function (
      method: string,
      endpointString: string
    ) {
      //Remove the API related part of the endpoint.
      let candidateStringWithoutApiDefinition = endpointString.replace(
        /\/v1/g,
        ""
      );
      //Remove left symbol from the template strings variables and change it for 'For' with forward slash to be split later on.
      let endpointStringWithoutSymbols =
        candidateStringWithoutApiDefinition.replace(/[{]/g, "For/");
      //Remove right symbol from template variable.
      endpointStringWithoutSymbols = endpointStringWithoutSymbols.replace(
        /[}]/g,
        ""
      );
      //Split by forward slash
      let candidateStringArray = endpointStringWithoutSymbols.split(/\/|-/);
      //CamelCasing:
      let candidateString = "";
      for (const wordIndex in candidateStringArray) {
        candidateString +=
          candidateStringArray[wordIndex].substring(0, 1).toUpperCase() +
          candidateStringArray[wordIndex].substring(1).toLowerCase();
      }
      candidateString = method.toLowerCase() + candidateString;
      return candidateString;
    },
    /**
     *
     * @param endpoint string "/v1/endpoint/{id}/endpoint"
     * @param extraParameters object
     * @param inserts object
     * @returns {Promise<unknown>}
     */
    runGetEndpointWithInsertsAndParams: function (config: EndpointConfig) {
      if (!config.endpoint) {
        throw "Missing endpoint";
      }

      if (config.useMeta === undefined) {
        config.useMeta = true;
      }

      if (config.chunkSize === undefined) {
        config.chunkSize = 5;
      }

      if (!config.extraParameters) {
        config.extraParameters = {};
      }

      if (helperFunctions.doesEndpointStringIncludeInserts(config.endpoint)) {
        if (config.inserts) {
          for (const insertsKey in config.inserts) {
            //replace key with insert
            config.endpoint = config.endpoint.replace(
              "{" + insertsKey + "}",
              config.inserts[insertsKey]
            );
          }
        } else {
          throw "Missing inserts";
        }
      }

      let url = domain + "/restapi" + config.endpoint;
      let uri = this.processQueryParamaters(url, config.extraParameters);

      let extraParamKeys = Object.keys(config.extraParameters);

      let limit = null;
      if (extraParamKeys.includes("limit")) {
        limit = parseInt(config.extraParameters.limit);
      }
      let include = null;
      if (extraParamKeys.includes("include")) {
        include = config.extraParameters.include;
      }

      if (config.useMeta) {
        return fetchAllWithMeta(
          uri,
          apiKey,
          tenantCode,
          isVERBOSE || config.verbose,
          limit,
          include,
          config.chunkSize,
          config.rawResponse,
          config.extraHeaders,
          config.extraAxiosSettings
        );
      } else {
        //Execute call and return
        return SentralFetchRateLimited(
          uri,
          apiKey,
          tenantCode,
          isVERBOSE || config.verbose,
          // @ts-ignore
          config.rawResponse,
          config.extraHeaders,
          config.extraAxiosSettings
        );
      }
    },
  };

  function getSDK() {
    if (Object.entries(SDK).length === 0) {
      throw "Cannot call SDK without first initiating SDK from swagger json file. Call initiateSDKFromAssetEndpointsFile(filename)";
    }
    return SDK;
  }

  // Convert Swagger to Endpoints File
  async function generateEndpointsFile(
    assetsCacher: any,
    folderPathOfSwaggerJSON: string
  ) {
    let sentralSwagger = SwaggerFileImporter(folderPathOfSwaggerJSON);
    let sentralEndpoints = sentralSwagger.getEndpointFullDetails();
    await assetsCacher.save("endpoints", sentralEndpoints);
  }

  async function saveSDKMeta(endpoints: string[], SDK: any) {
    let sdkMetaCache = Cacher(ASSETSFOLDERPATH);
    await sdkMetaCache.save("META", { endpoints, SDK });
    // Write a common JS file that can be imported for reference.
    try {
      let cjsContent =
        "const SDK = " + JSON.stringify(SDK) + "; module.exports = SDK;";
      fs.writeFileSync(path.join(ASSETSFOLDERPATH, "META.cjs"), cjsContent);
      let esmContent = "export default " + JSON.stringify(SDK) + ";";
      fs.writeFileSync(path.join(ASSETSFOLDERPATH, "META.esm.js"), esmContent);
    } catch (e) {
      console.log(e);
    }
  }

  async function loadSDKMeta(): Promise<any> {
    let sdkMetaCache = Cacher(ASSETSFOLDERPATH);
    return await sdkMetaCache.load("META");
  }
  async function querySDKMeta(callback: Function) {
    callback(await loadSDKMeta());
  }

  // Initiating SDK from Swagger.json documentation.
  await initiateSDKFromSwaggerFile(swaggerFolder, assetsFolderPath, verbose);

  return {
    getSDK,
    querySDKMeta,
  };
};
