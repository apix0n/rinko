# rinko (りんこ)

a url shortener built using [hono](https://hono.dev/) on the [cloudflare developer platform](https://developers.cloudflare.com) (workers & kv).

this is a rebuild of [shrty.dev](https://github.com/craigsdennis/shorty-dot-dev) without all the ai shit (a chatbot as admin panel and an ai-generated favicon like-?).

## semi-one-click deploy*

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Fapix0n%2Frinko)

using this button, you can deploy rinko to cloudflare workers, but it won't have an defined `API_SECRET`; learn more just below.

## link management

> ### to manage your links, go to `/_` or click on "admin panel".

> in local development, the api is protected by the token specified in `.dev.vars`.
>
> when deploying, you need to use the cloudflare dashboard or `wrangler` to add an `API_SECRET` environment variable to your worker. [worker secrets / cloudflare docs >](https://developers.cloudflare.com/workers/configuration/secrets/#secrets-on-deployed-workers)

---

### `/_/set` | `POST`

> this endpoint accepts both `application/json` & `application/x-www-form-urlencoded` payloads.

#### options / parameters

* `slug`: the short link itself; if you put `123` as slug, you'd go to `hxxps://[rinko]/123`. if empty or not given, it creates a random 4-character slug.
* `url`: the destination link.
* `overwrite: true/false`: if true, overwrites the link if there was one. if no `url` given, it deletes the specified short link.

#### curl examples

```bash
$ curl hxxps://[rinko]/_/set -d "url=https://google.com" -H "Authorization: Bearer {api token}"
{"slug":"oNcK","url":"https://google.com","link":"/oNcK"}
```

```bash
$ curl hxxps://[rinko]/_/set -d "url=https://google.com&slug=google" -H "Authorization: Bearer {api token}"
{"slug":"google","url":"https://google.com","link":"/google"}

$ curl hxxps://[rinko]/_/set -d "url=https://google.co.jp&slug=google" -H "Authorization: Bearer {api token}" 
{"slug":"google","url":"https://google.com","link":"/google","message":"Did not update google because it already was pointing to https://google.com and overwrite was set to false."}

$ curl hxxps://[rinko]/_/set -d "url=https://google.co.jp&slug=google&overwrite=true" -H "Authorization: Bearer {api token}"
{"slug":"google","url":"https://google.co.jp","link":"/google"}
```

```bash
$ curl hxxps://[rinko]/_/set -d "slug=google&overwrite=true" -H "Authorization: Bearer {api token}"
{"slug":"google","message":"Deleted link google"}
```

---

### `/_/list` | `GET`

* returns the list of all short links with their destinations.

```json
[
	{
		"slug": "google",
		"url": "https://google.co.jp",
		"link": "/google"
	},
	{
		"slug": "github",
		"url": "https://github.com/apix0n",
		"link": "/github"
	},
	{
		"slug": "yt/video",
		"url": "https://www.youtube.com/watch?v=shs0rAiwsGQ",
		"link": "/yt/video"
	}
]
```

---

### special links

* use `_` as a slug that matches the root page

### restricted links / cannot use

* `_/` prefixes (e.g., _/something),
* `favicon.ico`

## search

rinko can behave as a "search engine" for browsers using the format `hxxps://[rinko]/_/search?q=%s` where %s is the url encoded query, and where a space becomes a trailing slash; which redirects to `hxxps://[rinko]/query`.

to register rinko as a search engine, go to `hxxps://[rinko]/` and it should install to your browser automatically.
if it doesn't work, copy the given link and add it as a custom search engine.

### examples

* `hxxps://[rinko]/_/search?q=google` redirects to `hxxps://[rinko]/google` which itself redirects to `https://google.co.jp`
* `hxxps://[rinko]/_/search?q=github` redirects to `hxxps://[rinko]/github` which itself redirects to `https://github.com/apix0n`
* `hxxps://[rinko]/_/search?q=yt%20video` (`hxxps://[rinko]/_/search?q=yt video`) redirects to `hxxps://[rinko]/yt/video` which itself redirects to `https://www.youtube.com/watch?v=shs0rAiwsGQ`

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