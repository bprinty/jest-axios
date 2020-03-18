/**
 * Main exports for project.
 */


// imports
// -------
import _ from 'lodash';
import axios from 'axios';

import { NotFound, Missing } from './errors';


// parsers
// -------
/**
 * Parse :id parameter from url (making the assumption
 * that an id is numeric), and return the id and associated
 * abstract endpoint.
 *
 * @param {string} url - Url to parse.
 */
function normalize(url) {
  let id = null;
  let endpoint = url;
  const re = /\/(\d+)/;
  const matches = url.match(re);
  if (matches !== null) {
    id = matches[1];
    endpoint = url.replace(re, '/:id');
  }
  return { id, endpoint };
}

function format(obj) {
  const data = {};
  _.map(obj, (value, key) => {
    if (_.isFunction(value)) {
      data[key] = value(obj);
    } else {
      data[key] = value;
    }
  });
  return data;
}


_.isError = (data) => {
  return _.isObject(result) && _.has(result, 'status') && _.has(result, 'message') && result.status >= 400;
}


// classes
// -------
/**
 * Abstract base class for mocking server data. New mock servers
 * can be created by inheriting this class via `extends` and
 * overriding the `data()` and `api()` class methods.
 */
export class Server {
  constructor(name) {
    this.name = name || 'mock-server';
    this.db = {};

    // reformat data for internal storage
    _.each(this.data(), (val, key) => {
      // reduce list into dictionary with indices
      if (_.isArray(val)) {
        let idx = 1;
        this.db[key] = val.reduce((obj, item) => {
          item.id = idx;
          obj[idx] = item;
          idx += 1;
          return obj;
        }, {});

      // store singleton data
      } else {
        this.db[key] = val;
      }

      // TODO: CREATE PROXY FOR DATABASE CLOJURE TO ALLOW THIS.DB.MODEL.GET(ID)
    });

    this._api = this.api();
  }

  /**
   * Get model data for specified id, accounting for relationship
   * definitions between models.
   *
   * @param {string} model - Model name.
   * @param {integer} id - Model key/identifier.
   */
  get(model, id) {
    if (id === undefined) {
      return _.map(_.values(this.db[model]), format);
    } else {
      return format(this.db[model][id]);
    }
  }

  /**
   * Generate default request processors for collection
   * endpoints, overriding the `get` and `post` handlers.
   *
   * @param {string} model - Database model.
   * @param {array} exclude - Model keys to exclude from response payload.
   * @param {array} include - Model keys to include in response payload.
   * @param {string} key - foreign key to parent resource.
   */
  collection(options) {
    if (_.isString(options)) {
      options = { model: options };
    }
    const model = options.model;
    return {
      get: () => Object.keys(this.db[model]).map(id => this.get(model, id)),
      post: (data) => {
        const id = Number(_.max(Object.keys(this.db[model]))) + 1;
        data.id = id;
        this.db[model][id] = data;
        return this.get(model, id);
      },
    };

    // {
    //   get: (id) => {
    //     const records = Object.keys(this.db.records).map(id => this.db.records[id]);
    //     return records.filter(x => x.post_id === id);
    //   },
    //   post: (id, data) => {
    //     // TODO: THINK AB OUT CLOJURE SYNTAX WHEN ABSTRACTING
    //     //       INTO NEW PACKAGE
    //     // this.db.records.get(id);
    //     // this.db.records.add(data);
    //     // this.db.records.update(id, data);
    //     // this.db.records.remove(id);
    //     data.id = Number(_.max(Object.keys(this.db.records))) + 1;
    //     data.post_id = id;
    //     this.db.records[data.id] = data;
    //     const records = Object.keys(this.db.records).map(key => this.db.records[key]);
    //     return records.filter(x => x.post_id === id);
    //   },
    // },

  }

  /**
   * Generate default request processors for model
   * endpoints, overriding the `get`, `put`, and `delete`
   * handlers.
   *
   * @param {string} model - Database model.
   * @param {array} exclude - Model keys to exclude from response payload.
   * @param {array} include - Model keys to include in response payload.
   * @param {string} key - foreign key to child resource.
   */
  model(options) {
    if (_.isString(options)) {
      options = { model: options };
    }
    const model = options.model;
    return {
      get: id => this.get(model, id),
      put: (id, data) => {
        const keys = Object.keys(this.db[model][id]);
        this.db[model][id] = Object.assign(this.db[model][id], _.pick(data, keys));
        return this.get(model, id);
      },
      delete: (id) => {
        delete this.db[model][id];
      },
    };
  }

