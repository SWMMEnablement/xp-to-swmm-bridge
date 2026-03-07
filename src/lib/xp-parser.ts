// ===================================================================
// XPSWMM .xp File Parser - TypeScript port
// .xp files are TEXT — 80-column fixed-width punch card images
// stored in the CAiCE database engine format.
// ===================================================================

export const SHAPE_CODES: Record<number, string> = {
  1:'Circular',2:'Rectangular',3:'Horseshoe',4:'Egg',5:'Basket-handle',
  6:'Trapezoidal',7:'Power Function',8:'Natural Channel',9:'Gothic',10:'Catenary',
  11:'Semi-Elliptical',12:'Modified Basket',13:'User Defined',14:'Arch Pipe',
  15:'Irregular',16:'Parabolic',17:'Rect Closed',18:'Semi-Circular',
  19:'Rect Round',20:'Rect Triangular'
};

export const OUTFALL_CODES: Record<number, string> = {
  0:'None',1:'Free Outfall',2:'Fixed Backwater',3:'User Tide',
  4:'Computed Tide',5:'Stage History',6:'Flow History',7:'Rating Curve'
};

export const ROUTING_CODES: Record<number, string> = {
  0:'Std Dynamic Wave',1:'Always Non-linear',2:'Never Non-linear',
  3:'Kinematic Wave',4:'Diffusion Wave'
};

export const WEIR_CODES: Record<number, string> = {
  1:'Transverse',2:'Side-flow',3:'V-Notch',4:'Broad-crested'
};

export const PUMP_CODES: Record<number, string> = {
  1:'Type 1 (vol)',2:'Type 2 (depth)',3:'Type 3 (head)',4:'Type 4 (depth-flow)'
};

interface FieldDef {
  g: string; c: string; p: number; w: number; t: number;
}

