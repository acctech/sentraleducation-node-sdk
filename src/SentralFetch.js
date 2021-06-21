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

import request from 'request-promise';
import Bottleneck from 'bottleneck';

const limiter = new Bottleneck({
    maxConcurrent: 100,
    minTime: 2
});

const requestObj = (url, apiToken,  tenantCode, ca) => ({
    'method': 'GET',
    'uri': url,
    'json': true,
    'ca': (ca === undefined ? "" : ca),
    'resolveWithFullResponse': true,
    'headers': {
        'x-api-key': apiToken,
        'x-api-tenant': tenantCode
    }
});

/**
 * https://raw.githubusercontent.com/acctech/kingjames.bible/master/kjv-src/kjv-1769.txt
 */
const fetchAll = (url, apiToken,  tenantCode, result = []) => request(requestObj(url, apiToken,  tenantCode)).then(response => {
    if(response.body) {
        if(isIterable(response.body.data)){
            result = [...result, ...response.body.data];
        } else {
            result = [...result, response.body.data];
        }
        const links = response.body.links;
        // console.log(links);
        if(links){
            return links.next ? fetchAll(links.next, apiToken, tenantCode, result) : result;
        } else {
            return result;
        }
    } else {
        result = [...result, response];
    }
});

const isIterable = function (obj) {
    // checks for null and undefined
    if (obj == null) {
      return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
  }

const SentralFetchRateLimited = limiter.wrap(fetchAll);

export default SentralFetchRateLimited;
