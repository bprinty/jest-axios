
[![Build Status](https://travis-ci.com/bprinty/jest-axios.png?branch=master)](https://travis-ci.com/bprinty/jest-axios) [![Code coverage](https://codecov.io/gh/bprinty/Flask-Occam/branch/master/graph/badge.svg)](https://codecov.io/gh/bprinty/Flask-Occam) [![Maintenance yes](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/bprinty/jest-axios/graphs/commit-activity) [![GitHub license](https://img.shields.io/github/license/Naereen/StrapDown.js.svg)](https://github.com/bprinty/jest-axios/blob/master/LICENSE) [![Documentation status](http://inch-ci.org/github/dwyl/hapi-auth-jwt2.svg?branch=master)](https://bprinty.github.io/jest-axios)

# Jest Axios

## Introduction

Jest Axios is a [Jest](https://jestjs.io/) plugin that simplifies the process of mocking [axios](https://github.com/axios/axios) requests during testing. It fully utilizes Jest's built-in capabilities for mocking functions, and will automatically override requests made using axios throughout your application.

It does this with three main features:

1. Easy configuration for defining functions to return data for specific endpoints and request methods.
2. An internal database for storing data to serve via endpoint mocks.
3. Providing tools that minimize boilerplate when mocking data for data models and collections of models.


### Why is this Useful?

It can be difficult to test JavaScript packages and complex web applications that fetch data from external services. Jest provides good [tools](https://jestjs.io/docs/en/mock-functions) for mocking data, but those tools aren't scalable for `axios` specifically or easy to configure for common REST API patterns. The result is a lot of unnecessary boilerplate in Jest tests, which can cause confusion and increase the maintenance burden of a test suite. This package simplifies that process by providing users a tool to quickly and robustly spin up mocked API services that will serve real data when `axios` requests are made throughout an application.


## Installation

### Install in Project

To use this library in a project, add the package to your package dependencies via:

```bash
npm install --save jest-axios
```

Or, with [yarn](https://yarnpkg.com/):

```bash
yarn add jest-axios
```

## Documentation

Documentation for the project can be found [here](http://bprinty.github.io/jest-axios).


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
server.init();
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

This simple example showcases only a small portion of the features available in the package. For more detailed examples and explanations, see the [docs](https://bprinty.github.io/jest-axios).


## Contributors

### Getting Started

To get started contributing to the project, simply clone the repo and setup the dependencies using `yarn` or `npm install`:

```bash
git clone git@github.com:bprinty/jest-axios.git
cd jest-axios/
yarn
```

Once you do that, you should be ready to write code, run tests, and edit the documentation.


### Building Documentation

To develop documentation for the project, make sure you have all of the developer dependencies installed from the `package.json` file in the repo. Once you have all of those dependencies, you can work on the documentation locally using:

```bash
yarn docs:dev
```

Or, using `vuepress` directly:

```bash
vuepress dev docs
```

### Running Tests

The [Jest](https://jestjs.io/) framework is used for testing this application. To run tests for the project, use:

```bash
yarn test
```

To have Jest automatically watch for changes to code for re-running tests in an interactive way, use:

```bash
yarn test:watch
```

To run or watch a specific test during development, use:

```bash
yarn test:watch -t model.update
```

Or, you can invoke `jest` directly:

```bash
jest
jest --watch
jest --watch -t model.update
```

### Submiting Feature Requests

If you would like to see or build a new feature for the project, submit an issue in the [GitHub Issue Tracker](https://github.com/bprinty/jest-axios/issues) for the project. When submitting a feature request, please fully explain the context, purpose, and potential implementation for the feature, and label the ticket with the `discussion` label. Once the feature is approved, it will be re-labelled as `feature` and added to the project Roadmap.


### Improving Documentation

Project documentation can always be improved. If you see typos, inconsistencies, or confusing wording in the documentation, please create an issue in the [GitHub Issue Tracker](https://github.com/bprinty/jest-axios/issues) with the label `documentation`. If you would like to fix the issue or improve the documentation, create a branch with the issue number (i.e. `GH-123`) and submit a PR against the `master` branch.


### Submitting PRs

For contributors to this project, please submit improvements according to the following guidelines:

1. Create a branch named after the ticket you're addressing. `GH-1` or `bp/GH-1` are examples of good branch naming.
2. Make your changes and write tests for your changes.
3. Run all tests locally before pushing code.
4. Address any test failures caught by [Travis CI](https://travis-ci.com/bprinty/jest-axios).
5. Make sure you've updated the documentation to reflect your changes (if applicable).
6. Submit a PR against the `master` branch for the project. Provide any additional context in the PR description or comments.


### Keeping up to Speed on the Project

All development efforts for the project are tracked by the project [Kanban](https://github.com/bprinty/jest-axios/projects/1) board. Contributors use that board to communicate the status of pending, in-progress, or resolved development efforts. If you have a question about the Roadmap or current in-progress issues for the project, see that board.