export const DB: Record<string, FieldDef> = {
  NODNAM:{g:'EXTR',c:'SP1N',p:62,w:10,t:5}, NODX:{g:'EXTR',c:'SP1N',p:6,w:12,t:2},
  NODY:{g:'EXTR',c:'SP1N',p:18,w:12,t:2}, INQ:{g:'EXTR',c:'SP1N',p:5,w:1,t:4},
  NODST:{g:'EXTR',c:'SP1N',p:30,w:1,t:4}, JPRT:{g:'EXTR',c:'SP1N',p:54,w:1,t:4},
  JPLT:{g:'EXTR',c:'SP1N',p:56,w:1,t:4}, FLGOUTF:{g:'EXTR',c:'SP1N',p:50,w:1,t:4},
  GINFLOW:{g:'EXTR',c:'SP1N',p:73,w:2,t:4}, ICAP:{g:'EXTR',c:'SP1N',p:75,w:2,t:4},
  GRELEV:{g:'EXTR',c:'D1',p:13,w:8,t:2}, Y0:{g:'EXTR',c:'D1',p:40,w:7,t:2},
  QINST:{g:'EXTR',c:'D1',p:31,w:8,t:2}, JNRR:{g:'EXTR',c:'D1',p:50,w:1,t:4},
  A1:{g:'EXTR',c:'J2',p:4,w:7,t:2}, A2:{g:'EXTR',c:'J2',p:18,w:7,t:2},
  A3:{g:'EXTR',c:'J2',p:26,w:7,t:2}, A4:{g:'EXTR',c:'J2',p:34,w:7,t:2},
  A5:{g:'EXTR',c:'J2',p:42,w:7,t:2}, A6:{g:'EXTR',c:'J2',p:50,w:7,t:2},
  A7:{g:'EXTR',c:'J2',p:58,w:7,t:2},
  KO:{g:'EXTR',c:'J3',p:4,w:1,t:3}, DELTA:{g:'EXTR',c:'J3',p:11,w:8,t:2},
  ZTOP:{g:'EXTR',c:'E1',p:13,w:7,t:2}, ASTORE:{g:'EXTR',c:'E1',p:21,w:7,t:2},
  CNTLS:{g:'EXTR',c:'E1',p:70,w:1,t:3},
  CNAME1:{g:'EXTR',c:'SPDN',p:1,w:10,t:5}, CNAME2:{g:'EXTR',c:'SPDN',p:11,w:10,t:5},
  CNAME3:{g:'EXTR',c:'SPDN',p:21,w:10,t:5}, CNAME4:{g:'EXTR',c:'SPDN',p:31,w:10,t:5},
  COND1:{g:'EXTR',c:'SPDV',p:1,w:1,t:4}, PUMP1:{g:'EXTR',c:'SPDV',p:8,w:1,t:4},
  ORIF1:{g:'EXTR',c:'SPDV',p:15,w:1,t:4}, WEIR1:{g:'EXTR',c:'SPDV',p:22,w:1,t:4},
  NKLASS:{g:'EXTR',c:'C1',p:13,w:2,t:3}, AFULL:{g:'EXTR',c:'C1',p:16,w:8,t:2},
  DEEP:{g:'EXTR',c:'C1',p:25,w:7,t:2}, WIDE:{g:'EXTR',c:'C1',p:34,w:7,t:2},
  LEN:{g:'EXTR',c:'C1',p:43,w:8,t:2}, ZP1:{g:'EXTR',c:'C1',p:52,w:8,t:2},
  ZP2:{g:'EXTR',c:'C1',p:61,w:8,t:2}, ROUGH:{g:'EXTR',c:'C1',p:70,w:10,t:2},
  SLOPE:{g:'EXTR',c:'C1A',p:27,w:8,t:2},
  BARREL:{g:'EXTR',c:'C6',p:67,w:8,t:2},
  AORIF:{g:'EXTR',c:'F1',p:25,w:6,t:2}, CORIF:{g:'EXTR',c:'F1',p:32,w:4,t:2},
  ZP:{g:'EXTR',c:'F1',p:37,w:7,t:2}, DORIF:{g:'EXTR',c:'F1',p:45,w:10,t:2},
  ONKLASS:{g:'EXTR',c:'F1',p:23,w:1,t:3},
  KWEIR:{g:'EXTR',c:'G1',p:22,w:1,t:3}, YCREST:{g:'EXTR',c:'G1',p:24,w:8,t:2},
  YTOP:{g:'EXTR',c:'G1',p:33,w:8,t:2}, WLEN:{g:'EXTR',c:'G1',p:44,w:6,t:2},
  COEFF:{g:'EXTR',c:'G1',p:53,w:4,t:2},
  IPTYP:{g:'EXTR',c:'H1A',p:1,w:2,t:3}, PON:{g:'EXTR',c:'H1A',p:11,w:8,t:2},
  POFF:{g:'EXTR',c:'H1A',p:19,w:8,t:2}, PSEL:{g:'EXTR',c:'H1A',p:51,w:20,t:5},
  ALPHA:{g:'EXTR',c:'A1',p:5,w:75,t:5}, ALPHB:{g:'EXTR',c:'A1B',p:5,w:75,t:5},
  CNTLJD:{g:'EXTR',c:'B0',p:64,w:1,t:4}, CNTLMC:{g:'EXTR',c:'B0',p:66,w:1,t:4},
  CNTLR:{g:'EXTR',c:'B0',p:70,w:1,t:4}, CNTLT:{g:'EXTR',c:'B0',p:68,w:1,t:4},
  DELT:{g:'EXTR',c:'B1',p:10,w:6,t:2}, INTER:{g:'EXTR',c:'B1',p:30,w:4,t:1},
  JNTER:{g:'EXTR',c:'B1',p:35,w:4,t:1}, HLOSS:{g:'EXTR',c:'B1',p:42,w:8,t:2},
  METRIC:{g:'EXTR',c:'B2',p:4,w:1,t:3}, AMEN:{g:'EXTR',c:'B2',p:11,w:7,t:2},
  MAXE:{g:'EXTR',c:'B2',p:72,w:6,t:2},
  FMIN:{g:'EXTR',c:'BB1',p:51,w:8,t:2}, FMAX:{g:'EXTR',c:'BB1',p:60,w:8,t:2},
  MFAIL:{g:'EXTR',c:'BB2',p:6,w:8,t:1}, FUDGE:{g:'EXTR',c:'BB2',p:15,w:8,t:2},
  AJ1:{g:'EXTR',c:'BB2',p:24,w:8,t:2}, AJ2:{g:'EXTR',c:'BB2',p:33,w:8,t:2},
  ISMTH:{g:'EXTR',c:'BB2',p:51,w:8,t:1}, KSUPER:{g:'EXTR',c:'BB2',p:77,w:1,t:3},
  ISOL:{g:'EXTR',c:'BB2',p:78,w:1,t:3}, KINE:{g:'EXTR',c:'BB2',p:79,w:1,t:3},
  // Runoff block (RNFF) subcatchment fields
  SNAME:{g:'RNFF',c:'R1',p:1,w:10,t:5},    // Subcatchment name
  SAREA:{g:'RNFF',c:'R1',p:11,w:10,t:2},    // Area (acres or hectares)
  SWID:{g:'RNFF',c:'R1',p:21,w:10,t:2},     // Width (ft or m)
  SSLOPE:{g:'RNFF',c:'R1',p:31,w:10,t:2},   // Slope (%)
  SIMPERV:{g:'RNFF',c:'R1',p:41,w:10,t:2},  // % Imperviousness
  SOUTLET:{g:'RNFF',c:'R1',p:51,w:10,t:5},  // Outlet node name
  SNIMP:{g:'RNFF',c:'R2',p:1,w:10,t:2},     // Manning's N impervious
  SNPERV:{g:'RNFF',c:'R2',p:11,w:10,t:2},   // Manning's N pervious
  SDSIP:{g:'RNFF',c:'R2',p:21,w:10,t:2},    // Depression storage imperv (in/mm)
  SDSPV:{g:'RNFF',c:'R2',p:31,w:10,t:2},    // Depression storage perv (in/mm)
  SPZIMP:{g:'RNFF',c:'R2',p:41,w:10,t:2},   // % zero imperv storage
  SROUTE:{g:'RNFF',c:'R2',p:51,w:10,t:3},   // Routing: 0=Outlet, 1=Imperv, 2=Perv
  SF0:{g:'RNFF',c:'R3',p:1,w:10,t:2},       // Horton max infil rate
  SFF:{g:'RNFF',c:'R3',p:11,w:10,t:2},      // Horton min infil rate
  SFDECAY:{g:'RNFF',c:'R3',p:21,w:10,t:2},  // Horton decay constant (1/hr)
  SFDRY:{g:'RNFF',c:'R3',p:31,w:10,t:2},    // Drying time (days)
  SFMAXVOL:{g:'RNFF',c:'R3',p:41,w:10,t:2}, // Max volume (in/mm)
  SCURVEN:{g:'RNFF',c:'R4',p:1,w:10,t:2},   // SCS Curve Number
  SCONDUC:{g:'RNFF',c:'R4',p:11,w:10,t:2},  // Hydraulic conductivity
  SHEAD:{g:'RNFF',c:'R4',p:21,w:10,t:2},    // Suction head
  SIMD:{g:'RNFF',c:'R4',p:31,w:10,t:2},     // Initial moisture deficit
  SRGNAME:{g:'RNFF',c:'R5',p:1,w:10,t:5},   // Rain gage name
  SSNOW:{g:'RNFF',c:'R5',p:11,w:1,t:4},     // Snow flag
  // Inflow time series fields (D2 card)
  INFLTYP:{g:'EXTR',c:'D2',p:4,w:1,t:3},    // Inflow type: 1=flow, 2=stage
  NPAIRS:{g:'EXTR',c:'D2',p:6,w:4,t:1},     // Number of time-value pairs
  TSFACT:{g:'EXTR',c:'D2',p:11,w:10,t:2},   // Time scale factor (to seconds)
  QFACT:{g:'EXTR',c:'D2',p:21,w:10,t:2},    // Flow scale factor
};

