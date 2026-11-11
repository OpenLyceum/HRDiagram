/**
 * fetch-catalog.ts
 *
 * Takes the star snapshot the simulation plots. Run it by hand (`npm run fetch-data`) when you want
 * fresher data; the sim never queries an archive at runtime because the ESA Gaia archive's TAP service
 * sends no CORS headers.
 *
 * Sources
 *   - ESA Gaia archive TAP (https://gea.esac.esa.int/archive/), which also hosts
 *       · the Gaia Catalogue of Nearby Stars (GCNS, Gaia Collaboration, Smart et al. 2021), built on Gaia EDR3;
 *         EDR3 and DR3 share source_ids and photometry,
 *       · the Hipparcos catalogue (ESA 1997) for V, B−V and spectral types,
 *       · the Hipparcos new reduction (van Leeuwen 2007) for parallaxes,
 *       · gaiadr3.hipparcos2_best_neighbour, which links HIP numbers to Gaia source_ids.
 *   - IAU Catalog of Star Names (IAU-CSN, WGSN), for official proper names.
 *   - HYG database v4.1 (astronexus, CC BY-SA 4.0), for Bayer/Flamsteed/Gliese designations only.
 *   - Pecaut & Mamajek (2013) "Modern Mean Dwarf Stellar Color and Effective Temperature Sequence".
 *   - Montreal white dwarf cooling sequences (Bédard et al. 2020), 0.6 M☉ pure-hydrogen (DA) grid.
 *
 * Outputs (src/common/model/data/)
 *   - gaiaCensus.json: a random 1-in-10 sample of GCNS stars within 100 pc (source_id mod 10 = 0),
 *     column-oriented: distance (pc), G, BP−RP, white-dwarf flag.
 *   - namedStars.json: the nearest stars (≤ 10 pc) and the brightest stars (Hipparcos V < 3), one row each.
 *   - dwarfSequence.json and whiteDwarfSequence.json: the two reference tables the sim interpolates.
 *
 * Only observables are stored. Temperatures, luminosities and radii are derived inside the sim
 * (src/common/model/stellarPhysics.ts), so the same, tested code turns every star into a point.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const GAIA_TAP = "https://gea.esac.esa.int/tap-server/tap/sync";
const IAU_CSN_URL = "https://www.pas.rochester.edu/~emamajek/WGSN/IAU-CSN.txt";
const HYG_URL = "https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv";
const MAMAJEK_URL = "https://www.pas.rochester.edu/~emamajek/EEM_dwarf_UBVIJHK_colors_Teff.txt";
const WD_URL = "https://www.astro.umontreal.ca/~bergeron/CoolingModels/Tables/Table_Mass_0.6";

const DATA_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../src/common/model/data");

/** Census sampling: keep stars whose source_id ends in 0, a random 1 in 10. */
const SAMPLE_MODULUS = 10;
/** Nearest stars are those within this distance (pc). */
const NEAREST_LIMIT_PC = 10;
/** Brightest stars are those with Hipparcos V below this. */
const BRIGHTEST_LIMIT_V = 3;
/** Gaia photometry saturates for brighter stars, so those keep their Hipparcos photometry. */
const GAIA_BRIGHT_LIMIT_G = 3.5;

/** A parallax must be at least this many times its error before a star counts as "nearest". */
const MIN_PARALLAX_OVER_ERROR = 10;

/** Photometric quality cuts (Gaia Collaboration, Babusiaux et al. 2018), as ADQL. */
const QUALITY_ADQL = [
  "phot_bp_mean_flux_over_error > 10",
  "phot_rp_mean_flux_over_error > 10",
  "ruwe < 1.4",
  "phot_bp_rp_excess_factor > 1.0 + 0.015 * POWER(phot_bp_mean_mag - phot_rp_mean_mag, 2)",
  "phot_bp_rp_excess_factor < 1.3 + 0.06 * POWER(phot_bp_mean_mag - phot_rp_mean_mag, 2)",
].join(" AND ");

