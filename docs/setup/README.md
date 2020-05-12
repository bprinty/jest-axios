# Setup

## Install

To use this library in a project, add the package to your package dependencies via:

```bash
npm install --save jest-axios
```

Or, with [yarn](https://yarnpkg.com/):

```bash
yarn add jest-axios
```

## Configure

To configure your application to use this module, extend the `Server` object for serving the models in your app:

```javascript
import { Server } from 'jest-axios';

// database
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
    };
  }
}

// instantiate mock server
server = App('todo-app');

```

And use the following to automatically mock axios requests inside jest (should happen at the top of your test file):

```javascript
// required for mocking axios
jest.mock('axios');
server.init(axios);

// optional - reset server to initial state between tests
beforeEach(() => {
  server.reset();
});

// tests
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

});
```

::: tip
When initializing the server, you **must** call `server.init(axios)` after `jest.mock('axios')`. Otherwise, axios will not be mocked.
:::

When configured, this package will even mock requests nested inside the package you're testing. For example, the following tests will pass (using the `server` object from above):

```javascript
// configure mock
jest.mock('axios');
server.init(axios)

// nest axios requests in other functions
async get(url) {
  return axios.get(url).then(response => response.data);
}

async post(url, data) {
  return axios.post(url, data).then(response => response.data);
}

async put(url, data) {
  return axios.put(url, data).then(response => response.data);
}

async delete(url) {
  return axios.delete(url).then(response => response.data);
}

// run tests
test('api.test', async () => {  

  // get
  assert.equal(await get('/todos'), [
    { id: 1, name: 'foo', done: false },
    { id: 2, name: 'bar', done: true },
  ]);

  // post
  assert.equal(await post('/todos', { name: 'baz': done: true }), {
    id: 3,
    name: 'baz',
    done: true,
  })

  // put
  assert.equal(await put('/todos/1', { name: 'baz' }), {
    id: 1,
    name: 'baz',
    done: false,
  })

  // delete
  await delete('/todos/3');
  try{
    get('/todos/3')
    assert.fail('Request should have failed');
  } catch (err) {
    assert.equal(err.status, 404);
  }
});
```


See the [Guide](/guide/usage/) for more information on how to configure mock axios servers with this library.
