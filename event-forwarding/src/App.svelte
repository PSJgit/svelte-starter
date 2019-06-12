<script>
  import Product from "./Product.svelte";
  import Modal from "./Modal.svelte";
  

  let products = [
    {
      id: 'p1',
      title: 'A book',
      price: 9.99
    }
  ]

  /* event.detail is where the data is passed up from the child component */
  const addToCart = (e) => {
    console.log(e.detail)
  }

  const deleteItem = (e) => {
     console.log(e.detail)
  }
</script>

<style>

</style>

<!-- if props are the same name as the object props being passed down, ... will unpack it for you -->
{#each products as product}
  <Product 
    {...product}
    on:add-to-cart={addToCart}
    on:deleteItem={deleteItem}
  />
{/each}

<Modal>
  <h1 slot='header'>HEADER CONTENT</h1>
  <p>content... content</p>
  
</Modal>
