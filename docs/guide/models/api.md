# API

The most important feature of this library is the ability to reflect data from an external API. When defining front-end models to store data, developers must specify configuration for how to retrieve the data.

The following code shows the data structure for Model API configuration:

```javascript
class MyModel extends Model {

  /**
   * Static method for declaring data accessors.
   */
  static api() {
    return {
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
      create: 'mymodel',
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
       * Endpoint for deleting a single odel via API.
       * This method is used whenever Model.delete() is called for
       * an existing model in the store.
       */
      delete: '/mymodel/:id',
    };
  }

  ...

}
```

> Note that `api()` must be a `static` method on your class. If it is not declared as a static method, the model **will not work according to expectations**.

## Interpreting URLs

Developers commonly need to construct URLs using model properties when updating data for a specific model. For instance, the following actions might be used for interacting with data from the `Post` model:

```javascript
PUT /posts/1  // update a post with the id `1`
GET /posts/my-post // fetch data for a post with the url slug `my-post`
```

With this library, you can automatically construct those urls for models using the `:prop` syntax in `api()` configuration:

```javascript
  ...

  static api() {
    return {
      update: '/posts/:id', // PUT /posts/:id
      get: '/posts/:slug', // GET /posts/:slug
    };
  }

  static props() {
    return {
      slug: null, // slug property (id is implicitly used as key)
    }
  }

  ...
```

If the `Post` model has the properties `id` and `slug`, these urls will be automatically resolved when used for updating data.

This syntax will also work with more complex endpoint patterns like:

```javascript
GET /authors/:id/posts/:tag // fetch posts from a specific author with a specific tag
```

## Request Methods

The following request methods are used by default for each of the actions available in `api()` configuration:


| Action      | Method   | Description                                                                 |
|:------------|:---------|:----------------------------------------------------------------------------|
| **fetch**   | `GET`    | Fetch a collection of models. Used with `Model.fetch()`.                    |
| **create**  | `POST`   | Creating new item. Used with `new Model({}) and Model.commit()`.            |
| **get**     | `GET`    | Fetch single item. Used with `Model.fetch(id)`.                             |
| **update**  | `PUT`    | Update data for single item. Used with `Model.commit()` after data changes. |
| **delete**  | `DELETE` | Delete single item. Used with `Model.delete()`                              |


For information on how to override these request methods globally or for a specific model, see the [Configuration](/guide/setup/configure.md) section of the documentation.

## Alternative Data Sources

In addition to accepting strings, each of the keys in the `api()` configuration can take callables for retrieving data. If using callables for these actions, the callables *must* return a `Promise` object:

```javascript
class MyModel extends Model {

  static api() {
    return {
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
    };
  }
}

// fetch data with params
MyModel.fetch({ foo: 1, bar: 2 }).then((results) => {
  // do something after data returns
})
```

This mechanism for overwriting data access methods is particularly useful if you're not using a REST API in your application (e.g. [GraphQL](https://graphql.org/) or [gRPC](https://grpc.io/]).


## Parsing Request Data

Ideas about data models on the frontend of an application can differ from models exposed via the application API, especially for large teams that don't communicate well. Frontend developers might need to reshape data from the backend so that they more logically represent the ideas available via the application UI.

Let's say our API is producing data in the format (please don't design an API like this; the structure below is here just to illustrate a point):

```javascript
[
  [1, { title: 'foo' }],
  [2, { title: 'bar' }],
]
```

And we need to re-parse that data into the following format so it can be consumed by our models:

```javascript
[
  { id: 1, title: 'test' },
  { id: 2, title: 'test2' },
]
```

To accomplish this, we can overwrite API callables to reshape data before and after requests:

```javascript
// within Model.api()
{
  update: (data) => {
    // parsing input for update action
    const {id, ...extra} = data;
    const newData = [id, extra];

    // return promise for sending the update
    return this.axios.put('/mymodel', newData).then((response) => {

      // parsing result to update internal properties
      const result = {response.data[0], ...response.data[1]};
      return result;
    });
  },
  fetch: (params) => {
    // return promise for fetching and processing the data
    return this.axios.get('/mymodel', { params }).then((response) => {

      // parse payload into new structure
      return response.data.map(item => Object.assign(item[1], { id: item[0] }));
    });
  },
}
```

> Note that the axios instance used by models can be accessed via `this.axios`. Axios configuration parameters set on the library will automatically be set on the instance.
