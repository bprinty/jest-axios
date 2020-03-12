# Contract

Similarly to the [class-based](/guide/models/properties.md) syntax for defining an API contract, this library allows developers to explicitly provide a specification for model properties so that assumptions can be made about how data should be managed. This section will detail how to explicitly declare a contract for models you define in your store.

The following code shows the data structure for declaring Model properties:

```javascript
const myModels = {
  api: { ... },
  contract: {
    /**
    * Placeholder property for example.
    */
    myProp: {
      /**
       * Default value for property.
       */
      default: null,
      /**
       * Default type for the property. If no `mutate` configuration
       * is set, the type specified here will be used to mutate the object.
       */
      type: String,
      /**
       * Parse value from server. This is useful for reformatting back-end
       * data into a format that is more useful for front-end operations.
       * This is different than the `mutate` property because it
       * defines how the contract will be parsed **after** data is returned
       * from the back-end.
       * @param value - Value passed to property after fetching data.
       * @returns Parsed value to use for property on front-end.
       */
      parse: function(value) {
        ...
        return parsedValue;
      },
      /**
       * Mutation function for processing property before create/update
       * actions. This is different than the `parse` property because it
       * defines how the contract will be mutated **before** data is sent to
       * the backend.
       * @param value - Value passed to property on update.
       * @returns Mutated value to set as model property.
       */
      mutate: function(value) {
        ...
        return newValue;
      },
      /**
       * Validation function for ensuring property is valid.
       * @param value - Un-mutated value passed to property on update.
       * @returns Boolean describing if value is valid or not.
       */
      validate: function(value) {
        ...
        return isValid;
      },
      /**
       * Collapse nested models into a single property for API
       * update actions (POST or PUT). This value is only relevant if
       * the property is an Object type or a linked Model instance. If
       * a boolean `true` is applied here, 'id' will be used as the collapse
       * property.
       */
       collapse: 'linkedPropId',
       /**
        * Function for retrieving property data. Properties that
        * instrument this property are not saved in the store for models,
        * and instead accessed using the function specified below. This
        * is primarily useful for adding linked models that aren't nested
        * in response data.
        * @returns Value accessible via Model.<prop>
        */
        get: () => {},
        /**
         * Shorthand for easily renaming a model property when data is
         * received **from** the API. In this case, `originalName` in
         * the payload for this model will be cast to `myProp` when the
         * model is used and casted back to `originalName` when data are
         * sent back to the application API.
         */
        from: 'originalName',
        /**
         * Shorthand for easily renaming a model property when data is sent
         * to the API. In this case, the model property will be renamed to
         * `apiName` when requests are sent to the application API.
         */
        to: 'apiName',
    },
    ...
  },

  ...

}
```

If you don't wish to specify detailed property-specific configuration, you can use the following shorthand for simply setting defaults:

```javascript
const myModels = {
  api: { ... },
  contract: {
      prop1: null,
      prop2: 2,
      prop3: 'foo',
  },
}
```

## Vuex Constructs

Considering the API definition above, several constructs are created for validating and mutating data for store updates. In particular, Vuex [mutations](https://vuex.vuejs.org/guide/mutations.html) are created for each type of API specification, and are stored with the names ``<model>.<mutation>``. For clarity, the above specification is equivalent to (only a few mutations will be described to provide context):

```javascript
const state = {
  myModels: [],
};

...

const mutations = {
  /**
   * Clear all instances of model from store.
   */
  'myModels.clear': (state) => {
    // 1. Find all model instances in store.
    // 2. Remove them from the store.
  },
  /**
   * Sync a single model instance with the store.
   */
  'myModels.sync': (state, data) => {
    // 1. Search for existing records in the store.
    // 2. Update existing records with new data.
    // 3. If no record exists, create a new one.
  },
  /**
   * Action for resetting model properties to contract defaults.
   */
  'myModels.reset': (state, id) => {
    // 1. Search for existing record in the store.
    // 2. Reset model properties to contract defaults.
  },
  /**
   * Action for fetching a single model instance by ID.
   */
  'myModels.remove': (state, id) => {
    // 1. Search for existing record in the store.
    // 2. Remove existing record from the store.
  },

}
```

> Note that the mutations referenced above perform all data validation and reformatting according to the contract specification.


### Mutations

The following table shows a full list of available mutations created for model definitions:

| Mutation | Description |
|-|-|
| `<model>.clear` | Clear all records for model from the store. |
| `<model>.sync` | Add or update existing instance(s) to/in the store. |
| `<model>.reset` | Reset instance properties to contract defauts. |
| `<model>.remove` | Remove existing instance from the store. |

And the code below shows some examples of how to use these mutations:

```javascript
// add new instance to the store
store.commit('myModels.sync', { id: 5, foo: 'foo', bar: 'bar' });

// add several new instances to the store
store.commit('myModels.sync', [
    { id: 7, foo: 'foo', bar: 'bar' },
    { id: 8, foo: 'foo', bar: 'bar' }
]);

// update the data for an existing instance
store.commit('myModels.sync', { id: 5, foo: 'baz' });

// update the data for several existing instance
store.commit('myModels.sync', [
    { id: 7, foo: 'baz' },
    { id: 8, bar: 'baz' },
]);

// remove an existing instance from the store
store.commit('myModels.remove', 5);
store.commit('myModels.remove', { id: 5, foo: 'foo', bar: 'bar' });

// clear all instances from store
store.commit('myModels.clear');
```

See the [API](/guide/store/api.md) section of the documentation for information on the other Vuex constructs defined by this module. This section of the documentation only describes the `state parameters`, and `mutations` created, but other Vuex `actions` are used to manage the API connection.

::: warning

Although developers can use mutations directly for interacting with the data, it is strongly recommended that you leave data updates to the actions automatically added to the store. For example, `update` actions will automatically call mutations to update state for tracked model instances, so there's no need to commit mutations directly.

:::

## Linked Models

As alluded to in the contract definition above, you can configure properties to reference other types of models via the `link` parameter in the contract definition. If the `link` property is specified, the library will try to parse nested payloads for the property and commit those linked model data into the store.

For example, if the API you're pulling data from produces nested data:

```javascript
// GET /posts
[
  {
      id: 1,
      title: 'Post 1',
      body: 'This is the text for post 1',
      author: {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@doe.com'
      },
  },
  {
      id: 2,
      title: 'Post 2',
      body: 'This is the text for post 2',
      author: {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@doe.com',
      },
  },
  ...,
]
```

And you have two models defined for your store like so:

```javascript
const authors = {
  contract: { ... },
};

const posts = {
  contract: {
    title: '',
    body: '',
    author_id: {
      from 'author',
      mutate: data => data.id,
      model: 'authors',
    },
  },
};
```

Then this library will automatically commit `authors` information to the store once they're fetched via the API. For example:

```javascript
store.authors  // []
store.posts  // []
store.dispatch('posts.fetch').then((data) => {
  store.posts // [{id: 1, title: 'foo', body: 'bar', author_id: 1}, ...]
  store.authors // [{id: 1, name: 'foobar'}, ...]
});
```

## Model Templates

You can also use the store to generate templates and default objects for each type of model. For example:

```javascript
const newAuthor = store.getters('authors.template')()
const authorDefaults = store.getters('authors.defaults')()
```

This is primarily useful for pre-allocating an object that can be filled and later sent to the server on an update. The difference between these two is that `template` will return `undefined` for any property without defaults, and `defaults` will only return keys for contract definitions with a `default` key set.
