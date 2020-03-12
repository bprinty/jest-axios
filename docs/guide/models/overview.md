# Overview

Let's take a top-down approach to understanding how models work with Vuex Reflect. Throughout this section of the documentation, let's focus on building a content management application with two related models: `Posts` and `Authors`. Using tools from this library, we want to define Models to help us traverse our data and reflect a backend API. Additionally, we'll be defining relationships between our Models. First, let's start with `Author`. The API providing `Author` data has the following endpoints:

```
/authors
  GET - Query all or a subset of authors.

/authors/:id
  GET - Get the metadata for a single author.
  PUT - Update data for a single author.

/authors/:id/posts
  GET - Query all or a subset of posts for a single author.
```

> Note that a nested endpoint exists `/authors/:id/posts` for querying all posts for a specific author. This can be represented in our Model definition via `relations()` configuraton.

The `Author` records from this API take the shape:

```javascript
// GET /authors
[
  { id: 1, name: 'Jane Doe', email: 'jane@doe.com' },
  { id: 2, name: 'John Doe', email: 'john@doe.com' },
  ...,
]
```


## Defining Models

Now that we understand the data involved, let's define our `Author` model:

```javascript
import v from 'validator';

class Author extends Model {

  /**
   * API config for fetching and updating data.
   */
  static api() {
    return {
      fetch: '/authors',
      get: '/authors/:id',
      update: '/authors/:id',
    };
  }

  /**
   * Property definitions for the model.
   */
  static props() {
    return {
      /**
      * Author name.
      */
      name: {
        default: null,
        required: true,
        type: String,
      },
      /**
      * Author email.
      */
      email: {
        default: null,
        type: String,
        validation: {
          check: v.isEmail,
          message: '`${value}` is not a valid email.',
        },
      },
    };
  }

  /**
   * Relationships to other objects tracked by the library.
   */
  static relations() {
    return {
      /**
       * All posts for a single author.
       */
      posts: {
        model: Post,
        url: '/authors/:id/posts',
      },
    }
  }
}
```

Let's unpack some parts of the `Author` definition from above:

1. This library provides granularity over what endpoints are used during specific types of API actions. The [API](/guide/models/api.md) subsection has more details on all available actions.
2. Properties can define (in a declarative way) rules for mutating and validating data during updates. The [Properties](/guide/models/properties.md) subsection has more information on these rules.
3. Relationships between models where data can be fetched via API can be defined using the `relations()` static method. The [Relationships](/guide/models/relationships.md) subsection has more information on how to configure these data links.

Now that we've defined our `Author` Model, let's define our `Post` Model. The API providing `Post` data has the following endpoints:

```
/posts
  GET - Query all or a subset of authors.

/posts/:id
  GET - Get the metadata for a single post.
  PUT - Update data for a single post.
  DELETE - Delete a specific post.

/posts/:id/author
  GET - Get metadata for the author of a post.

/posts/:id/archive
  POST - Archive a post.

/posts/:id/history
  GET - Get the change history for a single post.
  POST - Add new item to post change history.
```

> Note that several nested endpoints exist for the `Post` model. These are represented in our Model definition via `relations()`, `actions()`, and `queries()` configuration.

The `Post` records from this API take the shape:

```javascript
// GET /posts
[
  {
      id: 1,
      title: 'Post 1',
      body: 'This is the text for post 1',
      author: {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@doe.com'
      },
  },
  {
      id: 2,
      title: 'Post 2',
      body: 'This is the text for post 2',
      author: {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@doe.com',
      },
  },
  ...,
]
```

Note that `Post` data from the API contains nested information about related `Author` data. This is a commonly used pattern in web development, and this library is built to support that pattern accordingly (by saving nested `Author` objects in the Vuex store automatically).

In the `Post` model definition below, note how the nested `Author` configuration is represented as an entry in the `props()` definition:

```javascript
class Post extends Model {

  /**
   * API config for fetching and updating data.
   */
  static api() {
    return {
      create: '/posts',
      fetch: '/posts',
      update: '/posts/:id',
    };
  }

  /**
   * Property definitions for the model.
   */
  static props() {
    return {
      /**
      * Post title.
      */
      title: {
        default: 'My Post Title',
        required: true,
        type: String,
      },
      /**
      * Post body
      */
      body: {
        type: String,
        mutation: value => `<div>${value}</div>`,
      },
      /**
      * Linked post author. Collapse to `author_id` when making create/update requests.
      */
      author: {
        model: Author,
        collapse: true,
        to: 'author_id',
      },
    };
  }

  static relations() {
    return {
      author: {
        model: Author,
        url: '/posts/:id/author',
      },
    };
  }

  static actions() {
    return {
      archive: '/posts/:id/archive',
      history: '/posts/:id/history',
    },
  }

  static queries() {
    return {
      history: '/posts/:id/history',
    };
  }
};
}
```

> See the [Configuration](/guide/setup/configure.md) section of the documentation for details on how to register these definitions with the `Vuex` store.


## Using Model/Collection Syntax

In the `api()` definitions for a Model, you can also use a Model/Collection style syntax. For example, this Model definition:

```javascript
class Item extends Model {

  static api() {
    return {
      model: '/authors/:id',
      collection: '/authors',
    };
  }

  ...
}
```

Automatically translates to:

```javascript
class Item extends Model {

  static api() {
    return {
      fetch: '/posts',
      create: '/posts',
      get: '/posts/:id',
      update: '/posts/:id',
      delete: '/posts/:id',
    };
  }

  ...
}
```

