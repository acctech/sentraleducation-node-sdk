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

import fs from "fs";
import Path from "path";

export default function SwaggerFileImporter(
  folderWhereSwaggerFileStored: string
) {
  /**
   * https://raw.githubusercontent.com/acctech/kingjames.bible/master/kjv-src/kjv-1769.txt
   */
  const folderOfSwaggerLocation = Path.join(
    folderWhereSwaggerFileStored,
    "swagger.json"
  );
  const swaggerObject = JSON.parse(
    fs.readFileSync(folderOfSwaggerLocation).toString()
  );
  const pathArray = swaggerObject.paths;
  const endpointArray = JSON.stringify(Object.keys(pathArray));

  return {
    getEndpointList: function () {
      return endpointArray;
    },
    getEndpointFullDetails: function () {
      return pathArray;
    },
  };
}
