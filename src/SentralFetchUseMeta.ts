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

import q from "q";
import axios, { AxiosRequestConfig } from "axios";
import https from "https";

const CHUNK_DELAY_MS = 30;

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
    "User-Agent": "SentralNodeSDK",
    ...extraHeaders,
  },
  ...extraAxiosSettings,
  timeout: 360000,
});
/**
 * Merge the mainData array with the included data array to make one object.
 * @param {[]} mainDataArray
 * @param {[]} includedDataArray
 * @returns
 */
function mergeIncludedDataWithMainData(
  mainDataArray: any[],
  includedDataArray: any[]
) {
  if (mainDataArray && includedDataArray) {
    let mainDataArrayClone = Array.isArray(mainDataArray)
      ? JSON.parse(JSON.stringify(mainDataArray))
      : JSON.parse(JSON.stringify([mainDataArray]));

    // For each of the individual included data objects
    includedDataArray.forEach((includedData) => {
      let includedDataType = includedData.type;
      let includedDataId = includedData.id;

      // Go through the main data
      mainDataArrayClone.forEach(
        (mainData: any, mainDataArrayCloneIndex: number) => {
          if (typeof mainData.relationships === "object") {
            // Find the included data that matches the mainData
            // Go through the relationships keys
            let relationshipNames = Object.keys(mainData.relationships);
            // Find the relationship that has matching type & id
            let matchingRelationshipName = relationshipNames.find(
              (relationshipName) => {
                return (
                  mainData.relationships[relationshipName]?.data?.type ===
                    includedDataType &&
                  mainData.relationships[relationshipName]?.data?.id ===
                    includedDataId
                );
              }
            );

            if (includedDataId !== undefined && matchingRelationshipName) {
              // Prepare an included object if it doesn't exist
              let included =
                mainDataArrayClone[mainDataArrayCloneIndex]["included"];
              if (included === undefined || included === null) {
                mainDataArrayClone[mainDataArrayCloneIndex]["included"] = {};
              }

              // Add the data to the included object using the type as the attribute name.
              mainDataArrayClone[mainDataArrayCloneIndex]["included"][
                matchingRelationshipName
              ] = includedData;
            }
          }
        }
      );
    });

    return mainDataArrayClone;
  }

  // If no mainDataArray or includedDataArray, return a clone of mainDataArray
  return JSON.parse(JSON.stringify(mainDataArray));
}

/**
 * https://raw.githubusercontent.com/acctech/kingjames.bible/master/kjv-src/kjv-1769.txt
 */
const fetchAllWithMeta = async (
  url: string,
  apiToken: string,
  tenantCode: string,
  verbose = false,
  limit: number | null,
  includeString: string,
  chunkSize = 10,
  rawResponse: boolean = false,
  extraHeaders: any = {},
  extraAxiosSettings: any = {}
) => {
  let data: any[] = [];

  // Default limit if none given
  if (limit === null) {
    limit = 10;
  }

  // Make first request.
  let response = await axios(
    requestObj(
      url,
      apiToken,
      tenantCode,
      undefined,
      rawResponse,
      extraHeaders,
      extraAxiosSettings
    )
  );

  if (rawResponse) {
    return response;
  }

  if (!response?.data.data || !response?.data.meta) {
    return response.data;
  }

  // Use count to figure out max items
  let totalItemCount = response.data.meta.count;
  data = data.concat(response.data.data);

  // If there are keywords in the include string then merge the related objects into one
  if (includeString && includeString.length > 0) {
    data = mergeIncludedDataWithMainData(
      response.data.data,
      response.data.included
    );
  }

  // console.log(JSON.stringify(data, null, 2));
  let nextUrlsArray = [];
  // Prepare the future links skipping the first one if theres more than 1 result
  if (totalItemCount && totalItemCount > 1) {
    // Prepare urls
    for (let i = 0; i < totalItemCount; ) {
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
    let responseArray: any[] = [];
    let lastProgress = 0;
    for (let i = 0; i < nextUrlsArray.length; i += chunkSize) {
      let progressPercentage = Math.floor(i / nextUrlsArray.length);
      if (
        verbose &&
        // progressPercentage % 10 === 0 &&
        lastProgress !== progressPercentage
      ) {
        console.log("Progress", Math.floor(i / nextUrlsArray.length) + "%");
        lastProgress = progressPercentage;
      }
      let requestArrayChunk = [];
      let endSlice =
        nextUrlsArray.length < i + chunkSize
          ? nextUrlsArray.length
          : i + chunkSize;
      requestArrayChunk = nextUrlsArray.slice(i, endSlice);
      let sliceReturnResponseArray = requestArrayChunk.map((requestUrl) => {
        return axios(
          requestObj(
            requestUrl,
            apiToken,
            tenantCode,
            undefined,
            rawResponse,
            extraHeaders,
            extraAxiosSettings
          )
        );
      });
      responseArray = responseArray.concat(
        (await q.all(sliceReturnResponseArray)).map((response) => {
          if (includeString && includeString.length > 0) {
            return mergeIncludedDataWithMainData(
              response?.data?.data,
              response?.data?.included
            );
          } else {
            return response?.data?.data;
          }
        })
      );
      await q.delay(CHUNK_DELAY_MS);
    }
    data = data.concat(...responseArray);
  }

  if (verbose) {
    console.log(
      "Meta count match:",
      data.length,
      totalItemCount,
      data.length === totalItemCount
    );
  }

  return data;
};

const isIterable = function (obj: any) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === "function";
};

export default fetchAllWithMeta;
