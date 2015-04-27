import { promisifyAll, all } from 'bluebird';
import fileExists from 'file-exists';
import R from 'ramda';
import objectPath from 'object-path';

var fs = promisifyAll(require('fs'));
var dir = promisifyAll(require('node-dir'));

function getSchema(templatePath) {
  let schemaPath = templatePath
    .replace('/templates/', '/schemas/')
    .replace('.html', '.json');

  if(fileExists(schemaPath)) {
    return fs.readFileAsync(schemaPath)
      .then(JSON.parse)
      .then((schema) => {
        return { path: schemaPath, content: schema };
      });
  } else {
    return { path: schemaPath, content: {} };
  }
}

function buildSchemasResponse(schemas) {
  let response = {};
  R.forEach((schema) => {
    let path = schema.path
      .replace('.json', '').split('/')
      .slice(2).join('.');

    objectPath.set(response, path, schema.content);
  }, schemas);
  return response;
}

export default function parseSchemas(config) {
  return dir.filesAsync(`${config.appPath}/templates`)
    .then((files) => {
      return all(R.map(getSchema, files));
    })
    .then((schemas) => {
      return buildSchemasResponse(schemas);
    });
}
