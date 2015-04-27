import fetch from 'node-fetch';
import { promisifyAll } from 'bluebird';
import fileExists from 'file-exists';
import R from 'ramda';
import parseSchemas from './schemas';

var fs = promisifyAll(require('fs'));

const DEFAULT_CONFIG = {
  paramsPath: 'params.json',
  appPath: 'app/'
};

export default function (config) {
  return (req, res, next) => {
    let promise, params;

    if(req.url !== '/themes/params') {
      return next();
    }

    config = R.merge(DEFAULT_CONFIG, config);
    if(fileExists(config.paramsPath)) {
      promise = fs.readFileAsync(config.paramsPath);
    } else {
      promise = fetch(`https://api.myedools.com/themes/${config.themeId}/params`);
    }

    promise
      .then(JSON.parse)
      .then((result) => {
        params = result;
        return parseSchemas(config);
      })
      .then((schemas) => {
        params.schemas = schemas;
        res.end(JSON.stringify(params));
      });
  };
}
