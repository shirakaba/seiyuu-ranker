<script lang="ts">
	import { onMount } from "svelte";
	import { query } from "./query";
	import Results from "./Results.svelte";
	import type { MediaSeason, QueryResult } from "./query";
	import { default as EventEmitter } from "wolfy87-eventemitter";

	async function getRandomNumber() {
		const res = await fetch(`tutorial/random-number`);
		const text = await res.text();

		if (res.ok) {
			return text;
		} else {
			throw new Error(text);
		}
	}

	let restrictToSeason: boolean = true;

	interface SeasonOption {
		text: string,
		value: MediaSeason,
	}

	const seasons: SeasonOption[] = [
		{ text: "☃️ Winter (Dec to Feb)", value: "WINTER" },
		{ text: "🌸 Spring (Mar to May)", value: "SPRING" },
		{ text: "⛱ Summer (Jun to Aug)", value: "SUMMER" },
		{ text: "🍁 Fall (Sep to Nov)", value: "FALL" },
	];

	function getCurrentSeason(currentDate: Date): MediaSeason {
		const currentMonth: number = currentDate.getMonth() + 1;

		switch(currentMonth){
			case 12:
			case 1:
			case 2:
				return "WINTER";
			case 3:
			case 4:
			case 5:
				return "SPRING";
			case 6:
			case 7:
			case 8:
				return "SUMMER";
			default:
				return "FALL";
		}
	}

	const currentDate = new Date();
	let year: string = currentDate.getFullYear().toString();
	$: yearValid = /^\d+$/.test(year) && Number.isInteger(parseInt(year));

	const currentSeason = getCurrentSeason(currentDate);
	let selectedSeason: SeasonOption = seasons.find(season => season.value === currentSeason)!;

	let submissionInFlight: boolean = false;
	$: canSubmit = !submissionInFlight && yearValid;
	let submissionPromise: Promise<QueryResult[]|null> = Promise.resolve(null);

	let queryProgress: number|null = null;


	function onSubmit(): void {
		if(submissionInFlight){
			return;
		}
		submissionInFlight = true;

		const progressMonitor = new EventEmitter();
		const onUpdate = (numerator, denominator) => {
			queryProgress = (numerator / denominator) * 100;
		};
		progressMonitor.on("update", onUpdate);

		submissionPromise = query({
			variables: {
				seasonYear: parseInt(year),
				...(restrictToSeason ? { season: selectedSeason.value } : {}),
			},
			progressMonitor,
		})
		.finally(() => {
			submissionInFlight = false;
		});
	}

	let progressBar: HTMLProgressElement;
	onMount(() => {
		progressBar.removeAttribute("value"); // To make it indeterminate.
	});
</script>

<main>
	<h1>Seiyuu Ranker</h1>

	<section>
		<h2>Form</h2>

		<form on:submit|preventDefault={onSubmit}>
			<label>
				Year
				<input style="width: 4em;" bind:value={year}>
			</label>
			{#if !yearValid}
				<p style="color: red;">Please enter a valid year.</p>
			{/if}
	
			<p><em>Note that the release year is offset from the calendar by one month.</em></p>
			<p><em>i.e. It includes the December of the preceding year rather than that of the given year.</em></p>
	
			<label>
				<input type=checkbox bind:checked={restrictToSeason}>
				Restrict to season
			</label>
	
			{#if restrictToSeason}
				<div style="padding: 8px;">
					<select bind:value={selectedSeason}>
						{#each seasons as season}
							<option value={season}>
								{season.text}
							</option>
						{/each}
					</select>
				</div>
			{/if}
		
			<button disabled={!canSubmit} type=submit>
				Submit
			</button>
		</form>
	</section>

	
	<section>
		<h2>Results</h2>

		{#await submissionPromise}
			<!-- svelte-ignore empty-block -->
		{:then result}
			{#if result === null}
				<p>Submit the form to populate the results.</p>
			{/if}
		{:catch error}
			<p>Try submitting again.</p>
		{/await}

		<div>
			<progress bind:this={progressBar} style="display: {(submissionInFlight) ? "inline-block" : "none"}" max="100" value={queryProgress}></progress>
		</div>

		{#await submissionPromise}
			<p>Requesting data...</p>
			<p><em>Note that we wait 125 ms between requests to prevent being rate-limited by the server. This may be over-the-top.</em></p>
		{:then result}
			{#if result !== null}
				<!-- <code>{JSON.stringify(result)}</code> -->
				<Results data={result}/>
			{/if}
		{:catch error}
			<p style="color: red">{error.message}</p>
		{/await}
	</section>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #293856;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>