# Xiaoying Ye｜Portfolio publish copy

This directory is the self-contained static publish copy for the single-page portfolio. It is intentionally framework-free and contains no Wix runtime, external fonts, CDN, analytics, or project-private files.

The visible page is `index.html`: Hero, Selected Motion, Other Works, Seasonal Posters, and a minimal footer. The only navigation labels are `HOME` and `WORK`. Legacy `additional-works/`, `about/`, and `contact/` paths keep relative fallbacks into the matching root section.

The `assets/seasonal/` files are derived from five read-only GIF sources. Each MP4 is silent H.264 `yuv420p` with fast start metadata, keeps the source portrait ratio, has a longest edge no higher than 1080px, and is below 25 MiB. PNG files are the extracted first-frame posters. `F26 bg_edited.jpg` is not used.

Upload the contents of this directory as a static site. This local copy keeps its `.git` repository; syncing files here does not commit, push, or deploy anything.
