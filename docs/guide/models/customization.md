# Customization

Since developers declare frontend models as classes, it's easy to add methods to those classes for performing common model operations.

To illustrate this functionality, let's use two examples within the context of a todo list application:

1. In our application, we need the ability to complete todo items via `POST` http call.
2. We also need an action available on Todo instances that will automatically export the Todo and download the data when a user clicks a button.

Here is how the `Todo` model might be customized to accommodate these two tasks:

```javascript
class Todo extends Model {

  ...

  /**
   * Send POST request for closing todo items. After the request
   * is issued, the model instance and store are both updated. The
   * method when called will return a Promise for waiting on the
   * response.
   */
  closeTodo() {
    return this.axios.post(`/todos/${this.id}/done`).then(() => {
      this.done = true;
      this.commit();
    });
  }

  /**
   * Export todo item and download JSON file with todo data in browser.
   */
  exportTodo() {
    const data = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.json()));
    const a = document.createElement('a');
    a.href = 'data:' + data;
    a.download = 'todo.json';
    document.appendChild(a);
    a.click();
    a.remove()
    return
  }

}

```

With these new model customizations, we can put it all together in a component like so:

```html
<template>
  <p>{{ todo.$.text }}</p>
  <button @click="todo.closeTodo">Close</button>
  <button @click="todo.exportTodo">Export</button>
</template>
<script>
export default {
  name: 'todo-item',
  props: ['todo'],
}
</script>
```

As with any enabling feature, there is a balance that developers should seek between Model methods and a more functional API. Developers should be cognizant about differentiating functionality provided by models and functionality provided by broader application functions.

And although it's not recommended for most use-cases, you can also overwrite any of the methods available by default on Model objects.
