"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const SentralFetch_js_1 = __importDefault(require("./SentralFetch.js"));
const SentralFetchUseMeta_js_1 = __importDefault(require("./SentralFetchUseMeta.js"));
const simple_object_to_json_cacher_1 = __importDefault(require("simple-object-to-json-cacher"));
const SwaggerFileImporter_js_1 = __importDefault(require("./SwaggerFileImporter.js"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
module.exports = function SentralSDK(auth, swaggerFolder, assetsFolderPath, verbose = false) {
    return __awaiter(this, void 0, void 0, function* () {
        /**
         * https://raw.githubusercontent.com/acctech/kingjames.bible/master/kjv-src/kjv-1769.txt
         */
        const apiKey = auth.sentralAPIKey;
        const tenantCode = auth.sentralTenantSchoolCode;
        const domain = auth.domain;
        let SDK = {};
        let ASSETSFOLDERPATH = "";
        let isVERBOSE = false;
        const sentralSDKInstance = this;
        /**
         * Initiate SDK from Swagger.json documentation.
         * @param {String} assetsFolderPath optional, Folder to copy the output processed JSON to.
         * @param {String} swaggerFolder Folder to read the swagger.json documentation from.
         * @returns
         */
        function initiateSDKFromSwaggerFile(swaggerFolder, assetsFolderPath, verbose = false) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log("Initiating SDK");
                isVERBOSE = verbose;
                ASSETSFOLDERPATH = assetsFolderPath !== null && assetsFolderPath !== void 0 ? assetsFolderPath : "./assets";
                let sdkMetaCache = (0, simple_object_to_json_cacher_1.default)(ASSETSFOLDERPATH);
                try {
                    if (!fs_1.default.existsSync(path_1.default.join(ASSETSFOLDERPATH, "endpoints.json"))) {
                        yield generateEndpointsFile((0, simple_object_to_json_cacher_1.default)(ASSETSFOLDERPATH), swaggerFolder);
                    }
                    let endpointMetaDataFull = yield sdkMetaCache.load("endpoints");
                    let endpoints = Object.keys(endpointMetaDataFull);
                    for (let i = 0; i < endpoints.length; i++) {
                        let endpoint = endpoints[i];
                        let endpointMetaData = endpointMetaDataFull[endpoint];
                        try {
                            let availableMethods = Object.keys(endpointMetaData).map((methodName) => methodName.toLowerCase());
                            for (let mIndex = 0; mIndex < availableMethods.length; mIndex++) {
                                let methodKey = availableMethods[mIndex];
                                // Available Inserts
                                let availableInserts = helperFunctions.retrieveInsertsNames(endpoint);
                                // Check and Retrieve Query Parameters
                                let availableParams = null;
                                if (endpointMetaData[methodKey].parameters) {
                                    availableParams = endpointMetaData[methodKey].parameters.map(function (queryParam) {
                                        return queryParam.name;
                                    });
                                }
                                // Nominate a function name
                                let candidateNameForFunction = helperFunctions.prepareCandidateFunctionNameForEndpoint(methodKey, endpoint);
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
                                    SDK[candidateNameForFunction] = function (config) {
                                        return helperFunctions.runGetEndpointWithInsertsAndParams(Object.assign(Object.assign({}, config), { endpoint }));
                                    };
                                }
                            }
                        }
                        catch (couldntInitiateEndpoint) {
                            console.log(couldntInitiateEndpoint, endpoint, endpointMetaData);
                        }
                    }
                    //Save SDK meta.
                    yield saveSDKMeta(endpoints, SDK);
                    console.log("SDK Loaded");
                    //Return this for chaining.
                    return sentralSDKInstance;
                }
                catch (err) {
                    throw "Couldn't load endpoints to create SDK Meta";
                }
            });
        }
        const helperFunctions = {
            retrieveInsertsNames: function (endpointString) {
                let inserts = endpointString.match(/{([^}]*)}/g);
                if (inserts) {
                    inserts = inserts.map((insert) => insert.replace(/[{}]/g, ""));
                }
                return inserts;
            },
            processQueryParamaters: function (url, queryParametersObj) {
                let urlQueryParameters = "";
                if (queryParametersObj) {
                    urlQueryParameters = "?";
                    let parametersKeys = Object.keys(queryParametersObj);
                    parametersKeys.forEach(function (parametersKey, index) {
                        let queryPair = parametersKey + "=" + queryParametersObj[parametersKey] + "&";
                        urlQueryParameters += queryPair;
                    });
                    urlQueryParameters = urlQueryParameters.replace(/&$/, "");
                }
                if (verbose) {
                    console.log("Query Parameter String:", urlQueryParameters);
                }
                //Make it Safe
                let encURI = encodeURI(url + (urlQueryParameters === "?" ? "" : urlQueryParameters));
                return encURI;
            },
            doesEndpointStringIncludeInserts: function (endpoint) {
                return endpoint.includes("/{") && endpoint.includes("}");
            },
            /**
             * Prepares a function name from an endpoint string.
             * Both function params are required.
             * @param method GET, POST, PATCH, PUT, etc
             * @param endpointString "/v1/api/endpoing/myendpoint{1}"
             * @returns {string}
             */
            prepareCandidateFunctionNameForEndpoint: function (method, endpointString) {
                //Remove the API related part of the endpoint.
                let candidateStringWithoutApiDefinition = endpointString.replace(/\/v1/g, "");
                //Remove left symbol from the template strings variables and change it for 'For' with forward slash to be split later on.
                let endpointStringWithoutSymbols = candidateStringWithoutApiDefinition.replace(/[{]/g, "For/");
                //Remove right symbol from template variable.
                endpointStringWithoutSymbols = endpointStringWithoutSymbols.replace(/[}]/g, "");
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
            runGetEndpointWithInsertsAndParams: function (config) {
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
                            config.endpoint = config.endpoint.replace("{" + insertsKey + "}", config.inserts[insertsKey]);
                        }
                    }
                    else {
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
                    return (0, SentralFetchUseMeta_js_1.default)(uri, apiKey, tenantCode, isVERBOSE || config.verbose, limit, include, config.chunkSize, config.rawResponse, config.extraHeaders, config.extraAxiosSettings);
                }
                else {
                    //Execute call and return
                    return (0, SentralFetch_js_1.default)(uri, apiKey, tenantCode, isVERBOSE || config.verbose, 
                    // @ts-ignore
                    config.rawResponse, config.extraHeaders, config.extraAxiosSettings);
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
        function generateEndpointsFile(assetsCacher, folderPathOfSwaggerJSON) {
            return __awaiter(this, void 0, void 0, function* () {
                let sentralSwagger = (0, SwaggerFileImporter_js_1.default)(folderPathOfSwaggerJSON);
                let sentralEndpoints = sentralSwagger.getEndpointFullDetails();
                yield assetsCacher.save("endpoints", sentralEndpoints);
            });
        }
        function saveSDKMeta(endpoints, SDK) {
            return __awaiter(this, void 0, void 0, function* () {
                let sdkMetaCache = (0, simple_object_to_json_cacher_1.default)(ASSETSFOLDERPATH);
                yield sdkMetaCache.save("META", { endpoints, SDK });
                // Write a common JS file that can be imported for reference.
                try {
                    let cjsContent = "const SDK = " + JSON.stringify(SDK) + "; module.exports = SDK;";
                    fs_1.default.writeFileSync(path_1.default.join(ASSETSFOLDERPATH, "META.cjs"), cjsContent);
                    let esmContent = "export default " + JSON.stringify(SDK) + ";";
                    fs_1.default.writeFileSync(path_1.default.join(ASSETSFOLDERPATH, "META.esm.js"), esmContent);
                }
                catch (e) {
                    console.log(e);
                }
            });
        }
        function loadSDKMeta() {
            return __awaiter(this, void 0, void 0, function* () {
                let sdkMetaCache = (0, simple_object_to_json_cacher_1.default)(ASSETSFOLDERPATH);
                return yield sdkMetaCache.load("META");
            });
        }
        function querySDKMeta(callback) {
            return __awaiter(this, void 0, void 0, function* () {
                callback(yield loadSDKMeta());
            });
        }
        // Initiating SDK from Swagger.json documentation.
        yield initiateSDKFromSwaggerFile(swaggerFolder, assetsFolderPath, verbose);
        return {
            getSDK,
            querySDKMeta,
        };
    });
};
