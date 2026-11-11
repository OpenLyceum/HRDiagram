# Credits — HR Diagram

An interactive Hertzsprung–Russell diagram built on real Gaia and Hipparcos stars.

## License

GNU Affero General Public License v3.0 or later — see [org LICENSE](https://github.com/OpenLyceum/.github/blob/main/LICENSE).
The bundled star data keep their own licences, listed below.

## Acknowledgments

Built with [SceneryStack](https://scenerystack.org/) as part of the
[OpenLyceum](https://github.com/OpenLyceum) fleet.

# Data credits

The sim bundles a frozen snapshot of public star catalogues. `npm run fetch-data`
(`scripts/catalog/fetch-catalog.ts`) refreshes it. The retrieval date is stored in each JSON file under
`src/common/model/data/` and shown in the sim.

## Gaia

This work has made use of data from the European Space Agency (ESA) mission Gaia
(https://www.cosmos.esa.int/gaia), processed by the Gaia Data Processing and Analysis Consortium (DPAC,
https://www.cosmos.esa.int/web/gaia/dpac/consortium). Funding for the DPAC has been provided by national
institutions, in particular the institutions participating in the Gaia Multilateral Agreement.

- Gaia Collaboration, Smart, R. L., et al. 2021, *Gaia Early Data Release 3: The Gaia Catalogue of Nearby
  Stars*, A&A 649, A6. This is the 100 pc sample and the stars within 10 pc.
- Gaia Collaboration, Vallenari, A., et al. 2023, *Gaia Data Release 3: Summary of the content and survey
  properties*, A&A 674, A1. This supplies the DR3 parallaxes of Hipparcos stars and the Hipparcos–Gaia
  cross-match.

Gaia data are released under CC BY-SA 3.0 IGO.

## Hipparcos

- ESA 1997, *The Hipparcos and Tycho Catalogues*, ESA SP-1200. This supplies V, B−V and spectral types.
- van Leeuwen, F. 2007, *Validation of the new Hipparcos reduction*, A&A 474, 653. This supplies parallaxes.

Both were queried through the ESA Gaia archive.

## Star names

- IAU Catalog of Star Names, IAU Division C Working Group on Star Names (WGSN),
  https://www.iau.org/public/themes/naming_stars/ (CC BY 4.0).
- HYG database v4.1, D. Nash (astronexus), https://github.com/astronexus/HYG-Database (CC BY-SA 4.0).
  Only its Bayer, Flamsteed and Gliese designations are used.

## Reference sequences

- Pecaut, M. J., & Mamajek, E. E. 2013, ApJS 208, 9, and E. Mamajek's online table *A Modern Mean Dwarf
  Stellar Color and Effective Temperature Sequence* (version 2022.04.16). These give temperatures,
  colours, bolometric corrections and the main sequence.
- Bédard, A., Bergeron, P., Brassard, P., & Fontaine, G. 2020, ApJ 901, 93, and the Montreal white dwarf
  cooling tables (https://www.astro.umontreal.ca/~bergeron/CoolingModels/). These give the 0.6 M☉
  pure-hydrogen white dwarf sequence.

## Inspiration

The screens follow the NAAP *Hertzsprung–Russell Diagram* lab and its *HR Diagram Explorer*
(University of Nebraska–Lincoln Astronomy Education group).
