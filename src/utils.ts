import { Context } from "hono";
import { getConnInfo } from "hono/cloudflare-workers";

export function generateRandomSlug(length: number = 4): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from(
        { length },
        () => chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
}

export async function getPayload(c: Context) {
    const contentType = c.req.header('Content-Type');

    if (contentType?.includes('application/json')) {
        return await c.req.json();
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
        const formData = await c.req.parseBody();
        return {
            slug: formData.slug as string,
            url: formData.url as string,
            overwrite: formData.overwrite === 'true'
        };
    }

    throw new Error('Unsupported Content-Type');
}

export function cfData(c: Context) {
    const request = c.req;
    const cf = request.raw.cf;

    return {
        continent: cf?.continent,
        country: cf?.country,
        region: cf?.region,
        city: cf?.city,
        as: cf?.asOrganization,
        ua: request.header('User-Agent'),
        ref: request.header('Referer'),
        q: request.query(),	
        ip: getConnInfo(c).remote.address,
    }
}