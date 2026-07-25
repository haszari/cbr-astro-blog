import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

// Common metadata shared by all content types
const commonMetadata = z.object({
	title: z.string(),
	teaser: z.string().optional(),
});

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		commonMetadata.extend({
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			headerImage: image().optional(),
			bluesky: z.object({
				uri: z.string(),
				url: z.string(),
				// CID intentionally omitted — uri is sufficient for dedup.
				// Add cid field later if edit detection is needed.
			}).optional(),
		}),
});

const radio = defineCollection({
	loader: glob({ base: './src/content/radio', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		commonMetadata.extend({
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			listenUrl: z.string().url().optional(),
			tracklist: z.array(z.union([
				z.string(),
				z.object({ artist: z.string(), title: z.string() }),
			])).optional(),
			bluesky: z.object({
				uri: z.string(),
				url: z.string(),
			}).optional(),
			heroImage: image().optional(),
			headerImage: image().optional(),
		}),
});

// TODO could validate many of these as URLs, even verify domain.

const releases = defineCollection({
  loader: file("src/content/data/releases.yml"),
  schema: ({ image }) => 
		commonMetadata.extend({
			artist: z.string(),
			releaseDate: z.coerce.date(),
			cover: image().optional(),
			colours: z.object({
				background: z.string().optional(),
				text: z.string().optional(),
				accent: z.string().optional(),
				accentText: z.string().optional(),
			}).optional(),

			listenLinks: z.object({
				soundcloud: z.string().optional().or(z.null()),
				bandcamp: z.string().optional().or(z.null()),
				youtube: z.string().optional().or(z.null()),
				beatport: z.string().optional().or(z.null()),
				spotify: z.string().optional().or(z.null()),
				apple: z.string().optional().or(z.null()),
			}).optional(),

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
				residentadvisor: z.string().optional().or(z.null()),
				
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
				propel: z.string().optional().or(z.null()),

			})
		})
});


const nzArtists = defineCollection({
  loader: file("src/content/data/nz-artists.yml"),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    lastReleaseYear: z.coerce.number().optional(),
    styles: z.array(z.string()).optional(),
    bandcamp: z.string().optional(),
    related: z.array(z.string()).optional(),
    aliases: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional(),
    links: z.object({
      bandcamp: z.string().optional(),
      soundcloud: z.string().optional(),
      spotify: z.string().optional(),
      youtube: z.string().optional(),
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      chain: z.string().optional(),
    }).optional(),
  }),
});

export const collections = { 
	blog,
	radio,
	releases,
	artists,
	nzArtists
};
