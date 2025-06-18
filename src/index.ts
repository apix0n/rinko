import { Context, Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth'
import { getConnInfo } from 'hono/cloudflare-workers'
import { fourZeroFourPage } from './404';
import { addLink, getLinks } from './links';
import { getPayload } from './utils';

export type Bindings = {
	[key in keyof CloudflareBindings]: CloudflareBindings[key];
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/favicon.ico', (c) => c.redirect('/favicon.png'))

app.use('/_/*', (c, next) => {
	const auth = bearerAuth({ token: c.env.API_SECRET })
	return auth(c, next);
});

function logRequest(c: Context, slug: string, url: string | null) {
	const request = c.req;
	const cf = request.raw.cf;

	console.log({
		slug,
		url,
		user: {
			continent: cf?.continent,
			country: cf?.country,
			region: cf?.region,
			city: cf?.city,
			as: cf?.asOrganization,
			ua: request.header('User-Agent'),
			ip: getConnInfo(c).remote.address,
		}
	})
}

app.post('/_/set', async (c) => {
	try {
		const payload = await getPayload(c);
		const result = await addLink(c.env, payload.slug, payload.url, payload.overwrite);
		if (Object.keys(result).length === 1 && Object.keys(result)[0] === 'message') return c.json(result, 400);
		return c.json(result);
	} catch (error) {
		return c.json({ error: 'Invalid request format' }, 400);
	}
});

app.get('/_/list', async (c) => {
	const result = await getLinks(c.env)
	return c.json(result)
})

app.all('/_/*', (c) => {
	return c.text('Not Found', 404);
})

app.get('/*', async (c) => {
	const slug = c.req.path.substring(1); // Remove leading slash
	const url = await c.env.LINKS.get(slug);
	logRequest(c, slug, url);
	if (url === null) {
		return c.status(404);
	}
	// Redirect
	return c.redirect(url);
});

app.notFound((c) => {
	return c.html(fourZeroFourPage)
})

export default app;