/** The same cuts, applied to a fetched row (the archive's ADQL has no CASE, so the nearest query can't flag them). */
function goodPhotometry(row: Row): boolean {
  const bpRp = num(row["phot_bp_mean_mag"]) - num(row["phot_rp_mean_mag"]);
  const excess = num(row["phot_bp_rp_excess_factor"]);
  return (
    num(row["phot_bp_mean_flux_over_error"]) > 10 &&
    num(row["phot_rp_mean_flux_over_error"]) > 10 &&
    num(row["ruwe"]) < 1.4 &&
    excess > 1.0 + 0.015 * bpRp ** 2 &&
    excess < 1.3 + 0.06 * bpRp ** 2
  );
}

const CENSUS_QUERY =
  "SELECT source_id, dist_50, phot_g_mean_mag, phot_bp_mean_mag, phot_rp_mean_mag, wd_prob " +
  `FROM external.gaiaedr3_gcns_main_1 WHERE dist_50 < 0.1 AND MOD(source_id, ${SAMPLE_MODULUS}) = 0 AND ${QUALITY_ADQL}`;

/** Every GCNS star a little beyond 10 pc, with or without good photometry (its distance still matters). */
const NEAREST_QUERY =
  "SELECT g.source_id, g.dist_50, g.ra, g.dec, g.pmra, g.pmdec, g.phot_g_mean_mag, g.phot_bp_mean_mag, " +
  "g.phot_rp_mean_mag, g.phot_bp_mean_flux_over_error, g.phot_rp_mean_flux_over_error, g.ruwe, " +
  "g.phot_bp_rp_excess_factor, g.wd_prob, hb.original_ext_source_id AS hip " +
  "FROM external.gaiaedr3_gcns_main_1 AS g " +
  "LEFT OUTER JOIN gaiadr3.hipparcos2_best_neighbour AS hb ON hb.source_id = g.source_id " +
  `WHERE g.dist_50 < ${(NEAREST_LIMIT_PC * 1.05) / 1000}`;

/** Bright or (by Hipparcos) nearby stars, with the Gaia DR3 parallax of their counterpart when one exists. */
const HIPPARCOS_QUERY =
  "SELECT h.hip, h.vmag, h.b_v, h.sptype, nr.plx, nr.e_plx, hb.source_id, " +
  "gs.parallax AS gaia_plx, gs.parallax_over_error AS gaia_plx_snr " +
  "FROM public.hipparcos AS h JOIN public.hipparcos_newreduction AS nr ON nr.hip = h.hip " +
  "LEFT OUTER JOIN gaiadr3.hipparcos2_best_neighbour AS hb ON hb.original_ext_source_id = h.hip " +
  "LEFT OUTER JOIN gaiadr3.gaia_source AS gs ON gs.source_id = hb.source_id " +
  `WHERE h.vmag < ${BRIGHTEST_LIMIT_V} OR nr.plx > ${1000 / (NEAREST_LIMIT_PC * 1.05)}`;

type Row = Record<string, string>;

/**
 * Hipparcos spectral types that describe a companion or are garbled, replaced by the primary's type.
 * Recorded in namedStars.json so the substitution stays visible.
 */
const SPECTRAL_TYPE_OVERRIDES: Record<number, { readonly type: string; readonly reason: string }> = {
  24608: { type: "G8III", reason: "Capella: Hipparcos gives 'M1: comp'; the pair is G8 III + G0 III" },
  54061: { type: "K0III", reason: "Dubhe: Hipparcos gives 'F7V comp' (the companion); the primary is K0 III" },
  72105: { type: "K0II-III", reason: "Izar: Hipparcos gives 'A0' (the companion); the primary is K0 II–III" },
};

// ── Fetching and parsing ───────────────────────────────────────────────────────

/**
 * Optional response cache for development: set FETCH_CACHE_DIR to a directory and repeated runs reuse
 * earlier responses instead of querying the archives again. Never set it for a real refresh.
 */
const CACHE_DIR = process.env["FETCH_CACHE_DIR"];

const MAX_ATTEMPTS = 5;

