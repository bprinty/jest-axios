# API

## Classes

The main export of this API is the `Server` object, which is extended for any API mocking. Important components of the object to take node of are:

* `data` - Method for declaring data in mocked server by default.
* `api` - Method for declaring Functionality for mocked endpoints.
* `model` - Method for abstracting common GET/PUT/DELETE functionality for models.
* `collection` - Method for abstracting common GET/POST functionality for models.

### Server

/autodoc src/index.js Server


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
