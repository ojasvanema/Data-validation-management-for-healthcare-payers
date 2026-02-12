import React, { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import GlassCard from './GlassCard';
import { ProviderRecord } from '../types';
import { useTheme } from './ThemeContext';
import { MapPin } from 'lucide-react';

interface USHeatmapProps {
  records?: ProviderRecord[];
}

// US Atlas TopoJSON — free, hosted by Observable/topojson
const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// FIPS code → state abbreviation mapping
const FIPS_TO_ABBR: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY"
};

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming"
};

const USHeatmap: React.FC<USHeatmapProps> = ({ records = [] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [tooltipContent, setTooltipContent] = useState<{
    name: string;
    abbr: string;
    count: number;
    flagged: number;
    verified: number;
    review: number;
    avgRisk: number;
  } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Aggregate provider counts and risk info by state
  const stateData = useMemo(() => {
    const data: Record<string, { count: number; flagged: number; verified: number; review: number; totalRisk: number }> = {};
    records.forEach(r => {
      if (r.state) {
        const st = r.state.toUpperCase().trim();
        if (!data[st]) data[st] = { count: 0, flagged: 0, verified: 0, review: 0, totalRisk: 0 };
        data[st].count++;
        if (r.status === 'Flagged') data[st].flagged++;
        if (r.status === 'Verified') data[st].verified++;
        if (r.status === 'Review') data[st].review++;
        data[st].totalRisk += r.riskScore;
      }
    });
    return data;
  }, [records]);

  const maxCount = useMemo(() => {
    const counts = Object.values(stateData).map((d: any) => d.count as number);
    return counts.length > 0 ? Math.max(...counts) : 1;
  }, [stateData]);

  const getColor = (abbr: string) => {
    const info = stateData[abbr];
    if (!info || info.count === 0) {
      return isDark ? '#111827' : '#e2e8f0';
    }
    const intensity = Math.max(0.15, info.count / maxCount);
    if (isDark) {
      const r = Math.round(6 + intensity * 10);
      const g = Math.round(50 + intensity * 135);
      const b = Math.round(40 + intensity * 89);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const r = Math.round(209 - intensity * 179);
      const g = Math.round(238 - intensity * 48);
      const b = Math.round(214 - intensity * 145);
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const getHoverColor = (abbr: string) => {
    const info = stateData[abbr];
    if (!info || info.count === 0) {
      return isDark ? '#1e293b' : '#cbd5e1';
    }
    const intensity = Math.max(0.15, info.count / maxCount);
    if (isDark) {
      const r = Math.round(10 + intensity * 20);
      const g = Math.round(70 + intensity * 155);
      const b = Math.round(55 + intensity * 100);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const r = Math.round(180 - intensity * 160);
      const g = Math.round(220 - intensity * 40);
      const b = Math.round(190 - intensity * 130);
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, abbr: string) => {
    const info = stateData[abbr];
    setTooltipContent({
      name: STATE_NAMES[abbr] || abbr,
      abbr,
      count: info?.count || 0,
      flagged: info?.flagged || 0,
      verified: info?.verified || 0,
      review: info?.review || 0,
      avgRisk: info && info.count > 0 ? Math.round(info.totalRisk / info.count) : 0,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const container = (e.currentTarget as HTMLElement).closest('.heatmap-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const totalStatesWithProviders = Object.keys(stateData).length;
  const totalProviders = records.length;

  return (
    <GlassCard className="lg:col-span-3 p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-2 h-6 bg-emerald-500 rounded-sm"></span>
          Provider Distribution Map
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <span className={`flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            <MapPin size={12} />
            {totalStatesWithProviders} states · {totalProviders} providers
          </span>
        </div>
      </div>

      <div className="relative heatmap-container" onMouseMove={handleMouseMove}>
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 1000 }}
          style={{ width: '100%', height: 'auto', maxHeight: '400px' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                const fips = geo.id;
                const abbr = FIPS_TO_ABBR[fips] || "";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getColor(abbr)}
                    stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)'}
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: {
                        fill: getHoverColor(abbr),
                        outline: 'none',
                        stroke: isDark ? 'rgba(16,185,129,0.6)' : 'rgba(16,185,129,0.8)',
                        strokeWidth: 1.5,
                        cursor: 'pointer',
                      },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={(e) => handleMouseEnter(e as unknown as React.MouseEvent, abbr)}
                    onMouseLeave={() => setTooltipContent(null)}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        {/* Tooltip */}
        {tooltipContent && (
          <div
            className={`absolute pointer-events-none z-50 px-3 py-2.5 rounded-lg text-xs shadow-xl border transition-opacity duration-100
              ${isDark ? 'bg-[#0a1a14] border-emerald-500/30 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-lg'}
            `}
            style={{
              left: Math.min(tooltipPos.x + 14, 500),
              top: tooltipPos.y - 80,
              minWidth: '155px',
            }}
          >
            <div className="font-semibold text-sm mb-1.5 flex items-center gap-1.5">
              <span>{tooltipContent.name}</span>
              <span className={`text-[10px] font-normal ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>({tooltipContent.abbr})</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between gap-4">
                <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Providers</span>
                <span className="font-semibold">{tooltipContent.count}</span>
              </div>
              {tooltipContent.count > 0 && (
                <>
                  <div className={`border-t my-1 ${isDark ? 'border-white/10' : 'border-slate-100'}`} />
                  <div className="flex justify-between gap-4">
                    <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Avg Risk</span>
                    <span className={`font-semibold ${tooltipContent.avgRisk > 60 ? 'text-red-400' : tooltipContent.avgRisk > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {tooltipContent.avgRisk}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Verified</span>
                    <span className="font-medium text-emerald-400">{tooltipContent.verified}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Flagged</span>
                    <span className="font-medium text-red-400">{tooltipContent.flagged}</span>
                  </div>
                  {tooltipContent.review > 0 && (
                    <div className="flex justify-between gap-4">
                      <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Review</span>
                      <span className="font-medium text-amber-400">{tooltipContent.review}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-2">
        <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Low</span>
        <div className="flex gap-0.5">
          {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1.0].map((intensity, i) => (
            <div
              key={i}
              className="w-6 h-3 rounded-sm"
              style={{
                backgroundColor: isDark
                  ? `rgb(${Math.round(6 + intensity * 10)}, ${Math.round(50 + intensity * 135)}, ${Math.round(40 + intensity * 89)})`
                  : `rgb(${Math.round(209 - intensity * 179)}, ${Math.round(238 - intensity * 48)}, ${Math.round(214 - intensity * 145)})`
              }}
            />
          ))}
        </div>
        <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>High</span>
        <span className={`text-[10px] ml-1 ${isDark ? 'text-gray-600' : 'text-slate-300'}`}>(Provider Count)</span>
      </div>
    </GlassCard>
  );
};

export default USHeatmap;
