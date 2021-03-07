<script lang="ts">
	import { query } from "./query";
	import type { MediaSeason } from "./query";

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


	function onSubmit(): void {
		// alert(`answered question ${selected.id} (${selected.text}) with "${answer}"`);
	}
</script>

<main>
	<h1>Seiyuu Ranker</h1>

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