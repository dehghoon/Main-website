# Learning & Resources

The English hub lives at `/learning` in the main site's App Router. It uses the
root layout's shared Linkoteq header and account bridge. The canonical URL uses
the same www origin as the site's sitemap. The hub renders `noindex, nofollow`
during review and is reachable by direct URL for local testing.

## Local review

Use Node.js 24, which matches the production project's Node major version.
From the repository root, run the following commands.

```sh
npm install --no-package-lock
npm run typecheck
node --test tests/learning-catalog.test.ts
npm run test:marketing-seo
npm run build
npm run start -- --hostname 127.0.0.1
```

Visit [Learning & Resources](http://127.0.0.1:3000/learning). Use
[the local sitemap](http://127.0.0.1:3000/sitemap.xml) to check sitemap exclusion.
Site credentials are unnecessary for reviewing the learning catalog.

## Editorial and release steps

- Review the English copy, selected display labels, publisher links and
  jurisdiction or edition references with the content owner.
- Keep `lib/learning/catalog.ts` as the public allowlist. Review proposed
  additions as individual entries. Use publisher links and original summaries.
- Check the Knowledge Center link in the desktop menu and mobile drawer.
- Verify robots metadata, canonical URLs and the sitemap after deploying
  changes to public Learning routes.
- If each topic later has enough distinct reviewed learning content, consider
  `/learning/structural-analysis-design-loads`,
  `/learning/steel-design-connections`,
  `/learning/concrete-masonry-anchors` and
  `/learning/structural-bim-model-exchange`. Give each approved page its own
  metadata and cross-link it from the hub. Keep filters on the hub as client
  state so search combinations have one canonical route.

The hosted production hub and its public guides are indexable. The production
sitemap automatically includes new Workspace articles after publication. Preview
deployments remain noindex. The Resources Workspace appears below the resource
browser on the same page.
