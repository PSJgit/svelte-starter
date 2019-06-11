<script>
    import Header from './ui/Header.svelte';
    import MeetupItem from './components/Meetup-Item.svelte';

    const meetups = [
        {
            id: 'm1',
            title: 'title',
            subTitle: 'subtitle',
            description: 'In this descriptiong',
            imageUrl: 'images/rota-alternativa-1663969-unsplash.jpg',
            address: 'address',
            contactEmail: 'email@email.com'
        },
        {
            id: 'm2',
            title: 'title2',
            subTitle: 'subtitle2',
            description: 'In this description2',
            imageUrl: 'images/janis-karkossa-1668527-unsplash.jpg',
            address: 'address2',
            contactEmail: 'email@email.com2'
        }
    ]
</script>

<style>
    section {
        margin-top: 5rem;
    }
</style>

<Header />

<section id='meetups'>
    {#each meetups as meetup}
        <MeetupItem 
            title={meetup.title}
            subTitle={meetup.subTitle}
            description={meetup.description}
            imageUrl={meetup.imageUrl}
            address={meetup.address}
            contactEmail={meetup.contactEmail}
        />
    {/each}
</section>