export interface XPNode {
  idx: number;
  name: string;
  type: string;
  x: number;
  y: number;
  grelev: number;
  y0: number;
  qinst: number;
  ko?: number;
  delta?: number;
  ztop?: number;
  astore?: number;
  outfallType?: string;
  inq?: string;
  flgoutf?: string;
  [key: string]: unknown;
}

export interface XPLink {
  idx: number;
  name: string;
  type: string;
  usNode: string;
  dsNode: string;
  nklass?: number;
  afull?: number;
  deep?: number;
  wide?: number;
  len?: number;
  zp1?: number;
  zp2?: number;
  rough?: number;
  slope?: number;
  barrel?: number;
  shapeName?: string;
  aorif?: number;
  dorif?: number;
  corif?: number;
  onklass?: number;
  kweir?: number;
  ycrest?: number;
  ytop?: number;
  wlen?: number;
  wcoeff?: number;
  iptyp?: number;
  pon?: number;
  poff?: number;
  psel?: string;
  pumpType?: string;
  weirType?: string;
  zp?: number;
  [key: string]: unknown;
}

export interface XPSubcatchment {
  idx: number;
  name: string;
  area: number;
  width: number;
  slope: number;
  imperv: number;
  outlet: string;
  nImperv: number;
  nPerv: number;
  dsImperv: number;
  dsPerv: number;
  pctZero: number;
  routeTo: string;
  // Infiltration (Horton)
  f0: number;
  ff: number;
  fDecay: number;
  fDry: number;
  fMaxVol: number;
  // Infiltration (Green-Ampt / Curve Number)
  curveNum: number;
  conduc: number;
  suctionHead: number;
  initMoisDef: number;
  // Rain gage
  rainGage: string;
  [key: string]: unknown;
}

export interface XPTimeSeriesPoint {
  time: number;   // Time in hours
  value: number;  // Flow or stage value
}

export interface XPTimeSeries {
  name: string;        // Usually matches the node name
  nodeIdx: number;     // OI of the associated node
  type: string;        // 'FLOW' or 'STAGE'
  points: XPTimeSeriesPoint[];
  timeFactor: number;  // Multiplier to convert stored time to hours
  valueFactor: number; // Multiplier for flow/stage values
}

export interface XPParseResult {
  nodes: XPNode[];
  links: XPLink[];
  subcatchments: XPSubcatchment[];
  timeSeries: XPTimeSeries[];
  jobControl: Record<string, string>;
  rawCards: Record<string, { data: string }[]>;
  format: string;
  title: string;
  warnings: string[];
}

type RecordMap = Record<string, Record<number, Record<number, string[]>>>;

export class XPParser {
  nodes: XPNode[] = [];
  links: XPLink[] = [];
  subcatchments: XPSubcatchment[] = [];
  timeSeries: XPTimeSeries[] = [];
  jobControl: Record<string, string> = {};
  rawCards: Record<string, { data: string }[]> = {};
  format = 'unknown';
  title = '';
  warnings: string[] = [];

