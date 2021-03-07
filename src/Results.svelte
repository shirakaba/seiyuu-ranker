<script lang="ts">
    import type { QueryResult } from "./query";

    export let data: QueryResult[] = [];
    const maxSeiyuusToShow = null;
    $: slicedData = maxSeiyuusToShow === null ? data : data.slice(0, maxSeiyuusToShow);

    const maxImagesToShow = 5;
</script>

<div class="container">
    {#each slicedData as { id, mainRoles, supportingRoles, backgroundRoles, allRoles, fullName, image, siteUrl, showIds }, index }
        <table class="seiyuu">
            {#if index < maxImagesToShow}
                <tr>
                    <td>
                        <img alt="{fullName}" src={image}/>
                    </td>
                </tr>
            {/if}
            <tr><td><a class="seiyuuName" href={siteUrl}>{fullName}</a></td></tr>
            <tr>
                <td>All roles</td>
                <td>{allRoles}</td>
            </tr>
            <tr>
                <td>Main roles</td>
                <td>{mainRoles}</td>
            </tr>
            <tr>
                <td>Supporting roles</td>
                <td>{supportingRoles}</td>
            </tr>
            <tr>
                <td>Background roles</td>
                <td>{backgroundRoles}</td>
            </tr>
            <!-- TODO: links to shows -->
        </table>
    {/each}
</div>

<style>
    .container {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        /* max-width: 640px; */
        text-align: left;
        justify-content: center;
    }
    .seiyuu {
        /* flex: 1; */
        width: 250px;
    }
    .seiyuuName {
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>