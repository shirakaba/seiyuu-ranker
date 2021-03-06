<script lang="ts">
	import { onMount } from "svelte";
	import { query } from "./query";
	import type { SeiyuuSummary } from "./query";
	import Results from "./Results.svelte";
	import type { MediaSeason, QueryResult } from "./query";
	import { default as EventEmitter } from "wolfy87-eventemitter";
	import UbiquityChart from "./UbiquityChart.svelte";
	import type { QueryResultProcessed, Point } from "./QueryResultProcessed";

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
	let pendingRateLimit: number|null = null;

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

	interface SortOption {
		text: string,
		value: "ALL"|"SUPPORTING"|"MAIN",
	}

	const sortOptions: SortOption[] = [
		{ text: "All roles", value: "ALL" },
		{ text: "Supporting roles", value: "SUPPORTING" },
		{ text: "Main roles", value: "MAIN" },
	];
	let sortOption: SortOption = sortOptions.find(sortOption => sortOption.value === "MAIN")!;

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
	let submissionPromise: Promise<QueryResultProcessed|null> = Promise.resolve(null);

	let queryProgress: number|null = null;
	let queryResultRaw: QueryResult|null = null;

	function mockSelector(year: string, season: MediaSeason|null): string {
		if(year === "2020"){
			if(season === null){
				return "./2020_all.json";
			}

			return "./2020_winter.json";
		}

		if(year === "2021"){
			if(season === null){
				return "./2021_all.json";
			}

			if(season === "SPRING"){
				return "./2021_spring.json";
			}
	
			if(season === "WINTER"){
				return "./2021_winter.json";
			}
		}

		return "./2021_winter.json";
	}

	const mock: boolean = false;
	const printResponse: boolean = false;
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
		const onRateLimitUpdate = (rateLimited: boolean, duration: number) => {
			if(!rateLimited){
				pendingRateLimit = null;
				return;
			}
			pendingRateLimit = duration;
		};
		progressMonitor.on("rateLimitUpdate", onRateLimitUpdate);

		submissionPromise = (
				mock ? 
					fetch(mockSelector(year, restrictToSeason ? selectedSeason.value : null))
					.then((response) => {
						return response.json()
						.then((json) => {
							if(!response.ok){
								return Promise.reject(json);
							}
							return json;
						})
					}) :
					query({
						variables: {
							seasonYear: parseInt(year),
							...(restrictToSeason ? { season: selectedSeason.value } : {}),
						},
						progressMonitor,
						quick: false,
					})
			)
			.then<QueryResultProcessed>((result: QueryResult) => {
				// Shows this season for which character info is available

				queryResultRaw = result;
				const { seiyuuSummaries } = result;

				/**
				 * Our sorting approach is to sort by the desired role type first.
				 * In the case of a tie, we sort by the next-most-valuable role, in the precedence:
				 * main > supporting > all
				 */
				const seiyuusSortedByAllRoles = [...seiyuuSummaries].sort((a, b) => {
					const { allRoles: allRolesA, mainRoles: mainRolesA, supportingRoles: supportingRolesA } = a;
					const { allRoles: allRolesB, mainRoles: mainRolesB, supportingRoles: supportingRolesB } = b;

					if(allRolesA !== allRolesB){
						return allRolesB - allRolesA;
					}

					if(mainRolesA !== mainRolesB){
						return mainRolesB - mainRolesA;
					}

					if(supportingRolesA !== supportingRolesB){
						return supportingRolesB - supportingRolesA;
					}
				
					return 0;
				});
				const seiyuusSortedByMainRoles = [...seiyuuSummaries].sort((a, b) => {
					const { allRoles: allRolesA, mainRoles: mainRolesA, supportingRoles: supportingRolesA } = a;
					const { allRoles: allRolesB, mainRoles: mainRolesB, supportingRoles: supportingRolesB } = b;

					if(mainRolesA !== mainRolesB){
						return mainRolesB - mainRolesA;
					}

					if(supportingRolesA !== supportingRolesB){
						return supportingRolesB - supportingRolesA;
					}

					if(allRolesA !== allRolesB){
						return allRolesB - allRolesA;
					}

					return 0;
				});
				const seiyuusSortedBySupportingRoles = [...seiyuuSummaries].sort((a, b) => {
					const { allRoles: allRolesA, mainRoles: mainRolesA, supportingRoles: supportingRolesA } = a;
					const { allRoles: allRolesB, mainRoles: mainRolesB, supportingRoles: supportingRolesB } = b;
				
					if(supportingRolesA !== supportingRolesB){
						return supportingRolesB - supportingRolesA;
					}

					if(mainRolesA !== mainRolesB){
						return mainRolesB - mainRolesA;
					}

					if(allRolesA !== allRolesB){
						return allRolesB - allRolesA;
					}

					return 0;
				});

				const allRolesPoints: Point[] = seiyuusSortedByAllRoles.reduce(
					(acc: Point[], { allRoles }: SeiyuuSummary, i: number) => {
						if(allRoles === 0){
							// Stop adding actors to array, as roles are now accounted for.
							return acc;
						}

						acc.push({ x: i + 1, y: acc[acc.length - 1].y + allRoles });
						return acc;
					},
					[{ x: 0, y: 0 }],
				);
				const mainRolesPoints: Point[] = seiyuusSortedByMainRoles.reduce(
					(acc: Point[], { mainRoles }: SeiyuuSummary, i: number) => {
						if(mainRoles === 0){
							// Stop adding actors to array, as roles are now accounted for.
							return acc;
						}

						acc.push({ x: i + 1, y: acc[acc.length - 1].y + mainRoles });
						return acc;
					},
					[{ x: 0, y: 0 }],
				);
				const supportingRolesPoints: Point[] = seiyuusSortedBySupportingRoles.reduce(
					(acc: Point[], { supportingRoles }: SeiyuuSummary, i: number) => {
						if(supportingRoles === 0){
							// Stop adding actors to array, as roles are now accounted for.
							return acc;
						}

						acc.push({ x: i + 1, y: acc[acc.length - 1].y + supportingRoles });
						return acc;
					},
					[{ x: 0, y: 0 }],
				);

				return {
					...result,

					seiyuusSortedByAllRoles,
					seiyuusSortedByMainRoles,
					seiyuusSortedBySupportingRoles,

					allRolesPoints: allRolesPoints.map(point => {
						return {
							x: point.x,
							y: 100 * (point.y / allRolesPoints[allRolesPoints.length - 1].y),
						};
					}),
					mainRolesPoints: mainRolesPoints.map(point => {
						return {
							x: point.x,
							y: 100 * (point.y / mainRolesPoints[mainRolesPoints.length - 1].y),
						};
					}),
					supportingRolesPoints: supportingRolesPoints.map(point => {
						return {
							x: point.x,
							y: 100 * (point.y / supportingRolesPoints[supportingRolesPoints.length - 1].y),
						};
					}),
				};
			})
			.finally(() => {
				submissionInFlight = false;
			});
	}

	let progressBar: HTMLProgressElement;
	onMount(() => {
		progressBar.removeAttribute("value"); // To make it indeterminate.
		if(mock){
			onSubmit();
		}
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
			{#if pendingRateLimit}
				<p><em>
					Currently <a href="https://anilist.gitbook.io/anilist-apiv2-docs/overview/rate-limiting">rate-limited</a>.
					{#if Number.isNaN(pendingRateLimit)}
						Will continue in one minute...
					{:else}
						Will continue in {pendingRateLimit} seconds...
					{/if}
				</em></p>
			{/if}
		</div>

		{#await submissionPromise}
			<p>Requesting data...</p>
		{:then result}
			{#if result !== null}
				{#if printResponse}
					<code>{JSON.stringify(queryResultRaw)}</code>
				{/if}
			
				<!-- <div style="position: relative; display: flex; justify-content: center; width: 100%; height: 300px;"></div> -->
				<div style="display: inline-block; width: 300px; height: 300px;">
					<UbiquityChart
						title="All roles"
						points={result.allRolesPoints}
						y2={result.allRolesPoints[result.allRolesPoints.length - 1].y}
						x2={result.allRolesPoints.length}
					/>
				</div>
				<div style="display: inline-block; width: 300px; height: 300px;">
					<UbiquityChart
						title="Supporting roles"
						points={result.supportingRolesPoints}
						y2={result.supportingRolesPoints[result.supportingRolesPoints.length - 1].y}
						x2={result.supportingRolesPoints.length}
					/>
				</div>
				<div style="display: inline-block; width: 300px; height: 300px;">
					<UbiquityChart
						title="Main roles"
						points={result.mainRolesPoints}
						y2={result.mainRolesPoints[result.mainRolesPoints.length - 1].y}
						x2={result.mainRolesPoints.length}
					/>
				</div>

				<div style="padding: 8px;">
					<label>
						Sort by: 
						<select bind:value={sortOption}>
							{#each sortOptions as sortOption}
								<option value={sortOption}>
									{sortOption.text}
								</option>
							{/each}
						</select>
					</label>
				</div>

				<Results data={result} sortBy={sortOption.value}/>
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
		max-width: 1024px;
		margin: 0 auto;
	}

	h1 {
		color: #293856;
	}

	/* @media (min-width: 640px) {
		main {
			max-width: none;
		}
	} */
</style>