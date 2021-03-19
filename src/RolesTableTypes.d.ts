import type { Character } from "./query";

export interface CharacterWithShow extends Character {
    showPreferredTitle: string,
    showUrl: string,
    characterUrl: string,
}