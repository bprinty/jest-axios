# Usage

This section details how to use the module, including all of the ways you can extend the [`Server`](/api/#server) class provided by this package to mock both simple and complex REST APIs for testing.

The following concepts will be used to incrementally expose readers to the functionality provided by this package. The sections below start off simple and progressively become more and more complex to expose functionality:

* [Mocking Endpoints](#mocking-endpoints) - How to mock simple request methods for specific endpoints.
* [Mocking Data Models](#mocking-data-models) - How to build data models and mock requests for CRUD operations.
* [Mocking Endpoint Actions](#mocking-endpoint-actions) - How to mock nested actions for data models.
* [Mocking Model Relations](#mocking-model-relations) - How to incorporate relations between data models.
* [Mocking Nested Resources](#mocking-nested-resources) - How to nest related resource payloads in requests.

For additional context on how to use this module during testing, see the [Quickstart](/#quickstart) section of the documentation.


## Mocking Endpoints

The main feature provided by this package is the *ability to mock REST endpoints*. For that goal, we can easily define functions to mock specific rest endpoints by extending the `Server` class provided with this package. To set up an API mock that will automatically return fake data during `axios` requests made by your project, first extend the `Server` class and define functions for the various request types:

::: warning Note

The example immediately below is meant to be illustrative, not suggestive. See the sections after this one for a better example of how to use this package.

:::

```javascript
// contents of tests/server.js
import { Server } from 'jest-axios';

class App extends Server {
  api() {
    return {
      '/posts': {
        get: () => [
          { id: 1, title: 'Foo', body: 'foo bar' },
          { id: 2, title: 'Bar', body: 'bar baz' },
        ],
        post: (data) => { id: 3, ...data },
      },
      '/posts/1': {
        get: () => { id: 1, title: 'Foo', body: 'foo bar' },
        put: (data) => data,
        delete: () => {},
      },
      '/posts/2': {
        get: () => { id: 2, title: 'Bar', body: 'bar baz' },
      },
    };
  }
}

export default App('posts-app');
```

Once these endpoints are defined, any axios call issuing `GET` requests for those endpoints will return the data specified in the code above:

```javascript
await axios.get('/posts');
/*
[
  { id: 1, title: 'Foo', body: 'foo bar' },
  { id: 2, title: 'Bar', body: 'bar baz' },
]
*/

// get new post
await axios.get('/posts/1');
/*
{ id: 1, title: 'Foo', body: 'foo bar' }
*/
```

For example, here is a full `jest` test file that uses the `posts-app` mock above during testing:

```javascript
import axios from 'axios';
import server from './server';

jest.mock('axios');
server.init();

test('posts test', async () => {

  // issue request
  const response = await axios.get('/posts');

  // check status code
  assert.equal(response.status, 200);

  // check payload
  assert.equal(response.data, [
    { id: 1, title: 'Foo', body: 'foo bar' },
    { id: 2, title: 'Bar', body: 'bar baz' },
  ]);

});
```

If you make a bad request (for an endpoint that isn't mocked by this library), you'll receive an appropriate response code:

```javascript
axios.get('/missing-endpoint').catch(err => {
  // err will have `status` and `message` data.
});
```

That covers the basics of the core functionality provided by this module, but defining singular endpoints like this can become messy if you're trying to mock many data models with many model instances. To simplify the process of mocking these requests with data, we can define `data()` configuration that will allow us to access a database of stored data when resolving requests.

## Mocking Data Models

When testing applications, we often need to pull data for specific data models and collections of those models from an API. To showcase a mock server that fakes this type of data, let's configure a simple mock server that hosts a simple collection called `posts`:

```javascript
import { Server } from 'jest-axios';

class App extends Server {

  data() {
    return {
      posts: [
        { title: 'Foo', body: 'foo bar' },
        { title: 'Bar', body: 'bar baz' },
      ],
    };
  }

  api() {
    return {
      '/posts': this.collection('posts'),
      '/posts/:id': this.model('posts')
    };
  }
}
```

::: tip

Whenever an `:id` parameter is embedded within a URL, an the url will automatically be parsed for the `id` parameter and the `id` parameter will become the first argument to the endpoint callable.

:::

With this simple configuration, axios will behave accordingly as the following requests are made:

```javascript
// get collection of posts
await axios.get('/posts');
/*
[
  { id: 1, title: 'Foo', body: 'foo bar' },
  { id: 2, title: 'Bar', body: 'bar baz' },
]
*/

// create new post
await axios.post('/posts', { title: 'Baz', body: 'baz' });
/*
{ id: 3, title: 'Baz', body: 'baz' }
*/

// get new post
await axios.get('/posts/3');
/*
{ id: 3, title: 'Baz', body: 'baz' }
*/

// update new post
await axios.put('/posts/3', { title: 'BazBaz' });
/*
{ id: 3, title: 'BazBaz', body: 'baz' }
*/

// delete new post and check if it exists
await axios.delete('/posts/3');
try {
  await axios.get('/posts/3');
} catch (err) {
  console.log(err);
}
/*
{
  status: 402,
  message: 'Could not find resource `3`'
}
*/
```

## Mocking Endpoint Actions

Now that we've highlighted basic model CRUD functionality, let's add some custom endpoints for performing actions on data. In this example, we want to include a nested `/posts/:id/archive` endpoint for setting an `archive` flag on `post` objects. To do so, we can update our `api()` definition like so:

```javascript
api() {
  return {
    '/posts': this.collection('posts'),
    '/posts/:id': this.model('posts'),
    '/posts/:id/archive': {
      post: (id) => {
        this.db.posts[id].archive = true;
        return { status: 'ok' };
      },
    }
  };
}
```

With this defined, any `/posts/:id/archive` call will automatically be mocked:

```javascript
// archive post
await axios.post('/posts/1/archive');
/*
{ status: 'ok' }
*/

// get data to show new flag
await axios.get('/posts/1');
/*
{ id: 1, title: 'Foo', body: 'foo bar', archived: true }
*/
```

## Mocking Model Relations

You can similarly use this pattern to automatically mock fetching nested resources. Let's say we want to track `authors` and `comments` related to a specific post. In this scenario, `posts` have a single author and multiple `comments`. To represent those relationships when defining data, you can use the following definitions:

```javascript
import { Server } from 'jest-axios';


class App extends Server {

  data() {
    return {
      posts: [
        { title: 'Foo', body: 'foo bar', author_id: 1 },
        { title: 'Bar', body: 'bar baz', author_id: 1 },
      ],
      authors: [
        { name: 'Jane Doe', email: 'jane@doe.com' },
        { name: 'John Doe', email: 'john@doe.com' },
      ],
      comments: [
        { user: 'jack', body: 'foo comment', post_id: 1 },
        { user: 'jill', body: 'bar comment', post_id: 1 },
      ]
    };
  }

  api() {
    return {
      '/posts': this.collection('posts'),
      '/posts/:id': this.model('posts'),
      '/posts/:id/authors': this.model('authors', { key: 'author_id' }),
      '/posts/:id/comments': this.collection('comments', { key: 'post_id' }),
    };
  }
}
```

In the example above, the `collection` and `model` factory methods take an option object. For the `model` factory method, the `key` option represents a foreign key **on the requested resource** to the specified model. For the `collection` factory method, the `key` option represents a foreign key **on the related collection** that is linked to the requested resource's `id`.

If the syntax above for configuring nested resource fetching is confusing, you can configure the relations manually (above is shorthand for configuring a common pattern). For clarity, here is how you could configure the relations manually:

```javascript
api() {
  return {
    '/posts': this.collection('posts'),
    '/posts/:id': this.model('posts'),
    '/posts/:id/authors': {
      get: (id) => {
        const authorId = this.db.posts[id].author_id;
        return this.db.authors[authorId];
      },
      post: (id, data) => {
        this.db.posts[id].author_id = data.id;
        return this.db.authors[data.id];
      }
    },
    '/posts/:id/comments': {
      get: (id) => {
        return this.db.comments.filter(x => x.post_id === id);
      },
      post: (id, data) => {
        data.post_id = id;
        const result = this.db.comments.add(data);
        return result;
      },
    },
    '/posts/:id/comments/:comment_id': {
      delete: (id, comment_id) => {
        delete this.db.comments[comment_id];
      }
    },
  };
}
```

## Mocking Nested Resources

Nesting resources inside payloads for a single model instance is common practice for reducing the number of requests that need to be made for pulling data associated with a view. With this library, you can mock nesting for related models by setting data properties equal to callable objects. In this example, let's say we want our `/posts/:id` endpoint to return nested data for `authors` and `comments` relations, but we don't want to bog down the `/posts` endpoint with those relations. First, we can augment the `posts` model with callable objects that return the data we need:

```javascript
// showing data block only
data() {
  const getAuthor = post => this.db.authors.get(post.author_id);
  const getComments = post => this.db.comments.filter(x => x.post_id === post.id);
  return {
    posts: [
      {
        title: 'Foo',
        body: 'foo bar',
        author_id: 1,
        author: getAuthor,
        comments: getComments,
      },
      {
        title: 'Bar',
        body: 'bar baz',
        author_id: 1,
        author: getAuthor,
        comments: getComments,
      },
    ],
    authors: [
      { name: 'Jane Doe', email: 'jane@doe.com' },
      { name: 'John Doe', email: 'john@doe.com' },
    ],
    comments: [
      { user: 'jack', body: 'foo comment', post_id: 1 },
      { user: 'jill', body: 'bar comment', post_id: 1 },
    ]
  };
}
```

And in the `api()` configuration block, we can subset the responses by specific keys:

```javascript
api() {
  return {
    '/posts': this.collection('posts', { exclude: ['author', 'comments'] }),
    '/posts/:id': this.model('posts', { exclude: ['author_id'] }),
  };
}
```

This type of configuration will result in the following axios mocks:

```javascript
await axios.get('/posts');
/*
[
  { id: 1, title: 'Foo', body: 'foo bar', author_id: 1 },
  { id: 2, title: 'Bar', body: 'bar baz', author_id: 1 },
]
*/

await axios.get('/posts/1');
/*
{
  id: 1,
  title: 'Foo',
  body: 'foo bar',
  author: {
    id: 1,
    name: 'Jane Doe',
    email: 'jane@doe.com',
  }
  comments: [
    { user: 'jack', body: 'foo comment', post_id: 1 },
    { user: 'jill', body: 'bar comment', post_id: 1 },
  ]
}
*/
```


## Singleton Models

Alongside Models and Collections, it's often useful to have a data model that represents singleton data instead of collection data. A common example of this is providing profile data to the currently logged-in user via a `/profile` endpoint contextualized to return information for the current user.

Since we don't need to define a relational schema to represent users in our database (we're just concerned with actions of a single user), we can represent the profile data as a `singleton` model. Here is an example config with data and endpoint actions for a `/profile` singleton model:

```javascript
import { Server } from 'jest-axios';

class App extends Server {

  data() {
    return {
      profile: {
        username: 'admin',
        last_seen: () => new Date();
      }
    };
  }

  api() {
    return {
      '/profile': self.singleton('profile'),
    };
  }
}

export default App('profile');
```

For clarity, here is equivalent configuration for the `api()` block above:

```javascript
api() {
  return {
    '/profile': {
      get: () => this.db.profile,
      put: (data) => {
        this.db.profile = Object.assign(this.db.profile, data);
        return this.db.profile;
      },
      delete: () => {
        this.reset('profile')
      },
    },
  };
}
```

With the endpoint configuration above, axios requests will return an object for the endpoint instead of a collection:

```javascript
// get profile
await axios.get('/profile');
/*
{
  username: 'admin',
  last_seen: '2020-03-16T4:24:38.680Z',
}
*/

// update profile
await axios.put('/profile', { username: 'foo'});
/*
{
  username: 'foo',
  last_seen: '2020-03-16T4:24:38.680Z',
}
*/

// send delete request and check value
await axios.delete('/profile');
await axios.get('/profile');
/*
{
  username: 'admin',
  last_seen: '2020-03-16T4:24:39.680Z',
}
*/
```

Additionally, you can see that mocking functions are always re-evaluated when new `GET` requests are made.


## Server Utilities

There are several utilities that can be used during testing. First, to reset a database between sessions, you can use the `server.reset()` function:

```javascript
jest.mock('axios');
server.init();
beforeEach(() => {
  server.reset();
});
```

This will reset the database down to it's initial state (with data configured in the `data()` block). To clear the database completely during testing, use the `server.clear()` function:

```javascript
jest.mock('axios');
server.init();
beforeAll(() => {
  server.clear();
});
```

Finally, to access the state of a database during or after testing, use the `server.db` property:

```javascript
jest.mock('axios');
server.init();
afterAll(() => {
  console.log('Printing Database!');
  console.log(server.db);
});
```

If you have any questions that aren't answered by this documentation, feel free to file a `documentation` issue in the [GitHub Issue Tracker](https://github.com/bprinty/jest-axios) for this project.
