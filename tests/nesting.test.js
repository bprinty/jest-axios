/**
 * Testing for package.
 */


// imports
// -------
import axios from 'axios';
import { assert } from 'chai';
import server from './server';


// config
// ------
jest.mock('axios');
server.init(axios);
beforeEach(() => {
  server.reset();
});


// tests
// -----
describe('nesting', () => {
  let res;

  test('nesting.get', async () => {
    // collection
    res = await axios.get('/posts/1/history');
    assert.deepEqual(res.data, [
      { id: 1, delta: 'foo', post_id: 1 },
      { id: 2, delta: 'bar', post_id: 1 },
    ]);

    res = await axios.get('/posts/2/history');
    assert.deepEqual(res.data, []);

    // model
    res = await axios.get('/posts/1/author');
    assert.deepEqual(res.data, {
      id: 1,
      email: 'jane@doe.com',
      name: 'Jane Doe'
    });
  });

  test('nesting.post', async () => {
    // collection
    res = await axios.post('/posts/2/history', { delta: 'baz' });
    assert.equal(res.status, 201);
    assert.deepEqual(res.data, {
        id: 3,
        delta: 'baz',
        post_id: 2,
    });

    // model
    res = await axios.post('/posts/1/author', { email: 'jack@doe.com', name: 'Jack Doe' });
    assert.equal(res.status, 201);
    assert.deepEqual(res.data, {
      id: 3,
      email: 'jack@doe.com',
      name: 'Jack Doe',
    });
    res = await axios.get('/authors/3/posts');
    assert.equal(res.data.length, 1);
    assert.equal(res.data[0].id, 1);

    // action
    res = await axios.post('/posts/1/archive');
    res = await axios.get('/posts/1');
    assert.equal(res.data.archived, true);
  });

  test('nesting.put', async () => {
    // collection
    res = await axios.put('/posts/1/history', [{ id: 1 }]);
    assert.equal(res.status, 200);
    assert.equal(res.data.length, 1);
    assert.deepEqual(res.data[0], {
        id: 1,
        delta: 'foo',
        post_id: 1
    });

    // model
    res = await axios.put('/posts/1/author', { id: 2 });
    assert.equal(res.status, 200);
    assert.deepEqual(res.data, {
      id: 2,
      email: 'john@doe.com',
      name: 'John Doe'
    });
    res = await axios.get('/posts/1/author');
    assert.equal(res.data.id, 2);
  });

  test('nesting.delete', async () => {
    // model
    res = await axios.delete('/posts/1/author');
    assert.equal(res.status, 204);
    res = await axios.get('/posts/1');
    assert.equal(res.data.author, null);
    try {
      res = await axios.get('/posts/1/author');
      assert.fail('Request for nested resource should have failed.');
    } catch(err) {
      assert.equal(err.status, 404);
    }
  });

});