async function fetchText(url: string, init?: RequestInit): Promise<string> {
  const cacheFile = CACHE_DIR
    ? resolve(
        CACHE_DIR,
        `${createHash("sha256")
          .update(`${url}\n${String(init?.body ?? "")}`)
          .digest("hex")}.txt`,
      )
    : null;
  if (cacheFile && existsSync(cacheFile)) {
    return readFileSync(cacheFile, "utf8");
  }
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(600_000) });
      if (!response.ok) {
        // The Gaia archive answers 429 when queried too often; honour its Retry-After.
        const retryAfter = Number(response.headers.get("retry-after"));
        const error = new Error(`HTTP ${response.status} for ${url}`);
        Object.assign(error, { waitSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null });
        throw error;
      }
      const text = await response.text();
      if (cacheFile) {
        mkdirSync(dirname(cacheFile), { recursive: true });
        writeFileSync(cacheFile, text);
      }
      return text;
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS) {
        throw error;
      }
      const hinted = (error as { waitSeconds?: number | null }).waitSeconds;
      const waitSeconds = hinted ?? 30 * attempt;
      console.warn(`  retrying in ${waitSeconds} s (${String(error)})`);
      await new Promise((r) => setTimeout(r, waitSeconds * 1000));
    }
  }
}

/** Minimal RFC 4180 CSV parser (quoted fields, doubled quotes). */
function parseCsv(text: string): Row[] {
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      record.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") {
        i++;
      }
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  const [header, ...body] = records;
  if (!header) {
    return [];
  }
  return body
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((name, i) => [name, r[i] ?? ""])));
}

async function gaiaQuery(query: string): Promise<Row[]> {
  const body = new URLSearchParams({ REQUEST: "doQuery", LANG: "ADQL", FORMAT: "csv", QUERY: query });
  const text = await fetchText(GAIA_TAP, { method: "POST", body });
  if (text.startsWith("<")) {
    throw new Error(`Gaia TAP error for query:\n${query}\n${text.slice(0, 800)}`);
  }
  return parseCsv(text);
}

function num(value: string | undefined): number {
  return value === undefined || value.trim() === "" ? Number.NaN : Number(value);
}

function round(value: number, decimals: number): number | null {
  return Number.isFinite(value) ? Number(value.toFixed(decimals)) : null;
}

function roundSig(value: number, digits: number): number | null {
  return Number.isFinite(value) ? Number(value.toPrecision(digits)) : null;
}

// ── Reference tables ──────────────────────────────────────────────────────────

/** Parses the main body of Mamajek's dwarf table (between the first header line and the next). */
function parseMamajek(text: string): Record<string, string | number | null>[] {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.startsWith("#SpT"));
  const header = lines[start]?.slice(1).trim().split(/\s+/) ?? [];
  const rows: Record<string, string | number | null>[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("#")) {
      break;
    }
    const cells = line.trim().split(/\s+/);
    if (cells.length < 10) {
      continue;
    }
    const value = (name: string): number | null => {
      const cell = cells[header.indexOf(name)];
      if (cell === undefined || /^\.+$/.test(cell)) {
        return null;
      }
      const parsed = Number(cell.replace(/[:*]$/, ""));
      return Number.isFinite(parsed) ? parsed : null;
    };
    const spType = cells[0] ?? "";
    // Brown dwarfs (L, T, Y) sit far below the luminosity range of an HR diagram for stars.
    if (/^[LTY]/.test(spType)) {
      continue;
    }
    rows.push({
      spType,
      teff: value("Teff"),
      bcV: value("BCv"),
      logL: value("logL"),
      mV: value("Mv"),
      bv: value("B-V"),
      bpRp: value("Bp-Rp"),
      mG: value("M_G"),
      gMinusV: value("G-V"),
      radius: value("R_Rsun"),
      mass: value("Msun"),
    });
  }
  return rows;
}

