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
        <tr class="headRow">
            <td>Role</td>
            <td>Show</td>
            <td>Name</td>
        </tr>
    </thead>
    <tbody>
        {#each characters as { showPreferredTitle, role, name, characterUrl, showUrl }}
            <tr class="bodyRow">
                <td>{presentRole(role)}</td>
                <td class="showTitle">
                    <a href={showUrl}>{showPreferredTitle}</a>
                </td>
                <td>
                    <a href={characterUrl}>{name}</a>
                </td>
            </tr>
        {/each}
    </tbody>
</table>

<style>
    tbody > tr:nth-child(even){background-color: #f2f2f2;}
    .headRow {
        font-weight: bold;
    }
    .bodyRow {
        vertical-align: top;
    }
    .showTitle {
        /* overflow: hidden; */
        /* text-overflow: ellipsis; */
    }
</style>