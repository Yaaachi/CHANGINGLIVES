# Changing Lives Foundation — Static GitHub edition

All images are in the root directory. Upload all files to the repository root and enable GitHub Pages (Settings → Pages), or deploy to Netlify.

## Editing events without a backend
Only authorised GitHub collaborators can edit `events.json`. Use the GitHub website to edit it and commit. Upload event posters to the repository root. An example entry:

```json
[
  {
    "id": "example-2026",
    "title": "Community gathering",
    "date": "2026-11-20",
    "location": "Gqeberha",
    "description": "Details of the gathering.",
    "image": "poster.jpg",
    "rsvp": "https://example.com/register"
  }
]
```

The file is empty by default because no upcoming events were confirmed. Commit edits and wait for deployment. GitHub manages authentication and permissions. The Admin page explains the process. The old Node.js files remain for reference only; they are not needed for the static site.

## Contact form
The form uses FormSubmit, which requires recipient email verification. Test delivery after publishing.

## Editorial accuracy
Content is adapted from the provided organisational profile. The site does not present unverified impact counts as audited results. Confirm preferred contact numbers, formal partner statuses, and any new programme claims before publication.

## Transparent branding refresh
The previous opaque JPG logos have been replaced by the five supplied transparent PNGs, stored in the repository root:
`changing-lives-logo.png`, `makhanda-youth-logo.png`, `umhlobo-wenene-logo.png`, `sakoh-media-logo.png`, and `sabc-logo.png`.

Brand marks shown alongside projects reflect appearances in supplied materials, **not necessarily formal sponsorships or endorsements**. Confirm relationships before describing them as partnerships.

The static admin workflow uses GitHub collaborator access to edit `events.json`; there is no secure client-side PIN-only login without a trusted authentication service.