/** Parses the pure-hydrogen block of a Montreal cooling table. */
function parseWhiteDwarfTable(text: string): Record<string, number>[] {
  const lines = text.split("\n");
  const header = lines[1]?.replace("log g", "logg").trim().split(/\s+/) ?? [];
  const rows: Record<string, number>[] = [];
  for (const line of lines.slice(2)) {
    if (/Pure-helium/.test(line) || /^\s*Teff/.test(line)) {
      break;
    }
    const cells = line.trim().split(/\s+/).map(Number);
    if (cells.length < header.length) {
      continue;
    }
    // Columns are named once per photometric system, so pick them by position.
    const at = (name: string, occurrence = 0): number => {
      let seen = -1;
      for (let i = 0; i < header.length; i++) {
        if (header[i] === name && ++seen === occurrence) {
          return cells[i] ?? Number.NaN;
        }
      }
      return Number.NaN;
    };
    const teff = at("Teff");
    if (teff < 3500 || teff > 80000) {
      continue;
    }
    rows.push({
      teff,
      logg: at("logg"),
      mBol: at("Mbol"),
      mV: at("V"),
      bv: Number((at("B") - at("V")).toFixed(3)),
      mG: at("G3"),
      bpRp: Number((at("G3_BP") - at("G3_RP")).toFixed(3)),
    });
  }
  return rows;
}

/** IAU-CSN: fixed-width columns located from the header line. Returns HIP → proper name. */
function parseIauNames(text: string): Map<number, string> {
  const lines = text.split("\n");
  const header = lines.find((l) => l.startsWith("#Name/ASCII")) ?? "";
  const hipStart = header.indexOf("HIP");
  const hdStart = header.indexOf(" HD");
  const nameEnd = header.indexOf("Designation");
  const names = new Map<number, string>();
  for (const line of lines) {
    if (line.startsWith("#") || line.trim() === "") {
      continue;
    }
    // Column 2 holds names with diacritics; column 1 is ASCII and keeps the fixed widths exact.
    const name = line.slice(0, header.indexOf("Name/Diacritics")).trim();
    const hip = Number(line.slice(hipStart - 2, hdStart).trim());
    const diacritics = line.slice(header.indexOf("Name/Diacritics"), nameEnd).trim();
    if (Number.isInteger(hip) && hip > 0) {
      names.set(hip, diacritics.length > 0 ? diacritics : name);
    }
  }
  return names;
}

const GREEK: Record<string, string> = {
  Alp: "α",
  Bet: "β",
  Gam: "γ",
  Del: "δ",
  Eps: "ε",
  Zet: "ζ",
  Eta: "η",
  The: "θ",
  Iot: "ι",
  Kap: "κ",
  Lam: "λ",
  Mu: "μ",
  Nu: "ν",
  Xi: "ξ",
  Omi: "ο",
  Pi: "π",
  Rho: "ρ",
  Sig: "σ",
  Tau: "τ",
  Ups: "υ",
  Phi: "φ",
  Chi: "χ",
  Psi: "ψ",
  Ome: "ω",
};

type HygStar = { designation: string | null; proper: string | null; ra: number; dec: number; mag: number };

/** "Alp-1" → "α¹". */
function bayerLetter(bayer: string): string {
  const [letter = "", index] = bayer.split("-");
  const superscripts = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const sup = index ? [...index].map((d) => superscripts[Number(d)] ?? d).join("") : "";
  return `${GREEK[letter] ?? letter}${sup}`;
}

function hygDesignation(row: Row): string | null {
  const con = row["con"] ?? "";
  const comp = (row["gl"] ?? "").match(/[A-C]$/)?.[0] ?? "";
  if (row["bayer"] && con) {
    return `${bayerLetter(row["bayer"])} ${con}${comp ? ` ${comp}` : ""}`;
  }
  if (row["flam"] && con) {
    return `${row["flam"]} ${con}${comp ? ` ${comp}` : ""}`;
  }
  if (row["gl"]) {
    return row["gl"].replace(/^Gl /, "GJ ").replace(/^GJ\s*/, "GJ ");
  }
  return null;
}

// ── Main ───────────────────────────────────────────────────────────────────────

type NamedStar = {
  name: string;
  designation: string;
  hip: number | null;
  gaia: string | null;
  photometry: "gaia" | "hipparcos";
  distance: number | null;
  v: number | null;
  bv: number | null;
  g: number | null;
  bpRp: number | null;
  spType: string | null;
  whiteDwarf: boolean;
  nearest: boolean;
  brightest: boolean;
};

/** Looks up names: IAU proper names by HIP, HYG designations by HIP or by position. */
class StarNamer {
  private readonly iau: Map<number, string>;
  private readonly hygByHip = new Map<number, HygStar>();
  private readonly hygNear: HygStar[] = [];
  private readonly reserved: Set<HygStar>;
  private readonly claimed = new Set<HygStar>();

