import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string().optional(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
		}),
});

const releases = defineCollection({
  loader: file("src/content/data/releases.yml"),
  schema: ({ image }) => 
		z.object({
			artist: z.string(),
			title: z.string(),
			releaseDate: z.coerce.date(),
			cover: image().optional(),

			listenLinks: z.object({
				soundcloud: z.string().optional().or(z.null()),
				bandcamp: z.string().optional().or(z.null()),
				youtube: z.string().optional().or(z.null()),
				beatport: z.string().optional().or(z.null()),
				spotify: z.string().optional().or(z.null()),
				apple: z.string().optional().or(z.null()),
			}),

			description: z.string().optional(),
			blurb: z.string().optional(),
		})
});

export const collections = { 
	blog,
	releases
};
