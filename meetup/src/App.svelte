<Header />

<main>
  <div class="meetup-controls">
    <Button text="New meetup" on:click="{() => editMode = 'add'}"></Button>
  </div>

  {#if editMode === 'add'}
    <EditMeetup on:save='{addMeetup}'/>
  {:else}
    <MeetupGrid {meetups} on:togglefavourite="{toggleFavourite}" />
  {/if}
  
</main>

<script>
  import Header from "./ui/Header.svelte";
  import EditMeetup from "./components/Edit-meetup.svelte";
  import MeetupGrid from "./components/Meetup-grid.svelte";
  import Button from "./ui/Button.svelte";


  let editMode;

  let meetups = [
    {
      id: "m1",
      title: "Meet up title one",
      subtitle: "The subtitle for the first one",
      description: "Meet up one, do thing, something. Anything.",
      imageUrl: "images/rota-alternativa-1663969-unsplash.jpg",
      address: "Somewhere other there, maybe.",
      contactEmail: "email@email.com",
      isFavourite: false
    },
    {
      id: "m2",
      title: "Meet up title two",
      subtitle: "Another subtitle",
      description: "Meet up two, with a coastline.",
      imageUrl: "images/janis-karkossa-1668527-unsplash.jpg",
      address: "The coast, something something, 4005",
      contactEmail: "coast@email.com2",
      isFavourite: false
    }
  ];

  const addMeetup = (e) => {
    let newMeetup = {
      id: Math.random().toString(),
      title: e.detail.title,
      subtitle: e.detail.subtitle,
      description: e.detail.description,
      imageUrl: e.detail.imageUrl,
      address: e.detail.address,
      contactEmail: e.detail.contactEmail
    };
    meetups = [newMeetup, ...meetups];
    editMode = null;
  };

  const toggleFavourite = (e) => {
    const id = e.detail;
    const toggleFav = meetups.map( (obj) => {
      if (obj.id === id) {
        obj.isFavourite = !obj.isFavourite;
      }
      return obj;
    });
    meetups = [...toggleFav]
 
    /* const meetupTarget =  {...meetups.find(m => m.id === id)};

    meetupTarget.isFavourite = !meetupTarget.isFavourite;

    const meetupIndex = meetups.findIndex(m => m.id === id);
    
    const updatedMeetups = [...meetups];
    updatedMeetups[meetupIndex] = meetupTarget;
    meetups = updatedMeetups; */

  }
</script>

<style>
  section,
  main {
    margin-top: 5rem;
  }

  form {
    width: 30rem;
    max-width: 90%;
    margin: auto;
  }
  .meetup-controls {
    margin: 1rem;
  }
</style>

