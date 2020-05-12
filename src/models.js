/**
 * Data managers.
 */


// imports
// -------
import _ from 'lodash';


// helpers
// -------
function format(obj, id) {
  const data = id ? { id } : {};
  if (!_.isNaN(Number(data.id))) {
    data.id = Number(data.id);
    obj.id = data.id;
  }
  _.map(obj, (value, key) => {
    if (_.isFunction(value)) {
      data[key] = value(obj);
    } else {
      data[key] = value;
    }
  });
  return data;
}


// classes
// -------
/**
 * Abstract model class for databases.
 */
class Model {
  /**
   * Get all records from model.
   */
  all() {
    throw new Error('`all()` method must be overridden by extensions of `Model` class.');
  }

  /**
   * Return json data structure with all data in model.
   */
  json() {
    return this.all();
  }

  /**
   * Reset database to initial state.
   */
  reset() {
    this.data = _.clone(this.backup);
    this.head = this.backupIndex;
  }
}

/*
 * Collection class for managing collections of objects.
 * This objects provides some proxy methods for interacting
 * with faux databases provided by this package.
 */
export class Collection extends Model {
  /**
   * Create a new Collection.
   *
   * @param {string} name - Name of model.
   * @param {array} data - Data to store.
   * @param {function} index - Indexing function for model ids.
   */
  constructor(name, data, index) {
    super();
    this.index = index;
    this.name = name;
    this.data = {};

    if (!_.isArray(data)) {
      throw new Error('Inputs to `Collection` object must be `Array` type.');
    }
    this.head = 0;
    data.map((value) => {
      this.head = this.index(this.head);
      this.data[this.head] = value;
      return value;
    });
    this.backupIndex = this.head;
    this.backup = _.clone(data);

    return new Proxy(this, {
      get: (obj, prop) => ((prop in obj.data) ? { id: prop, ...obj.data[prop] } : obj[prop]),
      set: (obj, prop, value) => {
        if (prop === 'head') {
          obj.head = value;
          return true;
        }
        if (!_.isObject(value)) {
          throw new Error('New collection record must be `Object` type.');
        }
        if (prop in obj.data) {
          const keys = Object.keys(obj.data[prop]);
          obj.data[prop] = Object.assign(obj.data[prop], _.pick(value, keys));
        } else {
          obj.head = prop;
          obj.data[prop] = data;
        }
        return true;
      },
      deleteProperty: (obj, prop) => {
        delete obj.data[prop];
        return true;
      },
    });
  }

  /**
   * Get single item from collection.
   *
   * @param {number} id - Identifier for model to get from database.
   */
  get(id) {
    if (!(id in this.data)) {
      return undefined;
    }
    return format(this.data[id], id);
  }

  /**
   * Get all models in collection.
   */
  all() {
    return Object.keys(this.data).map(id => this.get(id));
  }

  /**
   * Add data to collection.
   *
   * @param {object} - Data to add to collection.
   */
  add(data) {
    // create template for missing function fields
    let tmpl = {};
    const keys = Object.keys(this.data);
    if (keys.length) {
      tmpl = this.data[keys[0]];
    }
    _.map(tmpl, (value, key) => {
      if (_.isFunction(value) && !(key in data)) {
        data[key] = value;
      }
    });

    // generate new index and save data
    this.head = this.index(this.head);
    this.data[this.head] = data;
    return this.get(this.head);
  }

  /**
   * Update data for model.
   */
  update(id, data) {
    if (!(id in this.data)) {
      throw new Error(`Specified id \`${id}\` not in collection.`);
    }
    _.map(data, (value, key) => {
      this.data[id][key] = value;
    });
    return this.get(id);
  }

  /**
   * Remove record from collection.
   *
   * @param {string} id - Identifier for record.
   */
   remove(id) {
     delete this.data[id];
   }
}


/**
 * Singleton class for managing singleton objects.
 * This objects provides some proxy methods for interacting
 * with faux databases provided by this package.
 */
export class Singleton extends Model {
  /**
   * Create a new Singleton object.
   *
   * @param {string} name - Name of model.
   * @param {array} data - Data to store.
   */
  constructor(name, data) {
    super();
    this.name = name;

    if (!_.isObject(data)) {
      throw new Error('Inputs to `Singleton` object must be `Object` type.');
    }
    this.backup = _.clone(data);
    this.data = data;

    return new Proxy(this, {
      get: (obj, prop) => {
        if (prop in obj.data) {
          const data = obj.get();
          return data[prop];
        }
          return obj[prop];
      },
      set: (obj, prop, value) => {
        obj.data[prop] = value;
        return true;
      },
      deleteProperty: (obj, prop) => {
        delete obj.data[prop];
        return true;
      },
    });
  }

  /**
   * Update data for model.
   */
  update(data) {
    _.map(data, (value, key) => {
      this.data[key] = value;
    });
    return this.json();
  }

  /**
   * Get formatted collection results.
   */
  get() {
    return format(this.data);
  }

  /**
   * Get formatted collection results.
   */
  all() {
    return format(this.data);
  }
}


// exports
// -------
export default {
  Singleton,
  Collection,
};
