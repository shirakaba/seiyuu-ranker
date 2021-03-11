import type { QueryResult } from "./query";

export interface Point {
    x: number,
    y: number,
}

export interface QueryResultProcessed extends Omit<QueryResult, "seiyuuSummaries"> {
    seiyuusSortedByAllRoles: SeiyuuSummary[],
    seiyuusSortedByMainRoles: SeiyuuSummary[],
    seiyuusSortedBySupportingRoles: SeiyuuSummary[],
    allRolesPoints: Point[],
    mainRolesPoints: Point[],
    supportingRolesPoints: Point[],
    /**
     * Characters with background roles tend to have no associated voice actors listed, so makes bad graphs, though it does vary from season to season.
     */
    // backgroundRolesPoints: Point[],
}