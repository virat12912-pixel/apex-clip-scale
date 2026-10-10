# Technical decisions

- Keep live social-profile link and follower checks in an authenticated edge function scoped to verified account records, so client-supplied profile claims are not trusted.