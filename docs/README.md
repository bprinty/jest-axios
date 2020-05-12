# Jest Axios

## Introduction

Jest Axios is a [Jest](https://jestjs.io/) plugin that simplifies the process of mocking [axios](https://github.com/axios/axios) requests during testing. It fully utilizes Jest's built-in capabilities for mocking functions, and will automatically override requests made using axios throughout your application.

It does this with three main features:

1. Easy configuration for defining functions to return data for specific endpoints and request methods.
2. An internal database for storing data to serve via endpoint mocks.
3. Providing tools that minimize boilerplate when mocking data for data models and collections of models.


### Why is this Useful?

It can be difficult to test JavaScript packages and complex web applications that fetch data from external services. Jest provides good [tools](https://jestjs.io/docs/en/mock-functions) for mocking data, but those tools aren't scalable for `axios` specifically or easy to configure for common REST API patterns. The result is a lot of unnecessary boilerplate in Jest tests, which can cause confusion and increase the maintenance burden of a test suite. This package simplifies that process by providing users a tool to quickly and robustly spin up mocked API services that will serve real data when `axios` requests are made throughout an application.


### Prerequisites

This documentation assumes users have at least a practical understanding of [ES6](https://www.freecodecamp.org/news/write-less-do-more-with-javascript-es6-5fd4a8e50ee2/) syntax and constructs. This documentation has code examples heavily utilizing ES6 constructs.


## Quickstart

The documentation that follows details how to mock a REST API for a minimal [todo list](https://vuejs.org/v2/examples/todomvc.html) application. First, we'll define configuration for mocking requests in our application, and will then use axios in `jest` tests to showcase the mocked requests.

For more detailed documentation about how to define and configure mock REST API services with this library, see the [Guide](/guide/) section of the documentation.

To start, here is the syntax for configuring a server to mock requests:

```javascript
// contents of tests/index.test.js
import axios from 'axios';
import { Server } from 'jest-axios';

class App extends Server {

  data() {
    return {
      todos: [
        { name: 'foo', done: false },
        { name: 'bar', done: true },
      ],
    };
  }

  api() {
    return {
      '/todos': this.collection('todos'),
      '/todos/:id': this.model('todos'),
      '/todos/:id/complete': {
        post: id => this.db.todos.update(id, { done: true });
      },
    };
  }
}
```

Once we have this defined, we need to configure our tests to initialize the server and mock axios:


```javascript
// contents of tests/index.test.js
...

server = App('todo-app');
jest.mock('axios');
server.init(axios);
```

With the server initialized, let's run some tests to show the mocked requests:

```javascript
// contesnts of tests/index.test.js
...

test('api.test', async () => {

  // issue request
  const response = await axios.get('/todos');

  // check status code
  assert.equal(response.status, 200);

  // check payload
  assert.equal(response.data, [
    { id: 1, name: 'foo', done: false },  
    { id: 2, name: 'bar', done: true },
  ]);

  // issue missing request and check error
  try {
    await axios.get('/missing');
    assert.fail('Endpoint `/missing` should have returned error.');
  } catch (err) {
    assert.equal(err.status, 404);
  }

  // get specific todo item
  let todo = await axios.get('/todos/1').then(response => response.data);
  assert.equal(todo, { name: 'foo', done: false });

  // complete todo item and check again
  await axios.post('/todos/1/complete');
  todo = await axios.get('/todos/1').then(response => response.data);
  assert.equal(todo.done, true);
});
```

That's it! This library will also automatically mock any `axios` requests you make throughout your project, so you don't need to directly make `axios` calls inside tests to benefit from this package.

This simple example showcases only a small portion of the features available in the package. For more detailed examples and explanations, see the [Usage](/guide/) section of the documentation.

For API documentation, see the [API](/api/) section of the documentation.


## Table of Contents

- [Setup](/setup/)
- [Usage](/guide/)
- [API](/api/)


## Additional Resources

- [Jest](https://jestjs.io/)
- [Jest Mocking Tools](https://jestjs.io/docs/en/mock-functions)
- [Axios](https://github.com/axios/axios)
