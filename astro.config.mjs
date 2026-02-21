// @ts-check

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';

import { defineConfig } from 'astro/config';


// https://astro.build/config
export default defineConfig({
  site: 'https://cartoonbeats.com',
  integrations: [
    mdx(), 
    sitemap(), 
    react(),
    // partytown used for Google Analytics
    partytown({
      config: {
        forward: ['dataLayer.push'],
      },
    }),
  ],
});