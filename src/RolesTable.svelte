<script lang="ts">
    import type { QueryResultProcessed } from "./QueryResultProcessed";
    import type { Character } from "./query";

    export let characters: Character[];
</script>

<table>
    <thead>
        <tr>
            <td>Show</td>
            <td>Role</td>
            <td>Name</td>
        </tr>
    </thead>
    <tbody>
        {#each characters as { role, name }}
            <tr>
                <td>?</td>
                <td>{role}</td>
                <td>{name}</td>
            </tr>
        {/each}
    </tbody>
</table>