// ===================================================================
// Starter Template Models for the Make .xp builder
// Pre-configured MakeModel instances for common SWMM scenarios
// ===================================================================

import { type MakeModel } from './xp-generator';

let _tid = 1000;
const tid = () => `tmpl_${++_tid}`;

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  model: MakeModel;
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: 'simple-pipe',
    name: 'Simple Pipe Network',
    description: '4 junctions, 1 outfall, 4 conduits in a linear trunk with a side branch. Includes 2 subcatchments draining to upstream nodes.',
    icon: '🔧',
    model: {
      jobControl: {
        title: 'Simple Pipe Network',
        metric: false,
        routingMethod: 0,
        timeStep: 30,
        maxTrials: 8,
        headTolerance: 0.005,
      },
      nodes: [
        { id: tid(), name: 'J1', x: 0, y: 0, elevation: 110, maxDepth: 6, initDepth: 0, type: 'junction' },
        { id: tid(), name: 'J2', x: 300, y: 0, elevation: 107, maxDepth: 6, initDepth: 0, type: 'junction' },
        { id: tid(), name: 'J3', x: 600, y: 0, elevation: 104, maxDepth: 8, initDepth: 0, type: 'junction' },
        { id: tid(), name: 'J4', x: 300, y: 300, elevation: 108, maxDepth: 6, initDepth: 0, type: 'junction' },
        { id: tid(), name: 'Out1', x: 900, y: 0, elevation: 100, maxDepth: 0, initDepth: 0, type: 'outfall', outfallType: 1 },
      ],
      links: [
        { id: tid(), name: 'C1', fromNode: 'J1', toNode: 'J2', type: 'conduit', shape: 1, depth: 1.5, width: 0, length: 300, roughness: 0.013, usInvert: 0, dsInvert: 0, barrels: 1 },
        { id: tid(), name: 'C2', fromNode: 'J2', toNode: 'J3', type: 'conduit', shape: 1, depth: 2.0, width: 0, length: 300, roughness: 0.013, usInvert: 0, dsInvert: 0, barrels: 1 },
        { id: tid(), name: 'C3', fromNode: 'J3', toNode: 'Out1', type: 'conduit', shape: 1, depth: 2.5, width: 0, length: 300, roughness: 0.013, usInvert: 0, dsInvert: 0, barrels: 1 },
        { id: tid(), name: 'C4', fromNode: 'J4', toNode: 'J2', type: 'conduit', shape: 1, depth: 1.0, width: 0, length: 300, roughness: 0.015, usInvert: 0, dsInvert: 0, barrels: 1 },
      ],
      subcatchments: [
        { id: tid(), name: 'S1', area: 10, width: 500, slope: 0.5, imperv: 25, outlet: 'J1', nImperv: 0.01, nPerv: 0.1, dsImperv: 0.05, dsPerv: 0.05, f0: 3.0, ff: 0.5, fDecay: 4.0 },
        { id: tid(), name: 'S2', area: 8, width: 400, slope: 0.8, imperv: 50, outlet: 'J4', nImperv: 0.012, nPerv: 0.1, dsImperv: 0.05, dsPerv: 0.05, f0: 3.0, ff: 0.5, fDecay: 4.0 },
      ],
      controls: [],
    },
  },
  {
    id: 'pump-station',
    name: 'Pump Station',
    description: 'Wet well with 2 pumps (lead/lag), force main to outfall. Includes RTC rules for pump on/off based on wet well depth.',
    icon: '⚡',
    model: {
      jobControl: {
        title: 'Pump Station Model',
        metric: false,
        routingMethod: 0,
        timeStep: 10,
        maxTrials: 10,
        headTolerance: 0.005,
      },
      nodes: [
        { id: tid(), name: 'Inlet', x: 0, y: 0, elevation: 105, maxDepth: 6, initDepth: 0, type: 'junction' },
        { id: tid(), name: 'WetWell', x: 300, y: 0, elevation: 95, maxDepth: 15, initDepth: 2, type: 'storage', storageArea: 200 },
        { id: tid(), name: 'FM_Jct', x: 600, y: 0, elevation: 108, maxDepth: 4, initDepth: 0, type: 'junction' },
        { id: tid(), name: 'Outfall', x: 900, y: 0, elevation: 100, maxDepth: 0, initDepth: 0, type: 'outfall', outfallType: 1 },
      ],
      links: [
        { id: tid(), name: 'Gravity', fromNode: 'Inlet', toNode: 'WetWell', type: 'conduit', shape: 1, depth: 2.0, width: 0, length: 300, roughness: 0.013, usInvert: 0, dsInvert: 0, barrels: 1 },
        { id: tid(), name: 'Pump_Lead', fromNode: 'WetWell', toNode: 'FM_Jct', type: 'pump', pumpType: 2, pumpOnDepth: 4.0, pumpOffDepth: 1.0, pumpCurveName: 'PC_Lead' },
        { id: tid(), name: 'Pump_Lag', fromNode: 'WetWell', toNode: 'FM_Jct', type: 'pump', pumpType: 2, pumpOnDepth: 8.0, pumpOffDepth: 3.0, pumpCurveName: 'PC_Lag' },
        { id: tid(), name: 'ForceMn', fromNode: 'FM_Jct', toNode: 'Outfall', type: 'conduit', shape: 1, depth: 1.5, width: 0, length: 500, roughness: 0.013, usInvert: 0, dsInvert: 0, barrels: 1 },
      ],
      subcatchments: [
        { id: tid(), name: 'Basin', area: 25, width: 800, slope: 1.0, imperv: 60, outlet: 'Inlet', nImperv: 0.012, nPerv: 0.1, dsImperv: 0.05, dsPerv: 0.05, f0: 3.0, ff: 0.5, fDecay: 4.0 },
      ],
      controls: [
        { id: tid(), name: 'Lead_On', sensorNode: 'WetWell', attribute: 'DEPTH', relation: '>', threshold: 4.0, actionLink: 'Pump_Lead', action: 'ON', elseAction: '', priority: 2 },
        { id: tid(), name: 'Lead_Off', sensorNode: 'WetWell', attribute: 'DEPTH', relation: '<', threshold: 1.0, actionLink: 'Pump_Lead', action: 'OFF', elseAction: '', priority: 2 },
        { id: tid(), name: 'Lag_On', sensorNode: 'WetWell', attribute: 'DEPTH', relation: '>', threshold: 8.0, actionLink: 'Pump_Lag', action: 'ON', elseAction: '', priority: 1 },
        { id: tid(), name: 'Lag_Off', sensorNode: 'WetWell', attribute: 'DEPTH', relation: '<', threshold: 3.0, actionLink: 'Pump_Lag', action: 'OFF', elseAction: '', priority: 1 },
      ],
    },
  },
  {
    id: 'detention-lid',
    name: 'Detention Pond with LID',
    description: 'Detention pond with orifice/weir outlet, upstream subcatchments using bio-retention and permeable pavement LID controls.',
    icon: '🌿',
    model: {
      jobControl: {
        title: 'Detention Pond with LID',
        metric: false,
        routingMethod: 0,
        timeStep: 30,
        maxTrials: 8,
        headTolerance: 0.005,
      },
      nodes: [
        { id: tid(), name: 'Inlet_N', x: 0, y: 0, elevation: 112, maxDepth: 6, initDepth: 0, type: 'junction' },
        { id: tid(), name: 'Inlet_S', x: 0, y: 400, elevation: 111, maxDepth: 6, initDepth: 0, type: 'junction' },
        { id: tid(), name: 'Pond_In', x: 400, y: 200, elevation: 105, maxDepth: 8, initDepth: 0, type: 'junction' },
        { id: tid(), name: 'Pond', x: 700, y: 200, elevation: 100, maxDepth: 12, initDepth: 0, type: 'storage', storageArea: 5000 },
        { id: tid(), name: 'DS_Jct', x: 1000, y: 200, elevation: 98, maxDepth: 6, initDepth: 0, type: 'junction' },
        { id: tid(), name: 'Outfall', x: 1300, y: 200, elevation: 95, maxDepth: 0, initDepth: 0, type: 'outfall', outfallType: 1 },
      ],
      links: [
        { id: tid(), name: 'Pipe_N', fromNode: 'Inlet_N', toNode: 'Pond_In', type: 'conduit', shape: 1, depth: 2.0, width: 0, length: 450, roughness: 0.013, usInvert: 0, dsInvert: 0, barrels: 1 },
        { id: tid(), name: 'Pipe_S', fromNode: 'Inlet_S', toNode: 'Pond_In', type: 'conduit', shape: 1, depth: 1.5, width: 0, length: 450, roughness: 0.013, usInvert: 0, dsInvert: 0, barrels: 1 },
        { id: tid(), name: 'Pond_Inlet', fromNode: 'Pond_In', toNode: 'Pond', type: 'conduit', shape: 2, depth: 3.0, width: 4.0, length: 50, roughness: 0.025, usInvert: 0, dsInvert: 0, barrels: 1 },
        { id: tid(), name: 'LowFlow', fromNode: 'Pond', toNode: 'DS_Jct', type: 'orifice', orificeShape: 2, orificeCoeff: 0.65, orificeDiam: 1.0, orificeOffset: 0.0 },
        { id: tid(), name: 'Spillway', fromNode: 'Pond', toNode: 'DS_Jct', type: 'weir', weirType: 4, weirCrest: 8.0, weirTop: 12.0, weirLength: 20.0, weirCoeff: 2.65 },
        { id: tid(), name: 'DS_Pipe', fromNode: 'DS_Jct', toNode: 'Outfall', type: 'conduit', shape: 1, depth: 3.0, width: 0, length: 300, roughness: 0.013, usInvert: 0, dsInvert: 0, barrels: 1 },
      ],
      subcatchments: [
        { id: tid(), name: 'Residential', area: 15, width: 600, slope: 0.5, imperv: 40, outlet: 'Inlet_N', nImperv: 0.01, nPerv: 0.1, dsImperv: 0.05, dsPerv: 0.05, f0: 3.0, ff: 0.5, fDecay: 4.0 },
        { id: tid(), name: 'Commercial', area: 8, width: 400, slope: 0.3, imperv: 85, outlet: 'Inlet_S', nImperv: 0.012, nPerv: 0.1, dsImperv: 0.05, dsPerv: 0.05, f0: 2.5, ff: 0.4, fDecay: 4.0 },
        { id: tid(), name: 'ParkingLot', area: 3, width: 200, slope: 1.0, imperv: 95, outlet: 'Inlet_S', nImperv: 0.015, nPerv: 0.1, dsImperv: 0.06, dsPerv: 0.05, f0: 2.0, ff: 0.3, fDecay: 3.0 },
      ],
      controls: [],
    },
  },
];
