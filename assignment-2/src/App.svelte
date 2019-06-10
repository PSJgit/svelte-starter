<script>

	let userPassword = '';
	let validation = 'Please enter your password';
	let passwordArr = [];

	const checkPassLength = () => {
		if (userPassword !== '' && userPassword.length > 10) {
			return validation = 'Too long!'
		} else if (userPassword.length < 5) {
			return validation = 'Too short!'
		} else {
			return validation = 'passed';
		}
	}

	const addPassword = () => {
		if (validation === 'passed' && !passwordArr.includes(userPassword)) {
			passwordArr = [
				...passwordArr,
				userPassword
			];
		}
		console.log('Duplicate password')
	}

	const deletePassword = (index) => {
		passwordArr = passwordArr.filter((password, i) => {
			return i !== index;
		});
	}
	
</script>

<h1>Assignment</h1>

<p>Solve these tasks.</p>

<ol>
	<li>Add a password input field and save the user input in a variable.</li>
	<li>Output "Too short" if the password is shorter than 5 characters and "Too long" if it's longer than 10.</li>
	<li>Output the password in a paragraph tag if it's between these boundaries.</li>
	<li>Add a button and let the user add the passwords to an array.</li>
	<li>Output the array values (= passwords) in a unordered list (ul tag).</li>
	<li>Bonus: If a password is clicked, remove it from the list.</li>
</ol>

<input type='password' bind:value={userPassword} on:keyup={checkPassLength}/>

<button on:click={addPassword}>Add password</button>

<p>{validation === 'passed' ? `Your password is: ${userPassword}` : validation}</p>

<ul id='password-list'>
	{#each passwordArr as password, i (password)}
		<li on:click={ () => {deletePassword(i)}}>{password}</li>
	{/each}
</ul>
