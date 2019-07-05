<script>
  import CustomInput from "./CustomInput.svelte";
  import Toggle from "./Toggle.svelte";
  import { isValidEmail } from "./validation.js";

  let val = "Max";
  let price = 0;
  let selectedOption = 1;
  let agreed;
  //   let favColor = 'green';
  let favColor = ["green"];
  let singleFavColor = "red";
  let usernameInput;
  let someDiv;
  let customInput;
  let enteredEmail = "";
  let formIsValid = false;

  $: if (isValidEmail(enteredEmail)) {
    formIsValid = true;
  } else {
    formIsValid = false;
  }

  $: console.log(val);
  $: console.log(selectedOption);
  $: console.log(price);
  $: console.log(agreed);
  $: console.log(favColor);
  $: console.log(singleFavColor);
  $: console.log(customInput);

  function setValue(event) {
    val = event.target.value;
  }

  function saveData() {
    //   console.log(document.querySelector('#username').value);
    console.log(usernameInput.value);
    console.dir(usernameInput);
    console.dir(someDiv);
    customInput.empty();
  }
</script>

<style>
  .invalid {
    border: 1px solid red;
  }
</style>

<!-- <input type="text" value={val} on:input={setValue}> -->
<!-- <input type="text" bind:value={val} /> -->
<CustomInput bind:val bind:this={customInput} />

<Toggle bind:chosenOption={selectedOption} />

<input type="number" bind:value={price} />

<label>
  <input type="checkbox" bind:checked={agreed} />
  Agree to terms?
</label>

<!-- Replace "checkbox" with "radio" and update the "favColor" variable above to see the radio example -->
<h1>Favorite Color?</h1>
<label>
  <input type="checkbox" name="color" value="red" bind:group={favColor} />
  Red
</label>
<label>
  <input type="checkbox" name="color" value="green" bind:group={favColor} />
  Green
</label>
<label>
  <input type="checkbox" name="color" value="blue" bind:group={favColor} />
  Blue
</label>

<select bind:value={singleFavColor}>
  <option value="green">Green</option>
  <option value="red">Red</option>
  <option value="blue">Blue</option>
</select>

<hr />

<input type="text" bind:this={usernameInput} />
<button on:click={saveData}>Save</button>

<div bind:this={someDiv} />

<hr />

<form on:submit>
  <input
    type="email"
    bind:value={enteredEmail}
    class={isValidEmail(enteredEmail) ? '' : 'invalid'} />
  <button type="submit" disabled={!formIsValid}>Save</button>
</form>
