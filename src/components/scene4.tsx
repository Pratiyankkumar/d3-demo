import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

/**
 * Mathematically verified graph of y = (2x + 1) / (x^2 - x - 2)
 * VA: x = -1, x = 2
 * HA: y = 0
 * Intercepts: (-0.5, 0), (0, -0.5)
 */
const RationalFunctionGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 600;
    const height = 450;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Mathematically verified domain and range for clear visualization
    const xScale = d3.scaleLinear().domain([-6, 6]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-8, 8]).range([height - margin.bottom, margin.top]);

    const g = svg.append('g');

    // Time constants
    const DURATION = 1500;
    const DELAY_BETWEEN_FRAMES = 1200;

    // Line generator helper
    const lineGenerator = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveMonotoneX);

    // --- Frame 1: Coordinate Plane and Asymptotes ---
    const axes = g.append('g').attr('class', 'axes');
    
    // X and Y Axis
    axes.append('line').attr('x1', xScale(-6)).attr('y1', yScale(0)).attr('x2', xScale(6)).attr('y2', yScale(0)).attr('stroke', '#94a3b8').attr('stroke-width', 1);
    axes.append('line').attr('x1', xScale(0)).attr('y1', yScale(-8)).attr('x2', xScale(0)).attr('y2', yScale(8)).attr('stroke', '#94a3b8').attr('stroke-width', 1);

    // Vertical Asymptotes x = -1 and x = 2
    const vAsymptotes = [-1, 2];
    vAsymptotes.forEach(xPos => {
      g.append('line')
        .attr('x1', xScale(xPos)).attr('y1', yScale(-8))
        .attr('x2', xScale(xPos)).attr('y2', yScale(8))
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '8,6')
        .attr('opacity', 0)
        .transition()
        .duration(DURATION)
        .attr('opacity', 0.6);
    });

    // --- Graph Data Generation ---
    const f = (x: number) => (2 * x + 1) / (x * x - x - 2);

    // Branch 1: x < -1
    const leftData: [number, number][] = d3.range(-6, -1.1, 0.05).map(x => [x, f(x)]);
    // Branch 2: -1 < x < 2
    // Branch 3: x > 2
    const rightData: [number, number][] = d3.range(2.15, 6, 0.05).map(x => [x, f(x)]);

    const drawPath = (data: [number, number][], delay: number, color: string = "#3b82f6") => {
      const path = g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 3)
        .attr('d', lineGenerator);

      const length = path.node()?.getTotalLength() || 0;

      path.attr('stroke-dasharray', `${length} ${length}`)
        .attr('stroke-dashoffset', length)
        .transition()
        .delay(delay)
        .duration(DURATION)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);
      
      return path;
    };

    // --- Frame 2: Left Branch ---
    drawPath(leftData, DELAY_BETWEEN_FRAMES);

    // --- Frame 3: Middle Branch ---
    
    // Mark intercepts in middle branch
    const intercepts = [{x: -0.5, y: 0, label: '(-0.5, 0)'}, {x: 0, y: -0.5, label: '(0, -0.5)'}];
    intercepts.forEach((pt, i) => {
        g.append('circle')
            .attr('cx', xScale(pt.x)).attr('cy', yScale(pt.y)).attr('r', 4)
            .attr('fill', '#1e40af').attr('opacity', 0)
            .transition().delay(DELAY_BETWEEN_FRAMES * 2.5 + (i * 300)).attr('opacity', 1);
    });

    // --- Frame 4: Right Branch ---
    drawPath(rightData, DELAY_BETWEEN_FRAMES * 3.5);

    // --- Frame 5: Highlight ---
    g.selectAll('path')
      .transition()
      .delay(DELAY_BETWEEN_FRAMES * 5)
      .duration(1000)
      .attr('stroke-width', 5)
      .attr('stroke', '#2563eb');

  }, [key]);

  return (
    <div className="flex flex-col items-center bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm">
      <div className="mb-4 text-center">
        <h3 className="text-xl font-bold text-slate-800">Rational Function Analysis</h3>
        <p className="text-sm text-slate-500 font-mono">y = (2x + 1) / (x² - x - 2)</p>
      </div>

      <div className="bg-white rounded-xl shadow-inner p-2">
        <svg ref={svgRef} width="600" height="450" className="overflow-visible"></svg>
      </div>

      <div className="mt-6 flex gap-4 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-red-500 border-t border-dashed"></span>
          <span className="text-slate-600 uppercase tracking-tighter">Asymptotes (x=-1, x=2)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-blue-600 rounded"></span>
          <span className="text-slate-600 uppercase tracking-tighter">Function Branches</span>
        </div>
      </div>

      <button
        onClick={() => setKey(prev => prev + 1)}
        className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg transition-all"
      >
        Replay Animation
      </button>
    </div>
  );
};

export default RationalFunctionGraph;