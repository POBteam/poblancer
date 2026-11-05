# Jobs public page

Original local `/jobs/` inspected on 26 October 2026. React preserves its heading, description, original photographic banner, two job records, employer logos, salaries, category labels, employment type and location. Original Jobs has no visible footer; this route follows that layout. Salary options remain native single-choice semantics.

`/api/public/jobs` reads the original WordPress archive through a bounded server-side parser and approved query keys. Public cache is five minutes; errors retain previous client results. No guest nonces, privileged credentials, raw markup or executable source scripts reach the frontend. Details, applications and saved jobs still use native WordPress pages. No submission, payment or webhook logic changed.

Seven Jobs categories and ten Projects categories were checked directly against local WordPress. All returned parseable results, including genuine empty results. See `category-checks-2026-10-26.json`. The browser filter panel was checked and a Lifestyle request submitted. Adapter tests cover records, original filter keys, repeated location values and numeric validation. Production build passed.

Known remaining parity work: country/state dependent loading from the original location widget is not implemented; its initial state selector remains empty as in the captured HTML. Job details and job-type archive destinations remain native. Mobile CSS exists but a full mobile visual comparison was not performed in this change. No production capacity claim is made.

Services video now has an equal 4px light blue gradient frame, no external fallback link or white header. Actual playback and computed padding verified. Projects proposal normal text verified white on navy. Shared style expectations recorded in `public-page-style-rules.md`.
