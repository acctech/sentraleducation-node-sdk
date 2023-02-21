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

import Bottleneck from "bottleneck";
import axios, { AxiosRequestConfig } from "axios";
import https from "https";

const limiter = new Bottleneck({
  maxConcurrent: 200,
  minTime: 1,
});

const requestObj = (
  url: string,
  apiToken: string,
  tenantCode: string,
  ca: string | undefined,
  rawResponse: boolean = true,
  extraHeaders: any = {},
  extraAxiosSettings: any = {}
): AxiosRequestConfig => ({
  method: "GET",
  url,
  transformResponse: rawResponse ? (data) => data : undefined,
  httpsAgent: ca
    ? new https.Agent({
        ca: ca === undefined ? "" : ca,
      })
    : undefined,
  headers: {
    "x-api-key": apiToken,
    "x-api-tenant": tenantCode,
    ...extraHeaders,
  },
  ...extraAxiosSettings,
  timeout: 360000,
});

/**
 * https://raw.githubusercontent.com/acctech/kingjames.bible/master/kjv-src/kjv-1769.txt
 */
const fetchAll = (
  url: string,
  apiToken: string,
  tenantCode: string,
  verbose: boolean,
  rawResponse: boolean = false,
  extraHeaders: any = {},
  extraAxiosSettings: any = {},
  result: any = []
): any =>
  axios(
    requestObj(
      url,
      apiToken,
      tenantCode,
      undefined,
      rawResponse,
      extraHeaders,
      extraAxiosSettings
    )
  ).then((response: any) => {
    if (rawResponse) {
      if (response) {
        if (isIterable(response)) {
          result = [...result, ...response];
        } else {
          result = [...result, response];
        }

        // Try and see if there's a links object for pagination
        try {
          const links = JSON.parse(response.data)?.links;
          if (links) {
            if (links.next) {
              if (verbose) {
                console.log(`Fetching ${links.next}`);
              }
              return fetchAll(
                links.next,
                apiToken,
                tenantCode,
                verbose,
                rawResponse,
                extraHeaders,
                extraAxiosSettings,
                result
              );
            } else {
              if (verbose) {
                console.log(`Reached end of pagination.`);
              }
              return result;
            }
          } else {
            return result;
          }
        } catch (e) {
          console.log(e);
        }
      } else {
        result = [...result, response];
      }
    }

    if (response.data) {
      if (isIterable(response.data.data)) {
        result = [...result, ...response.data.data];
      } else {
        result = [...result, response.data.data];
      }
      const links = response.data.links;
      // console.log(links);
      if (links) {
        if (links.next) {
          if (verbose) {
            console.log(`Fetching ${links.next}`);
          }
          return fetchAll(
            links.next,
            apiToken,
            tenantCode,
            verbose,
            rawResponse,
            extraHeaders,
            extraAxiosSettings,
            result
          );
        } else {
          if (verbose) {
            console.log(`Reached end of pagination.`);
          }
          return result;
        }
      } else {
        return result;
      }
    } else {
      result = [...result, response];
    }
  });

const isIterable = function (obj: any) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === "function";
};

const SentralFetchRateLimited = limiter.wrap(fetchAll);

export default SentralFetchRateLimited;
