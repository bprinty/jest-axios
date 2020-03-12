# API

The [Models](/guide/models/api.md) section of the documentation provided more detail about how API methods can be configured to pull information. It is highly recommended to read and understand the concepts outlined in that documentation before jumping further into this section of the docs.

The following code shows an analagous data structure for store API configuration:

```javascript
const myModels = {
  api: {
    /**
     * Endpoint for model collection actions. This property is automatically
     * used for `fetch` and `create` in api definitions if those
     * configuration items aren't specified.
     */
    collection: '/mymodel',
    /**
     * Endpoint for model instance actions. This property is automatically
     * used for `get`, `update`, and `delete` in api definitions if those
     * configuration items aren't specified.
     */
    model: '/mymodel/:id',
    /**
     * Endpoint for fetching a collection of models via API parameters.
     * This method is used whenever Model.fetch() is called.
     */
    fetch: '/mymodel',
    /**
     * Endpoint for creating a single model via API.
     * This method is used whenever Model.commit() is used after
     * a new frontend model is created.
     */
    create: '/mymodel',
    /**
     * Endpoint for fetching a single model via API.
     * This method is used whenever Model.fetch(<id>) is called.
     */
    get: '/mymodel/:id',
    /**
     * Endpoint for updating a single model via API.
     * This method is used whenever Model.commit() is called
     * for an existing model in the store. If `delete` is not
     * set, this endpoint will be used for DELETE operations.
     */
    update: '/mymodel/:id',
    /**
     * Endpoint for deleting a single model via API.
     * This method is used whenever Model.delete() is called for
     * an existing model in the store.
     */
    delete: '/mymodel/:id',
  },
  contract: { ... },
}
```


## Vuex Constructs

Considering the API definition above, several constructs are created for fetching/pushing data via application API. In particular, Vuex [actions](https://vuex.vuejs.org/guide/actions.html) are created for each type of API specification, and are stored with the name ``<model>.<action>``. For clarity, the above specification is equivalent to (only a few actions will be described to provide context):

```javascript
const state = {
  myModels: [],
};

...

const actions = {
  /**
   * Action for fetching  a collection of models (with optional parameters) via API.
   */
  'myModels.fetch': ({ commit }, params) => {
    // 1. Issue request or execute callable with params to fetch data.
    // 2. Return promise with resulting JSON data from API.
    // 3. Promise automatically commits new data to the store before resolving.
  },
  /**
   * Action for creating a single model instance via API.
   */
  'myModels.create': ({ commit }, data) => {
    // 1. Issue request or execute callable with payload to create new model instance.
    // 2. Return promise with resulting JSON data from API.
    // 3. Promise automatically commits data to the store before resolving.
  },
  ...

}
```

> Note that the mutations referenced above perform all data validation and reformatting according to the contract specification.


### Actions

The following table shows a full list of available actions created for model definitions:

| Mutation | Description |
|-|-|
| `<model>.fetch` | Issue a `GET` request to fetch model data. |
| `<model>.create` | Issue a `POST` request to create a new model instance. |
| `<model>.get` | Issue a `GET` request on a single model instance to retrieve data. |
| `<model>.update` | Issue a `PUT` request to update metadata for an existing model. |
| `<model>.delete` | Issue a `DELETE` request to delete an existing model instance. |

> Note: Request methods are referenced in the table above, but developers have the ability to override these methods with custom functions for interacting with an external datasource. They can also override the default request methods used when performing specific actions. See the [Configuration](/guide/setup/configure.md) section for more information.

And the code below shows some examples of how to use these `actions`:

```javascript
// fetch all myModel data from API
store.dispatch('myModels.fetch').then((data) => {
  // do something with the data
});

// create new myModel instance
const myModel = { foo: 'foo', bar: 'bar' };
store.dispatch('myModels.create', post);

// get specific myModel instance
const myModel = store.getters('myModels.get', 1);

// update myModel instance
myModel.param = 'bar';
const post = store.getters('myModels.update', post);

// delete myModel instance
store.getters('myModels.delete', post);
```

See the [Contract](/guide/store/contract.md) section of the documentation for information on the other Vuex constructs defined by this module. This section of the documentation only describes the `state parameters` and `actions` created, but other Vuex `mutations` are created to manage the data.


## Alternative Data Sources

Without declaring `Model` classes, you can still use similar configuration for customizing API data access. Here is how you might configure this library to pull data from alternative data sources:

```javascript
const myModels = {
  api: {
    update: '/mymodel/:id',
    fetch: (params) => {
      return new Promise((resolve, reject) => {
        // code for fetching data with params
        const data = [
          { 'one': 1, 'two': 2 },
          { 'three': 3, 'four': 4 },
        ];
        resolve(data);
      });
    },
  },
}
```

Using this strategy, the downstream API is the same:

```javascript
store.dispatch('myModels.fetch', { foo: 1, bar: 2 }).then((results) => {
  // do something after data returns
})
```

This mechanism for overwriting data access methods is particularly useful if you're not using a REST API in your application (e.g. [GraphQL](https://graphql.org/) or [gRPC](https://grpc.io/]).


## Parsing Request Data

The syntax for customizing request parsing without defining Models is very similar to the syntax used when Models are defined. Consider the use-case where our API provides data in the following format:

```javascript
[
  [1, { title: 'foo' }],
  [2, { title: 'bar' }],
]
```

And we need to re-parse that data into the following format so it can be easily consumed by the models in our store:

```javascript
[
  { id: 1, title: 'test' },
  { id: 2, title: 'test2' },
]
```

To accomplish this, we can overwrite API callables to reshape data before and after requests:

```javascript
const myModels = {
  api: {
    update: (data) => {
      // parsing input for update action
      const {id, ...extra} = data;
      const newData = [id, extra];

      // return promise for sending the update
      return axios.put('/mymodel', newData).then((response) => {

        // parsing result to update internal properties
        const result = {response.data[0], ...response.data[1]};
        return result;
      });
    },
    fetch: (params) => {
      // return promise for fetching and processing the data
      return axios.get('/mymodel', { params }).then((response) => {

        // parse payload into new structure
        return response.data.map(item => Object.assign(item[1], { id: item[0] }));
      });
    },
  },
};
```

> Note that the axios instance used in this case is user-defined and must be configured outside of this library.
