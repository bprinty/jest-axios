# Querying

Once data are fetched by this library, they are automatically reflected onto the frontend store and available to query throughout the application. This section will detail patterns for how to query the data via the fluid query API provided by this library.

Before diving deeper, let's clarify two terms used throughout this section:

1. **Fetch** - Describes retrieving data from an external API. Data fetched from external APIs are saved to the store.
2. **Query** - Describes querying data directly from the Vuex store. Data available from the store must *first* be fetched from the API.

It's very important to note that when starting a query via `Model.query()`, only data currently in the Vuex store will be searched for relevant query criteria.

To start a query, use the `query()` method on Model objects:

```javascript
Todo.query()
```

This will return a query closure used to fluidly access the data via query operators:

```javascript
Todo.query().operator1().operator2()...
```

This pattern allows developers to fluidly construct mechanisms for accessing data in complex ways. For example:

```javascript
Todo.query().filter({ done: true }).has('text').offset(50).limit(3).count()
```

See the next section for a list of available query operators and examples of how to use them.


## Query Operators

The list of available query operators is as follows:

| Method     | Description                                                            |
|:-----------|:-----------------------------------------------------------------------|
|**filter**  | Filter query data by specific parameters or callable                   |
|**has**     | Filter query data to include only models with non-null parameter       |
|**all**     | Return all results of query                                            |
|**first**   | Return first result of query                                           |
|**last**    | Return last result of query                                            |
|**random**  | Return random result of query                                          |
|**sample**  | Sample `n` records from the query                                      |
|**count**   | Collapse query into count of records                                   |
|**sum**     | Collapse query into sum of values of specified property across records |
|**min**     | Collapse query into minimum value of specified property across records |
|**max**     | Collapse query into maximum value of specified property across records |
|**offset**  | Remove the first `n` records from the query                            |
|**limit**   | Limit query to the first `n` records                                   |
|**order**   | Order query results by a Model property                                |
|**shuffle** | Shuffle and return all records from the query.                         |


Here are some code examples detailing how each of these methods can be used:

```javascript
// filter
Todo.query().filter({ done: true }).all()
Todo.query().filter({ text: /contains text/ }).all()
Todo.query().filter(record => record.done).all()

// has
Todo.query().has('text').first()

// all
Todo.query().all()

// first
Todo.query().first()
Todo.query().first(5)

// last
Todo.query().last()
Todo.query().last(5)

// random
Todo.query().random()

// sample
Todo.query().sample(20)

// count
Todo.query().filter({ done: true }).count()

// sum/min/max
Todo.query().filter({ done: true }).sum('priority')
Todo.query().filter({ done: true }).min('priority')
Todo.query().filter({ done: true }).max('priority')

// limit/offset
Todo.query().offset(50).limit(100).all()

// order
Todo.query().order('text').last()
Todo.query().order((a, b) => a.id > b.id).last()

// shuffle
Todo.query().shuffle().all()
```

## Filtering

As alluded to above, the `filter` operator can take any number of arguments. The first is a simple object detailing a value to subset property data by:

```javascript
const doneTodos = Todo.query().filter({ done: true }).all()
```

Additionally, regular expressions are supported for filtering property values (if the property value is a string):

```javascript
const todosWithText = Todo.query().filter({ text: /contains text at end$/ }).all()
```

To be clear, the query above will return all models where the `text` parameter matches the provided regular expression. You can also use multiple filters with the `filter` operator:

```javascript
const doneTodosWithText = Todo.query().filter({ done: true, text: /contains text/ }).all()
```

Finally, the `filter` operator can also take a callable that receives a query record as input and returns a boolean describing if the record should propagate down the query chain:

```javascript
const todosWithId = Todo.query().filter(record => [1, 2].includes(record.id)).all();
```

## Sorting

Similarly to filtering, the `order` operator can either take a parameter to sort by:

```javascript
const orderedTodos = Todo.query().sort('text');
```

Or, it can contain a comparator callable that will receive two records as inputs:

```javascript
const lengthSortedTodos = Todo.query().sort((a, b) => {
  return b.text.length - a.text.length;
});
```
