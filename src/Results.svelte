<script lang="ts">
    import type { SeiyuuSummary } from "./query";
    import type { QueryResultProcessed } from "./QueryResultProcessed";
    import RolesTable from "./RolesTable.svelte";
    import type { CharacterWithShow } from "./RolesTableTypes";

    export let data: Omit<QueryResultProcessed, "allRolesPoints"|"mainRolesPoints"|"supportingRolesPoints"> = {
        seiyuusSortedByAllRoles: [],
        seiyuusSortedByMainRoles: [],
        seiyuusSortedBySupportingRoles: [],
        shows: {},
    };
    $: {
        console.log(`data.shows`, data.shows);
    }
    export let sortBy: "MAIN"|"SUPPORTING"|"ALL" = "ALL";
    let seiyuus: SeiyuuSummary[];
    $: seiyuus = sortBy === "MAIN" ? 
        data.seiyuusSortedByMainRoles : 
            sortBy === "SUPPORTING" ? 
                data.seiyuusSortedBySupportingRoles :
                data.seiyuusSortedByAllRoles;
    const maxSeiyuusToShow: number|null = null;
    $: seiyuusSliced = maxSeiyuusToShow === null ? seiyuus : seiyuus.slice(0, maxSeiyuusToShow);

    const maxImagesToShow = 5;

    const roleValues = {
        MAIN: 3,
        SUPPORTING: 2,
        BACKGROUND: 1,
        UNCLASSIFIED: 0,
    } as const;

    function getShowsForSeiyuu(seiyuuId: string, showIds: number[]): CharacterWithShow[] {
        const characters: CharacterWithShow[] = [];

        showIds.forEach(showId => {
            const {
                preferredTitle: showPreferredTitle,
                seiyuus,
            } = data.shows[showId];

            seiyuus[seiyuuId].forEach((characterForSeiyuu: Character) => {
                characters.push({
                    ...characterForSeiyuu,
                    showId,
                    showPreferredTitle,
                });
            });
        });

        // Sort desc, such that: main > supp > back > other
        return characters.sort((a, b) => {
            const { role: roleA } = a;
            const { role: roleB } = b;

            const countA = roleValues[roleA];
            const countB = roleValues[roleB];
        
            return countB - countA;
        });
    }
</script>

<div class="container">
    {#each seiyuusSliced as { id, mainRoles, supportingRoles, backgroundRoles, allRoles, fullName, image, siteUrl, showIds }, index }
        <div class="card">
            <table class="seiyuu">
                {#if index < maxImagesToShow}
                    <tr class="imgRow">
                        <td colspan="3">
                            <img alt="{fullName}" src={image}/>
                        </td>
                    </tr>
                {/if}
                <tr class="seiyuuNameRow"><td colspan="3">#{index + 1} <a class="seiyuuName" href={siteUrl}>{fullName}</a></td></tr>
                <tr>
                    <td rowSpan="4" class="roleHeader">
                        <div>Roles</div>
                    </td>
                    <td class="roles">All</td>
                    <td>{allRoles}</td>
                </tr>
                <tr>
                    <td class="roles main">Main</td>
                    <td>{mainRoles}</td>
                </tr>
                <tr>
                    <td class="roles supporting">Supporting</td>
                    <td>{supportingRoles}</td>
                </tr>
                <tr>
                    <td class="roles background">Background</td>
                    <td>{backgroundRoles}</td>
                </tr>
                
                <tr>
                    <td colspan="3">
                        <details open={index === 0}>
                            <summary>See roles</summary>
                            <RolesTable characters={getShowsForSeiyuu(id, showIds)}/>
                        </details>
                    </td>
                </tr>

                <!-- TODO: links to shows -->
                <!-- <tr>
                    <td class="showsHeader">Shows</td>
                </tr> -->
            </table>
        </div>
        
    {/each}
</div>

<style>
    .container {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        text-align: left;
        justify-content: center;
    }
    .card {
        background-color: #fafafa;
        border-radius: 8px;
        padding: 8px;
        margin: 8px;
    }
    .imgRow {
        height: 360px;
    }
    .imgRow > td {
        vertical-align: top;
    }
    .imgRow > td > img {
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
    }
    .seiyuu {
        width: 230px;
    }
    .seiyuuNameRow > td {
        padding-top: 4px;
        padding-bottom: 4px;
    }
    .seiyuuName {
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .roleHeader {
        width: 1em;
        text-transform: uppercase;
        padding-right: 8px;
    }
    .roleHeader > div {
        writing-mode: vertical-rl;
        transform: rotate(180deg);
    }
    .roles {
        text-transform: lowercase;
    }
    .roles.main {
        /* background-color: green; */
    }
    .roles.supporting {
        /* background-color: orange; */
    }
    .roles.background {
        /* background-color: yellow; */
    }
    .showsHeader {
        text-transform: uppercase;
    }
</style>