<script>
    import { createEventDispatcher } from 'svelte';
    import TextInput from '../ui/TextInput.svelte';
    import Button from '../ui/Button.svelte';

    const dispatch = createEventDispatcher();

    /* init vars for storing data from form input */
    let title = "";
    let subtitle = "";
    let address = "";
    let imageUrl = "";
    let description = "";
    let contactEmail = "";

    const submitForm = () => {
        dispatch('save', {
            title: title,
            subtitle: subtitle,
            address: address,
            imageUrl: imageUrl,
            description: description,
            contactEmail: contactEmail
        })
    }
</script>

<form on:submit|preventDefault={submitForm}>
    <TextInput
        id={"title"}
        label={"Title"}
        value={title}
        on:input={e => (title = e.target.value)} />
    <TextInput
        id={"subtitle"}
        label={"Subtitle"}
        value={subtitle}
        on:input={e => (subtitle = e.target.value)} />
    <TextInput
        id={"address"}
        label={"Address"}
        value={address}
        on:input={e => (address = e.target.value)} />
    <TextInput
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
        id={"contact-email"}
        label={"Contact Email"}
        value={contactEmail}
        on:input={e => (contactEmail = e.target.value)} />

    <Button type={"submit"} text={"Save"}/>
</form>


<style>
  form {
    width: 30rem;
    max-width: 90%;
    margin: auto;
  }
</style>
