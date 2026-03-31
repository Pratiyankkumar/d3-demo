import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface HyperbolaPoint {
  x: number;
  y: number;
}

const AnimatedHyperbolaScene1: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // --- 1. Setup ---
    const width = 600;
    const height = 400;
    const margin = { top: 40, right: 60, bottom: 40, left: 60 };
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Cleanup

    const a = 4, c = 6, b = Math.sqrt(20);
    const xScale = d3.scaleLinear().domain([-10, 10]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-8, 8]).range([height - margin.bottom, margin.top]);

    const g = svg.append('g');

    // Time constants for sequencing (ms)
    const DURATION = 1000;
    const DELAY_STEP = 1200;

    // --- Frame 1: Axes (Animated Growth) ---
    const xAxis = g.append('line')
      .attr('x1', xScale(0)).attr('y1', yScale(0))
      .attr('x2', xScale(0)).attr('y2', yScale(0))
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2);

    xAxis.transition().duration(DURATION)
      .attr('x1', xScale(-10)).attr('x2', xScale(10));

    const yAxis = g.append('line')
      .attr('x1', xScale(0)).attr('y1', yScale(0))
      .attr('x2', xScale(0)).attr('y2', yScale(0))
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2);

    yAxis.transition().duration(DURATION)
      .attr('y1', yScale(-8)).attr('y2', yScale(8));

    // --- Frame 2: Hyperbola (Self-Drawing Animation) ---
    const lineGenerator = d3.line<HyperbolaPoint>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveBasis);

    const tRange = d3.range(-2.2, 2.3, 0.1);
    const rightData: HyperbolaPoint[] = tRange.map(t => ({ x: a * Math.cosh(t), y: b * Math.sinh(t) }));
    const leftData: HyperbolaPoint[] = tRange.map(t => ({ x: -a * Math.cosh(t), y: b * Math.sinh(t) }));

    const drawBranch = (data: HyperbolaPoint[]) => {
      const path = g.append('path')
        .datum(data)
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', '#334155')
        .attr('stroke-width', 2.5)
        .attr('opacity', 0);

      const totalLength = (path.node() as SVGPathElement).getTotalLength();

      path
        .attr('stroke-dasharray', totalLength + ' ' + totalLength)
        .attr('stroke-dashoffset', totalLength)
        .attr('opacity', 1)
        .transition()
        .delay(DELAY_STEP)
        .duration(DURATION * 1.5)
        .attr('stroke-dashoffset', 0);
    };

    drawBranch(rightData);
    drawBranch(leftData);

    // --- Frame 3: Foci (Pop in) ---
    const foci = [{ x: -c, y: 0, id: 'F1' }, { x: c, y: 0, id: 'F2' }];
    
    foci.forEach((f, i) => {
      const focusGroup = g.append('g').attr('opacity', 0);
      
      focusGroup.append('circle')
        .attr('cx', xScale(f.x)).attr('cy', yScale(f.y)).attr('r', 5).attr('fill', '#ef4444');
      
      focusGroup.append('text')
        .attr('x', xScale(f.x)).attr('y', yScale(f.y) + 25)
        .attr('text-anchor', 'middle').attr('font-size', '12px').attr('fill', '#ef4444')
        .text(f.id === 'F1' ? 'F₁(-c, 0)' : 'F₂(c, 0)');

      focusGroup.transition()
        .delay(DELAY_STEP * 2.5 + (i * 300))
        .duration(500)
        .attr('opacity', 1);
    });

    // --- Frame 4: Vertical Dashed Line ---
    const dashedLine = g.append('line')
      .attr('x1', xScale(c)).attr('y1', yScale(0))
      .attr('x2', xScale(c)).attr('y2', yScale(0))
      .attr('stroke', '#f59e0b')
      .attr('stroke-dasharray', '5,5')
      .attr('stroke-width', 2)
      .attr('opacity', 0);

    dashedLine.transition()
      .delay(DELAY_STEP * 3.5)
      .duration(DURATION)
      .attr('opacity', 1)
      .attr('y1', yScale(-7))
      .attr('y2', yScale(7));

    // --- Frame 5: Points A and B ---
    const pts = [{ x: c, y: 5, label: 'A(c, 5)' }, { x: c, y: -5, label: 'B(c, -5)' }];
    
    pts.forEach((p, i) => {
      const ptGroup = g.append('g').attr('opacity', 0);

      ptGroup.append('circle')
        .attr('cx', xScale(p.x)).attr('cy', yScale(p.y)).attr('r', 6).attr('fill', '#3b82f6');
      
      ptGroup.append('text')
        .attr('x', xScale(p.x) + 12).attr('y', yScale(p.y) + (p.y > 0 ? -5 : 15))
        .attr('fill', '#1e40af').attr('font-weight', 'bold').text(p.label);

      ptGroup.transition()
        .delay(DELAY_STEP * 4.5 + (i * 400))
        .duration(500)
        .attr('opacity', 1)
        .attr('transform', 'scale(1.2)')
        .transition().duration(200).attr('transform', 'scale(1)');
    });

    // --- Frame 6: Segment AB and Length Label ---
    const segmentAB = g.append('line')
      .attr('x1', xScale(c)).attr('y1', yScale(0))
      .attr('x2', xScale(c)).attr('y2', yScale(0))
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 4);

    segmentAB.transition()
      .delay(DELAY_STEP * 5.5)
      .duration(DURATION)
      .attr('y1', yScale(5))
      .attr('y2', yScale(-5));

    const lengthLabel = g.append('text')
      .attr('x', xScale(c) - 15).attr('y', yScale(0))
      .attr('text-anchor', 'end').attr('fill', '#1e40af').attr('font-weight', 'bold')
      .attr('opacity', 0)
      .text('|AB| = 10');

    lengthLabel.transition()
      .delay(DELAY_STEP * 6)
      .duration(DURATION)
      .attr('opacity', 1);

  }, []);

  return (
    <div className="w-full flex flex-col items-center bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-extrabold text-slate-800">Animated Setup</h2>
        <p className="text-slate-500">Visualizing the Hyperbola and the vertical focal chord</p>
      </div>
      
      <div className="relative bg-slate-50 rounded-xl p-4 shadow-inner overflow-hidden">
        <svg ref={svgRef} width="600" height="400" className="overflow-visible"></svg>
      </div>

      <button 
        onClick={() => window.location.reload()} 
        className="mt-8 px-6 py-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-colors"
      >
        Replay Animation
      </button>
    </div>
  );
};

export default AnimatedHyperbolaScene1;