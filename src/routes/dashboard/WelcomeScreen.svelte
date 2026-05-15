<script lang="ts">
	const prompts = [
		"What are you working on?",
		"Let's get started",
		"Ask me anything",
		"How can I help you today?",
		"Got a problem to solve?",
		"Ready when you are"
	];

	let currentIndex = $state(0);
	let fadeOut = $state(false);

	function cyclePrompt() {
		fadeOut = true;
		setTimeout(() => {
			currentIndex = (currentIndex + 1) % prompts.length;
			fadeOut = false;
		}, 300);
	}

	$effect(() => {
		const interval = setInterval(cyclePrompt, 4000);
		return () => clearInterval(interval);
	});
</script>

<div class="welcome-container" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #cdd6f4;">
	<h1 class="title is-2 mb-4" style="color: #cdd6f4;">Welcome</h1>
	<p
		class="subtitle is-4"
		style="color: #a6adc8; transition: opacity 0.3s; opacity: {fadeOut ? 0 : 1};"
	>{prompts[currentIndex]}</p>
</div>
