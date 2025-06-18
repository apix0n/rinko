import { Context } from "hono";

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
