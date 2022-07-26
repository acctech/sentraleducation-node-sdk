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

import request from "request-promise";
import q from "q";

const CHUNK_DELAY_MS = 30;

const requestObj = (url, apiToken, tenantCode, ca) => ({
  method: "GET",
  uri: url,
  json: true,
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
      });
    });

    return mainDataArrayClone;
  }
  return null;
}

/**
 * https://raw.githubusercontent.com/acctech/kingjames.bible/master/kjv-src/kjv-1769.txt
 */
const fetchAllWithMeta = async (
  url,
  apiToken,
  tenantCode,
  verbose = false,
  limit,
  includeString,
  chunkSize = 10
) => {
  let data = [];

  // Make first request.
  let response = await request(requestObj(url, apiToken, tenantCode));
  // Use count to figure out max items
  let totalItemCount = response.body.meta.count;
  data = data.concat(response.body.data);

  // If there are keywords in the include string then merge the related objects into one
  if (includeString) {
    data = mergeIncludedDataWithMainData(
      response.body.data,
      response.body.included
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
    let responseArray = [];
    let lastProgress = 0;
    for (let i = 0; i < nextUrlsArray.length; i += chunkSize) {
      let progressPercentage = parseInt(i / nextUrlsArray.length);
      if (
        verbose &&
        // progressPercentage % 10 === 0 &&
        lastProgress !== progressPercentage
      ) {
        console.log("Progress", parseInt(i / nextUrlsArray.length) + "%");
        lastProgress = progressPercentage;
      }
      let requestArrayChunk = [];
      let endSlice =
        nextUrlsArray.length < i + chunkSize
          ? nextUrlsArray.length
          : i + chunkSize;
      requestArrayChunk = nextUrlsArray.slice(i, endSlice);
      let sliceReturnResponseArray = requestArrayChunk.map((requestUrl) => {
        return request(requestObj(requestUrl, apiToken, tenantCode));
      });
      responseArray = responseArray.concat(
        (await q.all(sliceReturnResponseArray)).map((response) => {
          return mergeIncludedDataWithMainData(
            response?.body?.data,
            response?.body?.included
          );
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

const isIterable = function (obj) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === "function";
};

export default fetchAllWithMeta;
