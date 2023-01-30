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
Object.defineProperty(exports, "__esModule", { value: true });
const request_promise_1 = __importDefault(require("request-promise"));
const q_1 = __importDefault(require("q"));
const CHUNK_DELAY_MS = 30;
const requestObj = (url, apiToken, tenantCode, ca, json = true) => ({
    method: "GET",
    uri: url,
    json: json,
    ca: ca === undefined ? "" : ca,
    resolveWithFullResponse: true,
    headers: {
        "x-api-key": apiToken,
        "x-api-tenant": tenantCode,
    },
    timeout: 360000,
});
/**
 * Merge the mainData array with the included data array to make one object.
 * @param {[]} mainDataArray
 * @param {[]} includedDataArray
 * @returns
 */
function mergeIncludedDataWithMainData(mainDataArray, includedDataArray) {
    if (mainDataArray && includedDataArray) {
        let mainDataArrayClone = Array.isArray(mainDataArray)
            ? JSON.parse(JSON.stringify(mainDataArray))
            : JSON.parse(JSON.stringify([mainDataArray]));
        // For each of the individual included data objects
        includedDataArray.forEach((includedData) => {
            let includedDataType = includedData.type;
            let includedDataId = includedData.id;
            // Go through the main data
            mainDataArrayClone.forEach((mainData, mainDataArrayCloneIndex) => {
                if (typeof mainData.relationships === "object") {
                    // Find the included data that matches the mainData
                    // Go through the relationships keys
                    let relationshipNames = Object.keys(mainData.relationships);
                    // Find the relationship that has matching type & id
                    let matchingRelationshipName = relationshipNames.find((relationshipName) => {
                        var _a, _b, _c, _d;
                        return (((_b = (_a = mainData.relationships[relationshipName]) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.type) ===
                            includedDataType &&
                            ((_d = (_c = mainData.relationships[relationshipName]) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.id) ===
                                includedDataId);
                    });
                    if (includedDataId !== undefined && matchingRelationshipName) {
                        // Prepare an included object if it doesn't exist
                        let included = mainDataArrayClone[mainDataArrayCloneIndex]["included"];
                        if (included === undefined || included === null) {
                            mainDataArrayClone[mainDataArrayCloneIndex]["included"] = {};
                        }
                        // Add the data to the included object using the type as the attribute name.
                        mainDataArrayClone[mainDataArrayCloneIndex]["included"][matchingRelationshipName] = includedData;
                    }
                }
            });
        });
        return mainDataArrayClone;
    }
    // If no mainDataArray or includedDataArray, return a clone of mainDataArray
    return JSON.parse(JSON.stringify(mainDataArray));
}
/**
 * https://raw.githubusercontent.com/acctech/kingjames.bible/master/kjv-src/kjv-1769.txt
 */
const fetchAllWithMeta = (url, apiToken, tenantCode, verbose = false, limit, includeString, chunkSize = 10, rawResponse = false) => __awaiter(void 0, void 0, void 0, function* () {
    let data = [];
    // Default limit if none given
    if (limit === null) {
        limit = 10;
    }
    // Make first request.
    let response = yield (0, request_promise_1.default)(requestObj(url, apiToken, tenantCode, undefined, false));
    if (rawResponse) {
        return response;
    }
    // Use count to figure out max items
    let totalItemCount = response.body.meta.count;
    data = data.concat(response.body.data);
    // If there are keywords in the include string then merge the related objects into one
    if (includeString && includeString.length > 0) {
        data = mergeIncludedDataWithMainData(response.body.data, response.body.included);
    }
    // console.log(JSON.stringify(data, null, 2));
    let nextUrlsArray = [];
    // Prepare the future links skipping the first one if theres more than 1 result
    if (totalItemCount && totalItemCount > 1) {
        // Prepare urls
        for (let i = 0; i < totalItemCount;) {
            let offset = (i += limit);
            if (totalItemCount - offset >= 0) {
                let currentURL = url;
                currentURL = currentURL.replace(/(&*)offset=\d+|offset=/g, "");
                currentURL += "&offset=" + offset;
                nextUrlsArray.push(currentURL);
            }
        }
        if (verbose) {
            console.log(nextUrlsArray);
        }
        // Split into chunks and make requests with q
        let responseArray = [];
        let lastProgress = 0;
        for (let i = 0; i < nextUrlsArray.length; i += chunkSize) {
            let progressPercentage = Math.floor(i / nextUrlsArray.length);
            if (verbose &&
                // progressPercentage % 10 === 0 &&
                lastProgress !== progressPercentage) {
                console.log("Progress", Math.floor(i / nextUrlsArray.length) + "%");
                lastProgress = progressPercentage;
            }
            let requestArrayChunk = [];
            let endSlice = nextUrlsArray.length < i + chunkSize
                ? nextUrlsArray.length
                : i + chunkSize;
            requestArrayChunk = nextUrlsArray.slice(i, endSlice);
            let sliceReturnResponseArray = requestArrayChunk.map((requestUrl) => {
                return (0, request_promise_1.default)(requestObj(requestUrl, apiToken, tenantCode, undefined));
            });
            responseArray = responseArray.concat((yield q_1.default.all(sliceReturnResponseArray)).map((response) => {
                var _a, _b, _c;
                if (includeString && includeString.length > 0) {
                    return mergeIncludedDataWithMainData((_a = response === null || response === void 0 ? void 0 : response.body) === null || _a === void 0 ? void 0 : _a.data, (_b = response === null || response === void 0 ? void 0 : response.body) === null || _b === void 0 ? void 0 : _b.included);
                }
                else {
                    return (_c = response === null || response === void 0 ? void 0 : response.body) === null || _c === void 0 ? void 0 : _c.data;
                }
            }));
            yield q_1.default.delay(CHUNK_DELAY_MS);
        }
        data = data.concat(...responseArray);
    }
    if (verbose) {
        console.log("Meta count match:", data.length, totalItemCount, data.length === totalItemCount);
    }
    return data;
});
const isIterable = function (obj) {
    // checks for null and undefined
    if (obj == null) {
        return false;
    }
    return typeof obj[Symbol.iterator] === "function";
};
exports.default = fetchAllWithMeta;
