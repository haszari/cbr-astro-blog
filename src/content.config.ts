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
			headerImage: image().optional(),
		}),
});

// TODO could validate many of these as URLs, even verify domain.

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

const artists = defineCollection({
  loader: file("src/content/data/artists.yml"),
  schema: ({ image }) => 
		z.object({
			name: z.string(),
			socialLinks: z.object({
				soundcloud: z.string().optional().or(z.null()),
				bandcamp: z.string().optional().or(z.null()),
				youtube: z.string().optional().or(z.null()),
				beatport: z.string().optional().or(z.null()),
				spotify: z.string().optional().or(z.null()),
				apple: z.string().optional().or(z.null()),
				
				bluesky: z.string().optional().or(z.null()),
				instagram: z.string().optional().or(z.null()),
				tiktok: z.string().optional().or(z.null()),
				facebook: z.string().optional().or(z.null()),
				mastodon: z.string().optional().or(z.null()),
				gravatar: z.string().optional().or(z.null()),
				twitterx: z.string().optional().or(z.null()),
				tumblr: z.string().optional().or(z.null()),
				threads: z.string().optional().or(z.null()),
				linkedin: z.string().optional().or(z.null()),

				mixcloud: z.string().optional().or(z.null()),

			})
		})
});


export const collections = { 
	blog,
	releases,
	artists
};