  public constructor(iau: Map<number, string>, hygRows: Row[], hipparcos: Row[]) {
    this.iau = iau;
    for (const row of hygRows) {
      const star: HygStar = {
        designation: hygDesignation(row),
        proper: row["proper"] || null,
        ra: num(row["ra"]) * 15,
        dec: num(row["dec"]),
        mag: num(row["mag"]),
      };
      const hip = num(row["hip"]);
      if (Number.isInteger(hip)) {
        this.hygByHip.set(hip, star);
      }
      const dist = num(row["dist"]);
      if (dist > 0 && dist < NEAREST_LIMIT_PC * 1.3) {
        this.hygNear.push(star);
      }
    }
    // Stars with a Hipparcos entry here are reserved for the HIP link.
    this.reserved = new Set(
      hipparcos.map((r) => this.hygByHip.get(num(r["hip"]))).filter((star): star is HygStar => star !== undefined),
    );
  }

  public byHip(hip: number): HygStar | null {
    return this.hygByHip.get(hip) ?? null;
  }

  /**
   * HYG positions are J2000; move a Gaia J2016 position back with its proper motion and match within 15″.
   * HYG's V must also fit the Gaia G (V − G runs from about 0 for blue stars to about 2.5 for M dwarfs), so
   * a faint companion is never given its bright primary's name. Each HYG star is used at most once.
   */
  public byPosition(row: Row): HygStar | null {
    const years = 16;
    const decRad = (num(row["dec"]) * Math.PI) / 180;
    const ra = num(row["ra"]) - (num(row["pmra"]) * years) / 3.6e6 / Math.cos(decRad);
    const dec = num(row["dec"]) - (num(row["pmdec"]) * years) / 3.6e6;
    const g = num(row["phot_g_mean_mag"]);
    let best: HygStar | null = null;
    let bestSep = 15 / 3600;
    for (const star of this.hygNear) {
      const usable = star.mag > g - 0.7 && star.mag < g + 3.5 && !this.reserved.has(star) && !this.claimed.has(star);
      const sep = Math.hypot((star.ra - ra) * Math.cos(decRad), star.dec - dec);
      if (usable && sep < bestSep) {
        bestSep = sep;
        best = star;
      }
    }
    if (best) {
      this.claimed.add(best);
    }
    return best;
  }

  /** [name, designation]: IAU name, else HYG proper name, else the designation. */
  public nameFor(hip: number | null, gaia: string | null, hyg: HygStar | null): [string, string] {
    const fallback = hip !== null ? `HIP ${hip}` : gaia !== null ? `Gaia DR3 ${gaia}` : "unknown";
    const designation = hyg?.designation ?? fallback;
    const name = (hip !== null ? this.iau.get(hip) : undefined) ?? hyg?.proper ?? designation;
    return [name, designation];
  }
}

const spectralTypeOf = (hip: number, catalogued: string | undefined): string | null =>
  SPECTRAL_TYPE_OVERRIDES[hip]?.type ?? (catalogued?.trim() || null);

/** Gaia stars within 10 pc with good, unsaturated photometry. Adds the HIP numbers it uses to `usedHip`. */
function gaiaNearestStars(near: Row[], hipparcos: Row[], namer: StarNamer, usedHip: Set<number>): NamedStar[] {
  const hipRows = new Map(hipparcos.map((r) => [num(r["hip"]), r]));
  const hipBySource = new Map(hipparcos.filter((r) => r["source_id"]).map((r) => [r["source_id"], r]));
  const stars: NamedStar[] = [];
  for (const row of near) {
    const g = num(row["phot_g_mean_mag"]);
    if (g < GAIA_BRIGHT_LIMIT_G || !goodPhotometry(row)) {
      continue; // saturated or poorly measured: a Hipparcos counterpart may still supply the star
    }
    const sourceId = row["source_id"] ?? "";
    const hipRow = hipBySource.get(sourceId) ?? hipRows.get(num(row["hip"]));
    const hip = hipRow ? num(hipRow["hip"]) : null;
    const hyg = (hip !== null ? namer.byHip(hip) : null) ?? namer.byPosition(row);
    const [name, designation] = namer.nameFor(hip, sourceId, hyg);
    if (hip !== null) {
      usedHip.add(hip);
    }
    const v = hipRow ? num(hipRow["vmag"]) : Number.NaN;
    stars.push({
      name,
      designation,
      hip,
      gaia: sourceId,
      photometry: "gaia",
      distance: roundSig(num(row["dist_50"]) * 1000, 4),
      v: round(v, 2),
      bv: hipRow ? round(num(hipRow["b_v"]), 3) : null,
      g: round(g, 3),
      bpRp: round(num(row["phot_bp_mean_mag"]) - num(row["phot_rp_mean_mag"]), 3),
      spType: hip !== null ? spectralTypeOf(hip, hipRow?.["sptype"]) : null,
      whiteDwarf: num(row["wd_prob"]) > 0.5,
      nearest: true,
      brightest: v < BRIGHTEST_LIMIT_V,
    });
  }
  return stars;
}

