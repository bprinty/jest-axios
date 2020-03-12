# Configure


## Registering Models

There are two ways to register this library with the `Vuex` store in your application. The first is to register all `Model` classes:

```javascript
import Vue from 'vue';
import Vuex from 'vuex';
import Reflect from 'vuex-reflect';

// creating models
class Post extends Model { ... }
class Author extends Model { ... }

// registering models
const db = Reflect({ Post, Author });

// creating the store
Vue.use(Vuex);
const store = new Vuex.Store({
  state: { ... },
  getters: { ... },
  mutations: { ... },
  actions: { ... },
  plugins: [db],
})
```

If you want to change the property name used for managing model state in Vuex, you can use specific key names when passing inputs to `Reflect`. For example:

```javascript
// registering models
const db = Reflect({
  posts: Post,
  authors: Author
});
```

Creating Models to register via this library is detailed in the [Models](/guide/models/overview.md) section of the documentation.

## Registering Store Configuration

The second is for developers who don't want to extend ES6 classes when defining models for their application (they wish to use the store directly). To register Vuex Reflect configuration directly with the Store, use:

```javascript
import Vue from 'vue';
import Vuex from 'vuex';
import Reflect from 'vuex-reflect';

// declaring configuration
const posts = { ... };
const authors = { ... };

// registering configuration
const db = Reflect({ posts, authors });

// creating the store
Vue.use(Vuex);
const store = new Vuex.Store({
  state: { ... },
  getters: { ... },
  mutations: { ... },
  actions: { ... },
  plugins: [db],
})
```

Creating non-model configuration to register via this library is detailed in the [Store](/guide/models/overview.md) section of the documentation.

## Configuration with Vuex Modules

Separating parts of the store into modules that encapsulate logical blocks of your application is a common practice when using Vuex. With this library, you can similary use modules to segment large code-bases to make them more manageable. Here is an example of declaring Models to use within the context of a vuex module:

```javascript
// contents of ./modules/moduleA/models.js

import { Model } from 'vuex-reflect';

class ModelAA extends Model {
  ...
}

class ModelAB extends Model {
  ...
}

export default {
  ModelAA,
  ModelAB,
};
```

```javascript
// contents of ./store.js

import Vue from 'vue';
import Vuex from 'vuex';
import Reflect from 'vuex-reflect';
import a from './modules/moduleA/models';
import b from './modules/moduleB/models';

// registering configuration
const db = Reflect({
  modules: { a, b },
});

// creating the store
Vue.use(Vuex);
const store = new Vuex.Store({
  plugins: [db],
})
```

If you need to define additional store constructs (`state`, `mutations`, etc ...) for modules, you can do so as you normally would with `Vuex` modules:

```javascript
// contents of ./modules/moduleA/store.js

const state = {
  // other state parameters
};

const mutations = { ... };

const getters = { ... };

const actions = { ... };

export default {
  state,
  mutations,
  getters,
  actions,
};
```

And register them in your application like so:

```javascript
// contents of ./store.js

import Vue from 'vue';
import Vuex from 'vuex';
import Reflect from 'vuex-reflect';
import moduleA from './modules/moduleA/store';
import moduleB from './modules/moduleA/store';
import modelsA from './modules/moduleA/models';
import modelsB from './modules/moduleB/models';

// registering configuration
const db = Reflect({
  modules: {
    a: modelsA,
    b: modelsB,
  },
});

// creating the store
Vue.use(Vuex);
const store = new Vuex.Store({
  modules: {
    a: moduleA,
    b: moduleB,
  }
  plugins: [db],
})
```

## Axios Configuration

This library uses [axios](https://github.com/axios/axios) for making requests. To set up the plugin with an axios instance having a pre-defined configuration, you can set the `axios` configuration option when instantiating the plugin:

```javascript
const http = new axios.create({
  baseURL: process.env.VUE_APP_API,
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
});

// passing in http object
var reflect = Reflect({
  axios: http,
});
```

If the result of `axios` is an object, this library will automatically wrap that object in an `axios({})` call. For example, this also works:

```javascript
var reflect = Reflect({
  axios: {
    baseURL: process.env.VUE_APP_API,
  },
});
```

Finally, you can additionally configure the `axios` option as a callable (useful if you dynamically need to set authentication for requests):

```javascript
var reflect = Reflect({
  axios: () => {
    baseURL: process.env.VUE_APP_API,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
});
```

You can also configure models individually with axios configuration. For more examples, see the [API](/guide/models/api.md) section of the documentation.


## Other Options

Other options available when setting up this library are as follows:

| Option                  | Type       | Default           | Description                                                                                                |
|:------------------------|:-----------|:------------------|:-----------------------------------------------------------------------------------------------------------|
| `axios`                 | `Function` | `axios`           | Function returning axios instance or axios configuration to use.                                           |

<!--

| `methods`               | `Object`   | *See below*       | HTTP request methods.                                                                                      |
| `primary`               | `String`   | `"id"`            | The property that should be used as the primary key to the model, usually something like `"id"`.           |


### Default Request Methods

To change the default request methods used for various operations, use the `methods` keyword when defining Vuex-Reflect options.

```javascript
var reflect = Reflect({
  methods: {
    'fetch': 'get',
    'create': 'post',
    'get': 'get',
    'update': 'put',
    'delete': 'delete',
  },
});
```

-->