  parse(text: string): XPParseResult {
    if (text.trimStart().startsWith('{\\rtf')) {
      text = text
        .replace(/^\{\\rtf[^}]*\{[^}]*\}\{[^}]*\}\r?\n?/, '')
        .replace(/\\deflang\d+\\[^\s]*/g, '')
        .replace(/\\par\s?/g, '\n')
        .replace(/\\plain[^\s]*/g, '')
        .replace(/\\f\d+\\fs\d+\s?/g, '')
        .replace(/\}$/, '')
        .replace(/\r?\n\r?\n+/g, '\n');
    }
    if (text.includes('[NODE]') || text.includes('[LINK]')) {
      this.format = 'XPX'; this.parseXPX(text);
    } else {
      this.format = 'XP_CARD'; this.parseCards(text);
    }
    return this.getResult();
  }

  getResult(): XPParseResult {
    return {
      nodes: this.nodes, links: this.links, subcatchments: this.subcatchments,
      timeSeries: this.timeSeries, jobControl: this.jobControl, rawCards: this.rawCards,
      format: this.format, title: this.title, warnings: this.warnings
    };
  }

  private xf(data: string, def: FieldDef): string {
    if (!data || !def) return '';
    const s = def.p - 1, e = s + def.w;
    return data.length >= e ? data.substring(s, e) : data.substring(s);
  }

  private toF(s: string): number { const v = parseFloat(s); return isNaN(v) ? 0 : v; }
  private toI(s: string): number { const v = parseInt(s); return isNaN(v) ? 0 : v; }
  private split(s: string): string[] { return s.trim().split(/[,\s]+/).filter(x => x); }

  private parseCards(text: string) {
    const lines = text.split(/\r\n|\r|\n/);
    let hasGroup = false;
    for (let i = 0; i < Math.min(200, lines.length); i++) {
      const t = lines[i].trimStart();
      if (/^(EXTR|RNFF|TRAN|SWMM|PLOT|CONF|ZZZS|ZXPX|SRPT|PLTT)\s/.test(t)) { hasGroup = true; break; }
    }
    if (hasGroup) this.parseNativeXP(lines);
    else this.parseSWMM34(lines);
  }

  private parseNativeXP(lines: string[]) {
    const rec: RecordMap = {};
    for (const raw of lines) {
      const line = raw.trimEnd();
      if (line.length < 12) continue;
      const grp = line.substring(0, 4).trim();
      const sub = parseInt(line.substring(4, 8).trim()) || 0;
      const card = line.substring(8, 12).trim();
      if (!grp || !card) continue;
      const oi = parseInt(line.substring(16, 20).trim()) || 0;
      const doff = (grp === 'ZZZN' || grp === 'ZZZE') ? 24 : 25;
      const data = line.length > doff ? line.substring(doff) : '';
      const key = `${grp}:${card}`;

      if (!rec[key]) rec[key] = {};
      if (!rec[key][oi]) rec[key][oi] = {};
      if (!rec[key][oi][sub]) rec[key][oi][sub] = [];
      rec[key][oi][sub].push(data);

      if (!this.rawCards[key]) this.rawCards[key] = [];
      this.rawCards[key].push({ data: line });
    }

    const gd = (key: string, oi: number, ...preferSubs: number[]): string => {
      const m = rec[key]?.[oi];
      if (!m) return '';
      for (const s of preferSubs) { if (m[s]?.[0]) return m[s][0]; }
      if (m[0]?.[0]) return m[0][0];
      if (m[1]?.[0]) return m[1][0];
      const k = Object.keys(m)[0];
      return m[k]?.[0] || '';
    };

    const ois = (key: string): number[] => rec[key] ? Object.keys(rec[key]).map(Number).filter(x => x > 0) : [];

    // Phase 2: ZZZN nodes
    const nodeNames: Record<number, string> = {};
    const nodeCoords: Record<number, { x: number; y: number }> = {};
    if (rec['ZZZN:NODE']) {
      let zzzNewFmt = false;
      for (const [oiStr, subs] of Object.entries(rec['ZZZN:NODE'])) {
        const oi = parseInt(oiStr);
        if (oi <= 0) continue;
        const recs = subs[oi] || subs[Object.keys(subs)[0] as any] || [];
        if (recs.length > 0) {
          const d = recs[0];
          if (d.length > 25 && d.substring(0, 3).trim() === '' && d[3] >= '0' && d[3] <= '9')
            zzzNewFmt = true;
        }
        break;
      }

      for (const [oiStr, subs] of Object.entries(rec['ZZZN:NODE'])) {
        const oi = parseInt(oiStr);
        if (oi <= 0) continue;
        const recs = subs[oi] || subs[Object.keys(subs)[0] as any] || [];
        if (recs.length > 0) {
          let nm: string;
          if (zzzNewFmt) nm = recs[0].substring(11, 25).trim().split(/\s/)[0];
          else nm = recs[0].substring(0, 14).trim().split(/\s/)[0];
          if (nm) nodeNames[oi] = nm;
        }
        for (let r = recs.length - 1; r >= 0; r--) {
          const cp = recs[r].trim().split(/\s+/);
          const x0 = parseFloat(cp[0]), y0 = parseFloat(cp[1]);
          if (cp.length >= 2 && !isNaN(x0) && !isNaN(y0) && (Math.abs(x0) > 1 || Math.abs(y0) > 1)) {
            nodeCoords[oi] = { x: x0, y: y0 };
            break;
          }
        }
      }
    }

    // Phase 3: ZZZE edges
    const nodeOIset_known = new Set(Object.keys(nodeNames).map(Number));
    const edgeInfo: Record<number, { name: string; from: number; to: number }> = {};
    if (rec['ZZZE:EDGE']) {
      for (const [oiStr, subs] of Object.entries(rec['ZZZE:EDGE'])) {
        const oi = parseInt(oiStr);
        if (oi <= 0) continue;
        const recs = subs[oi] || subs[Object.keys(subs)[0] as any] || [];
        if (recs.length > 0) {
          const data = recs[0];
          const firstToken = data.trim().split(/\s+/)[0] || `Link_${oi}`;
          const oistr = String(oi);
          const idx = data.indexOf(oistr);
          let from = 0, to = 0;
          if (idx > 0) {
            const before = data.substring(0, idx);
            const allNums = (before.match(/\d+/g) || []).map(Number).filter(n => n > 0);
            const known = allNums.filter(n => nodeOIset_known.has(n));
            if (known.length >= 2) { from = known[known.length - 2]; to = known[known.length - 1]; }
            else if (known.length === 1) { to = known[0]; }
            else {
              const big = allNums.filter(n => n >= 50);
              if (big.length >= 2) { from = big[big.length - 2]; to = big[big.length - 1]; }
              else if (big.length === 1) { to = big[0]; }
            }
          }
          edgeInfo[oi] = { name: firstToken, from, to };
        }
      }
    }

    // Phase 4: Collect OIs
    const nodeOIset = new Set([
      ...ois('EXTR:SP1N'), ...ois('EXTR:D1'), ...ois('EXTR:J3'), ...ois('EXTR:E1'),
      ...Object.keys(nodeNames).map(Number),
    ]);
    const linkOIset = new Set([
      ...ois('EXTR:C1'), ...ois('EXTR:F1'), ...ois('EXTR:G1'), ...ois('EXTR:H1A'),
      ...ois('EXTR:H1'), ...ois('EXTR:SPDN'), ...ois('EXTR:SPDV'),
      ...Object.keys(edgeInfo).map(Number),
    ]);

    // Phase 5: Build nodes
    for (const oi of [...nodeOIset].sort((a, b) => a - b)) {
      const n: XPNode = { idx: oi, name: '', type: 'Junction', x: 0, y: 0, grelev: 0, y0: 0, qinst: 0 };
      n.name = nodeNames[oi] || `Node_${oi}`;
      if (nodeCoords[oi]) { n.x = nodeCoords[oi].x; n.y = nodeCoords[oi].y; }
      else {
        const sp = gd('EXTR:SP1N', oi, 0);
        n.x = this.toF(this.xf(sp, DB.NODX));
        n.y = this.toF(this.xf(sp, DB.NODY));
      }
      const d1 = gd('EXTR:D1', oi, 0);
      n.grelev = this.toF(this.xf(d1, DB.GRELEV));
      n.y0 = this.toF(this.xf(d1, DB.Y0));
      n.qinst = this.toF(this.xf(d1, DB.QINST));
      const sp = gd('EXTR:SP1N', oi, 0);
      n.inq = this.xf(sp, DB.INQ).trim();
      n.flgoutf = this.xf(sp, DB.FLGOUTF).trim();
      const j3 = gd('EXTR:J3', oi, 0);
      n.ko = this.toI(this.xf(j3, DB.KO));
      n.delta = this.toF(this.xf(j3, DB.DELTA));
      const e1 = gd('EXTR:E1', oi, 0);
      n.ztop = this.toF(this.xf(e1, DB.ZTOP));
      n.astore = this.toF(this.xf(e1, DB.ASTORE));
      n.outfallType = OUTFALL_CODES[n.ko] || '';
      n.type = n.ko > 0 ? 'Outfall' : (n.astore! > 0 || n.ztop! > 0) ? 'Storage' : 'Junction';
      this.nodes.push(n);
    }

    // Phase 6: Build links
    for (const oi of [...linkOIset].sort((a, b) => a - b)) {
      const l: XPLink = { idx: oi, name: '', type: 'Conduit', usNode: '', dsNode: '' };
      const dn = gd('EXTR:SPDN', oi, 0);
      const spdnName = this.xf(dn, DB.CNAME1).trim();
      const spdnUS = this.xf(dn, DB.CNAME2).trim();
      const spdnDS = this.xf(dn, DB.CNAME3).trim();

      if (edgeInfo[oi]) {
        l.name = spdnName || edgeInfo[oi].name;
        const ef = edgeInfo[oi].from, et = edgeInfo[oi].to;
        l.usNode = spdnUS || (ef > 0 ? (nodeNames[ef] || `Node_${ef}`) : '');
        l.dsNode = spdnDS || (et > 0 ? (nodeNames[et] || `Node_${et}`) : '');
      } else {
        l.name = spdnName || `Link_${oi}`;
        l.usNode = spdnUS;
        l.dsNode = spdnDS;
      }

      const c1 = gd('EXTR:C1', oi, 0, 1);
      l.nklass = this.toI(this.xf(c1, DB.NKLASS));
      l.afull = this.toF(this.xf(c1, DB.AFULL));
      l.deep = this.toF(this.xf(c1, DB.DEEP));
      l.wide = this.toF(this.xf(c1, DB.WIDE));
      l.len = this.toF(this.xf(c1, DB.LEN));
      l.zp1 = this.toF(this.xf(c1, DB.ZP1));
      l.zp2 = this.toF(this.xf(c1, DB.ZP2));
      l.rough = this.toF(this.xf(c1, DB.ROUGH));
      l.shapeName = SHAPE_CODES[l.nklass] || (l.nklass ? `Shape_${l.nklass}` : '');

      const ca = gd('EXTR:C1A', oi, 0, 1);
      l.slope = this.toF(this.xf(ca, DB.SLOPE));
      const c6 = gd('EXTR:C6', oi, 0);
      l.barrel = this.toF(this.xf(c6, DB.BARREL)) || 1;

      const f1 = gd('EXTR:F1', oi, 1, 0);
      l.aorif = this.toF(this.xf(f1, DB.AORIF));
      l.dorif = this.toF(this.xf(f1, DB.DORIF));

      const g1 = gd('EXTR:G1', oi, 1, 0);
      l.kweir = this.toI(this.xf(g1, DB.KWEIR));
      l.ycrest = this.toF(this.xf(g1, DB.YCREST));
      l.wlen = this.toF(this.xf(g1, DB.WLEN));
      l.weirType = WEIR_CODES[l.kweir] || '';

      const h1 = gd('EXTR:H1A', oi, 0) || gd('EXTR:H1', oi, 0);
      l.iptyp = this.toI(this.xf(h1, DB.IPTYP));
      l.pon = this.toF(this.xf(h1, DB.PON));
      l.poff = this.toF(this.xf(h1, DB.POFF));
      l.pumpType = PUMP_CODES[l.iptyp] || '';

      const dv = gd('EXTR:SPDV', oi, 0);
      const hO = this.xf(dv, DB.ORIF1).trim();
      const hW = this.xf(dv, DB.WEIR1).trim();
      const hP = this.xf(dv, DB.PUMP1).trim();

      l.type = (hO === '1' || l.aorif! > 0) ? 'Orifice' :
               (hW === '1' || l.kweir! > 0) ? 'Weir' :
               (hP === '1' || l.iptyp! > 0) ? 'Pump' : 'Conduit';

      if (!l.slope && l.len! > 0) l.slope = ((l.zp1! - l.zp2!) / l.len!) * 100;
      this.links.push(l);
    }

    // Phase 7: Discover nodes from links if none found
    if (this.nodes.length === 0 && this.links.length > 0) {
      const discovered = new Set<string>();
      for (const l of this.links) {
        if (l.usNode && !discovered.has(l.usNode)) {
          discovered.add(l.usNode);
          this.nodes.push({ idx: this.nodes.length + 1, name: l.usNode, type: 'Junction', x: 0, y: 0, grelev: l.zp1 || 0, y0: 0, qinst: 0 });
        }
        if (l.dsNode && !discovered.has(l.dsNode)) {
          discovered.add(l.dsNode);
          this.nodes.push({ idx: this.nodes.length + 1, name: l.dsNode, type: 'Junction', x: 0, y: 0, grelev: l.zp2 || 0, y0: 0, qinst: 0 });
        }
      }
    }

    // Phase 8: Title & Job Control
    const a1d = gd('EXTR:A1', 0, 0);
    if (a1d) this.title = this.xf(a1d, DB.ALPHA).trim();
    this.extractJC(rec);

    // Phase 9: Subcatchments from RNFF block
    const scOIs = new Set([
      ...ois('RNFF:R1'), ...ois('RNFF:R2'), ...ois('RNFF:R3'),
      ...ois('RNFF:R4'), ...ois('RNFF:R5'),
    ]);
    for (const oi of [...scOIs].sort((a, b) => a - b)) {
      const r1 = gd('RNFF:R1', oi, 0);
      const r2 = gd('RNFF:R2', oi, 0);
      const r3 = gd('RNFF:R3', oi, 0);
      const r4 = gd('RNFF:R4', oi, 0);
      const r5 = gd('RNFF:R5', oi, 0);

      const name = this.xf(r1, DB.SNAME).trim() || `Sub_${oi}`;
      const area = this.toF(this.xf(r1, DB.SAREA));
      if (area <= 0 && !name) continue; // Skip empty subcatchments

      const routeCode = this.toI(this.xf(r2, DB.SROUTE));
      const routeMap: Record<number, string> = { 0: 'OUTLET', 1: 'IMPERVIOUS', 2: 'PERVIOUS' };

      const sc: XPSubcatchment = {
        idx: oi,
        name,
        area,
        width: this.toF(this.xf(r1, DB.SWID)),
        slope: this.toF(this.xf(r1, DB.SSLOPE)),
        imperv: this.toF(this.xf(r1, DB.SIMPERV)),
        outlet: this.xf(r1, DB.SOUTLET).trim() || '',
        nImperv: this.toF(this.xf(r2, DB.SNIMP)) || 0.01,
        nPerv: this.toF(this.xf(r2, DB.SNPERV)) || 0.1,
        dsImperv: this.toF(this.xf(r2, DB.SDSIP)) || 0.05,
        dsPerv: this.toF(this.xf(r2, DB.SDSPV)) || 0.05,
        pctZero: this.toF(this.xf(r2, DB.SPZIMP)),
        routeTo: routeMap[routeCode] || 'OUTLET',
        f0: this.toF(this.xf(r3, DB.SF0)),
        ff: this.toF(this.xf(r3, DB.SFF)),
        fDecay: this.toF(this.xf(r3, DB.SFDECAY)),
        fDry: this.toF(this.xf(r3, DB.SFDRY)),
        fMaxVol: this.toF(this.xf(r3, DB.SFMAXVOL)),
        curveNum: this.toF(this.xf(r4, DB.SCURVEN)),
        conduc: this.toF(this.xf(r4, DB.SCONDUC)),
        suctionHead: this.toF(this.xf(r4, DB.SHEAD)),
        initMoisDef: this.toF(this.xf(r4, DB.SIMD)),
        rainGage: this.xf(r5, DB.SRGNAME).trim() || '*',
      };
      this.subcatchments.push(sc);
    }

    // Phase 10: Time Series from D2/D3 cards (inflow hydrographs)
    const nodeNameMap: Record<number, string> = {};
    this.nodes.forEach(n => { nodeNameMap[n.idx] = n.name; });

    const d2OIs = ois('EXTR:D2');
    for (const oi of d2OIs.sort((a, b) => a - b)) {
      const nodeName = nodeNameMap[oi] || `Node_${oi}`;
      const tsName = `TS_${nodeName}`;

      // Get D2 header data
      const d2Header = gd('EXTR:D2', oi, 0);
      const inflType = this.toI(this.xf(d2Header, DB.INFLTYP));
      const nPairs = this.toI(this.xf(d2Header, DB.NPAIRS));
      const tsFact = this.toF(this.xf(d2Header, DB.TSFACT)) || 1;
      const qFact = this.toF(this.xf(d2Header, DB.QFACT)) || 1;

      // Collect all D2 records for this OI (time-value pairs stored across multiple records)
      const points: XPTimeSeriesPoint[] = [];
      const d2Subs = rec['EXTR:D2']?.[oi];
      if (d2Subs) {
        for (const [, records] of Object.entries(d2Subs)) {
          for (const data of records) {
            // Parse pairs from the data field - values are space-separated
            const vals = data.trim().split(/\s+/).map(Number).filter(v => !isNaN(v));
            // Skip header record (first record has type/npairs/factors)
            if (vals.length >= 2) {
              for (let i = 0; i < vals.length - 1; i += 2) {
                const t = vals[i] * (tsFact > 0 ? tsFact : 1);
                const v = vals[i + 1] * (qFact > 0 ? qFact : 1);
                if (t >= 0) points.push({ time: t, value: v });
              }
            }
          }
        }
      }

      // Also check D3 cards for additional data points
      const d3Subs = rec['EXTR:D3']?.[oi];
      if (d3Subs) {
        for (const [, records] of Object.entries(d3Subs)) {
          for (const data of records) {
            const vals = data.trim().split(/\s+/).map(Number).filter(v => !isNaN(v));
            if (vals.length >= 2) {
              for (let i = 0; i < vals.length - 1; i += 2) {
                const t = vals[i] * (tsFact > 0 ? tsFact : 1);
                const v = vals[i + 1] * (qFact > 0 ? qFact : 1);
                if (t >= 0) points.push({ time: t, value: v });
              }
            }
          }
        }
      }

      // Sort by time and remove duplicates
      points.sort((a, b) => a.time - b.time);
      const uniquePoints = points.filter((p, i) => i === 0 || p.time !== points[i - 1].time);

      if (uniquePoints.length > 0) {
        this.timeSeries.push({
          name: tsName,
          nodeIdx: oi,
          type: inflType === 2 ? 'STAGE' : 'FLOW',
          points: uniquePoints,
          timeFactor: tsFact,
          valueFactor: qFact,
        });

        // Update the associated node to reference this time series
        const node = this.nodes.find(n => n.idx === oi);
        if (node) {
          node.inflowTS = tsName;
        }
      }
    }
  }

  private parseSWMM34(lines: string[]) {
    const nodeMap: Record<string, XPNode> = {};
    const linkList: XPLink[] = [];
    for (const raw of lines) {
      const line = raw.trimEnd();
      if (!line.trim() || line[0] === '*' || line[0] === ';') continue;
      const cm = line.match(/^([A-Z][A-Z0-9]{0,3})\s+(.*)/);
      if (!cm) continue;
      const cid = cm[1], rest = cm[2];
      if (!this.rawCards[cid]) this.rawCards[cid] = [];
      this.rawCards[cid].push({ data: line });
      const p = this.split(rest);

      switch (cid) {
        case 'A1': this.title = rest.trim(); this.jobControl.TITLE = this.title; break;
        case 'B1': if (p[0]) this.jobControl.DELT = p[0]; break;
        case 'B2': if (p[0]) this.jobControl.METRIC = p[0]; break;
        case 'BB2':
          if (p[0]) this.jobControl.MFAIL = p[0];
          if (p[4]) this.jobControl.ISMTH = p[4];
          if (p[6]) this.jobControl.KINE = p[6];
          break;
        case 'D1': {
          const n: XPNode = { idx: Object.keys(nodeMap).length + 1, name: p[0] || '', grelev: this.toF(p[1]),
            y0: this.toF(p[4]), qinst: this.toF(p[5]), type: 'Junction', x: 0, y: 0 };
          nodeMap[n.name] = n; break;
        }
        case 'C1': if (p.length >= 5) {
          linkList.push({ idx: linkList.length + 1, name: `Conduit_${linkList.length + 1}`,
            usNode: p[0] || '', dsNode: p[1] || '', nklass: this.toI(p[2]),
            deep: this.toF(p[4]), wide: this.toF(p[5]), len: this.toF(p[6]),
            zp1: this.toF(p[7]), zp2: this.toF(p[8]), rough: this.toF(p[9]),
            barrel: 1, type: 'Conduit', shapeName: SHAPE_CODES[this.toI(p[2])] || '',
            slope: this.toF(p[6]) > 0 ? ((this.toF(p[7]) - this.toF(p[8])) / this.toF(p[6])) * 100 : 0 });
        } break;
      }
    }
    this.nodes = Object.values(nodeMap);
    this.links = linkList;
    if (this.jobControl.KINE !== undefined) this.jobControl._ROUTING = ROUTING_CODES[parseInt(this.jobControl.KINE)] || '';
    if (this.jobControl.METRIC !== undefined) this.jobControl._UNITS = parseInt(this.jobControl.METRIC) === 1 ? 'Metric' : 'US Customary';
  }

  private parseXPX(text: string) {
    const lines = text.split(/\r\n|\r|\n/);
    let cur: any = null, ot: string | null = null;
    const fmap: Record<string, string> = {
      NODNAM: 'name', NODE_NAME: 'name', NAME: 'name', NODX: 'x', X: 'x', NODY: 'y', Y: 'y',
      GRELEV: 'grelev', GROUND_ELEV: 'grelev', Y0: 'y0', INIT_DEPTH: 'y0', QINST: 'qinst',
      KO: 'ko', NKLASS: 'nklass', SHAPE: 'nklass', DEEP: 'deep', DIAMETER: 'deep', HEIGHT: 'deep',
      WIDE: 'wide', WIDTH: 'wide', LEN: 'len', LENGTH: 'len', ZP1: 'zp1', US_INVERT: 'zp1',
      ZP2: 'zp2', DS_INVERT: 'zp2', ROUGH: 'rough', MANNING: 'rough', ROUGHNESS: 'rough',
      BARREL: 'barrel', BARRELS: 'barrel', USNODE: 'usNode', US_NODE: 'usNode', FROM_NODE: 'usNode',
      DSNODE: 'dsNode', DS_NODE: 'dsNode', TO_NODE: 'dsNode'
    };
    const strProps = new Set(['name', 'usNode', 'dsNode', 'type']);

    const scFmap: Record<string, string> = {
      SAREA: 'area', AREA: 'area', SWID: 'width', SSLOPE: 'slope', SLOPE: 'slope',
      SIMPERV: 'imperv', IMPERV: 'imperv', PERCENT_IMPERV: 'imperv',
      SOUTLET: 'outlet', OUTLET: 'outlet', OUTLET_NODE: 'outlet',
      SNIMP: 'nImperv', N_IMPERV: 'nImperv', SNPERV: 'nPerv', N_PERV: 'nPerv',
      SDSIP: 'dsImperv', DS_IMPERV: 'dsImperv', SDSPV: 'dsPerv', DS_PERV: 'dsPerv',
      SPZIMP: 'pctZero', PCT_ZERO: 'pctZero',
      SF0: 'f0', MAX_RATE: 'f0', SFF: 'ff', MIN_RATE: 'ff',
      SFDECAY: 'fDecay', DECAY: 'fDecay', SFDRY: 'fDry', DRY_TIME: 'fDry',
      SCURVEN: 'curveNum', CURVE_NUMBER: 'curveNum',
      SCONDUC: 'conduc', CONDUCTIVITY: 'conduc',
      SHEAD: 'suctionHead', SUCTION_HEAD: 'suctionHead',
      SIMD: 'initMoisDef', INIT_DEFICIT: 'initMoisDef',
      SRGNAME: 'rainGage', RAIN_GAGE: 'rainGage',
    };
    const scStrProps = new Set(['name', 'outlet', 'rainGage', 'routeTo']);

    for (const line of lines) {
      const t = line.trim();
      if (!t || t[0] === ';' || t[0] === '*') continue;
      if (t === '[NODE]') {
        if (cur && ot === 'n') this.nodes.push(cur);
        if (cur && ot === 'l') this.links.push(cur);
        if (cur && ot === 's') this.subcatchments.push(cur);
        cur = { idx: this.nodes.length + 1, type: 'Junction', x: 0, y: 0, name: '', grelev: 0, y0: 0, qinst: 0 };
        ot = 'n'; continue;
      }
      if (t === '[LINK]') {
        if (cur && ot === 'n') this.nodes.push(cur);
        if (cur && ot === 'l') this.links.push(cur);
        if (cur && ot === 's') this.subcatchments.push(cur);
        cur = { idx: this.links.length + 1, type: 'Conduit', barrel: 1, name: '', usNode: '', dsNode: '' };
        ot = 'l'; continue;
      }
      if (t === '[SUBCATCHMENT]' || t === '[SUBCATCH]') {
        if (cur && ot === 'n') this.nodes.push(cur);
        if (cur && ot === 'l') this.links.push(cur);
        if (cur && ot === 's') this.subcatchments.push(cur);
        cur = { idx: this.subcatchments.length + 1, name: '', area: 0, width: 0, slope: 0, imperv: 0,
          outlet: '', nImperv: 0.01, nPerv: 0.1, dsImperv: 0.05, dsPerv: 0.05, pctZero: 25,
          routeTo: 'OUTLET', f0: 0, ff: 0, fDecay: 0, fDry: 0, fMaxVol: 0,
          curveNum: 0, conduc: 0, suctionHead: 0, initMoisDef: 0, rainGage: '*' };
        ot = 's'; continue;
      }
      const eq = t.match(/^(\w+)\s*=\s*(.*)/);
      if (eq && cur) {
        const k = eq[1].toUpperCase(), v = eq[2].trim();
        if (ot === 's') {
          if (k === 'NAME' || k === 'SNAME') cur.name = v;
          else {
            const prop = scFmap[k];
            if (prop) cur[prop] = scStrProps.has(prop) ? v : (parseFloat(v) || 0);
          }
        } else {
          const prop = fmap[k];
          if (prop) cur[prop] = strProps.has(prop) ? v : (parseFloat(v) || 0);
          if (k === 'KO' && parseInt(v) > 0) cur.type = 'Outfall';
          if (k === 'ASTORE' && parseFloat(v) > 0) cur.type = 'Storage';
          if (k === 'NKLASS') cur.shapeName = SHAPE_CODES[parseInt(v)] || `Shape_${v}`;
        }
      }
    }
    if (cur && ot === 'n') this.nodes.push(cur);
    if (cur && ot === 'l') this.links.push(cur);
    if (cur && ot === 's') this.subcatchments.push(cur);
  }

  private extractJC(rec: RecordMap) {
    const jcCards = ['A1', 'A1B', 'B0', 'B1', 'B1A', 'B2', 'BB1', 'BB2', 'BB3'];
    for (const cn of jcCards) {
      const key = `EXTR:${cn}`;
      const oiMap = rec[key]?.[0];
      if (!oiMap) continue;
      const data = oiMap[0]?.[0] || oiMap[Object.keys(oiMap)[0] as any]?.[0] || '';
      if (!data) continue;
      for (const [fn, fd] of Object.entries(DB)) {
        if (fd.g === 'EXTR' && fd.c === cn) {
          const v = this.xf(data, fd).trim();
          if (v) this.jobControl[fn] = v;
        }
      }
    }
    if (this.jobControl.KINE !== undefined) this.jobControl._ROUTING = ROUTING_CODES[parseInt(this.jobControl.KINE)] || '';
    if (this.jobControl.METRIC !== undefined) this.jobControl._UNITS = parseInt(this.jobControl.METRIC) === 1 ? 'Metric' : 'US Customary';
  }
}