Using the `model` and `collection` definitions can help developers reduce boilerplate. For clarity on describing internal functionality, the rest of this documentation will not use this shorthand during explanations.


## Using Models in Components

Once these models have been defined and [registered](/guide/setup/configure.md), you can use them throughout your application. As a quick example, let's take a look at a component that interacts with data from the `Post` model. In this component, you'll see that we need to first fetch the data before using it in the component.

```javascript
// JavaScript portion of Post Feed component.
export default {
  name: 'post-feed',
  created() {
    Post.fetch()
  },
  computed() {
    allPosts() {
      return Post.query().all();
    },
    shortPosts() {
      return Post.query().filter(x => x.body.length < 200).all();
    },
  },
}
```

This hints at an important principle you need to understand when using this library: **only data currently from the store can be queried**. It's up to developers to ensure that their store is in-sync with the data they want to have available. Fetching data from the API and into the store is easily done with `Model.fetch()`.

The [Store](/guide/store/overview.md) section provides more detail about how data flow into and out of the store. Technically, you don't even need models to use the API reflection functionality provided by this library. All Models in this module use getters and mutations from the store when accessing data.


## Querying Data

As alluded to above, once data have been fetched and added to the frontend store, you can query and interact with those data:

```javascript
const post = Post.get(1); // get post by id

post.title // get author
post.author.email // get author email
```

And since author data was embedded in the `Post` fetch, you can also access `Author` data from the store without fetching authors:

```javascript
const author = Author.get({email: 'john@doe.com'});

author.name // get author name
const authorPosts = await author.posts.fetch(); // get nested posts for author
```

Creating a new object is as easy as:

```javascript
const obj = new Post({ title: 'my-post', body: 'This is a post.', author: author })
```

Once objects are created, they aren't initially saved to the store or the backend. To issue a `create` action that will `POST` data to the API and update the store, you'll need to use `Model.commit()`:

```javascript
// Create new object
const obj = new Post({ title: 'my-post', body: 'This is a post.', author: author });

// Check out property values
obj.title // 'my-post' -- local version of data has been set
obj.$.title // null -- data hasn't been committed to store

// Commit data to backend and save result in Vuex store.
obj.commit().then((result) => {
  result.title // 'my-post' -- local version of data is set
  result.$.title // 'my-post' -- store version of data is set after request
});
```

If you remember from above, the `author` property was set to be a linked instance of the `Author` model. In the `property` definition for `author` above, we set the `collapse` property to `author_id`. The effect of this is collapsing that linked model into a single property in the `POST` payload:

```javascript
// POST /posts
{
  title: 'my-post',
  body: 'This is a post',
  author_id: 1,
}
```

Without setting the `collapse` property, the full `Author` json is sent in the request:

```javascript
// POST /posts
{
  title: 'my-post',
  body: 'This is a post',
  author: {
    id: 1,
    name: 'Jane Doe',
    email: 'jane@doe.com',
  },
}
```

## Querying Relations

If you've defined `relations()` with your model, you can query them just like other models:

```javascript
const post = Post.query().one();

// fetch author payload
post.author.fetch().then((author) => {
  // do something with author object
});

// update author model
const otherAuthor = Author.get(1);
await post.author.update(otherAuthor);

// fetch posts for related author
const posts = await otherAuthor.posts.fetch();
```

Each of these actions will automatically insert the `id` of the current model into the nested url, so the nested operation is fully contextualized. Inputs to actions (when required) should be other objects, and return values are objects of the Model type referenced in the relation configuration.

See the [Relationships](/guide/models/relationships.md) section for more information on defining nested model relations.


## Nested Actions

When nested `actions()` or `queries()` are defined, you can utilize them directly from model instances with the following syntax:

```javascript
const obj = await Post.get(1);

// archive post
await obj.archive();

// query history
const history = await obj.history.fetch();

// send data to nested history url
await obj.history.update({
  action: 'updating history',
  time: 'now'
});
```

When the same key is used multiple times for a nested action (across actions and queries), the key is automatically set up as an object that can dispatch to the `fetch/get/create/update/delete` interface available throughout the rest of this library. Otherwise, it is configured as a callable that returns a promise containing request data.

See the [Relationships](/guide/models/relationships.md) section for more information on defining nested model actions and queries. The configuration for nested actions can be complex enough to accommodate most needs.


## Clearing Store Data

Single page web applications (SPWA) also need the capacity to clear data from the store when users navigate across views of the application. It might not always be necessary, but here is some code showing how to remove model data from the store once a component is destroyed:

```html
<template></template>
<script>
export default {
  name: 'my-component',
  data() {
    return {
      items: [],
    }
  }
  created() {
    // fetch item data for the view
    Item.fetch().then((items) => {
      this.items = items;
    });
  },
  destroyed() {
    // clear items associated with this view
    this.items.forEach(obj => obj.remove());

    // or, to clear all items from the store
    Item.clear();
  },
}
</script>
```


## Additional Information

This overview covered several of the high-level features provided by this library, and you can find more information about each of the concepts alluded to above in these subsections:

1. [API](/guide/models/api.md) - Information about configuring API endpoints for fetching, updating, and querying data.
2. [Properties](/guide/models/properties.md) - Information about declaring model properties, along with mechanisms for validation and property mutations.
3. [Relationships](/guide/models/relationships.md) - Information about configuring relationships between models, including API endpoints for fetching nested data.
4. [Querying](/guide/models/querying.md) - Information about querying data via model classes.
5. [Customization](/guide/models/customization.md) - Information about customizing models with custom methods.
