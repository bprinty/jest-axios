# Relationships

Nested resource API designs are a commonly used pattern for providing contextualized data in a very readable way. Below are examples where a nested resource design can be used within an application:

```
/posts/:id/author   // author of post
/posts/:id/comments // all comments for single post
/posts/:id/archive  // send POST request to archive post
/posts/:id/history  // send GET request to retrieve post
```

This library supports declaring those types of relations in models via the `relations` configuration in Model definitions, allowing developers to access any number of nested Models from a model instance directly. The following code shows the data structure for declaring Model relations:

```javascript
const relatedModel = { ... };

const myModel = {
  api: { ... },
  relations: {    
    /**
    * Nested model.
    */
    relatedModel: {
      model: RelatedModel,
      url: '/mymodel/:id/relatedmodel',
    },
    /**
    * Nested collection of models.
    */
    relatedCollection: {
      model: RelatedModel,
      url: '/mymodel/:id/relatedcollection',
    },
  },
  actions: {
    /**
    * Nested action for model.
    */
    relatedAction: {
      /**
       * Request method to use for GET-ing action data.
       */
      fetch: '/mymodel/:id/action',
      /**
       * Request method to use for POST-ing action data.
       */
      create: '/mymodel/:id/action',
      /**
       * Request method to use for PUT-ing action data.
       */
      update: '/mymodel/:id/action',
      /**
       * Request method to use for DELETE-ing action data.
       */
      delete: '/mymodel/:id/action',
      /**
       * Whether or not to refresh the current model after
       * create/update/delete actions resolve.
       */
      refresh: true,
    },
  },
  queries: {
    /**
    * Nested query for model.
    */
    relatedQuery: '/mymodel/:id/query',
  }
}
```

## Fetching Nested Resources

After declaring relations, you can fetch the nested data using the `fetch()` method:

```javascript
const obj = MyModel.get(1) // get MyModel with id `1` from the store
obj.relatedCollection.fetch().then((results) => {
  // use RelatedModel objects
});
```

This is particularly useful if you're working on a component specific to a single model, and you haven't fully fetched the data you need from other parts of the application. In this case, if we had a `posts` model that declared `comments` as a relationship through a nested url like so:

```javascript
const comment = { ... };

const post = {
  props: {
    title: '',
    body: '',
    author: {
      type: 'authors',
      collapse: 'author_id'
    }
  },
  relations: {
    comments: {
      model: Comment,
      fetch: '/posts/:id/comments',
    }
  },
  actions: {
    archive: '/posts/:id/archive',
    history: '/posts/:id/history',
  },
  queries: {
    history: '/posts/:id/history',    
  },
}
```

We could utilize that relationship in a component that takes a `posts` model as a property and displays both `posts` and related `comments` data:

```html
<template>
  <h1>{{ post.$.name }}</h1>
  <button @click="archive">Archive Post</button>
  <small v-for="comment in comments" v-key="comment.id">{{ comment.$.text }}</small>
</template>
<script>
export default {
  name: 'my-component',
  props: {
    post: null,
  },
  data() {
    return {
      comments: [],
    }
  },
  created() {
    this.$store.dispatch(
      "posts.comments.fetch",
      this.post.id
    ).then((result) => {
      this.comments = result;
    });
  },
  methods() {
    archive() {
      this.$store.dispatch("posts.archive", this.post.id);
    },
  },
}
</script>
```

## Accessing Data

You can also define different types of nesting when declaring `relations`. For example, if one of your nested urls returns a single model (`authors`) and one returns a collection of models (`comments`), you can represent that declaratively via:

```javascript
const authors = { ... };
const comments = { ... };

const posts = {
  props: {
    title: '',
    body: '',
  },
  relations: {
    author: {
      model: 'authors',
      url: '/posts/:id/author',
    },
    comments: {
      model: 'comments',
      url: '/posts/:id/comments',
    },
  },
};
```

Using the definitions above, we can use the code below to query our nested models:

