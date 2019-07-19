<script>
  /* props */
  export let controlType = null;
  export let rows = null;
  export let id;
  export let label;
  export let value;
  export let type = "text";
  export let valid = true;
  export let validityMessage = '';
</script>

<style>
  input,
  textarea {
    display: block;
    width: 100%;
    font: inherit;
    border: none;
    border-bottom: 2px solid #ccc;
    border-radius: 3px 3px 0 0;
    background: white;
    padding: 0.15rem 0.25rem;
    transition: border-color 0.1s ease-out;
  }

  input:focus,
  textarea:focus {
    border-color: #e40763;
    outline: none;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    width: 100%;
  }

  .form-control {
    padding: 0.5rem 0;
    width: 100%;
    margin: 0.25rem 0;
  }

  .invalid {
    border-color: red;
    background: #fde3e3;
  }

  .error-message {
    color: red;
    margin: 0.25rem 0;
  }
</style>

<div class="form-control">
  {#if controlType === 'textarea'}
    <label for={id}>{label}</label>
    <textarea class:invalid={!valid} {rows} {id} {value} on:input />
  {:else}
    <label for={label}>{label}</label>
    <input class:invalid={!valid} {type} {id} {value} on:input />
  {/if}

  {#if validityMessage && !valid}
    <p class='error-message'>{validityMessage}</p>
  {/if}
</div>
