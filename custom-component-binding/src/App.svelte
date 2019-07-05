<script>
  import CustomInput from "./CustomInput.svelte";
  import Toggle from './Toggle.svelte';

  let val = "Max";
  let selectedOption = 1;

  $: console.log(val);
  $: console.log(selectedOption);

  function setValue(event) {
    val = event.target.value;
  }
</script>

<!-- <input type="text" value={val} on:input={setValue}> -->
<!-- <input type="text" bind:value={val} /> -->
<CustomInput bind:val={val} />

<Toggle bind:chosenOption={selectedOption} />