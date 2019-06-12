<script>
  import Header from "./ui/Header.svelte";
  import TextInput from "./ui/TextInput.svelte";
  import Button from "./ui/Button.svelte";
  import MeetupGrid from "./components/Meetup-grid.svelte";

  let meetups = [
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

  /* init vars for storing data from form input via bind directive */
  let title = "";
  let subtitle = "";
  let address = "";
  let imageUrl = "";
  let description = "";
  let contactEmail = "";

  const addMeetup = () => {
    let newMeetup = {
      id: Math.random().toString(),
      title: title,
      subtitle: subtitle,
      description: description,
      imageUrl: imageUrl,
      address: address,
      contactEmail: contactEmail
    };
    /* unpack old meetup array into new meet up array to get Svelte to update the dom*/
    meetups = [newMeetup, ...meetups];
  };
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
</style>

<Header />

<main>
  <form on:submit|preventDefault={addMeetup}>
    <TextInput
      type={"text"}
      id={"title"}
      label={"Title"}
      value={title}
      on:input={e => (title = e.target.value)} />
    <TextInput
      type={"text"}
      id={"subtitle"}
      label={"Subtitle"}
      value={subtitle}
      on:input={e => (subtitle = e.target.value)} />
    <TextInput
      type={"text"}
      id={"address"}
      label={"Address"}
      value={address}
      on:input={e => (address = e.target.value)} />
    <TextInput
      type={"text"}
      id={"imageUrl"}
      label={"Image Url"}
      value={imageUrl}
      on:input={e => (imageUrl = e.target.value)} />
    <TextInput
      controlType={"textarea"}
      rows={"3"}
      id={"description"}
      label={"Description"}
      value={description}
      on:input={e => (description = e.target.value)} />
    <TextInput
      type={"text"}
      id={"contact-email"}
      label={"Contact Email"}
      value={contactEmail}
      on:input={e => (contactEmail = e.target.value)} />
    
    <Button type={"submit"} text={"Save"}/>
  </form>

  <MeetupGrid {meetups} />
</main>
