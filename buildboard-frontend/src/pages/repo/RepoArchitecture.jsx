import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ForceGraph2D from 'react-force-graph-2d';
import api from '../../lib/api';
import { HolographicLoader, GlassCard } from '../../components/ui';
import { Network, FolderTree, Info } from 'lucide-react';

const RepoArchitecture = () => {
  const { owner, repo } = useParams();
  const fgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef();

  const { data: graphData, isLoading, error } = useQuery({
    queryKey: ['repo-architecture', owner, repo],
    queryFn: async () => {
      const res = await api.get(`/repos/${owner}/${repo}/architecture`);
      return res.data;
    }
  });

  // Handle resize
  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight || 600
      });
      
      const handleResize = () => {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight || 600
        });
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Zoom to fit once data loads
  useEffect(() => {
    if (graphData && fgRef.current) {
      // Small timeout to ensure the graph is rendered first
      setTimeout(() => {
        fgRef.current.zoomToFit(400, 50);
      }, 500);
    }
  }, [graphData]);

  if (isLoading) return (
    <div className="flex h-96 items-center justify-center">
      <HolographicLoader text="ANALYZING_ARCHITECTURE..." />
    </div>
  );

  if (error) return (
    <GlassCard className="border-t-[var(--brand-danger)] p-6">
      <div className="text-[var(--brand-danger)]">Failed to load architecture data: {error.message}</div>
    </GlassCard>
  );

  if (!graphData || !graphData.nodes.length) return (
    <div className="flex flex-col h-96 items-center justify-center text-[var(--text-muted)] space-y-4">
      <FolderTree size={48} className="opacity-20" />
      <p className="font-mono">Repository is empty. Cannot map architecture.</p>
    </div>
  );

  const paintNode = useCallback((node, ctx, globalScale) => {
    const isDir = node.group === 'directory';
    const label = node.name;
    const fontSize = 12/globalScale;
    ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
    
    // Draw Node
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.val * 2, 0, 2 * Math.PI, false);
    ctx.fillStyle = isDir ? '#00e5ff' : '#9d00ff';
    ctx.fill();
    ctx.lineWidth = 1/globalScale;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    // Draw Text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(label, node.x, node.y + (node.val * 2) + fontSize);
  }, []);

  return (
    <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold flex items-center gap-2">
          <Network className="text-[var(--brand-primary)]" />
          Live Architecture Map
        </h2>
        <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#00e5ff]"></div> Directory</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#9d00ff]"></div> File</span>
          <span className="flex items-center gap-1 ml-4 border border-[var(--border-subtle)] px-2 py-1 rounded">
            <Info size={12} /> Scroll to zoom, drag to pan
          </span>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 w-full bg-[#050508] border border-[var(--glass-border)] rounded-lg overflow-hidden relative shadow-[inset_0_0_50px_rgba(0,229,255,0.05)]">
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={(node, color, ctx) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val * 2 + 5, 0, 2 * Math.PI, false);
            ctx.fill();
          }}
          linkColor={link => link.type === 'hierarchy' ? 'rgba(0, 229, 255, 0.2)' : 'rgba(157, 0, 255, 0.4)'}
          linkWidth={link => link.type === 'hierarchy' ? 1 : 2}
          linkDirectionalParticles={link => link.type === 'dependency' ? 2 : 0}
          linkDirectionalParticleSpeed={0.01}
          cooldownTicks={100}
          onNodeDragEnd={node => {
            node.fx = node.x;
            node.fy = node.y;
          }}
        />
        
        {/* Aesthetic overlay grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>
    </div>
  );
};

export default RepoArchitecture;
