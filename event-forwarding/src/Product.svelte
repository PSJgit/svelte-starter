<script>
    import { createEventDispatcher } from 'svelte';

    export let title;
    export let price;
    // default value
    export let bestseller = false;

    const dispatch = createEventDispatcher();

    /* dispatch can take in a 2nd arg, which is any data you want to pass through */
    const addToCart = () => {
        dispatch('add-to-cart', 'data from addToCart')
    }

    const deleteItem = () => {
        dispatch('delete', 'data from deleteItem')
    }

</script>

<style>

</style>
<!-- on:click (on its own) is the forwarding syntax -->
<article>
    <h1>{title}</h1>
    <h1>${price}</h1>
    {#if bestseller}
        <p>{bestseller}</p>
    {/if}
    <button on:click="{addToCart}">Add product</button>
    <button on:click="{deleteItem}">Delete product</button>
</article>
