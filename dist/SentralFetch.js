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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bottleneck_1 = __importDefault(require("bottleneck"));
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
const limiter = new bottleneck_1.default({
    maxConcurrent: 200,
    minTime: 1,
});
const requestObj = (url, apiToken, tenantCode, ca, rawResponse = true, extraHeaders = {}, extraAxiosSettings = {}) => (Object.assign(Object.assign({ method: "GET", url, transformResponse: rawResponse ? (data) => data : undefined, httpsAgent: ca
        ? new https_1.default.Agent({
            ca: ca === undefined ? "" : ca,
        })
        : undefined, headers: Object.assign({ "x-api-key": apiToken, "x-api-tenant": tenantCode, "User-Agent": "SentralNodeSDK" }, extraHeaders) }, extraAxiosSettings), { timeout: 360000 }));
/**
 * https://raw.githubusercontent.com/acctech/kingjames.bible/master/kjv-src/kjv-1769.txt
 */
const fetchAll = (url, apiToken, tenantCode, verbose, rawResponse = false, extraHeaders = {}, extraAxiosSettings = {}, result = []) => (0, axios_1.default)(requestObj(url, apiToken, tenantCode, undefined, rawResponse, extraHeaders, extraAxiosSettings)).then((response) => {
    var _a;
    if (rawResponse) {
        if (response) {
            if (isIterable(response)) {
                result = [...result, ...response];
            }
            else {
                result = [...result, response];
            }
            // Try and see if there's a links object for pagination (Response is raw text response here)
            try {
                const links = (_a = JSON.parse(response.data)) === null || _a === void 0 ? void 0 : _a.links;
                if (links) {
                    if (links.next) {
                        if (verbose) {
                            console.log(`Fetching ${links.next}`);
                        }
                        return fetchAll(links.next, apiToken, tenantCode, verbose, rawResponse, extraHeaders, extraAxiosSettings, result);
                    }
                    else {
                        if (verbose) {
                            console.log(`Reached end of pagination.`);
                        }
                        return result;
                    }
                }
                else {
                    return result;
                }
            }
            catch (e) {
                console.log(e);
            }
        }
        else {
            result = [...result, response];
        }
    }
    if (response.data) {
        if (isIterable(response.data.data)) {
            result = [...result, ...response.data.data];
        }
        else {
            result = [...result, response.data.data];
        }
        const links = response.data.links;
        // console.log(links);
        if (links) {
            if (links.next) {
                if (verbose) {
                    console.log(`Fetching ${links.next}`);
                }
                return fetchAll(links.next, apiToken, tenantCode, verbose, rawResponse, extraHeaders, extraAxiosSettings, result);
            }
            else {
                if (verbose) {
                    console.log(`Reached end of pagination.`);
                }
                return result;
            }
        }
        else {
            return result;
        }
    }
    else {
        result = [...result, response];
    }
});
const isIterable = function (obj) {
    // checks for null and undefined
    if (obj == null) {
        return false;
    }
    return typeof obj[Symbol.iterator] === "function";
};
const SentralFetchRateLimited = limiter.wrap(fetchAll);
exports.default = SentralFetchRateLimited;
