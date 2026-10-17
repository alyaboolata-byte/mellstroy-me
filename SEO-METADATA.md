# Search metadata

`search-copy.mjs` runs after HTML generation. Edit `homeCopy`, `casino` and
`access` for homepage H1/title wording. Topic pages retain their own search
intent and individual titles. Homepages use the brand and casino/site terms
in the page language; Russian Mellstroy titles include both brand spellings.

The module removes guide-style positioning from rendered text and metadata,
keeps self canonicals, removes missing/nonreciprocal hreflang targets, adds
generic language fallbacks to regional tags, and emits language sitemaps.
Only real translated pages are linked. It fails the build for missing sitemap
HTML, duplicate URLs, noindex pages, missing H1/title, and stale positioning.

Approved assets, external destinations, tracking, verification, CSS selectors,
URL paths and executable scripts are preserved. A missing Bing ownership file
is generated for the connected Webmaster account.

Sitemap delivery and IndexNow acceptance are crawl notifications, not proof
of indexing or ranking. Keyword volume and top-30 rankings require separate
search-engine measurements by country/language/device.
