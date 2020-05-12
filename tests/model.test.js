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
describe('model', () => {
  let res;

  test('model.get', async () => {
    const author = await axios.get('/authors/1');
    assert.deepEqual(author.data, {
      id: 1,
      name: 'Jane Doe',
      email: 'jane@doe.com',
    });


    res = await axios.get('/posts/1');
    assert.equal(res.status, 200);
    assert.deepEqual(res.data, {
      id: 1,
      title: 'Foo',
      body: 'foo bar',
      author: author.data,
    });

    res = await axios.get('/posts/2');
    assert.equal(res.status, 200);
    assert.deepEqual(res.data, {
      id: 2,
      title: 'Bar',
      body: 'bar baz',
      author: author.data,
    });
  });

  test('model.put', async () => {
    res = await axios.put('/posts/1', { title: 'Foobar' });
    assert.equal(res.status, 200);
    res.data.author = res.data.author.id;
    assert.deepEqual(res.data, {
      id: 1,
      title: 'Foobar',
      body: 'foo bar',
      author: 1,
    });
  });

  test('model.delete', async () => {
    res = await axios.get('/posts/2');
    assert.equal(res.status, 200);
    res = await axios.delete('/posts/2');
    assert.equal(res.status, 204);
    try {
      await axios.get('/posts/2');
      assert.fail('Resource should be missing');
    } catch(err) {
      assert.equal(err.status, 404);
    }
  });

});
