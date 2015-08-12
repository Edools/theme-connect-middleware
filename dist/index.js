(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('request-promise'), require('bluebird'), require('file-exists'), require('ramda'), require('object-path')) : typeof define === 'function' && define.amd ? define(['exports', 'request-promise', 'bluebird', 'file-exists', 'ramda', 'object-path'], factory) : factory(global.index.js = {}, global.request, global.bluebird, global.fileExists, global.R, global.objectPath);
})(this, function (exports, request, bluebird, fileExists, R, objectPath) {
  'use strict';

  request = 'default' in request ? request['default'] : request;
  fileExists = 'default' in fileExists ? fileExists['default'] : fileExists;
  R = 'default' in R ? R['default'] : R;
  objectPath = 'default' in objectPath ? objectPath['default'] : objectPath;

  var _schemas__fs = bluebird.promisifyAll(require('fs'));
  var dir = bluebird.promisifyAll(require('node-dir'));

  function getSchema(templatePath) {
    var schemaPath = templatePath.replace('/templates/', '/schemas/').replace('.html', '.json');

    if (fileExists(schemaPath)) {
      return _schemas__fs.readFileAsync(schemaPath).then(JSON.parse).then(function (schema) {
        return { path: schemaPath, content: schema };
      });
    } else {
      return { path: schemaPath, content: {} };
    }
  }

  function buildSchemasResponse(schemas) {
    var response = {};
    R.forEach(function (schema) {
      var path = schema.path.replace('.json', '').split('/').slice(2).join('.');

      objectPath.set(response, path, schema.content);
    }, schemas);
    return response;
  }

  function parseSchemas(config) {
    return dir.filesAsync('' + config.appPath + '/templates').then(function (files) {
      return bluebird.all(R.map(getSchema, files));
    }).then(function (schemas) {
      return buildSchemasResponse(schemas);
    });
  }

  var index__fs = bluebird.promisifyAll(require('fs'));

  var DEFAULT_CONFIG = {
    paramsPath: 'params.json',
    appPath: 'app/'
  };

  var middleware = function middleware(config) {
    return function (req, res, next) {
      var promise = undefined,
          params = undefined;

      if (req.url !== '/themes/params') {
        return next();
      }

      config = R.merge(DEFAULT_CONFIG, config);
      if (fileExists(config.paramsPath)) {
        promise = index__fs.readFileAsync(config.paramsPath);
      } else {
        promise = request({
          uri: 'https://api.myedools.com/themes/' + config.theme + '/params',
          headers: {
            Authorization: 'Token token=' + config.token,
            Accept: 'application/vnd.edools.themes.v1+json'
          }
        });
      }

      promise.then(JSON.parse).then(function (result) {
        params = result;
        if (config.parseSchemas) {
          return parseSchemas(config);
        }
      }).then(function (schemas) {
        params.schemas = schemas;
        res.end(JSON.stringify(params));
      })['catch'](function (err) {
        throw err;
      });
    };
  };

  exports.middleware = middleware;
});
//# sourceMappingURL=./index.js.map