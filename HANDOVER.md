# XPSWMM to SWMM5 Converter — Project Handover

> **Version:** 2.0  
> **Date:** March 2026  
> **Stack:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui  
> **Live:** [xp-to-swmm-bridge.lovable.app](https://xp-to-swmm-bridge.lovable.app)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [File Structure](#3-file-structure)
4. [Core Modules](#4-core-modules)
   - [XP Parser](#41-xp-parser-srclibxp-parserts)
   - [SWMM5 Builder](#42-swmm5-builder-srclibswmm5-builderts)
5. [Pages & Features](#5-pages--features)
6. [Data Flow](#6-data-flow)
7. [XP File Format Reference](#7-xp-file-format-reference)
8. [SWMM5 Output Format](#8-swmm5-output-format)
9. [Element Mapping](#9-element-mapping)
10. [Water Quality / Pollutant Support](#10-water-quality--pollutant-support)
11. [Pump Curve Support](#11-pump-curve-support)
12. [Transect / Irregular Cross-Section Support](#12-transect--irregular-cross-section-support)
13. [Time Series Support](#13-time-series-support)
14. [Subcatchment Support](#14-subcatchment-support)
15. [Design System](#15-design-system)
16. [Extending the Project](#16-extending-the-project)
17. [Known Limitations](#17-known-limitations)
18. [Deployment](#18-deployment)
19. [Origins & Format Lineage](#19-origins--format-lineage)

---

## 1. Project Overview

A **client-side** web application that converts XPSWMM proprietary `.xp` files into EPA SWMM5 `.inp` format. All parsing and conversion happens in the browser — no server required, no files uploaded.

### Key Capabilities

| Feature | Description |
|---|---|
| **Single-file conversion** | Drop a `.xp` file → auto-downloads `.inp` |
| **Card Reader** | Interactive inspector with 12+ tabs for nodes, links, subcatchments, time series, pump curves, transects, pollutants, job control, network map, raw cards, export |
| **GitHub Batch** | Paste a public GitHub repo URL → scans for `.xp` files → batch convert |
| **Local Folder Batch** | Select a local folder → pick files with checkboxes → batch convert |
| **ZIP Download** | Download all converted `.inp` files as a single ZIP archive |
| **Dark Mode** | Theme toggle persisted to localStorage |

### Conversion Coverage Matrix

| Domain | Elements | Status |
|---|---|---|
| **Hydraulic Network** | Junctions, Outfalls, Storage Nodes | ✅ Full |
| **Conduits** | All 20 NKLASS shape codes, multi-barrel | ✅ Full |
| **Special Links** | Orifices, Weirs (4 types), Pumps (4 types) | ✅ Full |
| **Subcatchments** | Area, width, slope, imperviousness, routing | ✅ Full |
| **Infiltration** | Horton, Green-Ampt, SCS Curve Number | ✅ Full |
| **Time Series** | Inflow hydrographs (D2/D3 cards) | ✅ Full |
| **Pump Curves** | Performance curves Types 1–4 (H2/H3 cards) | ✅ Full |
| **Transects** | Irregular cross-sections (TRAN/C2/C3 cards) | ✅ Full |
| **Water Quality** | Pollutants, land uses, buildup, washoff, loadings | ✅ Full |
| **Job Control** | Units, routing, timestep, tolerances, damping | ✅ Full |
| **Controls/Rules** | Real-time control rules | ❌ Not yet |
| **LID Controls** | Low-impact development | ❌ Not yet |
| **Groundwater** | GW flow equations | ❌ Not yet |
| **Snow Pack** | Snow melt parameters | ❌ Not yet |

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser                                │
│                                                               │
│  ┌──────────┐    ┌───────────────┐    ┌───────────────────┐  │
│  │ .xp file │───▶│   XPParser    │───▶│   XPParseResult   │  │
│  │ (text)   │    │               │    │                   │  │
│  └──────────┘    │  ┌──────────┐ │    │ • nodes[]         │  │
│                  │  │ Native   │ │    │ • links[]         │  │
│                  │  │ XP Cards │ │    │ • subcatchments[] │  │
│                  │  ├──────────┤ │    │ • timeSeries[]    │  │
│                  │  │ XPX      │ │    │ • pumpCurves[]    │  │
│                  │  │ Exchange │ │    │ • transects[]     │  │
│                  │  ├──────────┤ │    │ • pollutants[]    │  │
│                  │  │ SWMM 3/4 │ │    │ • landuses[]      │  │
│                  │  │ Legacy   │ │    │ • buildups[]      │  │
│                  │  └──────────┘ │    │ • washoffs[]      │  │
│                  └───────────────┘    │ • loadings[]      │  │
│                                      │ • jobControl{}    │  │
│                                      │ • rawCards{}      │  │
│                                      └────────┬──────────┘  │
│                                               │              │
│                        ┌──────────────────────┤              │
│                        │                      │              │
│                   ┌────▼────┐           ┌─────▼─────┐       │
│                   │buildINP │           │ Card      │       │
│                   │         │           │ Reader UI │       │
│                   └────┬────┘           └───────────┘       │
│                        │                                     │
│                   ┌────▼────┐                                │
│                   │ .inp    │                                │
│                   │ file    │                                │
│                   └─────────┘                                │
└──────────────────────────────────────────────────────────────┘
```

**Zero backend dependencies.** The GitHub batch feature uses GitHub's public REST API (`api.github.com`) directly from the browser.

---

## 3. File Structure

```
src/
├── lib/
│   ├── xp-parser.ts          # XP file parser (~1000 lines)
│   │                          #   - 3 format detectors (XPX, Native XP, SWMM34)
│   │                          #   - 13 parsing phases
│   │                          #   - DB field definition table (100+ fields)
│   │                          #   - Exports: XPParser class, all interfaces, code maps
│   ├── swmm5-builder.ts      # SWMM5 .inp generator (~330 lines)
│   │                          #   - buildINP(): generates 20+ SWMM5 sections
│   │                          #   - buildCSV(): generic CSV exporter
│   └── utils.ts              # Tailwind merge utility
├── pages/
│   ├── Index.tsx              # Landing page with drag-drop converter
│   ├── XPReader.tsx           # Card Reader with 12+ tabbed inspector (~980 lines)
│   │                          #   - NetworkMap SVG component (inline)
│   │                          #   - Per-tab filtering, chart visualizations
│   │                          #   - Multi-format export (CSV, JSON, INP)
│   ├── GitHubBatch.tsx        # GitHub + local folder batch converter
│   ├── Documentation.tsx      # Full documentation with handover tab
│   └── NotFound.tsx           # 404 page
├── components/
│   ├── Header.tsx             # Nav bar + dark mode toggle
│   ├── FileUpload.tsx         # Drag-drop file upload
│   ├── ConversionOptions.tsx  # Conversion settings panel
│   ├── ResultsPanel.tsx       # Conversion results display
│   ├── ProgressIndicator.tsx  # Progress bar
│   ├── ConversionLog.tsx      # Log output
│   └── ui/                    # 40+ shadcn/ui components (Radix primitives)
├── hooks/
│   ├── use-mobile.tsx         # Mobile viewport detection
│   └── use-toast.ts           # Toast notification hook
├── index.css                  # Design tokens (HSL colors, gradients, dark mode)
├── App.tsx                    # Routes: /, /reader, /github-batch, /docs
└── main.tsx                   # Entry point
```

---

## 4. Core Modules

### 4.1 XP Parser (`src/lib/xp-parser.ts`)

The parser handles three input formats:

| Format | Detection | Method |
|---|---|---|
| **XPX** (exchange) | Contains `[NODE]` or `[LINK]` | `parseXPX()` — key=value pairs |
| **Native XP** (card) | Group codes like `EXTR`, `ZZZN`, `RNFF`, `QUAL`, `TRAN` | `parseNativeXP()` — 80-col fixed-width |
| **SWMM 3/4** | Card IDs like `D1`, `C1` | `parseSWMM34()` — legacy format |

#### DB Field Definitions

The `DB` constant maps ~100 field names to their exact card positions using the `FieldDef` structure:

```typescript
interface FieldDef {
  g: string;  // Group (e.g., 'EXTR', 'RNFF')
  c: string;  // Card (e.g., 'C1', 'SP1N', 'R1')
  p: number;  // Column position (1-based)
  w: number;  // Width in characters
  t: number;  // Type: 1=int, 2=real, 3=coded, 4=flag, 5=string
}
```

These definitions are derived from the original C source (`Swmfield.c` / `Swmfield.h`).

#### Complete Field Map by Group

**EXTR Group — Hydraulic Network:**

| Field | Card | Col | Width | Type | Description |
|---|---|---|---|---|---|
| `NODNAM` | SP1N | 62 | 10 | str | Node name |
| `NODX` | SP1N | 6 | 12 | real | X coordinate |
| `NODY` | SP1N | 18 | 12 | real | Y coordinate |
| `INQ` | SP1N | 5 | 1 | flag | Inflow flag |
| `FLGOUTF` | SP1N | 50 | 1 | flag | Outfall flag |
| `GRELEV` | D1 | 13 | 8 | real | Ground elevation |
| `Y0` | D1 | 40 | 7 | real | Initial depth |
| `QINST` | D1 | 31 | 8 | real | Constant inflow |
| `KO` | J3 | 4 | 1 | coded | Outfall type code |
| `DELTA` | J3 | 11 | 8 | real | Head loss delta |
| `ZTOP` | E1 | 13 | 7 | real | Crown elevation |
| `ASTORE` | E1 | 21 | 7 | real | Storage area |
| `NKLASS` | C1 | 13 | 2 | coded | Shape code (1–20) |
| `DEEP` | C1 | 25 | 7 | real | Conduit depth/diameter |
| `WIDE` | C1 | 34 | 7 | real | Conduit width |
| `LEN` | C1 | 43 | 8 | real | Conduit length |
| `ZP1` | C1 | 52 | 8 | real | Upstream invert |
| `ZP2` | C1 | 61 | 8 | real | Downstream invert |
| `ROUGH` | C1 | 70 | 10 | real | Manning's n |
| `SLOPE` | C1A | 27 | 8 | real | Slope |
| `BARREL` | C6 | 67 | 8 | real | Number of barrels |
| `AORIF` | F1 | 25 | 6 | real | Orifice area |
| `CORIF` | F1 | 32 | 4 | real | Orifice coefficient |
| `DORIF` | F1 | 45 | 10 | real | Orifice diameter |
| `ONKLASS` | F1 | 23 | 1 | coded | Orifice shape |
| `KWEIR` | G1 | 22 | 1 | coded | Weir type |
| `YCREST` | G1 | 24 | 8 | real | Weir crest height |
| `YTOP` | G1 | 33 | 8 | real | Weir top |
| `WLEN` | G1 | 44 | 6 | real | Weir length |
| `COEFF` | G1 | 53 | 4 | real | Weir coefficient |
| `IPTYP` | H1A | 1 | 2 | coded | Pump type (1–4) |
| `PON` | H1A | 11 | 8 | real | Pump ON level |
| `POFF` | H1A | 19 | 8 | real | Pump OFF level |
| `PSEL` | H1A | 51 | 20 | str | Pump curve name |
| `PCNPTS` | H2 | 1 | 4 | int | Pump curve point count |
| `INFLTYP` | D2 | 4 | 1 | coded | Inflow type (1=flow, 2=stage) |
| `NPAIRS` | D2 | 6 | 4 | int | Time-value pair count |
| `TSFACT` | D2 | 11 | 10 | real | Time scale factor |
| `QFACT` | D2 | 21 | 10 | real | Flow scale factor |

**EXTR Group — Job Control:**

| Field | Card | Col | Width | Type | Description |
|---|---|---|---|---|---|
| `ALPHA` | A1 | 5 | 75 | str | Title line |
| `DELT` | B1 | 10 | 6 | real | Routing time step (seconds) |
| `METRIC` | B2 | 4 | 1 | coded | Units (0=US, 1=Metric) |
| `MFAIL` | BB2 | 6 | 8 | int | Max iterations |
| `FUDGE` | BB2 | 15 | 8 | real | Head tolerance |
| `KINE` | BB2 | 79 | 1 | coded | Routing method |
| `ISMTH` | BB2 | 51 | 8 | int | Smoothing factor |

**RNFF Group — Subcatchments:**

| Field | Card | Col | Width | Type | Description |
|---|---|---|---|---|---|
| `SNAME` | R1 | 1 | 10 | str | Subcatchment name |
| `SAREA` | R1 | 11 | 10 | real | Area (acres/hectares) |
| `SWID` | R1 | 21 | 10 | real | Width |
| `SSLOPE` | R1 | 31 | 10 | real | Slope (%) |
| `SIMPERV` | R1 | 41 | 10 | real | % Imperviousness |
| `SOUTLET` | R1 | 51 | 10 | str | Outlet node name |
| `SNIMP` | R2 | 1 | 10 | real | Manning's N impervious |
| `SNPERV` | R2 | 11 | 10 | real | Manning's N pervious |
| `SDSIP` | R2 | 21 | 10 | real | Depression storage impervious |
| `SDSPV` | R2 | 31 | 10 | real | Depression storage pervious |
| `SPZIMP` | R2 | 41 | 10 | real | % zero imperv storage |
| `SROUTE` | R2 | 51 | 10 | coded | Routing (0=Outlet, 1=Imperv, 2=Perv) |
| `SF0` | R3 | 1 | 10 | real | Horton max infiltration |
| `SFF` | R3 | 11 | 10 | real | Horton min infiltration |
| `SFDECAY` | R3 | 21 | 10 | real | Horton decay constant |
| `SFDRY` | R3 | 31 | 10 | real | Drying time (days) |
| `SFMAXVOL` | R3 | 41 | 10 | real | Max volume |
| `SCURVEN` | R4 | 1 | 10 | real | SCS Curve Number |
| `SCONDUC` | R4 | 11 | 10 | real | Hydraulic conductivity |
| `SHEAD` | R4 | 21 | 10 | real | Suction head |
| `SIMD` | R4 | 31 | 10 | real | Initial moisture deficit |
| `SRGNAME` | R5 | 1 | 10 | str | Rain gage name |

#### Parse Result Structure

```typescript
interface XPParseResult {
  nodes: XPNode[];               // Junction, Outfall, Storage
  links: XPLink[];               // Conduit, Orifice, Weir, Pump
  subcatchments: XPSubcatchment[]; // Runoff block subcatchments
  timeSeries: XPTimeSeries[];    // Inflow hydrographs
  pumpCurves: XPPumpCurve[];     // Pump performance curves
  transects: XPTransect[];       // Irregular cross-sections
  pollutants: XPPollutant[];     // Water quality pollutant definitions
  landuses: XPLanduse[];         // Land use categories
  loadings: XPLoading[];         // Initial pollutant loadings
  buildups: XPBuildup[];         // Pollutant buildup functions
  washoffs: XPWashoff[];         // Pollutant washoff functions
  jobControl: Record<string, string>;  // A1, B1, B2, BB1, BB2 cards
  rawCards: Record<string, { data: string }[]>;  // All raw card data
  format: string;                // 'XP_CARD', 'XPX', 'SWMM34'
  title: string;
  warnings: string[];
}
```

#### Native XP Parsing Phases

| Phase | Description | Source Cards |
|---|---|---|
| **1** | Read all lines into `RecordMap` keyed by `group:card` → OI → sub → data[] | All lines |
| **2** | Extract node names and coordinates from ZZZN records | `ZZZN:NODE` |
| **3** | Extract edge connectivity (upstream/downstream node OIs) | `ZZZE:EDGE` |
| **4** | Collect all node/link OIs from EXTR cards | `EXTR:SP1N`, `D1`, `C1`, `F1`, `G1`, `H1A`, `SPDN`, `SPDV` |
| **5** | Build `XPNode[]` — elevation, depth, outfall type, storage | `EXTR:D1`, `J3`, `E1` |
| **6** | Build `XPLink[]` — shape, dimensions, roughness, type detection | `EXTR:C1`, `F1`, `G1`, `H1A`, `SPDV` |
| **7** | Discover nodes from link endpoints if none found directly | Link usNode/dsNode |
| **8** | Extract title and job control parameters | `EXTR:A1`, `B0`–`B2`, `BB1`–`BB2` |
| **9** | Build `XPSubcatchment[]` from runoff block | `RNFF:R1`–`R5` |
| **10** | Extract inflow time series (hydrographs) | `EXTR:D2`, `D3` |
| **11** | Extract pump performance curves | `EXTR:H1A`, `H2`, `H3` |
| **12** | Extract transects for irregular cross-sections | `TRAN:*`, `EXTR:C2`, `C3` |
| **13** | Extract pollutants, land uses, buildup/washoff, loadings | `QUAL:Q1`–`Q3`, `RNFF:R6` |

#### Key Lookup Codes

| Code Map | Values |
|---|---|
| `SHAPE_CODES` | 1=Circular, 2=Rectangular, 3=Horseshoe, 4=Egg, 5=Basket-handle, 6=Trapezoidal, 7=Power, 8=Natural Channel, 9=Gothic, 10=Catenary, 11=Semi-Elliptical, 12=Modified Basket, 13=User Defined, 14=Arch, 15=Irregular, 16=Parabolic, 17=Rect Closed, 18=Semi-Circular, 19=Rect Round, 20=Rect Triangular |
| `OUTFALL_CODES` | 0=None, 1=Free Outfall, 2=Fixed Backwater, 3=User Tide, 4=Computed Tide, 5=Stage History, 6=Flow History, 7=Rating Curve |
| `ROUTING_CODES` | 0=Std Dynamic Wave, 1=Always Non-linear, 2=Never Non-linear, 3=Kinematic Wave, 4=Diffusion Wave |
| `WEIR_CODES` | 1=Transverse, 2=Side-flow, 3=V-Notch, 4=Broad-crested |
| `PUMP_CODES` | 1=Type 1 (vol), 2=Type 2 (depth), 3=Type 3 (head), 4=Type 4 (depth-flow) |

### 4.2 SWMM5 Builder (`src/lib/swmm5-builder.ts`)

Generates a standards-compliant SWMM5 `.inp` file from `XPParseResult`.

#### Generated Sections (in order)

| Section | Source | Notes |
|---|---|---|
| `[TITLE]` | `result.title` or A1 card | Project title |
| `[OPTIONS]` | Job control fields | METRIC→FLOW_UNITS, KINE→FLOW_ROUTING, DELT→ROUTING_STEP |
| `[JUNCTIONS]` | Nodes where `type === 'Junction'` | Elev, MaxDepth (ZTOP−GRELEV), InitDepth |
| `[OUTFALLS]` | Nodes where `type === 'Outfall'` | KO → FREE/FIXED/TIDAL/TIMESERIES |
| `[STORAGE]` | Nodes where `type === 'Storage'` | FUNCTIONAL shape with ASTORE area |
| `[CONDUITS]` | Links where `type === 'Conduit'` | From, To, Length, Roughness, InOffset, OutOffset |
| `[ORIFICES]` | Links where `type === 'Orifice'` | ONKLASS → CIRCULAR/SIDE, discharge coefficient |
| `[WEIRS]` | Links where `type === 'Weir'` | KWEIR → TRANSVERSE/SIDEFLOW/V-NOTCH/TRAPEZOIDAL |
| `[PUMPS]` | Links where `type === 'Pump'` | Curve reference, ON/OFF levels |
| `[CURVES]` | `result.pumpCurves` | Pump1–Pump4 type curves with X-Y data |
| `[XSECTIONS]` | All conduits, orifices, weirs | NKLASS → shape name; IRREGULAR → transect reference |
| `[TRANSECTS]` | `result.transects` | HEC-2 format: NC, X1, GR lines |
| `[LOSSES]` | All conduits | Entry/exit/average losses (defaults to 0) |
| `[TIMESERIES]` | `result.timeSeries` | Time-value pairs |
| `[INFLOWS]` | Nodes with qinst > 0 or linked TS | FLOW/STAGE type with baseline |
| `[COORDINATES]` | Nodes with X/Y data | Spatial positioning |
| `[MAP]` | Bounding box from coordinates | DIMENSIONS extent |
| `[SUBCATCHMENTS]` | `result.subcatchments` | Rain gage, outlet, area, imperv, width, slope |
| `[SUBAREAS]` | `result.subcatchments` | Manning's N, depression storage, routing |
| `[INFILTRATION]` | Subcatchments with infiltration data | Horton, Green-Ampt, or Curve Number |
| `[POLLUTANTS]` | `result.pollutants` | Name, units, concentrations, decay |
| `[LANDUSES]` | `result.landuses` | Sweep interval/fraction |
| `[BUILDUP]` | `result.buildups` | POW/EXP/SAT/EXT function with coefficients |
| `[WASHOFF]` | `result.washoffs` | EXP/RC/EMC function with coefficients |
| `[LOADINGS]` | `result.loadings` | Initial pollutant mass per subcatchment |
| `[REPORT]` | Default | ALL for subcatchments, nodes, links |

#### Shape Code Mapping (NKLASS → SWMM5)

```
 1 → CIRCULAR           9 → GOTHIC            17 → RECT_CLOSED
 2 → RECT_CLOSED       10 → CATENARY          18 → SEMICIRCULAR
 3 → HORSESHOE         11 → SEMIELLIPTICAL    19 → RECT_ROUND
 4 → EGG               12 → BASKETHANDLE      20 → RECT_TRIANGULAR
 5 → BASKETHANDLE      13 → CUSTOM
 6 → TRAPEZOIDAL       14 → ARCH
 7 → POWER             16 → PARABOLIC
 8 → IRREGULAR
```

---

## 5. Pages & Features

### 5.1 Landing Page (`/`)

- Drag-and-drop zone for `.xp` files
- Auto-converts and downloads `.inp` on drop
- Quick overview of conversion capabilities

### 5.2 Card Reader (`/reader`)

Interactive file inspector with dynamic tabs (shown based on data availability):

| Tab | Content | Condition |
|---|---|---|
| **Summary** | Count cards for all element types, conduit shape distribution | Always |
| **Nodes** | Filterable table: name, type, X, Y, elevation, depth, Q, outfall, storage | Always |
| **Links** | Filterable table: name, type, shape, US/DS nodes, dimensions, roughness, slope, barrels | Always |
| **Subcatchments** | Filterable table: area, width, imperv, slope, infiltration, rain gage | When subcatchments > 0 |
| **Time Series** | SVG bar chart + data table per series; peak, duration stats | When timeSeries > 0 |
| **Pump Curves** | SVG line chart + data table per curve; type badge, ON/OFF levels | When pumpCurves > 0 |
| **Transects** | SVG cross-section profile with fill, bank markers, station-elev table | When transects > 0 |
| **Pollutants** | Pollutant defs, land uses, buildup/washoff functions, loadings tables | When pollutants > 0 |
| **Job Control** | Parameters grouped by card (A1, B1, B2, BB1, BB2) | Always |
| **Network Map** | SVG visualization with nodes colored by type and links as edges | Always |
| **Raw Cards** | All parsed cards with 80-column ruler | Always |
| **Export** | CSV (nodes, links, subcatchments, pump curves, transects, pollutants), JSON, INP; DbFieldDef reference | Always |

### 5.3 GitHub Batch Converter (`/github-batch`)

Two source modes:

**GitHub Repo:**
1. Paste a public repo URL (supports `/tree/branch/path` for subfolders)
2. GitHub API recursively scans for `.xp` files (up to 10 subdirectories)
3. Falls back to `master` branch if `main` returns 404

**Local Folder:**
1. Uses `webkitdirectory` browser API for folder selection
2. Filters for `.xp` files across all subfolders
3. All processing client-side — no upload

**Shared features:**
- Checkbox selection (select all / pick individual files)
- Sequential conversion with progress bar
- Per-file status indicators (pending / converting / done / error)
- Conversion summary table with totals (nodes, links, file sizes)
- Download individual `.inp` files or all as ZIP (via JSZip)

### 5.4 Documentation (`/docs`)

Five tabs: Supported Elements, Element Mapping, Limitations, Process, Handover.

---

## 6. Data Flow

```
Input File (text)
    │
    ▼
XPParser.parse(text)
    │
    ├── Detect format (XPX / Native XP / SWMM34)
    │
    ├── Parse into RecordMap (group:card → OI → sub → data[])
    │
    ├── Phase 2-3: Extract ZZZN nodes + ZZZE edges
    │
    ├── Phase 4-6: Build XPNode[] + XPLink[] from EXTR cards
    │
    ├── Phase 7: Discover nodes from link endpoints (fallback)
    │
    ├── Phase 8: Extract title + job control
    │
    ├── Phase 9: Build XPSubcatchment[] from RNFF block
    │
    ├── Phase 10: Extract XPTimeSeries[] from D2/D3 cards
    │
    ├── Phase 11: Extract XPPumpCurve[] from H2/H3 cards
    │
    ├── Phase 12: Extract XPTransect[] from TRAN/C2/C3 cards
    │
    └── Phase 13: Extract pollutants/landuses/buildups/washoffs/loadings
    │
    ▼
XPParseResult { nodes, links, subcatchments, timeSeries,
                pumpCurves, transects, pollutants, landuses,
                buildups, washoffs, loadings, jobControl, rawCards }
    │
    ├──────────────────────────┐
    │                          │
    ▼                          ▼
buildINP(result)         Card Reader UI (12+ tabs)
    │                     - SVG charts/maps
    ▼                     - Filterable tables
SWMM5 .inp text          - Multi-format export
    │
    ▼
Download / ZIP / Display
```

---

## 7. XP File Format Reference

### Native XP Card Format (80-column fixed-width)

```
Columns:  1-4    Group code (EXTR, ZZZN, ZZZE, RNFF, QUAL, TRAN, etc.)
          5-8    Sub-group number
          9-12   Card type (SP1N, D1, C1, R1, Q1, etc.)
         13-16   (reserved)
         17-20   Object Index (OI)
         21-24   (reserved)
         25-80   Data fields (positions defined by DB)
```

### Group Codes

| Group | Purpose |
|---|---|
| `EXTR` | Hydraulic network (Extran/Transport block) |
| `ZZZN` | Node topology definitions |
| `ZZZE` | Edge topology definitions |
| `RNFF` | Runoff block (subcatchments) |
| `QUAL` | Water quality (pollutants, buildup/washoff) |
| `TRAN` | Transect/cross-section geometry |
| `SWMM` | SWMM configuration |
| `CONF` | Configuration/settings |
| `ZXPX` | XPX format markers |

### Key Card Types by Group

**EXTR Group:**

| Card | Contains |
|---|---|
| `SP1N` | Node name, X/Y coords, inflow flag, outfall flag |
| `D1` | Ground elevation, initial depth, constant inflow |
| `D2` | Time series header (type, pair count, scale factors) |
| `D3` | Time series continuation data |
| `J3` | Outfall type (KO), head loss delta |
| `E1` | Crown elevation (ZTOP), storage area (ASTORE) |
| `SPDN` | Link name, upstream node name, downstream node name |
| `SPDV` | Multi-conduit flags (conduit/pump/orifice/weir enables) |
| `C1` | Conduit shape (NKLASS), depth, width, length, inverts, roughness |
| `C1A` | Conduit slope |
| `C2` | Transect data (station-elevation pairs) for irregular cross-sections |
| `C3` | Additional transect data |
| `C6` | Number of barrels |
| `F1` | Orifice area, coefficient, diameter, shape |
| `G1` | Weir type (KWEIR), crest height, top, length, coefficient |
| `H1A` | Pump type (IPTYP), on/off levels, curve selection |
| `H2` | Pump curve data points (X-Y pairs) |
| `H3` | Additional pump curve data |
| `A1` | Title line |
| `A1B` | Subtitle line |
| `B0` | Control flags |
| `B1` | Time step (DELT), output intervals |
| `B2` | Units (METRIC), junction parameters |
| `BB1` | Min/max Froude numbers |
| `BB2` | Max iterations, head tolerance, smoothing, routing method |

**RNFF Group:**

| Card | Contains |
|---|---|
| `R1` | Subcatchment name, area, width, slope, imperviousness, outlet |
| `R2` | Manning's N, depression storage, % zero storage, routing |
| `R3` | Horton infiltration (f0, ff, decay, dry time, max volume) |
| `R4` | Green-Ampt / SCS (curve number, conductivity, suction head, moisture deficit) |
| `R5` | Rain gage name, snow flag |
| `R6` | Subcatchment-level water quality parameters |

**QUAL Group:**

| Card | Contains |
|---|---|
| `Q1` | Pollutant definitions (name, units, concentrations, decay) |
| `Q2` | Buildup/washoff parameters (land use, coefficients, function type) |
| `Q3` | Initial pollutant loadings per subcatchment |

### ZZZN/ZZZE Records

- `ZZZN:NODE` — Node definitions with name (columns 1–14 or 12–25 depending on format) and spatial coordinates
- `ZZZE:EDGE` — Edge definitions with upstream/downstream node OI references parsed from numeric tokens

### XPX Exchange Format

Section-based, human-readable:
```
[NODE]
NAME = Junction1
GRELEV = 100.0
X = 5000.0
Y = 3000.0

[LINK]
NAME = Conduit1
USNODE = Junction1
DSNODE = Junction2
NKLASS = 1
DEEP = 1.2

[SUBCATCHMENT]
NAME = Sub1
SAREA = 10.0
SIMPERV = 50.0
```

---

## 8. SWMM5 Output Format

The generated `.inp` follows EPA SWMM5 specification. Example output:

```ini
;; SWMM5 .inp converted from XPSWMM .xp file
;; Generated by XPSWMM Card Reader

[TITLE]
;;Project Title/Notes
Example Model

[OPTIONS]
FLOW_UNITS           CFS
INFILTRATION         HORTON
FLOW_ROUTING         DYNWAVE
LINK_OFFSETS         DEPTH
MIN_SLOPE            0.0
ALLOW_PONDING        NO
SKIP_STEADY_STATE    NO
ROUTING_STEP         00:00:30
VARIABLE_STEP        0.75
INERTIAL_DAMPING     PARTIAL
NORMAL_FLOW_LIMITED  BOTH
MAX_TRIALS           8
HEAD_TOLERANCE       0.005

[JUNCTIONS]
;;Name           Elev       MaxDepth   InitDepth  SurDepth   Aponded
;;-------------- ---------- ---------- ---------- ---------- ----------
J1               100.00     10.00      0.00       0          0

[OUTFALLS]
;;Name           Elev       Type       Stage      Gated
;;-------------- ---------- ---------- ---------- -----
OF1              90.00      FREE                  NO

[CONDUITS]
;;Name           From             To               Length     Roughness  InOffset   OutOffset  InitFlow   MaxFlow
;;-------------- ---------------- ---------------- ---------- ---------- ---------- ---------- ---------- ----------
C1               J1               J2               500.00     0.0130     98.00      95.00      0          0

[XSECTIONS]
;;Link           Shape        Geom1      Geom2      Geom3      Geom4      Barrels
;;-------------- ------------ ---------- ---------- ---------- ---------- ----------
C1               CIRCULAR     1.20       0          0          0          1

[PUMPS]
;;Name           From             To               PumpCurve  Status   Startup    Shutoff
;;-------------- ---------------- ---------------- ---------- -------- ---------- ----------
P1               WetWell          Force            PC_P1      ON       3.00       1.00

[CURVES]
;;Name           Type       X-Value    Y-Value
;;-------------- ---------- ---------- ----------
PC_P1            Pump2      0.0000     0.0000
PC_P1                       5.0000     10.0000
;

[TRANSECTS]
NC  0.0350  0.0350  0.0350
X1  XS_Channel       10      20.00     80.00     0.0     0.0     0.0     0.0     0.0
GR  105.000  0.000  100.000  20.000  98.000  50.000  100.000  80.000
GR  105.000  100.000
;

[SUBCATCHMENTS]
;;Name           Rain Gage        Outlet           Area       %Imperv    Width      %Slope
;;-------------- ---------------- ---------------- ---------- ---------- ---------- ----------
Sub1             *                J1               10.00      50.00      200.00     2.00

[POLLUTANTS]
;;Name           Units  Crain      Cgw        Crdii      Kdecay     SnowOnly   CoPollutant    CoFrac
;;-------------- ------ ---------- ---------- ---------- ---------- ---------- -------------- ----------
TSS              mg/L   10.00      0          0          0          NO         *              0

[REPORT]
SUBCATCHMENTS ALL
NODES ALL
LINKS ALL
```

---

## 9. Element Mapping

### Node Type Detection

```
KO > 0                    → Outfall (KO code maps to outfall type via OUTFALL_CODES)
ASTORE > 0 or ZTOP > 0   → Storage  
Otherwise                 → Junction
```

### Link Type Detection (from SPDV flags, priority order)

```
ORIF1 === '1' or AORIF > 0  → Orifice
WEIR1 === '1' or KWEIR > 0  → Weir
PUMP1 === '1' or IPTYP > 0  → Pump
Otherwise                     → Conduit
```

### Outfall Type Mapping (KO → SWMM5)

| KO | SWMM5 Type | Notes |
|---|---|---|
| 1 | `FREE` | Free outfall |
| 2 | `FIXED` | Fixed stage (uses DELTA value) |
| 3, 4 | `TIDAL` | Tidal boundary |
| 5, 6 | `TIMESERIES` | Stage/flow time series |

### Weir Type Mapping (KWEIR → SWMM5)

| KWEIR | SWMM5 Type |
|---|---|
| 1 | `TRANSVERSE` |
| 2 | `SIDEFLOW` |
| 3 | `V-NOTCH` |
| 4 | `TRAPEZOIDAL` |

### Pump Type Mapping (IPTYP → SWMM5 Curve)

| IPTYP | Curve Type | X-Axis | Y-Axis |
|---|---|---|---|
| 1 | `Pump1` | Volume | Flow |
| 2 | `Pump2` | Depth | Flow |
| 3 | `Pump3` | Head | Flow |
| 4 | `Pump4` | Depth | Flow |

### Job Control Mapping

| XP Field | SWMM5 Option | Conversion |
|---|---|---|
| `METRIC` | `FLOW_UNITS` | 0→CFS, 1→CMS |
| `KINE` | `FLOW_ROUTING` | 0→DYNWAVE, 3→KINWAVE, 4→DIFWAVE |
| `DELT` | `ROUTING_STEP` | Seconds → HH:MM:SS |
| `MFAIL` | `MAX_TRIALS` | Direct |
| `FUDGE` | `HEAD_TOLERANCE` | Direct |
| `KINE` | `INERTIAL_DAMPING` | 1→FULL, 2→NONE, else→PARTIAL |

### Infiltration Method Detection

| Condition | Method | SWMM5 Params |
|---|---|---|
| `f0 > 0` | Horton | f0, ff, fDecay, fDry, fMaxVol |
| `conduc > 0` (no f0) | Green-Ampt | suctionHead, conduc, initMoisDef |
| `curveNum > 0` (no f0/conduc) | SCS Curve Number | curveNum, conduc, fDry |

---

## 10. Water Quality / Pollutant Support

### Interfaces

```typescript
interface XPPollutant {
  name: string;          // e.g., 'TSS', 'BOD', 'TN'
  units: string;         // 'mg/L', 'ug/L', '#/L'
  cRain: number;         // Concentration in rainfall
  cGW: number;           // Concentration in groundwater
  cRDII: number;         // Concentration in RDII
  cInit: number;         // Initial concentration in conveyance
  decayCoeff: number;    // First-order decay (1/day)
  snowOnly: boolean;     // Snow-only pollutant
  coPollutant: string;   // Co-pollutant name ('*' = none)
  coFraction: number;    // Co-pollutant fraction
}

interface XPLanduse {
  name: string;
  sweepInterval: number;
  sweepFraction: number;
  sweepAvail: number;
}

interface XPBuildup {
  landuse: string;
  pollutant: string;
  funcType: string;     // 'POW' | 'EXP' | 'SAT' | 'EXT'
  c1: number;           // Max buildup or coefficient
  c2: number;           // Rate constant
  c3: number;           // Time exponent or half-saturation
  perUnit: string;      // 'AREA' | 'CURBLENGTH'
}

interface XPWashoff {
  landuse: string;
  pollutant: string;
  funcType: string;     // 'EXP' | 'RC' | 'EMC'
  c1: number;           // Coefficient
  c2: number;           // Exponent
  sweepEffic: number;   // Sweep removal efficiency
  bmPct: number;        // BMP removal efficiency
}

interface XPLoading {
  subcatchment: string;
  pollutant: string;
  value: number;        // Initial buildup mass
}
```

### Parsing Sources

| Source | Card | What's Extracted |
|---|---|---|
| `QUAL:Q1` | Pollutant definitions | Name, units, rain/GW concentrations, decay |
| `QUAL:Q2` | Buildup/washoff | Land use, function type, coefficients |
| `QUAL:Q3` | Initial loadings | Subcatchment-pollutant-value triplets |
| `RNFF:R6` | Subcatchment quality | Pollutant name, units, concentration |

### SWMM5 Sections Generated

- `[POLLUTANTS]` — Pollutant definitions with units and concentrations
- `[LANDUSES]` — Land use categories with sweep parameters
- `[BUILDUP]` — Buildup function per land use per pollutant
- `[WASHOFF]` — Washoff function per land use per pollutant
- `[LOADINGS]` — Initial pollutant buildup per subcatchment

---

## 11. Pump Curve Support

### Interface

```typescript
interface XPPumpCurve {
  name: string;           // Curve name (from PSEL or generated as PC_<linkname>)
  linkIdx: number;        // OI of the associated pump link
  pumpType: number;       // IPTYP: 1=vol, 2=depth, 3=head, 4=depth-flow
  pumpTypeName: string;   // Human-readable pump type
  curveType: string;      // SWMM5 curve type: Pump1, Pump2, Pump3, Pump4
  points: { x: number; y: number }[];  // Performance curve data
}
```

### Parsing

- Identifies pump links where `type === 'Pump'` and `IPTYP > 0`
- Extracts curve name from `PSEL` field on `H1A` card
- Reads X-Y data pairs from `EXTR:H2` and `EXTR:H3` cards
- Points sorted by X-value

### SWMM5 Output

```ini
[CURVES]
;;Name           Type       X-Value    Y-Value
PC_Pump1         Pump2      0.0000     0.0000
PC_Pump1                    5.0000     10.0000
;
```

### UI Visualization

- SVG line chart with scatter points showing pump performance curve
- X-axis label adapts to pump type (Volume / Depth / Head)
- Data table with all curve points
- Header shows pump link name, ON/OFF levels, point count

---

## 12. Transect / Irregular Cross-Section Support

### Interface

```typescript
interface XPTransect {
  name: string;         // Generated as XS_<linkname>
  linkIdx: number;      // OI of the associated link
  nLeft: number;        // Manning's n for left overbank
  nRight: number;       // Manning's n for right overbank
  nChannel: number;     // Manning's n for main channel
  leftBank: number;     // Station of left bank (auto: 20% width)
  rightBank: number;    // Station of right bank (auto: 80% width)
  points: { station: number; elevation: number }[];
}
```

### Parsing

- Identifies links where `NKLASS === 8` (Natural Channel) or `NKLASS === 15` (Irregular)
- Collects station-elevation pairs from:
  - `TRAN:*` cards (any card in TRAN group for that OI)
  - `EXTR:C2` cards
  - `EXTR:C3` cards
- Points sorted by station; duplicates removed
- Bank stations auto-detected at 20%/80% of total width
- Manning's n taken from conduit roughness field

### SWMM5 Output (HEC-2 Format)

```ini
[TRANSECTS]
NC  0.0350  0.0350  0.0350
X1  XS_Channel       10      20.00     80.00     0.0     0.0     0.0     0.0     0.0
GR  105.000  0.000  100.000  20.000  98.000  50.000  100.000  80.000
GR  105.000  100.000
;
```

The `[XSECTIONS]` section references transects for irregular links:
```ini
LinkName         IRREGULAR    XS_Channel 0          0          0          1
```

### UI Visualization

- SVG cross-section profile with filled polygon under the ground line
- Dashed bank station marker lines
- Data table with all station-elevation points
- Header shows link name, Manning's n, bank stations, point count

---

## 13. Time Series Support

### Interface

```typescript
interface XPTimeSeries {
  name: string;          // Generated as TS_<nodename>
  nodeIdx: number;       // OI of the associated node
  type: string;          // 'FLOW' or 'STAGE'
  points: { time: number; value: number }[];
  timeFactor: number;    // Multiplier to convert stored time to hours
  valueFactor: number;   // Multiplier for flow/stage values
}
```

### Parsing

- Reads `EXTR:D2` header for inflow type (1=flow, 2=stage), pair count, scale factors
- Collects time-value pairs from `EXTR:D2` data records
- Also checks `EXTR:D3` cards for continuation data
- Values scaled by TSFACT and QFACT
- Points sorted by time; duplicates removed

### SWMM5 Output

```ini
[TIMESERIES]
;;Name           Time       Value
TS_Node1         0.0000     0.0000
TS_Node1         1.0000     5.2300
;

[INFLOWS]
;;Node           Constituent  Time Series      Type     Mfactor  Sfactor  Baseline
Node1            FLOW         TS_Node1         FLOW     1.0      1.0      0
```

### UI Visualization

- SVG bar chart showing hydrograph shape
- Peak value, duration, and point count in header
- Data table (first 20 points shown, overflow noted)

---

## 14. Subcatchment Support

### Interface

```typescript
interface XPSubcatchment {
  idx: number;
  name: string;
  area: number;          // Acres or hectares
  width: number;         // Overland flow width
  slope: number;         // Average slope (%)
  imperv: number;        // % Imperviousness
  outlet: string;        // Outlet node name
  nImperv: number;       // Manning's N for impervious area
  nPerv: number;         // Manning's N for pervious area
  dsImperv: number;      // Depression storage for impervious (in/mm)
  dsPerv: number;        // Depression storage for pervious (in/mm)
  pctZero: number;       // % of impervious area with zero storage
  routeTo: string;       // 'OUTLET' | 'IMPERVIOUS' | 'PERVIOUS'
  // Horton infiltration
  f0: number;            // Max infiltration rate
  ff: number;            // Min infiltration rate
  fDecay: number;        // Decay constant (1/hr)
  fDry: number;          // Drying time (days)
  fMaxVol: number;       // Max volume
  // Green-Ampt / SCS
  curveNum: number;      // SCS Curve Number
  conduc: number;        // Hydraulic conductivity
  suctionHead: number;   // Suction head
  initMoisDef: number;   // Initial moisture deficit
  // Rain gage
  rainGage: string;      // Rain gage name ('*' = none)
}
```

### Parsing

- Reads `RNFF:R1` through `RNFF:R5` cards for each subcatchment OI
- R1: Physical properties (name, area, width, slope, imperviousness, outlet)
- R2: Surface properties (Manning's N, depression storage, routing)
- R3: Horton infiltration parameters
- R4: Green-Ampt / SCS parameters
- R5: Rain gage reference

### SWMM5 Output

Generates three sections:
- `[SUBCATCHMENTS]` — Physical properties
- `[SUBAREAS]` — Surface parameters
- `[INFILTRATION]` — Method auto-detected (Horton if f0 > 0, Green-Ampt if conduc > 0, SCS if curveNum > 0)

---

## 15. Design System

### CSS Variables (HSL, in `index.css`)

```css
:root {
  --background: 218 24% 97%;     /* Light mode background */
  --foreground: 217 33% 17%;     /* Light mode text */
  --primary: 217 91% 60%;        /* Blue accent */
  --success: 142 71% 45%;        /* Green for links/done */
  --warning: 38 92% 50%;         /* Orange for outfalls */
  --destructive: 0 84% 60%;      /* Red for errors/pollutants */
  --muted: 220 14% 95%;          /* Subtle backgrounds */
  --accent: 217 91% 60%;         /* Interactive elements */
  --card: 0 0% 100%;             /* Card surfaces */
  --border: 220 13% 91%;         /* Borders */
}

.dark {
  --background: 224 71% 4%;
  --foreground: 213 31% 91%;
  /* ... dark mode overrides */
}
```

Dark mode overrides in `.dark` class. Theme persisted via `localStorage('xp-theme')`.

### Color Usage Convention

| Token | Usage |
|---|---|
| `text-primary` | Node names, link names, active data values |
| `text-success` | Link counts, transect badges |
| `text-warning` | Type labels, outfall counts, function type badges |
| `text-destructive` | Error states, pollutant badges |
| `text-muted-foreground` | Labels, column headers, secondary info |
| `bg-muted/50` | Table header backgrounds |
| `bg-primary/10` | Badge backgrounds |

### Font Strategy

- **UI text:** System font stack via Tailwind defaults
- **Data/code:** `font-mono` (monospace) for ALL table data, card dumps, field names, badges
- **Sizing:** `text-xs` for table cells, `text-sm` for descriptions, `text-2xl` for summary counts

### Component Library

40+ shadcn/ui components including: Accordion, Alert, Badge, Button, Card, Checkbox, Dialog, Dropdown, Input, Label, Select, Tabs, Table, Tooltip, Toast, etc.

---

## 16. Extending the Project

### Adding a new XP card field

1. Add entry to `DB` in `xp-parser.ts`:
   ```typescript
   NEWFIELD: { g:'EXTR', c:'XX', p:10, w:8, t:2 }
   ```
2. Add to `XPNode`, `XPLink`, or `XPSubcatchment` interface
3. Extract in `parseNativeXP()` at the appropriate phase
4. Add to XPX field map if supporting XPX format
5. Map in `buildINP()` to appropriate SWMM5 section

### Adding a new SWMM5 section

1. In `swmm5-builder.ts`, filter/access the relevant data from `XPParseResult`
2. Append section header with SWMM5 comment conventions (`;;`)
3. Format rows using `pd()` (padEnd) and `f()` (number format) helpers
4. Add after existing sections, before `[REPORT]`

### Adding a new data type (e.g., Controls, LID)

1. Create interface in `xp-parser.ts` (e.g., `XPControl`)
2. Add array to `XPParser` class and `XPParseResult` interface
3. Add parsing phase in `parseNativeXP()` 
4. Add SWMM5 generation in `buildINP()`
5. Add tab in `XPReader.tsx` (conditional on data.length > 0)
6. Add CSV export button in Export tab
7. Include in JSON export
8. Add summary count card

### Adding a new file format

1. Add detection logic in `XPParser.parse()` (check for format markers)
2. Create new `parseXYZ()` method in the `XPParser` class
3. Populate the same `XPParseResult` structure
4. Format auto-detection is based on content, not file extension

### Adding a new UI tab

1. Add `TabsTrigger` with conditional rendering (`{data.length > 0 && ...}`)
2. Add `TabsContent` with table/visualization
3. Follow existing patterns: font-mono, text-xs, bg-muted/50 headers
4. Add Badge in file info bar
5. Add summary count in Summary tab grid

---

## 17. Known Limitations

| Area | Status | Notes |
|---|---|---|
| **Subcatchments** | ✅ | Horton, Green-Ampt, SCS infiltration — parsed and converted |
| **Time Series** | ✅ | Inflow hydrographs from D2/D3 cards — with SVG visualization |
| **Pump Curves** | ✅ | Types 1–4 from H2/H3 cards — `[CURVES]` section generated |
| **Transects** | ✅ | Station-elevation from TRAN/C2/C3 — HEC-2 `[TRANSECTS]` format |
| **Pollutants** | ✅ | Definitions, land uses, buildup/washoff, loadings from QUAL/RNFF |
| **Controls/Rules** | ❌ | Real-time control rules not parsed or mapped |
| **LID Controls** | ❌ | Low-impact development not supported |
| **Groundwater** | ❌ | GW flow equations not extracted |
| **Snow Pack** | ❌ | Snow melt parameters not converted |
| **Rain Gages** | ⚠️ | Rain gage names referenced but gage definitions not generated |
| **Multi-conduit** | ⚠️ | Only primary conduit (grpno 0/1) exported; dashlinks partially supported |
| **Coordinate transforms** | ⚠️ | Raw database coordinates used; no PointPlaneToUser transformation |
| **RTF wrapper** | ⚠️ | Basic RTF stripping; complex RTF may leave artifacts |
| **GitHub API** | ⚠️ | 60 requests/hour unauthenticated; max 10 subdirectories scanned |
| **Bank stations** | ⚠️ | Auto-detected at 20%/80% width — may not match original model |

---

## 18. Deployment

### Dependencies

**Runtime:**
- React 18, react-router-dom, react-dom
- lucide-react (icons)
- jszip (ZIP file creation)
- recharts (chart library, available)
- shadcn/ui (40+ Radix primitive components)
- @tanstack/react-query
- sonner (toasts)

**Build:**
- Vite 5
- TypeScript 5
- Tailwind CSS 3 + tailwindcss-animate
- PostCSS

**No backend required** — static site deployment.

### Build

```bash
npm run build        # Production build → dist/
npm run dev          # Dev server with HMR
```

### Environment

No environment variables or API keys needed. The GitHub batch feature uses the public GitHub API without authentication.

### Routes

| Path | Page | Description |
|---|---|---|
| `/` | Index | Landing page with drag-drop converter |
| `/reader` | XPReader | Interactive card reader / file inspector |
| `/github-batch` | GitHubBatch | GitHub + local folder batch converter |
| `/docs` | Documentation | Full documentation |
| `*` | NotFound | 404 page |

---

## 19. Origins & Format Lineage

### The Architect of the .xp Format

Robert Dickinson didn't just use XPSWMM — he designed its DNA. From 1992 to 1999, as Senior Vice President for XP Software, he designed the `.xp` file format itself, building it on the XP visual engine as a text database of 80-column fixed-width card images inherited from the EPA SWMM3 Fortran code he had been working with since 1974. He also created the `.xpx` interchange format — a simpler `[NODE]/[LINK]` section-based export that made XPSWMM data portable. Every `.xp` file ever written follows the architecture Bob laid out: GROUP + CARD + Object Index + 80 columns of data at the exact byte offsets defined in `Swmfield.c`.

At CAiCE Software, he developed Visual SWMM — which ran from CAiCE's VBA code for AutoCAD — along with Visual Hydro, Visual Culvert, and Visual Inlets, a suite of hydraulic design tools for the AutoCAD platform. When Autodesk acquired CAiCE in 2002, the water tools didn't survive the transition — a VP told Bob in Clearwater that he didn't understand the role of rainfall in road design.

The irony would take two decades to resolve: Autodesk eventually acquired Innovyze in 2021 and hired Bob as a Water Technologist, finally recognizing that water is inseparable from infrastructure.

His SWMM lineage spans the entire history: co-developing Versions 3, 4, and 5, writing the RTK/RDII implementation during the SWMM5 CRADA, then spending nearly two decades at Innovyze supporting InfoSWMM, InfoSewer, and RDII Analyst. Now Chair of the SWMM5+ Technical Advisory Committee at [CIMM.org](https://cimm.org) with over 50 years of continuous SWMM development and 1,700+ blog posts on [SWMM5.org](https://swmm5.org), Bob is quite literally the person who designed the format this parser reads — and one of the few people on earth who understands every column position because he put them there.

### Format Timeline

| Year | Milestone |
|---|---|
| **1974** | Bob begins working with EPA SWMM Fortran code — the 80-column card image format originates here |
| **1988** | SWMM3/4 — fixed-width card IDs (D1, C1, B1, etc.) define the field layout |
| **1992–99** | XP Software — Bob designs the `.xp` native format: GROUP:CARD records with Object Index addressing |
| **~1995** | `.xpx` interchange format created — `[NODE]/[LINK]` key=value sections for data portability |
| **1998–02** | CAiCE Software — Visual SWMM, Visual Hydro, Visual Culvert, Visual Inlets for AutoCAD |
| **2002** | Autodesk acquires CAiCE — water tools discontinued |
| **2003–05** | SWMM5 CRADA — Bob co-develops EPA SWMM5 `.inp` format, writes RTK/RDII implementation |
| **2005–21** | Innovyze — InfoSWMM, InfoSewer, RDII Analyst, ICM SWMM |
| **2021** | Autodesk acquires Innovyze — Bob hired as Water Technologist, full circle |
| **Present** | Chair of SWMM5+ TAC at CIMM.org — 50+ years of continuous SWMM development |

---

## License & Credits

- **SWMM5 format:** EPA Storm Water Management Model specification
- **XP format:** CAiCE database engine format designed by Robert Dickinson at XP Software
- **Original C source reference:** `Swmfield.c`, `Swmfield.h`, `Exporun.c`, `Edovl.c`, `Export.c`
- **Built with:** [Lovable](https://lovable.dev)
