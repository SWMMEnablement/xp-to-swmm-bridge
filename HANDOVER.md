# XPSWMM to SWMM5 Converter — Project Handover

> **Version:** 1.0  
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
10. [Design System](#10-design-system)
11. [Extending the Project](#11-extending-the-project)
12. [Known Limitations](#12-known-limitations)
13. [Deployment](#13-deployment)

---

## 1. Project Overview

A **client-side** web application that converts XPSWMM proprietary `.xp` files into EPA SWMM5 `.inp` format. All parsing and conversion happens in the browser — no server required, no files uploaded.

### Key capabilities

| Feature | Description |
|---|---|
| **Single-file conversion** | Drop a `.xp` file → auto-downloads `.inp` |
| **Card Reader** | Interactive inspector with tabs for nodes, links, job control, network map, raw cards, export |
| **GitHub Batch** | Paste a public GitHub repo URL → scans for `.xp` files → batch convert |
| **Local Folder Batch** | Select a local folder → pick files with checkboxes → batch convert |
| **ZIP Download** | Download all converted `.inp` files as a single ZIP archive |
| **Dark Mode** | Theme toggle persisted to localStorage |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│                                                  │
│  ┌──────────┐    ┌───────────┐    ┌───────────┐ │
│  │ .xp file │───▶│ XPParser  │───▶│ XPParse   │ │
│  │ (text)   │    │           │    │ Result    │ │
│  └──────────┘    └───────────┘    └─────┬─────┘ │
│                                         │       │
│                                    ┌────▼────┐  │
│                                    │buildINP │  │
│                                    │         │  │
│                                    └────┬────┘  │
│                                         │       │
│                                    ┌────▼────┐  │
│                                    │ .inp    │  │
│                                    │ file    │  │
│                                    └─────────┘  │
└─────────────────────────────────────────────────┘
```

**Zero backend dependencies.** The GitHub batch feature uses GitHub's public REST API (`api.github.com`) directly from the browser.

---

## 3. File Structure

```
src/
├── lib/
│   ├── xp-parser.ts          # XP file parser (539 lines)
│   ├── swmm5-builder.ts      # SWMM5 .inp generator (182 lines)
│   └── utils.ts              # Tailwind merge utility
├── pages/
│   ├── Index.tsx              # Landing page with drag-drop converter
│   ├── XPReader.tsx           # Card Reader with tabbed inspector
│   ├── GitHubBatch.tsx        # GitHub + local folder batch converter
│   ├── Documentation.tsx      # Full documentation with handover tab
│   └── NotFound.tsx           # 404 page
├── components/
│   ├── Header.tsx             # Nav bar + dark mode toggle
│   ├── FileUpload.tsx         # Drag-drop file upload
│   ├── ConversionOptions.tsx  # Conversion settings
│   ├── ResultsPanel.tsx       # Conversion results display
│   ├── ProgressIndicator.tsx  # Progress bar
│   ├── ConversionLog.tsx      # Log output
│   └── ui/                    # shadcn/ui components
├── index.css                  # Design tokens (HSL colors, gradients)
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
| **Native XP** (card) | Group codes like `EXTR`, `ZZZN` | `parseNativeXP()` — 80-col fixed-width |
| **SWMM 3/4** | Card IDs like `D1`, `C1` | `parseSWMM34()` — legacy format |

#### DB Field Definitions

The `DB` constant maps field names to their card positions using the `FieldDef` structure:

```typescript
interface FieldDef {
  g: string;  // Group (e.g., 'EXTR')
  c: string;  // Card (e.g., 'C1', 'SP1N')
  p: number;  // Column position (1-based)
  w: number;  // Width in characters
  t: number;  // Type: 1=int, 2=real, 3=coded, 4=flag, 5=string
}
```

These definitions are derived from the original C source (`Swmfield.c` / `Swmfield.h`).

#### Parse Result Structure

```typescript
interface XPParseResult {
  nodes: XPNode[];           // Junction, Outfall, Storage
  links: XPLink[];           // Conduit, Orifice, Weir, Pump
  jobControl: Record<string, string>;  // A1, B1, B2, BB1, BB2 cards
  rawCards: Record<string, { data: string }[]>;  // All raw card data
  format: string;            // 'XP_CARD', 'XPX', 'SWMM34'
  title: string;
  warnings: string[];
}
```

#### Native XP Parsing Phases

1. **Phase 1:** Read all lines into `RecordMap` keyed by `group:card`, organized by object index (OI) and sub-group
2. **Phase 2:** Extract node names and coordinates from `ZZZN:NODE` records
3. **Phase 3:** Extract edge connectivity from `ZZZE:EDGE` records (upstream/downstream node OIs)
4. **Phase 4:** Collect all node/link OIs from EXTR cards (SP1N, D1, C1, F1, G1, H1A, etc.)
5. **Phase 5:** Build `XPNode` objects with ground elevation, initial depth, outfall type, storage
6. **Phase 6:** Build `XPLink` objects with shape, dimensions, roughness, slope, special types
7. **Phase 7:** Discover nodes from link endpoints if no nodes found directly
8. **Phase 8:** Extract title from A1 card and job control parameters

#### Key Lookup Codes

| Code Map | Values |
|---|---|
| `SHAPE_CODES` | 1=Circular, 2=Rectangular, 3=Horseshoe, 6=Trapezoidal, 8=Natural Channel, etc. |
| `OUTFALL_CODES` | 0=None, 1=Free, 2=Fixed Backwater, 3=User Tide, 5=Stage History, etc. |
| `ROUTING_CODES` | 0=Std Dynamic Wave, 1=Always Non-linear, 3=Kinematic Wave, 4=Diffusion Wave |
| `WEIR_CODES` | 1=Transverse, 2=Side-flow, 3=V-Notch, 4=Broad-crested |
| `PUMP_CODES` | 1=Type 1 (vol), 2=Type 2 (depth), 3=Type 3 (head), 4=Type 4 (depth-flow) |

### 4.2 SWMM5 Builder (`src/lib/swmm5-builder.ts`)

Generates a standards-compliant SWMM5 `.inp` file from `XPParseResult`.

#### Generated Sections

| Section | Source |
|---|---|
| `[TITLE]` | `result.title` or A1 card |
| `[OPTIONS]` | Job control: METRIC→FLOW_UNITS, KINE→FLOW_ROUTING, DELT→ROUTING_STEP |
| `[JUNCTIONS]` | Nodes where `type === 'Junction'` |
| `[OUTFALLS]` | Nodes where `type === 'Outfall'`, KO code → FREE/FIXED/TIDAL/TIMESERIES |
| `[STORAGE]` | Nodes where `type === 'Storage'`, FUNCTIONAL shape with ASTORE |
| `[CONDUITS]` | Links where `type === 'Conduit'` |
| `[ORIFICES]` | Links where `type === 'Orifice'` |
| `[WEIRS]` | Links where `type === 'Weir'`, KWEIR → TRANSVERSE/SIDEFLOW/V-NOTCH/TRAPEZOIDAL |
| `[PUMPS]` | Links where `type === 'Pump'` |
| `[XSECTIONS]` | Cross-sections for conduits, orifices, weirs. NKLASS → SWMM5 shape name |
| `[LOSSES]` | Entry/exit/average losses for conduits (defaults to 0) |
| `[INFLOWS]` | Nodes with `qinst > 0` |
| `[COORDINATES]` | Nodes with X/Y coordinates |
| `[MAP]` | Bounding box from coordinate extents |
| `[REPORT]` | Default: ALL for subcatchments, nodes, links |

#### Shape Code Mapping (NKLASS → SWMM5)

```
1  → CIRCULAR          9  → GOTHIC
2  → RECT_CLOSED      10  → CATENARY
3  → HORSESHOE        11  → SEMIELLIPTICAL
4  → EGG              12  → BASKETHANDLE
5  → BASKETHANDLE     13  → CUSTOM
6  → TRAPEZOIDAL      14  → ARCH
7  → POWER            16  → PARABOLIC
8  → IRREGULAR        17  → RECT_CLOSED
```

---

## 5. Pages & Features

### 5.1 Landing Page (`/`)

- Drag-and-drop zone for `.xp` files
- Auto-converts and downloads `.inp` on drop
- Quick overview of conversion capabilities

### 5.2 Card Reader (`/reader`)

Interactive file inspector with 7 tabs:

| Tab | Content |
|---|---|
| **Summary** | Node/link counts by type, conduit shape distribution |
| **Nodes** | Filterable table: name, type, X, Y, elevation, initial depth, outfall type |
| **Links** | Filterable table: name, type, shape, US/DS nodes, dimensions, roughness, slope |
| **Job Control** | Parameters grouped by card (A1, B1, B2, BB1, BB2) |
| **Network Map** | SVG visualization with nodes colored by type and links as edges |
| **Raw Cards** | All parsed cards with 80-column ruler and hex-dump-style view |
| **Export** | Download buttons for Nodes CSV, Links CSV, Full JSON, SWMM5 .inp; DbFieldDef reference table |

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
    ├── Extract ZZZN nodes (names + coordinates)
    │
    ├── Extract ZZZE edges (connectivity)
    │
    ├── Build XPNode[] from EXTR:SP1N, D1, J3, E1
    │
    ├── Build XPLink[] from EXTR:SPDN, SPDV, C1, F1, G1, H1A
    │
    └── Extract job control from A1, B0-B2, BB1-BB2
    │
    ▼
XPParseResult { nodes, links, jobControl, rawCards }
    │
    ▼
buildINP(result) → SWMM5 .inp text
    │
    ▼
Download / ZIP / Display
```

---

## 7. XP File Format Reference

### Native XP Card Format (80-column fixed-width)

```
Columns:  1-4    Group code (EXTR, ZZZN, ZZZE, etc.)
          5-8    Sub-group number
          9-12   Card type (SP1N, D1, C1, etc.)
         13-16   (reserved)
         17-20   Object Index (OI)
         21-24   (reserved)
         25-80   Data fields (positions defined by DB)
```

### Key Card Types

| Card | Contains |
|---|---|
| `SP1N` | Node name, X/Y coords, inflow flag, outfall flag |
| `D1` | Ground elevation, initial depth, constant inflow |
| `J3` | Outfall type (KO), head loss delta |
| `E1` | Crown elevation (ZTOP), storage area (ASTORE) |
| `SPDN` | Link name, upstream node, downstream node |
| `SPDV` | Multi-conduit flags (conduit/pump/orifice/weir enables) |
| `C1` | Conduit shape (NKLASS), depth, width, length, inverts, roughness |
| `C1A` | Conduit slope |
| `C6` | Number of barrels |
| `F1` | Orifice area, coefficient, diameter |
| `G1` | Weir type (KWEIR), crest height, top, length, coefficient |
| `H1A` | Pump type (IPTYP), on/off levels, curve selection |
| `A1` | Title line |
| `B0` | Control flags (junction defaults, routing, tolerances) |
| `B1` | Time step (DELT), output intervals |
| `B2` | Units (METRIC), junction parameters |
| `BB1` | Min/max Froude numbers |
| `BB2` | Max iterations (MFAIL), head tolerance (FUDGE), smoothing, routing method (KINE) |

### ZZZN/ZZZE Records

- `ZZZN:NODE` — Node definitions with name and spatial coordinates
- `ZZZE:EDGE` — Edge definitions with upstream/downstream node OI references

---

## 8. SWMM5 Output Format

The generated `.inp` follows EPA SWMM5 specification:

```ini
[TITLE]
Project title from A1 card

[OPTIONS]
FLOW_UNITS           CFS          ;; or CMS if METRIC=1
FLOW_ROUTING         DYNWAVE      ;; from KINE: 0→DYNWAVE, 3→KINWAVE, 4→DIFWAVE
ROUTING_STEP         00:00:30     ;; from DELT
INERTIAL_DAMPING     PARTIAL      ;; from KINE

[JUNCTIONS]
;;Name           Elev       MaxDepth   InitDepth  SurDepth   Aponded
Node1            100.00     10.00      0.00       0          0

[CONDUITS]
;;Name           From             To               Length     Roughness  InOffset   OutOffset
Link1            Node1            Node2             500.00     0.0130     98.00      95.00

[XSECTIONS]
;;Link           Shape        Geom1      Geom2      Geom3      Geom4      Barrels
Link1            CIRCULAR     1.20       0          0          0          1
```

---

## 9. Element Mapping

### Node Type Detection

```
KO > 0                    → Outfall (KO maps to outfall type)
ASTORE > 0 or ZTOP > 0   → Storage
Otherwise                 → Junction
```

### Link Type Detection (from SPDV flags)

```
ORIF1 === '1' or AORIF > 0  → Orifice
WEIR1 === '1' or KWEIR > 0  → Weir
PUMP1 === '1' or IPTYP > 0  → Pump
Otherwise                     → Conduit
```

### Job Control Mapping

| XP Field | SWMM5 Option |
|---|---|
| `METRIC` | `FLOW_UNITS` (0→CFS, 1→CMS) |
| `KINE` | `FLOW_ROUTING` (0→DYNWAVE, 3→KINWAVE, 4→DIFWAVE) |
| `DELT` | `ROUTING_STEP` |
| `MFAIL` | `MAX_TRIALS` |
| `FUDGE` | `HEAD_TOLERANCE` |
| `KINE` | `INERTIAL_DAMPING` (1→FULL, 2→NONE, else→PARTIAL) |

---

## 10. Design System

### CSS Variables (HSL, in `index.css`)

```css
--background: 218 24% 97%;     /* Light mode bg */
--foreground: 217 33% 17%;
--primary: 217 91% 60%;        /* Blue accent */
--success: 142 71% 45%;        /* Green for links/done */
--warning: 38 92% 50%;         /* Orange for outfalls */
--destructive: 0 84% 60%;      /* Red for errors */
```

Dark mode overrides in `.dark` class. Theme persisted via `localStorage('xp-theme')`.

### Font Strategy

- **UI text:** System font stack via Tailwind defaults
- **Data/code:** `font-mono` (monospace) for all table data, card dumps, field names

---

## 11. Extending the Project

### Adding a new XP card field

1. Add entry to `DB` in `xp-parser.ts`:
   ```typescript
   NEWFIELD: { g:'EXTR', c:'XX', p:10, w:8, t:2 }
   ```
2. Add to `XPNode` or `XPLink` interface
3. Extract in `parseNativeXP()` Phase 5 or 6
4. Map in `buildINP()` to appropriate SWMM5 section

### Adding a new SWMM5 section

1. In `swmm5-builder.ts`, filter nodes/links as needed
2. Append section header and formatted rows to `inp` string
3. Follow SWMM5 column-aligned format convention

### Adding a new file format

1. Add detection logic in `XPParser.parse()`
2. Create new `parseXYZ()` method
3. Populate same `XPParseResult` structure

---

## 12. Known Limitations

| Area | Limitation |
|---|---|
| **Subcatchments** | Not parsed (SWMM Runoff block not implemented) |
| **Time series** | Inflow time series references not converted |
| **Pump curves** | Referenced by name but curve data not extracted |
| **Transects** | Irregular cross-section station-elevation data not parsed |
| **Pollutants** | Water quality parameters not converted |
| **Controls/Rules** | Real-time control rules not mapped |
| **Multi-conduit** | Only primary conduit (grpno 0/1) exported; multi-conduit dashlinks partially supported |
| **Coordinate transforms** | Raw database coordinates used; no PointPlaneToUser transformation |
| **RTF wrapper** | Basic RTF stripping; complex RTF may leave artifacts |
| **GitHub API** | 60 requests/hour unauthenticated; max 10 subdirectories scanned |

---

## 13. Deployment

### Dependencies

- **Runtime:** React 18, react-router-dom, lucide-react, jszip, shadcn/ui (Radix primitives)
- **Build:** Vite 5, TypeScript 5, Tailwind CSS 3, PostCSS
- **No backend required** — static site deployment

### Build

```bash
npm run build        # Production build → dist/
npm run dev          # Dev server with HMR
```

### Environment

No environment variables or API keys needed. The GitHub batch feature uses the public GitHub API without authentication.

---

## 14. Origins & Format Lineage

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
