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
          }
        }
      }
    }
  }
}
`;

// Define our query variables and values that will be used in the query request
const mediaVariables = {
  // id_in: [108725],
  seasonYear: 2021,
  season: "WINTER",
  page: 1,
  perPage: 50, // max
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
        }
      }
    }
  }
}
`;

const charactersVariables = {
  "page": 1,
  "id": 110277
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

async function depaginateMedia({
  url,
  query,
  variables,
}){
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

  if(!hasNextPage){
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

async function depaginateCharacters({
  url,
  query,
  variables,
}){
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

  if(!hasNextPage){
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

export async function query(): Promise<QueryResult[]> {
    // Make the HTTP Api request
    return depaginateMedia({ url, query: mediaQuery, variables: mediaVariables })
    .then(async (payload) => {
      // console.log(payload);
      const { media } = payload;
    
      const showsMap = new Map();
      const voiceActorsMap = new Map();
    
      console.log("Shows this season:", media.length);
    
      const deepDepaginatedMedia = JSON.parse(JSON.stringify(media));
    
      await deepDepaginatedMedia.reduce(
        (acc, medium) => {
          return acc.then(() => {
            const { id, title, characters } = medium;
            const { total, perPage, currentPage, lastPage, hasNextPage } = characters.pageInfo;
      
            console.log(`[deepDepaginatedMedia.reduce 1] media id: ${id}; characters page ${currentPage} / ${lastPage} (${perPage} edges per page / ${total} total); hasNextPage: ${hasNextPage}`);
      
            delete characters.pageInfo;
    
            if(!hasNextPage){
              return;
            }
      
            return depaginateCharacters({
              url,
              query: charactersQuery,
              variables: {
                ...charactersVariables,
                id,
                page: 1,
              },
            })
            .then((depaginatedCharacters) => {
              console.log(`[deepDepaginatedMedia.reduce 2] media id: ${id}; characters page ${currentPage} / ${lastPage} (${perPage} edges per page / ${total} total); hasNextPage: ${hasNextPage}`);
    
              characters.edges = depaginatedCharacters.edges;
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
        const preferredTitle = english ?? romaji ?? native ?? "[No title]";
    
        const show = {
          preferredTitle,
        };
        showsMap.set(id, show);
    
        characters.edges.forEach((character) => {
          const { role, voiceActors } = character;
    
          const distinctVoiceActorsForCharacter = new Set();
    
          voiceActors.forEach((voiceActor) => {
            const { id, name: { full: fullName }, image: { large: image }, siteUrl } = voiceActor;
            const alreadyVisited = distinctVoiceActorsForCharacter.has(id);
            if(alreadyVisited){
              // Guard against their duplicates problem
              return;
            }
    
            const existingEntry = voiceActorsMap.get(id);
            if(existingEntry){
              existingEntry.allRoles++;
              if(role === "MAIN"){
                existingEntry.mainRoles++;
              } else if (role === "SUPPORTING"){
                existingEntry.supportingRoles++;
              } else if (role === "BACKGROUND"){
                existingEntry.backgroundRoles++;
              }
              existingEntry.shows.push(id);
              return;
            }
            voiceActorsMap.set(id, {
              mainRoles: role === "MAIN" ? 1 : 0,
              supportingRoles: role === "SUPPORTING" ? 1 : 0,
              backgroundRoles: role === "BACKGROUND" ? 1 : 0,
              allRoles: 1,
    
              fullName,
              image,
              siteUrl,
              shows: [id],
            });
          });
        });
      });
    
      const sortedDesc = [...voiceActorsMap].sort((a, b) => {
        const { allRoles: countA } = a[1];
        const { allRoles: countB } = b[1];
    
        return countB - countA;
      });
    
      const summary = sortedDesc.map(voiceActor => {
        const id = voiceActor[0];
        const {
          mainRoles,
          supportingRoles,
          backgroundRoles,
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
          allRoles,
    
          fullName,
          image,
          siteUrl,
          showIds: shows,
        };
      });
    
      console.table(summary);
      return summary;
    })
    .catch((error) => {
      console.error(error);
    });
}

interface QueryResult {
    id: string,
    
    mainRoles: number,
    supportingRoles: number,
    backgroundRoles: number,
    allRoles: number,

    fullName?: string,
    image?: string,
    siteUrl?: string,
    showIds: number[],
}