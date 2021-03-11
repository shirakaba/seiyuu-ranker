import type { default as EventEmitter } from "wolfy87-eventemitter";

/**
 * @see https://anilist.gitbook.io/anilist-apiv2-docs/overview/resources-and-recommended-reading
 * @see https://anilist.github.io/ApiV2-GraphQL-Docs/
 * @see https://anilist.co/graphiql
 * @see https://anilist.co/anime/108725/Yakusoku-no-Neverland-2/characters
 */

// Here we define our query as a multi-line string
// Storing it in a separate .graphql/.gql file is also possible
const mediaQuery: string = `
query ($season: MediaSeason!, $seasonYear: Int!, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      perPage
      currentPage
      lastPage
      hasNextPage
    }
    media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: START_DATE) {
      id
      title {
        english(stylised: true)
        romaji(stylised: true)
        native(stylised: true)
      }
      characters(page: 1, perPage: 25) {
        pageInfo {
          total
          perPage
          currentPage
          lastPage
          hasNextPage
        }
        edges { # Array of character edges
          role
          voiceActors (language: JAPANESE) {
            id
            name {
              full
            }
            image {
              large
            }
            siteUrl
          }
          node { # Need to add this as a workaround in order to load in the relational data for each voiceActors element.
            id
            name {
              full
              native
            }
          }
        }
      }
    }
  }
}
`;

// Define our query variables and values that will be used in the query request
const mediaVariables = {
  seasonYear: 2021,
  season: "WINTER",
};

const charactersQuery: string = `
query ($page: Int, $id: Int) {
  Media(id: $id) {
    id
    title {
      english(stylised: true)
      romaji(stylised: true)
      native(stylised: true)
    }
    characters(page: $page, perPage: 25) {
      pageInfo {
        total
        perPage
        currentPage
        lastPage
        hasNextPage
      }
      edges {
        role
        voiceActors (language: JAPANESE) {
          id
          name {
            full
          }
          image {
            large
          }
          siteUrl
        }
        node { # Need to add this as a workaround in order to load in the relational data for each voiceActors element.
          id
          name {
            full
            native
          }
        }
      }
    }
  }
}
`;

const charactersVariables = {
  page: 1,
  id: 110277
};

// Define the config we'll need for our Api request
const url = "https://graphql.anilist.co";

function makeOptions(query, variables){
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  };
}

interface depaginateMediaArgs {
  url: string,
  query: string,
  variables: any,
  firstPageOnly?: boolean,
}

async function depaginateMedia({
  url,
  query,
  variables,
  firstPageOnly = false,
}: depaginateMediaArgs){
  const explicitPage = variables.page ?? 1;

  const response = await fetch(
    url,
    makeOptions(
      query,
      {
        ...variables,
        page: explicitPage,
      }
    ),
  );

  const json = await response.json();
  if(!response.ok){
    return Promise.reject(json);
  }

  // console.log(json);
  const { pageInfo, media } = json.data.Page;
  const { total, perPage, currentPage, lastPage, hasNextPage } = pageInfo;

  console.log(`[depaginateMedia] media id: ${variables.id}; Page ${currentPage} / ${lastPage} (${perPage} media per page / ${total} total); hasNextPage: ${hasNextPage}`);

  if(!hasNextPage || firstPageOnly){
    return { media };
  }

  // Wait 125 ms just to go easy on their servers.
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 125));

  const depaginated = await depaginateMedia({
    url,
    query,
    variables: {
      ...variables,
      page: explicitPage + 1,
    },
  });

  return {
    media: [...media, ...depaginated.media],
  };
}

interface depaginateCharactersArgs {
  url: string,
  query: string,
  variables: any, 
  firstPageOnly?: boolean,
}

async function depaginateCharacters({
  url,
  query,
  variables,
  firstPageOnly = false,
}: depaginateCharactersArgs){
  const explicitPage = variables.page ?? 1;

  const response = await fetch(
    url,
    makeOptions(
      query,
      {
        ...variables,
        page: explicitPage,
      }
    ),
  );

  const json = await response.json();
  if(!response.ok){
    return Promise.reject(json);
  }

  // console.log(json);
  const { pageInfo, edges } = json.data.Media.characters;
  const { total, perPage, currentPage, lastPage, hasNextPage } = pageInfo;

  console.log(`[depaginateCharacters] media id: ${variables.id}; characters page ${currentPage} / ${lastPage} (${perPage} edges per page / ${total} total); hasNextPage: ${hasNextPage}`);

  if(!hasNextPage || firstPageOnly){
    return { edges };
  }

  // Wait 125 ms just to go easy on their servers.
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 125));

  const depaginated = await depaginateCharacters({
    url,
    query,
    variables: {
      ...variables,
      page: explicitPage + 1,
    },
  });

  return {
    edges: [...edges, ...depaginated.edges],
  };
}

export type MediaSeason = "WINTER"|"SPRING"|"SUMMER"|"FALL";

interface queryArgs {
  quick?: boolean,
  variables: {
    seasonYear: number,
    season?: MediaSeason,
  },
  progressMonitor?: EventEmitter,
}