/**
 * Hipparcos stars: the brightest, plus nearby stars Gaia couldn't measure well. Distance comes from the
 * Gaia DR3 parallax when it is good, otherwise from Hipparcos; either must have parallax / error ≥ 10 for
 * the star to count as nearest.
 */
function hipparcosStars(hipparcos: Row[], namer: StarNamer, usedHip: Set<number>): NamedStar[] {
  const stars: NamedStar[] = [];
  for (const row of hipparcos) {
    const hip = num(row["hip"]);
    const gaiaGood = num(row["gaia_plx_snr"]) >= MIN_PARALLAX_OVER_ERROR;
    const hipGood = num(row["plx"]) / num(row["e_plx"]) >= MIN_PARALLAX_OVER_ERROR;
    const plx = gaiaGood ? num(row["gaia_plx"]) : num(row["plx"]);
    const v = num(row["vmag"]);
    const distance = plx > 0 ? 1000 / plx : Number.NaN;
    const nearest = (gaiaGood || hipGood) && distance <= NEAREST_LIMIT_PC;
    const brightest = v < BRIGHTEST_LIMIT_V;
    if (usedHip.has(hip) || !(nearest || brightest)) {
      continue;
    }
    const [name, designation] = namer.nameFor(hip, row["source_id"] || null, namer.byHip(hip));
    const spType = spectralTypeOf(hip, row["sptype"]);
    stars.push({
      name,
      designation,
      hip,
      gaia: row["source_id"] || null,
      photometry: "hipparcos",
      distance: roundSig(distance, 4),
      v: round(v, 2),
      bv: round(num(row["b_v"]), 3),
      g: null,
      bpRp: null,
      spType,
      whiteDwarf: spType !== null && /^D/.test(spType),
      nearest,
      brightest,
    });
  }
  return stars;
}

const SOURCES = [
  "Gaia Catalogue of Nearby Stars (Gaia Collaboration, Smart et al. 2021), ESA/Gaia/DPAC",
  "Hipparcos catalogue (ESA 1997) and new reduction (van Leeuwen 2007), via the ESA Gaia archive",
  "IAU Catalog of Star Names (WGSN)",
  "HYG database v4.1 (astronexus, CC BY-SA 4.0)",
];

