
<Modal title='Edit Meetup' on:cancel>
    <form on:submit|preventDefault={submitForm}>
        <TextInput
            id={"title"}
            label={"Title"}
            valid={true}
            validityMessage="please add something"
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
    </form>
    <div slot='footer'>
        <Button type={"submit"} mode="outline" on:click={cancel}>Cancel</Button>
        <Button type={"submit"} on:click={submitForm}>Save</Button>
    </div>
</Modal>

<script>
    import { createEventDispatcher } from 'svelte';
    import TextInput from '../ui/TextInput.svelte';
    import Button from '../ui/Button.svelte';
    import Modal from '../ui/Modal.svelte'

    const dispatch = createEventDispatcher();

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

    const cancel = () => {
        dispatch('cancel');
    }
</script>

<style>
  form {
    width: 100%;
  }
</style>
