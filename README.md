# Snek

**Implementation of the best NFT marketplace with locked balances.**


## Prerequisites

* node 16.x
* docker

## Quickly running the sample

```bash
# 1. Install dependencies
npm ci

# 2. Compile typescript files
npm run build

# 3. Start target Postgres database
docker compose up -d

# 4. Apply database migrations from db/migrations
npx sqd db create
npx sqd db migrate

# 5. Now start the processor
node -r dotenv/config lib/processor.js

# 6. The above command will block the terminal
#    being busy with fetching the chain data, 
#    transforming and storing it in the target database.
#
#    To start the graphql server open the separate terminal
#    and run
npx squid-graphql-server

# 7. Now you can see the resuls by visiting the localhost:4350/graphql
```

## Dev flow

### 1. Define database schema

Start development by defining the schema of the target database via `schema.graphql`.
Schema definition consists of regular graphql type declarations annotated with custom directives.
Full description of `schema.graphql` dialect is available [here](https://docs.subsquid.io/schema-spec).

### 2. Generate TypeORM classes

Mapping developers use TypeORM [EntityManager](https://typeorm.io/#/working-with-entity-manager)
to interact with target database during data processing. All necessary entity classes are
generated by the squid framework from `schema.graphql`. This is done by running `npx sqd codegen`
command.

### 3. Generate database migration

All database changes are applied through migration files located at `db/migrations`.
`sqd(1)` tool provides several commands to drive the process.
It is all [TypeORM](https://typeorm.io/#/migrations) under the hood.

```bash
# Connect to database, analyze its state and generate migration to match the target schema.
# The target schema is derived from entity classes generated earlier.
npx sqd db create-migration

# Create template file for custom database changes
npx sqd db new-migration

# Apply database migrations from `db/migrations`
npx sqd db migrate

# Revert the last performed migration
npx sqd db revert

# DROP DATABASE
npx sqd db drop

# CREATE DATABASE
npx sqd db create            
```

### 4. Generate TypeScript definitions for substrate events and calls

This is an optional part, but it is very advisable. 

Event and call data comes to mapping handlers as a raw untyped json. 
Not only it is unclear what the exact structure of a particular event or call is, but
it can also rather frequently change over time.

Squid framework provides tools for generation of type-safe, spec version aware wrappers around
events and calls.

The end result looks like this:

```typescript
/**
 * Normalized `balances.Transfer` event data
 */
interface TransferEvent {
    from: Uint8Array
    to: Uint8Array
    amount: bigint
}

function getTransferEvent(ctx: EventHandlerContext): TransferEvent {
    // instanciate type-safe facade around event data
    let event = new BalancesTransferEvent(ctx)
    if (event.isV1020) {
        let [from, to, amount, fee] = event.asV1020
        return {from, to, amount}
    } else if (event.isV1050) {
        let [from, to, amount] = event.asV1050
        return {from, to, amount}
    } else {
        // This cast will assert, 
        // that the type of a given event matches
        // the type of generated facade.
        return event.asLatest
    }
}
```

Generation of type-safe wrappers for events and calls is currently a two-step process.

First, you need to explore the chain to find blocks which introduce new spec version and
fetch corresponding metadata. 

```bash
npx squid-substrate-metadata-explorer \
  --chain wss://kusama-rpc.polkadot.io \
  --archive https://kusama.indexer.gc.subsquid.io/v4/graphql \
  --out kusamaVersions.json
```

In the above command `--archive` parameter is optional, but it speeds up the process
significantly. From scratch exploration of kusama network without archive takes 20-30 minutes.

You can pass the result of previous exploration to `--out` parameter. In that case exploration will
start from the last known block and thus will take much less time.

After chain exploration is complete you can use `squid-substrate-typegen(1)` to generate 
required wrappers.

```bash
npx squid-substrate-typegen typegen.json
```

Where `typegen.json` config file has the following structure:

```json5
{
  "outDir": "src/types",
  "chainVersions": "kusamaVersions.json", // the result of chain exploration
  "typesBundle": "kusama", // see types bundle section below
  "events": [ // list of events to generate
    "balances.Transfer"
  ],
  "calls": [ // list of calls to generate
    "timestamp.set"
  ]
}
```

## Project conventions

Squid tools assume a certain project layout.

* All compiled js files must reside in `lib` and all TypeScript sources in `src`. 
The layout of `lib` must reflect `src`.
* All TypeORM classes must be exported by `src/model/index.ts` (`lib/model` module).
* Database schema must be defined in `schema.graphql`.
* Database migrations must reside in `db/migrations` and must be plain js files.
* `sqd(1)` and `squid-*(1)` executables consult `.env` file for a number of environment variables.

## Types bundle

Substrate chains which have blocks with metadata versions below 14 don't provide enough 
information to decode their data. For those chains external 
[type definitions](https://polkadot.js.org/docs/api/start/types.extend) are required.

Type definitions (`typesBundle`) can be given to squid tools in two forms:

1. as a name of a known chain (currently only `kusama`)
2. as a json file of a structure described below.

```json5
{
  "types": {
    "AccountId": "[u8; 32]"
  },
  "typesAlias": {
    "assets": {
      "Balance": "u64"
    }
  },
  "versions": [
    {
      "minmax": [0, 1000], // block range with inclusive boundaries
      "types": {
        "AccountId": "[u8; 16]"
      },
      "typesAlias": {
        "assets": {
          "Balance": "u32"
        }
      }
    }
  ]
}
```

* `.types` - scale type definitions similar to [polkadot.js types](https://polkadot.js.org/docs/api/start/types.extend#extension)
* `.typesAlias` - similar to [polkadot.js type aliases](https://polkadot.js.org/docs/api/start/types.extend#type-clashes)
* `.versions` - per-block range overrides/patches for above fields.

All fields in types bundle are optional and applied on top of a fixed set of well known
frame types.

## Differences from polkadot.js

Polkadot.js provides lots of [specialized classes](https://polkadot.js.org/docs/api/start/types.basics) for various types of data. 
Even primitives like `u32` are exposed through special classes.
In contrast, squid framework works only with plain js primitives and objects.
This allows to decrease coupling and also simply dictated by the fact, that
there is not enough information in substrate metadata to distinguish between 
interesting cases.

Account addresses is one example where such difference shows up.
From substrate metadata (and squid framework) point of view account address is simply a fixed length
sequence of bytes. On other hand, polkadot.js creates special wrapper for account addresses which 
aware not only of address value, but also of its 
[ss58](https://docs.substrate.io/v3/advanced/ss58/) formatting rules.
Mapping developers should handle such cases themselves.

## Graphql server extensions

It is possible to extend `squid-graphql-server(1)` with custom
[type-graphql](https://typegraphql.com) resolvers and to add request validation.
More details will be added later.

## Archival nodes

Because subsquid requires an archival indexer to be fast, there are currently 3 options how to do it:

1. Leave it as it is

there is already indexer for base basilisk

2. using archival node for Koda BSX Sandbox :snake:

```.env
ARCHIVE_URL=https://basilisk-test.indexer.gc.subsquid.io/v4/graphql
```

3. running your own

```bash
git clone git@github.com:subsquid/squid-archive-setup.git;
cd squid-archive-setup/basilisk
```

in `docker-compose.yml` set url for the chain

```
-      - WS_PROVIDER_ENDPOINT_URI=wss://basilisk.api.onfinality.io/public-ws
+      - WS_PROVIDER_ENDPOINT_URI=wss://basilisk-kodadot.hydration.cloud
```

then just

```bash
docker compose up
```

and set 

```.env
ARCHIVE_URL=http://localhost:4010/v1/graphql
```






