<script lang="ts">
    import type { Character } from "./query";
    import type { CharacterWithShow } from "./RolesTableTypes";

    export let characters: CharacterWithShow[];

    function presentRole(role: Character["role"]): string {
        switch(role){
            case "MAIN":
                return "main";
            case "BACKGROUND":
                return "back.";
            case "SUPPORTING":
                return "supp.";
            case "UNCLASSIFIED":
                return "other";
        }
    }
</script>

<table>
    <thead>
        <tr>
            <td>Role</td>
            <td>Show</td>
            <td>Name</td>
        </tr>
    </thead>
    <tbody>
        {#each characters as { showPreferredTitle, role, name }}
            <tr class="bodyRow">
                <td>{presentRole(role)}</td>
                <td class="showTitle">{showPreferredTitle}</td>
                <td>{name}</td>
            </tr>
        {/each}
    </tbody>
</table>

<style>
    .bodyRow {
        vertical-align: top;
    }
    .showTitle {
        /* overflow: hidden; */
        /* text-overflow: ellipsis; */
    }
</style>