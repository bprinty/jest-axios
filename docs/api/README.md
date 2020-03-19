# API

## Default

The main export of this API is the `Server` object, which is extended for any API mocking. Important components of the object to take node of are:

* `data` - Method for declaring data in mocked server by default.
* `api` - Method for declaring Functionality for mocked endpoints.
* `model` - Method for abstracting common GET/PUT/DELETE functionality for models.
* `collection` - Method for abstracting common GET/POST functionality for models.

### Server

/autodoc src/server.js Server


## Database

Internally, data are managed via `Model` objects that provide utilities for crud operations on database models. Below are examples of how these model objects are used under the hood for a `Server` object (see the example in the [Guide](/guide/) section for context):

```javascript
// get model with rendered functions and id
server.db.posts.get(1);

// update model
server.db.posts.update(1, { title: 'Foo', body: 'bar' });

// add new model to collection (resolving id)
server.db.posts.add({ title: 'Foo', body: 'bar' });

// remove model from collection
server.db.posts.remove(1);
```

### Collection

/autodoc src/models.js Collection


### Singleton

/autodoc src/models.js Singleton


## Errors

Below are error classes that can be used in in the api service for returning responses. Trowing any of these errors in an endpoint callable will propagate to the UI. For example:

```javascript
import { Server } from 'jest-axios';
import { NotFound, Forbidden } from 'jest-axios/errors';

class App extends Server {

  data() {
    return {
      todos: [
        { name: 'foo', done: false },
        { name: 'bar', done: true },
    };
  }

  api() {
    return {
      '/todos': this.collection('todos'),
      '/todos/:id': {
          get: this.model('todos').get,
          post: () => throw NotFound(),
          delete: () => throw Forbidden(),
      },
    };
  }
}
```

### NotFound

/autodoc src/errors.js NotFound

### Forbidden

/autodoc src/errors.js Forbidden

### Missing

/autodoc src/errors.js Missing
