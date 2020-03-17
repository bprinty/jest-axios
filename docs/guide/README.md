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

The core feature of this package is the ability to mock endpoint requests for testing.

::: warning Note

The example immediately below is meant to be illustrative, not suggestive. See the sections after this one for a better example of how to use this package.

:::

```javascript
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
```

And once these endpoints are defined, any axios call issuing `GET` requests for those endpoints will return the data specified in the code above:

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

However, this can become messy if you're trying to mock many data models with many model instances. To simplify the process of mocking these requests with data, we can define `data()` configuration that will set up a database that can be referenced in request methods.

## Mocking Data Models

This section will cover high-level ideas around how data models are defined in this library, and common tools/patterns you can use to mock certain functionality during testing. As a start, let's show a definition for a simple mock server that hosts a simple collection called `posts`:

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

With this simple configuration, axios will behave accordingly as the following requests are made:

```javascript
jest.mock('axios');
server.init()

async get(url) {
  return axios.get(url);
}

async post(url, data) {
  return axios.post(url, data);
}

async put(url, data) {
  return axios.put(url, data);
}

async delete(url) {
  return axios.delete(url);
}


test('example', async () => {  
  let response;

  // get collection of posts
  // response = await axios.get('/posts');
  assert.equal(
    get('/posts'),
    [
      { id: 1, title: 'Foo', body: 'foo bar' },
      { id: 2, title: 'Bar', body: 'bar baz' },
    ]
  );

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
})
```

## Mocking Endpoint Actions

Now that we've highlighted the basic functionality, let's add some custom endpoints for performing actions on data. In this example, we want to include a nested `/posts/:id/archive` endpoint for setting an `archive` flag on `post` objects. To do so, we can update our `api()` definition like so:

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

::: tip

Whenever an `:id` parameter is embedded within a URL, an the url will automatically be parsed for the `id` parameter and the `id` parameter will become the first argument to the endpoint callable.

:::

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

You can similarly use this pattern to automatically mock nested relation fetching. Let's say we want to track `authors` and `comments` related to a specific post. In this scenario, `posts` have a single author and multiple `comments`. To represent those relationships when defining data, you can use the following definitions:

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
      // TODO: WORK THROUGH THIS API
      '/posts/:id/authors': this.model('authors').from('author_id'),
      '/posts/:id/comments': this.collection('comments').from('post_id'),
    };
  }
}
```

Or, for clarity, here is how you could configure the relations manually:

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

It's often useful to have a data model that represents singleton data instead of collection data. A common example of this is providing profile data to the currently logged-in user via a `/profile` endpoint contextualized to return information for the current user.

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
}

export default App('profile');
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

This section covers various utilities available for `Server` objects instantiated during testing.

### Init

Before


### Reset

You can also reset data to the initial

### Dump

To dump a testing database (i.e. get an object with all of the data), you can use:

```javascript
server.json()
```

This will output data in the format:

```json

```
