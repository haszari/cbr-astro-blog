// @ts-check

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import { defineConfig } from 'astro/config';


// https://astro.build/config
export default defineConfig({
    site: 'https://haszari.github.io',
    base: '/cbr-astro-blog',
    integrations: [mdx(), sitemap(), react()],
});