```javascript
Promise.all([
  store.dispatch('comments.fetch'),
  store.dispatch('authors.fetch'),
  store.dispatch('posts.fetch'),
]).then(() => {

  // get post with id `1`
  const post = store.getters['posts'](1);

  // get nested post author
  store.dispatch('posts.authors.fetch', post.id).then((result) => {
    const postAuthor = result;
  });

  // get all nested comments
  store.dispatch('posts.comments.fetch', post.id).then((results) => {
    const postComments = results;
  });
});
```

If you need to issue other types of requests for nested relations, you can do so with the same syntax you used for models:

```javascript
const post = store.getters['posts'](1);

// delete comments (sends DELETE request)
await store.dispatch('posts.comments.delete', post.id);

// delete comments (sends GET request)
const otherAuthor = store.getters['authors'](1);
await store.dispatch('posts.author.update', otherAuthor);

// create new post comment (issue POST request with nested data)
const comment = { text: 'this is a comment' };
await store.dispatch('posts.comment.create', comment);
```

## Nested Actions

You can also define nested actions and queries that work within the context of your model. Let's add onto our example from above to include a nested action for `archive` (archiving a single post) and `history` (fetching historical data about a post):

```javascript
const posts = {
  ...
  actions: {
    archive: '/posts/:id/archive',
    history: '/posts/:id/history',
  },
  queries: {
    history: '/posts/:id/history',
  },
};
```

You can use these actions on the `posts` model directly, and each will return a promise that resolves with the request data:

```javascript
const post = store.getters['posts'](1);

// archive post (will issue Post.get(id) to refresh post after result)
await store.dispatch('posts.archive');

// get history data
const history = await store.dispatch('posts.history');
```

Under-the-hood, the `queries` syntax above is syntactic sugar for adding `fetch/get` configuration in the `actions` block. When store actions are configured, each element in `queries` configuration is added to the `actions` configuration with `fetch` and `get` nested actions pre-defined. For example, the above definition is equivalent to:

```javascript
const posts = {
  ...
  actions: {
    archive: '/posts/:id/archive',
    history: {
      fetch: '/posts/:id/history',
      get: '/posts/:id/history',
      create: '/posts/:id/history',
      update: '/posts/:id/history',
      delete: '/posts/:id/history',
    },
  },
};
```

When the store is set up and configuration is resolved for the `action()` block, items without nested configuration are configured as callables that return a promise with request data. If nested configuration is defined for actions, the nested property allows developers to dispatch those specific actions. You can see this in the examples above.


## Complex Action Configuration

As referenced above, action configuration can be defined abstractly or in a granular way. When defining an action that only has one type of purpose, you just need to specify a url:

```javascript
const posts = {
  ...,
  actions: {
    archive: '/posts/:id/archive',
  },
  queries: {
    history: '/posts/:id/history',
  },
};
```

And you can dispatch the action directly:

```javascript
const post = store.getters['posts'](1);
await store.dispatch('posts.archive', post.id);
const history = await store.dispatch('posts.history', post.id);
```

But, sometimes it's useful to have a nested url that can receive multiple request types. For this type of configuration, you can more specifically define urls for different request actions:

```javascript
const posts = {
  ...,
  actions:{    
    history: {
      fetch: '/posts/:id/history',
      get: '/posts/:id/history/summary',
      create: '/posts/:id/history/add',
      delete: '/posts/:id/history',
    },
  }  
};
```

Which can then be used with the following syntax:

```javascript
const post = store.getters['posts'](1);
const history = await store.dispatch('posts.history.fetch', post.id);
await store.dispatch('posts.history.create', post.id, { action: 'test', time: 'now' });
await store.dispatch('posts.history.delete', post.id);
```


## Custom Actions

Along with specifying nested urls to dispatch to in `actions` configuration, you can customize the methods available on each action by setting configuration keys equal to callables:

```javascript
const posts = {
  ...,
  actions: {    
    archive: {
      post: '/posts/:id/archive',
      notify: () => {
        return new Promise((resolve, reject) => {
          // code to notify external service
        });
      },  
    },
  },
};
```

These are available from model instances with a similar API:

```javascript
const post = store.getters['posts'](1);
await store.dispatch('posts.archive.post', post.id).then(() => {
  store.dispatch('posts.archive.notify', post.id);
});
```

This allows developers to accommodate most complex REST patterns for nested configuration.
