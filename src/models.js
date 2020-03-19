/**
 * Data managers.
 */


// imports
// -------
import _ from 'lodash';


// helpers
// -------
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


// classes
// -------
/**
 * Abstract model class for databases.
 */
class Model {
  json() {
    return this.data;
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
    data.map(value => {
      this.head = this.index(this.head);
      this.data[this.head] = value;
    });

    return new Proxy(this, {
      get: (obj, prop) => {
        return (prop in obj.data) ? { id: prop, ...obj.data[prop] } : obj[prop];
      },
      set: (obj, prop, value) => {
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
      },
      deleteProperty: (obj, prop) => {
        delete obj.data[prop];
      },
    });
  }

  /**
   * Get single item from collection.
   *
   * @param {number} id - Identifier for model to get from database.
   */
  get(id) {
    return format(this.data[id]);
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
    this.head = this.index(this.head);
    this.data[this.head] = data;
  }
}


/*
 * Singleton class for managing singleton objects.
 * This objects provides some proxy methods for interacting
 * with faux databases provided by this package.
 */
export class Singleton extends Model {
  constructor(name, data) {
    super();
    this.name = name;

    if (!_.isObject(data)) {
      throw new Error('Inputs to `Singleton` object must be `Object` type.');
    }
    this.data = data;

    return new Proxy(this, {
      get: (obj, prop) => {
        if (prop in obj.data) {
          const data = obj.get();
          return data[prop];
        } else {
          return obj[prop];
        }
      },
      set: (obj, prop, value) => {
        obj.data[prop] = value;
      },
      deleteProperty: (obj, prop) => {
        delete obj.data[prop];
      },
    });
  }

  /**
   * Get formatted collection results.
   */
  get() {
    return format(this.data);
  }
}

// exports
export default {
  Singleton,
  Collection,
};
