<script>
  let enteredPassword = "";
  let passwordValidity = "short";

  let passwords = [];

  $: if (enteredPassword.trim().length < 5) {
    passwordValidity = "short";
  } else if (enteredPassword.trim().length > 10) {
    passwordValidity = "long";
  } else {
    passwordValidity = "valid";
  }

  function confirmPassword() {
    if (passwordValidity === "valid") {
      passwords = [...passwords, enteredPassword];
    }
  }

  function removePassword(index) {
    passwords = passwords.filter((pw, idx) => {
      return idx !== index;
    });
  }
</script>

<h1>Assignment</h1>

<p>Solve these tasks.</p>

<ol>
  <li>Add a password input field and save the user input in a variable.</li>
  <li>
    Output "Too short" if the password is shorter than 5 characters and "Too long" if it's longer than 10.
  </li>
  <li>
    Output the password in a paragraph tag if it's between these boundaries.
  </li>
  <li>Add a button and let the user add the passwords to an array.</li>
  <li>Output the array values (= passwords) in a unordered list (ul tag).</li>
  <li>Bonus: If a password is clicked, remove it from the list.</li>
</ol>

<input type="password" bind:value={enteredPassword} />

<button on:click={confirmPassword}>Confirm Password</button>

{#if passwordValidity === 'short'}
  <p>Password is too short!</p>
{:else if passwordValidity === 'long'}
  <p>Password is too long!</p>
{:else}
  <p>Password: {enteredPassword}</p>
{/if}

<ul>
  {#each passwords as pw, i (pw)}
    <li on:click={removePassword.bind(this, i)}>{pw}</li>
  {/each}
</ul>
