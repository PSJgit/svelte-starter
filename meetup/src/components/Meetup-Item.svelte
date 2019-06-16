<article>
  <header>
    <h1>
      {title} 
      {#if isFavourite}
        <Badge>
          FAVOURITE
        </Badge>
      {/if}
    </h1>
    <h2>{subtitle}</h2>
    <p>{address}</p>
  </header>
  <div class="image">
    <img src={imageUrl} alt={title} />
  </div>
  <div class="content">
    <p>{description}</p>

  </div>
  <footer>
    <Button href="mailTo:{email}" type={"button"}>Contact</Button>
    <Button type={"button"}>Show details</Button>
    <Button 
      mode={"outline"} 
      type={"button"} 
      color={isFavourite ? null : 'success'}
      on:click={() => dispatch('togglefavourite', id)}>
        {isFavourite ? 'Unfavourite' : 'Favourite'} 
    </Button>
  </footer>
</article>

<script>
  import { createEventDispatcher } from 'svelte';
  import Button from '../ui/Button.svelte';
  import Badge from '../ui/Badge.svelte';

  /* dispatch var used for forwarding events */
  const dispatch = createEventDispatcher();

  /* Meetup-item component props */
  export let id;
  export let title;
  export let subtitle;
  export let imageUrl;
  export let description;
  export let address;
  export let email;
  export let isFavourite;

</script>

<style>
  article {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.26);
    border-radius: 5px;
    background: white;
    margin: 1rem;
  }

  header,
  .content,
  footer {
    padding: 1rem;
  }

  .image {
    width: 100%;
    height: 14rem;
  }

  .image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  h1 {
    font-size: 1.25rem;
    margin: 0.5rem 0;
    font-family: "Roboto Slab", sans-serif;
  }

  h1.is-favorite {
    background: #01a129;
    color: white;
    padding: 0 0.5rem;
    border-radius: 5px;
  }

  h2 {
    font-size: 1rem;
    color: #808080;
    margin: 0.5rem 0;
  }

  p {
    font-size: 1.25rem;
    margin: 0;
  }

  div {
    text-align: right;
  }
  
  .content {
    height: 4rem;
  }
</style>


