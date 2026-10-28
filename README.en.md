# CS2 Chicken Album Filename Generator

Generate copyable library filenames for custom JPG images using the publicly extracted CS2 pet album rules.

[Use online](https://steam.pet/cs2-pet-album/) · [简体中文](./README.md)

## Features

- Choose a growth stage, album requirement, and any available map, pose, or action. The default is a chick close-up.
- Paste an existing library filename to preserve its timestamp and unrelated tags, changing only the selected requirement and explicitly edited fields.
- Choose from seven aspect ratios, review changed tags, copy the result, and generate a new timestamp.
- Validate filenames and tag values strictly. A `book_` filename prompts the user to move the photo back to the library; invalid input produces no result.

## Usage

Double-click `index.html` to run it offline in a browser. The page uses native HTML, CSS, and JavaScript, with all styles and logic in one file. No backend, image upload, or dependency installation is needed.

Development and builds require Node.js 22 or later:

```bash
npm test
npm run build
npm run sync:site
```

`npm test` verifies filename rules with `node --test`. `npm run build` creates `dist/index.html`. `npm run sync:site` copies that file to `../steam.pet/cs2-pet-album/index.html` in the adjacent repository. Production uses the existing `steam.pet` `main` → Cloudflare Workers Builds workflow, without a separate Worker.

## Notes

Exit the game and make a backup before placing an actual JPG image, renamed to the generated filename, in the pet's `library` folder. Reopen the game and drag it into the album. Tags affect album recognition; they do not alter the image or the chicken's actual age. Use a different timestamp for every image. Keep backups outside the pet directory and avoid duplicate timestamps in `library/book`.

All filename processing happens locally in the browser. Images are neither read nor uploaded. Fire, electrocution, and C4 incident report achievement pages are excluded from ordinary photo naming options.

Rules reference SteamTracking's publicly extracted [album page script](https://raw.githubusercontent.com/SteamTracking/GameTracking-CS2/master/game/csgo/pak01_dir/panorama/scripts/popups/pet_book_pages.js) and [photo tag script](https://raw.githubusercontent.com/SteamTracking/GameTracking-CS2/master/game/csgo/pak01_dir/panorama/scripts/popups/pet_photo_tag.js). Filenames follow the current public scripts. Adding photos for a different growth stage has not been tested in-game, and future versions may change the rules.

## License

This is an unofficial tool with no open-source license. All rights to the original implementation are reserved. Repository access or public availability of the page does not grant permission to copy, modify, or redistribute it. Steam, Counter-Strike, game names, rules, and other third-party content remain subject to their respective rights and terms.
