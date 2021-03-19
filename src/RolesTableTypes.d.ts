import type { Character } from "./query";

export interface CharacterWithShow extends Character {
    showId: number,
    showPreferredTitle: string,
}