export async function query({ quick, variables, progressMonitor }: queryArgs): Promise<QueryResult> {
  // Make the HTTP Api request
  return depaginateMedia({ url, query: mediaQuery, variables, firstPageOnly: quick })
  .then(async (payload) => {
    // console.log(payload);
    const { media } = payload;

    // Emit 0% progress update, now that progress has become definite.
    progressMonitor?.emitEvent("update", [0, media.length]);
  
    const showsMap = new Map<string, ShowSummary>();
    const voiceActorsMap = new Map();
  
    console.log("Shows this season:", media.length);
  
    const deepDepaginatedMedia = JSON.parse(JSON.stringify(media));
  
    await deepDepaginatedMedia.reduce(
      (acc, medium, i, arr) => {
        return acc.then(() => {
          const progressNumerator = (i + 1);
          const { id, title, characters } = medium;
          const { total, perPage, currentPage, lastPage, hasNextPage } = characters.pageInfo;
    
          console.log(`[deepDepaginatedMedia.reduce 1] media id: ${id}; characters page ${currentPage} / ${lastPage} (${perPage} edges per page / ${total} total); hasNextPage: ${hasNextPage}`);
    
          delete characters.pageInfo;
  
          if(!hasNextPage){
            progressMonitor?.emitEvent("update", [progressNumerator, arr.length]);
            return;
          }
    
          return depaginateCharacters({
            url,
            query: charactersQuery,
            variables: {
              id,
              page: 1,
            },
            firstPageOnly: quick,
          })
          .then((depaginatedCharacters) => {
            console.log(`[deepDepaginatedMedia.reduce 2] media id: ${id}; characters page ${currentPage} / ${lastPage} (${perPage} edges per page / ${total} total); hasNextPage: ${hasNextPage}`);
  
            characters.edges = depaginatedCharacters.edges;

            progressMonitor?.emitEvent("update", [progressNumerator, arr.length]);
          });
        });
      },
      Promise.resolve(),
    );
  
    // console.log("deepDepaginatedMedia", deepDepaginatedMedia);
  
    const mediaWithCharactersData = deepDepaginatedMedia.filter((medium) => medium.characters.edges.length > 0);
  
    console.log(`Shows this season for which character info is available: ${mediaWithCharactersData.length} / ${deepDepaginatedMedia.length}`);
  
    mediaWithCharactersData.forEach((medium) => {
      const { id, title, characters } = medium;
      const { english, romaji, native } = title;
      const preferredTitle = english ?? romaji ?? native ?? "[Title missing]";
  
      const show: ShowSummary = {
        preferredTitle,
        seiyuus: {},
      };
      showsMap.set(id, show);
  
      characters.edges.forEach((character) => {
        const { role, voiceActors, node: { id: characterId, name: characterName } } = character;
  
        const distinctVoiceActorsForCharacter = new Set();
  
        voiceActors.forEach((voiceActor) => {
          const { id, name: { full: fullName }, image: { large: image }, siteUrl } = voiceActor;

          const alreadyVisited = distinctVoiceActorsForCharacter.has(id);
          if(alreadyVisited){
            // Guard against their duplicates problem
            return;
          }

          if(!show.seiyuus[id]){
            show.seiyuus[id] = [];
          }
          show.seiyuus[id].push({
            role: role ?? "UNCLASSIFIED",
            name: characterName?.full ?? characterName?.native ?? "[Name missing]",
          });
  
          const existingEntry = voiceActorsMap.get(id);
          if(existingEntry){
            existingEntry.allRoles++;
            if(role === "MAIN"){
              existingEntry.mainRoles++;
            } else if (role === "SUPPORTING"){
              existingEntry.supportingRoles++;
            } else if (role === "BACKGROUND"){
              existingEntry.backgroundRoles++;
            } else {
              existingEntry.unclassifiedRoles++;
            }
            existingEntry.shows.push(id);
            return;
          }
          voiceActorsMap.set(id, {
            mainRoles: role === "MAIN" ? 1 : 0,
            supportingRoles: role === "SUPPORTING" ? 1 : 0,
            backgroundRoles: role === "BACKGROUND" ? 1 : 0,
            unclassifiedRoles: (role !== "MAIN" && role !== "SUPPORTING" && role !== "BACKGROUND") ? 1 : 0,
            allRoles: 1,
  
            fullName,
            image,
            siteUrl,
            shows: [id],
          });
        });
      });
    });
  
    const seiyuuSummaries: SeiyuuSummary[] = [...voiceActorsMap].map(voiceActor => {
      const id = voiceActor[0];
      const {
        mainRoles,
        supportingRoles,
        backgroundRoles,
        unclassifiedRoles,
        allRoles,
  
        fullName,
        image,
        siteUrl,
        shows,
      } = voiceActor[1];
      
      return {
        id,
  
        mainRoles,
        supportingRoles,
        backgroundRoles,
        unclassifiedRoles,
        allRoles,
  
        fullName,
        image,
        siteUrl,
        showIds: shows,
      };
    });
  
    // console.table(seiyuus);

    return {
      seiyuuSummaries,
      shows: [...showsMap].reduce(
        (acc, entry, i) => {
          const [key, value] = entry;
          acc[key] = value;
          return acc;
        },
        {},
      )
    };
  })
  .catch((error) => {
    console.error(error);
  });
}

export interface SeiyuuSummary {
  id: string,
  
  mainRoles: number,
  supportingRoles: number,
  backgroundRoles: number,
  unclassifiedRoles: number,
  allRoles: number,

  fullName?: string,
  image?: string,
  siteUrl?: string,
  showIds: number[],
}

export interface ShowsSummary {
  [id: string]: ShowSummary,
}

interface ShowSummary {
  preferredTitle: string,
  seiyuus: Record<string, Character[]>,
}

interface Character {
  role: "MAIN"|"SUPPORTING"|"BACKGROUND"|"UNCLASSIFIED",
  name: string,
}

export interface QueryResult {
  seiyuuSummaries: SeiyuuSummary[],
  shows: ShowsSummary,
}