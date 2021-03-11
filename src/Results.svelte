<script lang="ts">
    import type { QueryResultProcessed } from "./QueryResultProcessed";

    export let data: Omit<QueryResultProcessed, "allRolesPoints"|"mainRolesPoints"|"supportingRolesPoints"> = {
        seiyuusSortedByAllRoles: [],
        seiyuusSortedByMainRoles: [],
        seiyuusSortedBySupportingRoles: [],
        shows: {},
    };
    let sortBy: "MAIN"|"SUPPORTING"|"ALL" = "ALL";
    $: seiyuus = sortBy === "MAIN" ? 
        data.seiyuusSortedByMainRoles : 
            sortBy === "SUPPORTING" ? 
                data.seiyuusSortedBySupportingRoles :
                data.seiyuusSortedByAllRoles;
    const maxSeiyuusToShow = null;
    $: slicedData = maxSeiyuusToShow === null ? seiyuus : seiyuus.slice(0, maxSeiyuusToShow);

    const maxImagesToShow = 5;
</script>

<div class="container">
    {#each slicedData as { id, mainRoles, supportingRoles, backgroundRoles, allRoles, fullName, image, siteUrl, showIds }, index }
        <div class="card">
            <table class="seiyuu">
                {#if index < maxImagesToShow}
                    <tr class="imgRow">
                        <td colspan="3">
                            <img alt="{fullName}" src={image}/>
                        </td>
                    </tr>
                {/if}
                <tr class="seiyuuNameRow"><td colspan="3"><a class="seiyuuName" href={siteUrl}>#{index + 1} {fullName}</a></td></tr>
                <tr>
                    <td rowSpan="4" class="roleHeader">
                        <div>Roles</div>
                    </td>
                    <td class="roles">All</td>
                    <td>{allRoles}</td>
                </tr>
                <tr>
                    <td class="roles">Main</td>
                    <td>{mainRoles}</td>
                </tr>
                <tr>
                    <td class="roles">Supporting</td>
                    <td>{supportingRoles}</td>
                </tr>
                <tr>
                    <td class="roles">Background</td>
                    <td>{backgroundRoles}</td>
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
    .showsHeader {
        text-transform: uppercase;
    }
</style>