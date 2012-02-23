/**
 * Created by JetBrains WebStorm.
 * User: Alex
 * Date: 11/30/11
 * Time: 1:06 AM
 * To change this template use File | Settings | File Templates.
 */

define(['postal'], function(postal) {
    postal.addWireTap(function(data) {
        if(!JSON) {
            throw "This browser or environment does provide JSON support";
        }
        try {
            console.log(JSON.stringify(data));
        }
        catch(exception) {
            console.log("Unable to parse data to JSON: " + exception);
        }
    });
});