  /**
   * Generate default request processors for singleton model
   * endpoints, overridding the `get`, `put`, and `delete`
   * handlers.
   *
   * @param {object} model - Database model.
   */
  singleton(options) {
    if (_.isString(options)) {
      options = { model: options };
    }
    const model = options.model;
    return {
      get: () => this.db[model],
      put: (data) => {
        this.db[model] = Object.assign(this.db[model], data);
        return this.db[model];
      },
      delete: () => this.reset(model),
    };
  }

  /**
   * Method for defining internal database that will
   * be used throughout requests. This method allows
   * users to configure an initial `state` for the database
   * and all internal data models.
   */
  data() {
    return {};
  }

  /**
   * Method returning server endpoints with get/post/put/delete
   * request processing callables.
   */
  api() {
    return {};
  }

  /**
   * Reset internal database for server mock to original state.
   *
   * @param {object} model - Database model to reset.
   */
  reset(model) {
    let obj = new this.constructor();

    // reset everything
    if (model === undefined) {
      this.db = obj.db;

    // reset specific model
    } else if (model in obj.db) {
      this.db[model] = obj.db[model];

    // handle invalid input
    } else {
      throw new Error(`Specified model \`${model}\` not in mock server database.`);
    }
    obj = null;
  }

  /**
   * Initialize server mock and create fake callables for
   * all axios requests. This method should be called before tests
   * run or at the beginning of a test session.
   */
  init() {
    let baseUrl = '';

    // GET
    axios.get.mockImplementation((url) => {
      const { id, endpoint } = normalize(baseUrl + url);
      return new Promise((resolve, reject) => {
        // handle invalid urls
        if (!(endpoint in this._api) || this._api[endpoint] === null) {
          reject(NotFound(url));
        }

        // handle missing server methods
        const method = this._api[endpoint].get;
        if (method === undefined) {
          reject(NotFound(url));
        }

        // collection request
        if (id === null) {
          resolve({
            status: 200,
            data: method(),
          });

        // model request
        } else {
          // reject on missing model
          const result = method(Number(id));
          if (_.isUndefined(result)) {
            reject(Missing(id));

          // return model
          } else {
            resolve({
              status: 200,
              data: result,
            });
          }
        }
      });
    });

    // POST
    axios.post.mockImplementation((url, data) => {
      const { id, endpoint } = normalize(baseUrl + url);
      return new Promise((resolve, reject) => {
        // handle invalid urls
        if (!(endpoint in this._api) || this._api[endpoint] === null) {
          reject(NotFound(url));
        }

        // handle missing server methods
        const method = this._api[endpoint].post;
        if (method === undefined) {
          reject(NotFound(url));
        }

        // collection request
        if (!id) {
          resolve({
            status: 201,
            data: method(data),
          });

        // model request
        } else {
          resolve({
            status: 200,
            data: method(Number(id), data),
          });
        }
      });
    });

    // PUT
    axios.put.mockImplementation((url, data) => {
      const { id, endpoint } = normalize(baseUrl + url);
      return new Promise((resolve, reject) => {
        // handle invalid urls
        if (!(endpoint in this._api) || this._api[endpoint] === null) {
          reject(NotFound(url));
        }

        // handle missing server methods
        const method = this._api[endpoint].put;
        if (method === undefined) {
          reject(NotFound(url));
        }


        // model request
        if (id) {
          resolve({
            status: 200,
            data: method(Number(id), data),
          });

        // singleton request
        } else {
          resolve({
            status: 200,
            data: method(data),
          });
        }
      });
    });

    // DELETE
    axios.delete.mockImplementation((url) => {
      const { id, endpoint } = normalize(baseUrl + url);
      return new Promise((resolve, reject) => {
        // handle invalid urls
        if (!(endpoint in this._api) || this._api[endpoint] === null) {
          reject(NotFound(url));
        }

        // handle missing server methods
        const method = this._api[endpoint].delete;
        if (method === undefined) {
          reject(NotFound(url));
        }

        // resolve response
        resolve({
          status: 204,
          data: this._api[endpoint].delete(Number(id)),
        });
      });
    });

    // instance creation
    axios.create.mockImplementation((params) => {
      if (_.has(params, 'baseUrl')) {
        baseUrl = params.baseUrl;
      }
      return axios;
    });

    // base handler
    axios.mockImplementation((params) => {
      const before = baseUrl;
      if (_.has(params, 'baseUrl')) {
        baseUrl = params.baseUrl;
      }
      params = Object.assign({ method: 'get', data: {} }, params);
      const method = axios[params.method];
      const result = method(params.url, params.data);
      baseUrl = before;
      return result;
    });
  }
}

export default Server;
