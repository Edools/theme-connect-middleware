import request from 'request-promise';
import { promisifyAll } from 'bluebird';
import fileExists from 'file-exists';
import R from 'ramda';
import parseSchemas from './schemas';

var fs = promisifyAll(require('fs'));

const DEFAULT_CONFIG = {
  paramsPath: 'params.json',
  appPath: 'app/'
};

var middleware = function (config) {
  return (req, res, next) => {
    let promise, params;

    if(req.url !== '/themes/params') {
      return next();
    }

    config = R.merge(DEFAULT_CONFIG, config);
    if(fileExists(config.paramsPath)) {
      promise = fs.readFileAsync(config.paramsPath);
    } else {
      promise = request({
        uri: `https://api.myedools.com/themes/${config.theme}/params`,
        headers: {
          Authorization: `Token token=${config.token}`,
          Accept: 'application/vnd.edools.themes.v1+json'
        }
      });
    }

    promise
      .then(JSON.parse)
      .then((result) => {
        params = result;
        if(config.parseSchemas) {
          return parseSchemas(config);
        }
      })
      .then((schemas) => {
        params.schemas = schemas;
        res.end(JSON.stringify(params));
      })
      .catch((err) => {
        throw err;
      });
  };
};

export { middleware };
