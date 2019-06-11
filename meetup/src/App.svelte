<script>
    import Header from './ui/Header.svelte';
    import MeetupItem from './components/Meetup-Item.svelte';

    const meetups = [
        {
            id: 'm1',
            title: 'title',
            subtitle: 'subtitle',
            description: 'In this descriptiong',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Advert_for_West_Indian_Lime_Juice_Wellcome_L0040443.jpg',
            address: 'address',
            contactEmail: 'email@email.com'
        },
        {
            id: 'm2',
            title: 'title2',
            subtitle: 'subtitle2',
            description: 'In this description2',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Advert_for_West_Indian_Lime_Juice_Wellcome_L0040443.jpg',
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
        <MeetupItem />
    {/each}
</section>


