import React, { useState, useCallback, useRef } from 'react';

interface MarqueeSelectionOptions {
    itemRefs: React.MutableRefObject<Map<number, HTMLElement>>;
    containerRef: React.RefObject<HTMLDivElement>;
    allItems: { id: number }[];
    selectedIds: Set<number>;
    setSelectedIds: (ids: Set<number>) => void;
    clearSelection: () => void;
}

interface Marquee {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const useMarqueeSelection = ({
    itemRefs,
    containerRef,
    allItems,
    selectedIds,
    setSelectedIds,
    clearSelection,
}: MarqueeSelectionOptions) => {
    const [marquee, setMarquee] = useState<Marquee | null>(null);
    const startPos = useRef<{ x: number; y: number } | null>(null);
    const initialSelection = useRef<Set<number>>(new Set());

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Only start marquee if clicking on the container itself (not on an item)
        // and it's a primary mouse button click.
        if (e.target !== containerRef.current || e.button !== 0) {
            if (e.target === containerRef.current) {
                clearSelection();
            }
            return;
        }

        startPos.current = { x: e.clientX, y: e.clientY };
        setMarquee({ x: e.clientX, y: e.clientY, width: 0, height: 0 });

        // Store the selection at the start of the drag
        if (e.ctrlKey || e.metaKey) {
            initialSelection.current = new Set(selectedIds);
        } else {
            initialSelection.current = new Set();
            clearSelection();
        }
    }, [containerRef, selectedIds, clearSelection]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!startPos.current || !containerRef.current) return;
        
        e.preventDefault();

        const containerRect = containerRef.current.getBoundingClientRect();
        
        const currentX = e.clientX;
        const currentY = e.clientY;

        const left = Math.min(startPos.current.x, currentX);
        const top = Math.min(startPos.current.y, currentY);
        const width = Math.abs(currentX - startPos.current.x);
        const height = Math.abs(currentY - startPos.current.y);

        const marqueeRect: Marquee = {
            x: left,
            y: top,
            width,
            height,
        };
        setMarquee(marqueeRect);
        
        const newSelectedIds = new Set(initialSelection.current);
        
        for (const item of allItems) {
            const element = itemRefs.current.get(item.id);
            if (element) {
                const itemRect = element.getBoundingClientRect();

                // Check for intersection
                if (
                    itemRect.left < marqueeRect.x + marqueeRect.width &&
                    itemRect.left + itemRect.width > marqueeRect.x &&
                    itemRect.top < marqueeRect.y + marqueeRect.height &&
                    itemRect.top + itemRect.height > marqueeRect.y
                ) {
                    if (initialSelection.current.has(item.id)) {
                        // If Ctrl/Meta is held, dragging over an initially selected item deselects it
                        if (e.ctrlKey || e.metaKey) newSelectedIds.delete(item.id);
                    } else {
                        newSelectedIds.add(item.id);
                    }
                } else {
                    // If not intersecting, ensure it's not in the selection unless it was initially
                    if (!initialSelection.current.has(item.id)) {
                        newSelectedIds.delete(item.id);
                    }
                }
            }
        }
        setSelectedIds(newSelectedIds);

    }, [allItems, itemRefs, setSelectedIds]);

    const handleMouseUp = useCallback(() => {
        startPos.current = null;
        setMarquee(null);
    }, []);

    const MarqueeComponent = marquee ? React.createElement('div', {
        className: "fixed border border-primary bg-primary/20 pointer-events-none",
        style: {
            left: marquee.x,
            top: marquee.y,
            width: marquee.width,
            height: marquee.height,
        },
    }) : null;

    return { MarqueeComponent, handleMouseDown, handleMouseMove, handleMouseUp };
};