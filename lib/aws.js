/* AWS SDK wrapper
*/
var Promise = require("bluebird")
var AWS = require('aws-sdk');
AWS.config.update({region: process.env.AWS_REGION || "eu-west-1"})

/* Simple promisification of AWS service clients
 */

AWS.Request.prototype.promise = function() {
  var deferred = Promise.pending()
  this.on('complete', function(resp) {
    if (resp.error) deferred.reject(resp.error);
    else deferred.resolve(resp.data);
  });
  this.send();
  return deferred.promise
}

module.exports = AWS