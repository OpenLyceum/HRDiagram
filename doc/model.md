# Model - HR Diagram

This document describes the model (the physics, the data and the simplifications) in terms for an
educator. It is the companion to [implementation-notes.md](./implementation-notes.md), which is for
developers.

## Overview

A Hertzsprung–Russell diagram plots stars by surface temperature (horizontal, hottest on the left)
and luminosity (vertical, most luminous at the top). A star's place on the diagram fixes its size:
a hot star of low luminosity must be small, and a cool star of high luminosity must be huge. The sim
lets students:

- place a star anywhere and read its radius;
- separate the effect of temperature from the effect of luminosity on the radius;
- plot real stars to see that most nearby stars are faint red dwarfs, while the stars we see in the
  sky are mostly luminous ones far away.

## Units and the Stefan–Boltzmann law

Everything is in solar units: luminosity L in L☉, radius R in R☉, temperature T in kelvin, with
T☉ = 5772 K (IAU 2015). From L = 4πR²σT⁴:

- L = R² (T / T☉)⁴
- R = √L ÷ (T / T☉)²

So:

- At fixed luminosity, doubling the temperature makes the star 4 times smaller (R ∝ 1/T²).
- At fixed temperature, 4 times the luminosity makes it 2 times larger (R ∝ √L).
- Lines of equal radius are straight on the log–log diagram: log L = 2 log R + 4 log(T/T☉).

## Magnitudes

- Bolometric magnitude: M_bol = 4.74 − 2.5 log₁₀ L (IAU 2015: M_bol,☉ = 4.74).
- Absolute visual magnitude: M_V = M_bol − BC_V(T). The bolometric correction BC_V is near zero for
  F stars and large and negative for very hot and very cool stars, which emit mostly outside the V band.
- Absolute from apparent magnitude: M = m − 5 log₁₀(d / 10 pc). Interstellar extinction is ignored.
  It is negligible within 100 pc, but it makes the most distant bright supergiants (Deneb, Rigel)
  come out somewhat less luminous than published values.

## Reference sequences

- **Main sequence (dwarfs, class V).** E. Mamajek's *Modern Mean Dwarf Stellar Color and Effective
  Temperature Sequence* (Pecaut & Mamajek 2013, table version 2022.04.16), from O3 V to M9.5 V. It
  gives T, BC_V, log L, M_V, B − V, Gaia BP − RP, M_G and R for each type. The sim uses it for:
  - the main-sequence band;
  - BC_V(T) for every star;
  - converting between temperature, B − V, BP − RP and spectral type;
  - the G-band bolometric correction of normal stars (M_bol − M_G as a function of BP − RP).
- **White dwarfs.** The Montreal cooling sequence for 0.6 M☉ pure-hydrogen (DA) white dwarfs
  (Bédard et al. 2020): T, M_bol, V and Gaia EDR3 G, BP, RP. A typical white dwarf is about Earth's
  size, 0.012 R☉.
- **Giants and supergiants.**
  - The class curves for Ia, Ib, II, III and IV come from representative absolute magnitudes
    rounded from standard textbook compilations (after Schmidt-Kaler 1982).
  - Ia and Ib sit about 1.3 mag above and below Iab, II is halfway between Ib and III, and IV is
    halfway between III and V.
  - Giants (G–M) and supergiants are given cooler temperatures than dwarfs of the same type, using
    approximate scales.
  - These curves are guides: real classes are broad bands, and the sim draws them as bands.
- **Instability strip.** A band about 1000 K wide from about 7000–8000 K at 3 L☉ to 5000–6000 K at
  10⁵ L☉. It is where RR Lyrae, Cepheids and δ Scuti stars pulsate.

## Real stars

### Where the data come from

The data are a snapshot taken on 2026-11-11. They are not live, because the Gaia archive cannot be
queried from a web page.

