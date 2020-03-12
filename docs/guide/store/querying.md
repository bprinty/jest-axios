# Querying

Once data are fetched by this library, they are automatically reflected onto the frontend store and available to access throughout the application.

The [Querying](/guide/models/querying.md) section of the documentation outlined several ways to query store data using class-based model definitions. If developers choose to not use class-based model definitions, they can still query data, but must define their own mechanisms for filtering the data.

::: tip

If you plan on doing a lot of complex querying throughout your application, it is recommended you use the class-based syntax for defining models, because it will produce a more readable and maintainable code base.

:::

The examples below mirror some of the examples in the querying guide, but highlight how to query store data directly:

```javascript
// filter
state.todos.filter(obj => obj.done)
state.todos.filter(obj => /contains text/.test(obj.text))

// has
state.todos.filter(obj => 'text' in obj)[0]

// all
state.todos

// first
state.todos[0]
state.todos.slice(0, 5)

// last
state.todos[state.todos.length - 1]
state.todos.slice(state.todos.length - 5, state.todos.length)

// random
_.sample(_.values(state.todos), 1)

// sample
_.sampleSize(_.values(state.todos), 20)

// count
state.todos.filter(obj => obj.done).length

// sum/min/max
_.sum(state.todos.filter(obj => obj.done).map(obj => obj.priority))
_.min(state.todos.filter(obj => obj.done).map(obj => obj.priority))
_.max(state.todos.filter(obj => obj.done).map(obj => obj.priority))

// limit/offset
state.todos.slice(50, 100)

// order
_.values(state.todos).sort((a, b) => b.id - a.id)[state.todos.length - 1]

// shuffle
_.sampleSize(_.values(state.todos), state.todos.length)
```
