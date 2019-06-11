<script>
  import Header from "./ui/Header.svelte";
  import MeetupGrid from "./components/Meetup-grid.svelte";

  const meetups = [
    {
      id: "m1",
      title: "Meet up title one",
      subTitle: "The subtitle for the first one",
      description: "Meet up one, do thing, something. Anything.",
      imageUrl: "images/rota-alternativa-1663969-unsplash.jpg",
      address: "Somewhere other there, maybe.",
      contactEmail: "email@email.com"
    },
    {
      id: "m2",
      title: "Meet up title two",
      subTitle: "Another subtitle",
      description: "Meet up two, with a coastline.",
      imageUrl: "images/janis-karkossa-1668527-unsplash.jpg",
      address: "The coast, something something, 4005",
      contactEmail: "coast@email.com2"
    }
  ];
</script>

<style>
  section {
    margin-top: 5rem;
  }
</style>

<Header />

<main>
  <MeetupGrid {meetups} />
</main>