| Set | Source | Count |
|---|---|---|
| Nearest stars | Gaia Catalogue of Nearby Stars (GCNS) within 10 pc with good photometry, plus nearby stars Gaia saturates on (Sirius, α Centauri A and B, Procyon, …) from Hipparcos | 259 |
| Brightest stars | Hipparcos stars with V < 3 | 172 |
| On both lists | Sirius, α Cen A, α Cen B, Procyon, Altair, Vega, Fomalhaut, β Hyi | 8 |
| Gaia census | A random 1 in 10 of the GCNS (100 pc) after photometric quality cuts | 44 311 |

Names are IAU proper names where they exist, otherwise Bayer/Flamsteed or Gliese designations.

### How each star is placed

- **Gaia stars.**
  - Temperature comes from the BP − RP colour, read off the dwarf sequence. White dwarfs flagged by
    the GCNS use the white dwarf sequence instead.
  - Luminosity comes from M_G plus the G-band bolometric correction at that colour.
  - V comes from G and the G − V colour.
  - Using the dwarf colour–temperature relation for the few giants within 100 pc misplaces them by
    about 100–200 K.
- **Hipparcos stars (the brightest).**
  - Temperature comes from the catalogued spectral type and luminosity class, using the scales above.
    If there is no type, it comes from B − V.
  - Luminosity comes from M_V = V − 5 log(d/10) and BC_V(T).
  - Many bright stars share a type (all B1 stars, say), so they share a temperature and line up in
    vertical columns. NAAP's data had the same binning.
- **Distances.** Gaia DR3 parallaxes where good, otherwise Hipparcos (2007). A star counts as
  "nearest" only if its parallax is at least ten times its uncertainty.

### Kind of star

- When the catalogue gives an MK luminosity class, the class decides the kind: V dwarf, IV subgiant,
  III or II giant, I supergiant, D white dwarf.
  - A catalogued giant class is overruled for a cool star (below 5500 K) that is less than twice as
    luminous as a main-sequence star of its temperature. One Hipparcos entry calls a K dwarf a giant.
- Otherwise the kind comes from the star's place on the diagram.
  - Gaia stars are classed by how many magnitudes they sit above the main sequence at their colour.
    Up to 1.5 mag above is still a dwarf, because unresolved binaries and young stars sit that high.
  - No giant is fainter than M_G = 5.
  - The star card says "from its place on the diagram" when the kind is inferred this way.
- The census's white dwarfs are those with a GCNS white dwarf probability above 0.5. A few of them are
  white dwarf + M dwarf pairs and come out larger than a lone white dwarf.

## What students should find

| Question | What the sim shows |
|---|---|
| Hot and faint, cool and luminous (NAAP Q4–Q6) | Hot faint stars are tiny (white dwarfs ≈ 0.01 R☉); cool luminous stars are huge (Betelgeuse ≈ 600 R☉) |
| Radius along the main sequence (Q7–Q8) | From ~0.1 R☉ (late M) to ~10 R☉ (O); mass rises with temperature too |
| The nearest stars (Q11–Q12) | 235 of 259 are main-sequence dwarfs, mostly M; 18 are white dwarfs; no giants |
| Bright vs near (Q13–Q14) | The brightest stars are mostly luminous (giants, supergiants, hot dwarfs) and far; only 8 are also among the nearest |
| Volume vs brightness limit | Within 100 pc: ~93% dwarfs, ~7% white dwarfs, ~0.2% giants. Brighter than V = 6: about 25% giants and no white dwarfs |

## Simplifications

- Extinction and reddening are ignored.
- Each star has a single temperature, luminosity and radius. Unresolved binaries are plotted as one
  star (e.g. Capella).
- The giant and supergiant temperature scales and class curves are approximate guides.
- The census is a 1-in-10 sample. Counts are multiplied by 10 to estimate the full catalogue.
- Gaia cannot measure stars brighter than about G = 3, so the census lacks a few of the brightest
  nearby stars. The Star Samples screen takes those from Hipparcos.
