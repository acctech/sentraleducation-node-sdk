import fs from "fs";
import Path from 'path';

export default function SwaggerFileImporter(folderWhereSwaggerFileStored){
    /**
    * https://raw.githubusercontent.com/acctech/kingjames.bible/master/kjv-src/kjv-1769.txt
    */
    const folderOfSwaggerLocation = Path.join(folderWhereSwaggerFileStored, "swagger.json");
    const swaggerObject = JSON.parse(fs.readFileSync(folderOfSwaggerLocation).toString());
    const pathArray = swaggerObject.paths;
    const endpointArray = JSON.stringify(Object.keys(pathArray));

    return {
        getEndpointList: function(){
            return endpointArray;
        },
        getEndpointFullDetails: function(){
            return pathArray;
        }
    }
}
