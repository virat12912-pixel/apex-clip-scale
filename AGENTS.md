# Technical decisions

- Keep live social-profile link and follower checks in an authenticated edge function scoped to verified account records, so client-supplied profile claims are not trusted.
- Keep accepted-budget arithmetic in a pure shared edge-function helper so approval and scheduled refresh enforce the same accepted-only spending rule.