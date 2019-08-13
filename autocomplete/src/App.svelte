<script>
	let name = 'world';
	const dataset = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
	let value = '';
	let filteredData;
	
	function filterValues(value) {
		
	return dataset.filter( (item, index) => {
		
			if (item.includes(value)) {
				console.log('okokokok')
				return item
			}
		})
	}
	
	$: filteredData = filterValues(value);
	$: console.log(filteredData)
	
</script>

<div class='custom-combo'>
	<input bind:value on:input={filterValues}/>
	{#if value.length >= 1}
		<ul>
			{#each filteredData as data, index}
				<li id={`item-${index}`}>{data}</li>
			{/each}	
		</ul>
	{/if}
</div>
	