function writeOutputs(
  retrieved: string,
  census: Row[],
  stars: NamedStar[],
  dwarfs: ReturnType<typeof parseMamajek>,
  whiteDwarfs: ReturnType<typeof parseWhiteDwarfTable>,
): void {
  write("gaiaCensus.json", {
    retrieved,
    sources: SOURCES.slice(0, 1),
    query: CENSUS_QUERY,
    sampling: `random 1 in ${SAMPLE_MODULUS} (source_id mod ${SAMPLE_MODULUS} = 0)`,
    sampleFraction: 1 / SAMPLE_MODULUS,
    count: census.length,
    distance: census.map((r) => roundSig(num(r["dist_50"]) * 1000, 4)),
    g: census.map((r) => round(num(r["phot_g_mean_mag"]), 3)),
    bpRp: census.map((r) => round(num(r["phot_bp_mean_mag"]) - num(r["phot_rp_mean_mag"]), 3)),
    whiteDwarf: census.map((r) => (num(r["wd_prob"]) > 0.5 ? 1 : 0)),
  });
  write(
    "namedStars.json",
    {
      retrieved,
      sources: SOURCES,
      queries: [NEAREST_QUERY, HIPPARCOS_QUERY],
      spectralTypeOverrides: Object.values(SPECTRAL_TYPE_OVERRIDES).map((o) => o.reason),
      nearestLimitPc: NEAREST_LIMIT_PC,
      brightestLimitV: BRIGHTEST_LIMIT_V,
      stars,
    },
    true,
  );
  write(
    "dwarfSequence.json",
    {
      retrieved,
      source: "Pecaut & Mamajek (2013, ApJS 208, 9), table version 2022.04.16",
      url: MAMAJEK_URL,
      rows: dwarfs,
    },
    true,
  );
  write(
    "whiteDwarfSequence.json",
    {
      retrieved,
      source: "Montreal white dwarf cooling sequences (Bédard et al. 2020), 0.6 M☉ pure-hydrogen atmospheres",
      url: WD_URL,
      rows: whiteDwarfs,
    },
    true,
  );
}

async function main(): Promise<void> {
  const retrieved = new Date().toISOString().slice(0, 10);

  console.log("Reference tables…");
  const dwarfs = parseMamajek(await fetchText(MAMAJEK_URL));
  const whiteDwarfs = parseWhiteDwarfTable(await fetchText(WD_URL));
  console.log(`  ${dwarfs.length} dwarf types, ${whiteDwarfs.length} white dwarf temperatures`);

  console.log("Gaia census sample (GCNS, 1 in 10 within 100 pc)…");
  const census = await gaiaQuery(CENSUS_QUERY);
  census.sort((a, b) => num(a["dist_50"]) - num(b["dist_50"]));
  console.log(`  ${census.length} stars`);

  console.log("Nearest stars (GCNS within 10 pc)…");
  const near = (await gaiaQuery(NEAREST_QUERY)).filter((r) => num(r["dist_50"]) * 1000 <= NEAREST_LIMIT_PC);
  console.log(`  ${near.length} stars`);

  console.log("Hipparcos (V < 3 or within 10 pc)…");
  const hipparcos = await gaiaQuery(HIPPARCOS_QUERY);
  console.log(`  ${hipparcos.length} stars`);

  console.log("Names (IAU-CSN, HYG)…");
  const namer = new StarNamer(
    parseIauNames(await fetchText(IAU_CSN_URL)),
    parseCsv(await fetchText(HYG_URL)),
    hipparcos,
  );

  const usedHip = new Set<number>();
  const stars = [...gaiaNearestStars(near, hipparcos, namer, usedHip), ...hipparcosStars(hipparcos, namer, usedHip)];
  stars.sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9));

  writeOutputs(retrieved, census, stars, dwarfs, whiteDwarfs);

  console.log("\nSummary");
  const whiteDwarfCount = census.filter((r) => num(r["wd_prob"]) > 0.5).length;
  console.log(`  census sample: ${census.length} (white dwarfs ${whiteDwarfCount})`);
  console.log(`  nearest (≤ ${NEAREST_LIMIT_PC} pc): ${stars.filter((s) => s.nearest).length}`);
  console.log(`  brightest (V < ${BRIGHTEST_LIMIT_V}): ${stars.filter((s) => s.brightest).length}`);
  const both = stars.filter((s) => s.nearest && s.brightest).map((s) => s.name);
  console.log(`  both: ${both.join(", ")}`);
}

/** Writes JSON with one top-level key per line (and one row per line when rowsPerLine), so diffs stay readable. */
function write(file: string, data: Record<string, unknown>, rowsPerLine = false): void {
  const lines = Object.entries(data).map(([key, value]) => {
    if (rowsPerLine && Array.isArray(value)) {
      return `${JSON.stringify(key)}:[\n${value.map((v) => JSON.stringify(v)).join(",\n")}\n]`;
    }
    return `${JSON.stringify(key)}:${JSON.stringify(value)}`;
  });
  writeFileSync(resolve(DATA_DIR, file), `{\n${lines.join(",\n")}\n}\n`);
  console.log(`  wrote ${file}`);
}

await main();
