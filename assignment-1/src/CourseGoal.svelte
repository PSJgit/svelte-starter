<script>
    export let goal;

    $: doHighlight = goal.includes('!');
</script>

<style>
  .highlight {
    color: red;
  }
</style>

<h1 class:highlight={doHighlight}>{goal}</h1>