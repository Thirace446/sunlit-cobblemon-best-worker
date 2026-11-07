# Sunlit Cobblemon · Best Worker

[简体中文](README.md) | [English](README.en.md)

<p align="center">
  <a href="https://thirace446.github.io/sunlit-cobblemon-best-worker/">
    <img src="https://img.shields.io/badge/Online%20Demo-Open%20Site-2563eb?style=for-the-badge" alt="Online demo">
  </a>
</p>

A best-worker lookup page for the **Society: Sunlit Cobblemon** modpack.

Pure static HTML with no backend or database. Player data is parsed and stored locally in the browser; this site does not host game files.

## Features

- Find the best workers for the Craft Station, Gardening Station, Mystery Mine, Crystal Ball, and Energy Pylon
- Filter by Pokémon Type, Actual Role, and Recipe Type
- Simulate Level, Individual Value (IV), Effort Value (EV), Nature, and Shiny
- Score, Speed Multiplier, Expected Yield, Range, and training advice
- English / Chinese / Korean interface
- Light / dark theme
- In-browser virtual scrolling for all 1337 entries

## For players

1. Open the GitHub Pages site root.
2. On first use, you will see the **Import modpack data** page.
3. The site currently supports only this modpack version:

```text
1.1.4-SSV4.1.5A
```

4. Download the modpack zip and the two mod jars listed by the page from CurseForge:
   - Sunlit Cobblebackported
   - Cobblemon Farmers
5. Drop the zip and both jars into the import page, then click **Parse and open site**.

Imported data is stored in the current browser's `localStorage`. Closing the page does not reset it; switching browsers or devices, or clearing site data, requires importing again.

## Local development

```powershell
npm run serve
```

Or double-click `start-server.bat`, then open:

```text
http://localhost:4173/
```

## Deployment

Deploy the site as static files on GitHub Pages. No build command or GitHub Actions is required.

- `index.html`: opens the lookup page when data is imported, otherwise the import page
- `.nojekyll`: skips Jekyll and publishes files as-is
- `.gitignore`: excludes local caches, release packages, and data generated from game files

## Documentation

- [CHANGELOG.md](CHANGELOG.md): version history

## Notice

A fan-made workstation lookup tool for Society: Sunlit Cobblemon, comparing how each Pokémon performs at the five workstations.  
Data comes from the modpack files players import locally; this site does not host or distribute game files.  
All script algorithms are based on publicly available modpack data. All information is subject to actual in-game content.

Feedback: [GitHub Issues](https://github.com/Thirace446/sunlit-cobblemon-best-worker/issues)
