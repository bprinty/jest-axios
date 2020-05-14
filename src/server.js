/**
 * Main exports for project.
 */


// imports
// -------
import _ from 'lodash';
import axios from 'axios';

import { Singleton, Collection } from './models';
import { NotFound, Missing } from './errors';


// helpers
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
    id = _.cast(matches[1]);
    endpoint = url.replace(re, '/:id');
  }
  return { id, endpoint };
}

_.isError = data => _.isObject(data) && _.has(data, 'status') && _.has(data, 'message') && data.status >= 400;

_.cast = (id) => {
  if (!_.isNaN(Number(id))) {
    id = Number(id);
  }
  return id;
};


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

    // reformat data spec
    this.db = {};
    _.each(this.data(), (val, key) => {
      if (_.isArray(val)) {
        this.db[key] = new Collection(key, val, this.constructor.index);
      } else {
        this.db[key] = new Singleton(key, val);
      }
    });

    // instantiate api contract
    this._api = this.api();
  }

  /**
   * Function for returning index of new item in server. Can
   * be overridden to use UUID indexes.
   *
   * @param {integer} max - Current max index in table.
   */
  static index(max) {
    max = max || 0;
    return max + 1;
  }

  /**
   * Get model data for specified id, accounting for relationship
   * definitions between models.
   *
   * @param {string} model - Model name.
   * @param {integer} id - Model key/identifier.
   */
  get(model, id) {
    return this.db[model].get(id);
  }

  /**
   * Generate default request processors for collection
   * endpoints, overriding the `get` and `post` handlers.
   *
   * @param {string} model - Database model.
   * @param {array} exclude - Model keys to exclude from response payload.
   * @param {string} relation - Relation to subset queries by.
   * @param {string} key - Foreign key on relation linking model and relation.
   */
  collection(options) {
    if (_.isString(options)) {
      options = { model: options };
    }
    const exclude = options.exclude || [];
    const { model, relation, key } = options;
    return {
      get: (id) => {
        let data = _.map(this.db[model].all(), item => _.omit(item, exclude));
        if (id && relation && key) {
          data = data.filter(item => item[key] === id);
        }
        return data;
      },
      post: (data, id) => {
        const process = (item) => {
          if (id && relation && key) {
            item[key] = id;
          }
          if ('id' in item) {
            return _.omit(this.db[model].update(item.id, item), exclude);
          } else { // eslint-disable-line
            return _.omit(this.db[model].add(item), exclude);
          }
        };
        if (_.isArray(data)) {
          return data.map(item => process(item));
        }
          return process(data);
      },
      put: (data, id) => {
        if (!(id && relation && key && _.isArray(data))) {
          return undefined;
        }
        const process = (item) => {
          item[key] = id;
          return _.omit(this.db[model].update(item.id, item), exclude);
        };
        return data.map(item => process(item));
      },
    };
  }

  /**
   * Generate default request processors for model
   * endpoints, overriding the `get`, `put`, and `delete`
   * handlers.
   *
   * @param {string} model - Database model.
   * @param {array} exclude - Model keys to exclude from response payload.
   * @param {string} relation - Relation to subset queries by.
   * @param {string} key - Foreign key on model linking model and relation.
   */
  model(options) {
    if (_.isString(options)) {
      options = { model: options };
    }
    const exclude = options.exclude || [];
    const { model, relation, key } = options;
    return {
      get: (id) => {
        // reformat id for relation
        if (id && relation && key) {
          if (!(id in this.db[relation].data)) {
            return undefined;
          }
          id = this.db[relation][id][key];
        }

        // process
        if (!(id in this.db[model].data)) {
          return undefined;
        }
        return _.omit(this.db[model].get(id), exclude);
      },
      put: (data, id) => {
        // with relation
        if (id && relation && key) {
          if (!(id in this.db[relation].data)) {
            return undefined;
          }
          if (!(data.id in this.db[model].data)) {
            return undefined;
          }
          this.db[relation].data[id][key] = data.id;
          return this.db[model].get(data.id);
        }

        // without relation
        if (!(id in this.db[model].data)) {
          return undefined;
        }
        return _.omit(this.db[model].update(id, data), exclude);
      },
      post: (data, id) => {
        if (!(id && relation && key && _.isPlainObject(data))) {
          return undefined;
        }
        let res;
        if ('id' in data) {
          res = _.omit(this.db[model].update(data.id, data), exclude);
        } else { // eslint-disable-line
          res = _.omit(this.db[model].add(data), exclude);
        }
        this.db[relation].update(id, { [key]: res.id });
        return res;
      },
      delete: (id) => {
        // with relation
        if (id && relation && key) {
          this.db[relation].update(id, { [key]: null });
          return undefined;
        }

        // without relation
        return this.db[model].remove(id);
      },
    };
  }

  /**
   * Generate default request processors for singleton model
   * endpoints, overridding the `get`, `put`, and `delete`
   * handlers.
   *
   * @param {object} model - Database model.
   * @param {array} exclude - Model keys to exclude from response payload.
   */
  singleton(options) {
    if (_.isString(options)) {
      options = { model: options };
    }
    const exclude = options.exclude || [];
    const model = options.model;
    return {
      get: () => _.omit(this.db[model].json(), exclude),
      put: data => _.omit(this.db[model].update(data), exclude),
      delete: () => this.db[model].reset(),
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
   * Dump current state of database into json object.
   */
  dump() {
    const result = {};
    Object.keys(this.db).map((key) => {
      result[key] = this.db[key].json();
      return result[key];
    });
    return result;
  }

  /**
   * Initialize server mock and create fake callables for
   * all axios requests. This method should be called before tests
   * run or at the beginning of a test session.
   */
  init(axios) {
    let baseUrl = '';

    // GET
    axios.get.mockImplementation((url) => {
      const { id, endpoint } = normalize(baseUrl + url);
      return new Promise((resolve, reject) => {
        // handle invalid urls
        if (!(endpoint in this._api) || this._api[endpoint] === null) {
          reject(NotFound(url, 'GET'));
        }

        // handle missing server methods
        const method = this._api[endpoint].get;
        if (method === undefined) {
          reject(NotFound(url, 'GET'));
        }

        // operate
        const result = method(id);
        if (_.isUndefined(result)) {
          reject(Missing(id));
        }
        resolve({
          status: 200,
          data: result,
        });
      });
    });

    // POST
    axios.post.mockImplementation((url, data) => {
      const { id, endpoint } = normalize(baseUrl + url);
      return new Promise((resolve, reject) => {
        // handle invalid urls
        if (!(endpoint in this._api) || this._api[endpoint] === null) {
          reject(NotFound(url, 'POST'));
        }

        // handle missing server methods
        const method = this._api[endpoint].post;
        if (method === undefined) {
          reject(NotFound(url, 'POST'));
        }

        // operate
        resolve({
          status: 201,
          data: method(data, id),
        });
      });
    });

    // PUT
    axios.put.mockImplementation((url, data) => {
      const { id, endpoint } = normalize(baseUrl + url);
      return new Promise((resolve, reject) => {
        // handle invalid urls
        if (!(endpoint in this._api) || this._api[endpoint] === null) {
          reject(NotFound(url, 'PUT'));
        }

        // handle missing server methods
        const method = this._api[endpoint].put;
        if (method === undefined) {
          reject(NotFound(url, 'PUT'));
        }

        // operate
        resolve({
          status: 200,
          data: method(data, id),
        });
      });
    });

    // DELETE
    axios.delete.mockImplementation((url) => {
      const { id, endpoint } = normalize(baseUrl + url);
      return new Promise((resolve, reject) => {
        // handle invalid urls
        if (!(endpoint in this._api) || this._api[endpoint] === null) {
          reject(NotFound(url, 'DELETE'));
        }

        // handle missing server methods
        const method = this._api[endpoint].delete;
        if (method === undefined) {
          reject(NotFound(url, 'DELETE'));
        }

        // resolve response
        resolve({
          status: 204,
          data: this._api[endpoint].delete(id),
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


// exports
// -------
export default {
  Server,
};
