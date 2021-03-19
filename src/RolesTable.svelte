<script lang="ts">
    import type { Character } from "./query";

    interface ShowToCharacters {
        showPreferredTitle: string,
        charactersForSeiyuu: Character[],
    }

    const roleValues = {
        MAIN: 3,
        SUPPORTING: 2,
        BACKGROUND: 1,
        UNCLASSIFIED: 0,
    } as const;

    export let showsToCharacters: ShowToCharacters[];
    let showsToCharactersSorted: ShowToCharacters[];
    $: showsToCharactersSorted = showsToCharacters.reduce(
        (acc, val: ShowToCharacters) => {
            const { showPreferredTitle, charactersForSeiyuu } = val;

            acc.push({
                showPreferredTitle,
                // Sort desc, such that: main > supp > back > other
                charactersForSeiyuu: charactersForSeiyuu.sort((a, b) => {
					const { role: roleA } = a;
					const { role: roleB } = b;

                    const countA = roleValues[roleA];
                    const countB = roleValues[roleB];
				
					return countB - countA;
				}),
            });
            return acc;
        },
        [],
    )
    // .sort((a: ShowToCharacters, b: ShowToCharacters) => {
    //     const { role: roleA } = a;
    //     const { role: roleB } = b;

    //     const countA = roleValues[roleA];
    //     const countB = roleValues[roleB];
    
    //     return countB - countA;
    // });

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
        {#each showsToCharactersSorted as { showPreferredTitle, charactersForSeiyuu }}
            {#each charactersForSeiyuu as { role, name }}
                <tr>
                    <td>{presentRole(role)}</td>
                    <td>{showPreferredTitle}</td>
                    <td>{name}</td>
                </tr>
            {/each}
        {/each}
    </tbody>
</table>

<style>

</style>