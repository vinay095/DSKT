import { useState, useCallback } from 'react';
import { CatalogItem } from '../lib/catalog';
import { CellCoord, WorldPoint } from '../types/geometry';
import { DeskElement, FloorPlan, RoomElement } from '../types/floorplan';
import { DEFAULT_FLOOR_CONFIG, worldToFinestCell } from '../geometry/grid';
import { checkEntityVsFloorBoundary, checkCellCollision, getEntityFootprint } from '../geometry/entities';

interface PlacementGhost {
  catalogItem: CatalogItem;
  originFinest: CellCoord;
  isValid: boolean;
}

export function useFloorEditor(
  floorPlan: FloorPlan,
  setFloorPlan: React.Dispatch<React.SetStateAction<FloorPlan>>
) {
  const [activeCatalogItem, setActiveCatalogItem] = useState<CatalogItem | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [placementGhost, setPlacementGhost] = useState<PlacementGhost | null>(null);

  const floorConfig = floorPlan.floorConfig || DEFAULT_FLOOR_CONFIG;

  /**
   * Updates preview ghost position when mouse moves across canvas during placement mode.
   */
  const updatePlacementGhost = useCallback(
    (worldPoint: WorldPoint) => {
      if (!activeCatalogItem) {
        setPlacementGhost(null);
        return;
      }

      // Convert world point to finest cell (snapped to placement a/4 boundaries)
      const rawFinest = worldToFinestCell(worldPoint, floorConfig);
      const snappedFinest: CellCoord = {
        col: Math.floor(rawFinest.col / 4) * 4,
        row: Math.floor(rawFinest.row / 4) * 4,
      };

      const footprint = getEntityFootprint(
        snappedFinest,
        activeCatalogItem.widthFinestCells,
        activeCatalogItem.heightFinestCells,
        0
      );

      // Validate boundary & overlap collision
      const isInsideFloor = checkEntityVsFloorBoundary(footprint.occupiedFinestCells, floorConfig);

      // Check collision with existing desks
      const existingDeskCells: CellCoord[] = floorPlan.desks.flatMap((d) =>
        getEntityFootprint(
          { col: d.x * 4, row: d.y * 4 },
          d.geometry?.widthFinestCells || 8,
          d.geometry?.heightFinestCells || 6,
          d.rotation
        ).occupiedFinestCells
      );

      const isColliding = checkCellCollision(footprint.occupiedFinestCells, existingDeskCells);
      const isValid = isInsideFloor && !isColliding;

      setPlacementGhost({
        catalogItem: activeCatalogItem,
        originFinest: snappedFinest,
        isValid,
      });
    },
    [activeCatalogItem, floorConfig, floorPlan.desks]
  );

  /**
   * Commits placement of active catalog item onto the floor plan document.
   */
  const commitPlacement = useCallback(
    (_worldPoint: WorldPoint) => {
      if (!activeCatalogItem || !placementGhost || !placementGhost.isValid) return;

      const placementCol = Math.floor(placementGhost.originFinest.col / 4);
      const placementRow = Math.floor(placementGhost.originFinest.row / 4);

      if (activeCatalogItem.category === 'desk') {
        const newDesk: DeskElement = {
          id: `desk-${Date.now()}`,
          code: `D-${floorPlan.desks.length + 101}`,
          x: placementCol,
          y: placementRow,
          rotation: 0,
          status: 'available',
          department: 'Engineering',
          hasMonitor: activeCatalogItem.hasMonitor,
          isStandingDesk: activeCatalogItem.isStandingDesk,
          geometry: {
            objectId: `obj-${Date.now()}`,
            category: 'desk',
            elementType: activeCatalogItem.id,
            originFinest: placementGhost.originFinest,
            widthFinestCells: activeCatalogItem.widthFinestCells,
            heightFinestCells: activeCatalogItem.heightFinestCells,
            rotation: 0,
            color: activeCatalogItem.color,
            label: activeCatalogItem.name,
          },
        };

        setFloorPlan((prev) => ({
          ...prev,
          desks: [...prev.desks, newDesk],
          lastModified: new Date().toISOString(),
        }));
        setSelectedEntityId(newDesk.id);
      } else if (activeCatalogItem.category === 'room') {
        const newRoom: RoomElement = {
          id: `room-${Date.now()}`,
          name: activeCatalogItem.name,
          x: placementCol,
          y: placementRow,
          width: activeCatalogItem.widthFinestCells / 4,
          height: activeCatalogItem.heightFinestCells / 4,
          type: 'meeting',
          capacity: activeCatalogItem.capacity || 6,
          geometry: {
            objectId: `obj-${Date.now()}`,
            category: 'meeting',
            elementType: activeCatalogItem.id,
            originFinest: placementGhost.originFinest,
            widthFinestCells: activeCatalogItem.widthFinestCells,
            heightFinestCells: activeCatalogItem.heightFinestCells,
            rotation: 0,
            color: activeCatalogItem.color,
            label: activeCatalogItem.name,
          },
        };

        setFloorPlan((prev) => ({
          ...prev,
          rooms: [...prev.rooms, newRoom],
          lastModified: new Date().toISOString(),
        }));
        setSelectedEntityId(newRoom.id);
      }

      // Reset placement mode after placing
      setActiveCatalogItem(null);
      setPlacementGhost(null);
    },
    [activeCatalogItem, placementGhost, floorPlan.desks.length, setFloorPlan]
  );

  /**
   * Rotates currently selected entity by 90 degrees CCW.
   */
  const rotateSelectedEntity = useCallback(() => {
    if (!selectedEntityId) return;

    setFloorPlan((prev) => ({
      ...prev,
      desks: prev.desks.map((d) =>
        d.id === selectedEntityId
          ? {
              ...d,
              rotation: ((d.rotation + 90) % 360) as 0 | 90 | 180 | 270,
              geometry: d.geometry
                ? {
                    ...d.geometry,
                    rotation: ((d.geometry.rotation + 90) % 360) as 0 | 90 | 180 | 270,
                  }
                : undefined,
            }
          : d
      ),
    }));
  }, [selectedEntityId, setFloorPlan]);

  /**
   * Deletes currently selected entity.
   */
  const deleteSelectedEntity = useCallback(() => {
    if (!selectedEntityId) return;

    setFloorPlan((prev) => ({
      ...prev,
      desks: prev.desks.filter((d) => d.id !== selectedEntityId),
      rooms: prev.rooms.filter((r) => r.id !== selectedEntityId),
      zones: prev.zones.filter((z) => z.id !== selectedEntityId),
    }));
    setSelectedEntityId(null);
  }, [selectedEntityId, setFloorPlan]);

  return {
    activeCatalogItem,
    setActiveCatalogItem,
    selectedEntityId,
    setSelectedEntityId,
    placementGhost,
    updatePlacementGhost,
    commitPlacement,
    rotateSelectedEntity,
    deleteSelectedEntity,
  };
}
