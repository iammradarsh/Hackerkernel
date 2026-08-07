# Video testimonials

The home-page testimonial rail plays its clips straight from this folder. Each
`data-kind="video"` card in `index.html` names its file:

| Card                              | File                        |
| --------------------------------- | --------------------------- |
| Robert — Co-Founder of Plump      | `robert-plump.mp4`          |
| Esther Howard — SOFTIFIE          | `esther-softifie.mp4`       |
| Courtney Henry — CH Beauty        | `courtney-chbeauty.mp4`     |

Drop the files in and they start working — no code change needed. To add
another video testimonial, copy a video card in the strip, point its
`data-video` at the new file and set `.tvid__poster` to the still.

**Encoding** — H.264 / AAC in an `.mp4`, portrait 9:16 or thereabouts (the card
is 204 × 366 and crops with `object-fit: cover`). Keep them short and small;
they are fetched only when someone presses play.

Until a file exists the card falls back to its poster image and the play button
reappears, so a missing clip never leaves a dead black rectangle on the page.
