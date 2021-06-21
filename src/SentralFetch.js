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
