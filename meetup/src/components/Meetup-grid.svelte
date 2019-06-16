<section id="meetups">
  {#each meetups as meetup}
    <MeetupItem
      id={meetup.id}
      title={meetup.title}
      subtitle={meetup.subtitle}
      description={meetup.description}
      imageUrl={meetup.imageUrl}
      address={meetup.address}
      isFavourite={meetup.isFavourite}
      email={meetup.contactEmail} 
      on:togglefavourite/>
  {/each}
</section>

<script>
  import MeetupItem from "./Meetup-Item.svelte";
  /* Receive meetup data array */
  export let meetups;
</script>

<style>
  section {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
    grid-gap: 1rem;
  }

  @media (min-width: 768px) {
    section {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>


