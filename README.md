# rinko (りんこ)

a url shortener built on the [cloudflare developer platform](https://developers.cloudflare.com) (workers & kv).

this is a rebuild of [shrty.dev](https://github.com/craigsdennis/shorty-dot-dev) without all the ai shit (a chatbot as admin panel and an ai-generated favicon like-?).

## link management

> ### to manage your links, go to `/_` or click on "admin panel".

> in local development, the api is protected by the token specified in `.dev.vars`.
>
> when deploying, use the cloudflare dashboard or `wrangler` to add an `API_SECRET` environment variable to your worker. [worker secrets / cloudflare docs >](https://developers.cloudflare.com/workers/configuration/secrets/#secrets-on-deployed-workers)

---

### `/_/set` | `POST`

> this endpoint accepts both `application/json` & `application/x-www-form-urlencoded` payloads.

#### options / parameters

* `slug`: the short link itself; if you put `123` as slug, you'd go to `{rinko url}/123`. if empty or not given, it creates a random 4-character slug.
* `url`: the destination link.
* `overwrite: true/false`: if true, overwrites the link if there was one. if no `url` given, it deletes the specified short link.

#### curl examples

```bash
$ curl {rinko url}/_/set -d "url=https://google.com" -H "Authorization: Bearer {api token}"
{"slug":"oNcK","url":"https://google.com","link":"/oNcK"}
```

```bash
$ curl {rinko url}/_/set -d "url=https://google.com&slug=google" -H "Authorization: Bearer {api token}"
{"slug":"google","url":"https://google.com","link":"/google"}

$ curl {rinko url}/_/set -d "url=https://google.co.jp&slug=google" -H "Authorization: Bearer {api token}" 
{"slug":"google","url":"https://google.com","link":"/google","message":"Did not update google because it already was pointing to https://google.com and overwrite was set to false."}

$ curl {rinko url}/_/set -d "url=https://google.co.jp&slug=google&overwrite=true" -H "Authorization: Bearer {api token}"
{"slug":"google","url":"https://google.co.jp","link":"/google"}
```

```bash
$ curl {rinko url}/_/set -d "slug=google&overwrite=true" -H "Authorization: Bearer {api token}"
{"slug":"google","message":"Deleted link google"}
```

---

### `/_/set` | `GET`

* returns the list of all short links with their destinations.

```json
[
    {
        "slug": "github",
        "url": "https://github.com/apix0n"
    },
	{
		"slug": "yt",
		"url": "https://www.youtube.com/watch?v=shs0rAiwsGQ"
	},
	{
		"slug": "google",
		"url": "https://google.com"
	}
]
```

---

### reserved links

*  `_/` and links beginning with `_/` (like `_/anything`),
*  `index.html`,
*  `favicon.ico` & `favicon.png`

## host your own

### setup

```bash
npm install
```

* create a new `kv` service to keep the links:

```bash
npx wrangler kv namespace create LINKS
```

* replace the `kv_namespaces` section of the `wrangler.jsonc` file
* copy the [.dev.vars.example](./.dev.vars.example) to `.dev.vars` (for local development) and change the values
* regenerate types:

```bash
npm run cf-typegen
```

## develop

```bash
npm run dev
```

## deploy

```bash
npm run deploy
```

### made by [apix](https://github.com/apix0n) with ❤️