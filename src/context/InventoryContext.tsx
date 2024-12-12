import React, { createContext, useContext, useState, useEffect } from 'react';
import { InventoryItem, Warehouse, WastageRecord, SaleRecord } from '../types';
import { inventoryService } from '../services/inventoryService';

interface InventoryContextType {
  inventory: InventoryItem[];
  warehouses: Warehouse[];
  loading: boolean;
  error: string | null;
  addItem: (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addWarehouse: (warehouse: Omit<Warehouse, 'id' | 'created_at'>) => Promise<void>;
  updateWarehouse: (id: string, warehouse: Partial<Warehouse>) => Promise<void>;
  deleteWarehouse: (id: string) => Promise<void>;
  transferItem: (itemId: string, targetWarehouseId: string, quantity: number) => Promise<void>;
  recordWastage: (wastage: Omit<WastageRecord, 'id'>) => Promise<void>;
  recordSale: (sale: Omit<SaleRecord, 'id'>) => Promise<void>;
  getLowStockItems: () => InventoryItem[];
  refreshData: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [inventoryData, warehousesData] = await Promise.all([
        inventoryService.getInventory(),
        inventoryService.getWarehouses()
      ]);
      console.log('Refreshed data:', { inventory: inventoryData, warehouses: warehousesData });
      setInventory(inventoryData);
      setWarehouses(warehousesData);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addItem = async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      await inventoryService.addItem(item);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
      throw err;
    }
  };

  // ... rest of the methods remain the same ...

  const value = {
    inventory,
    warehouses,
    loading,
    error,
    addItem,
    updateItem: async (id, updates) => {
      try {
        await inventoryService.updateItem(id, updates);
        await refreshData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update item');
        throw err;
      }
    },
    deleteItem: async (id) => {
      try {
        await inventoryService.deleteItem(id);
        await refreshData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete item');
        throw err;
      }
    },
    addWarehouse: async (warehouse) => {
      try {
        await inventoryService.addWarehouse(warehouse);
        await refreshData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add warehouse');
        throw err;
      }
    },
    updateWarehouse: async (id, updates) => {
      try {
        await inventoryService.updateWarehouse(id, updates);
        await refreshData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update warehouse');
        throw err;
      }
    },
    deleteWarehouse: async (id) => {
      try {
        await inventoryService.deleteWarehouse(id);
        await refreshData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete warehouse');
        throw err;
      }
    },
    transferItem: async (itemId, targetWarehouseId, quantity) => {
      try {
        await inventoryService.transferItem(itemId, targetWarehouseId, quantity);
        await refreshData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to transfer item');
        throw err;
      }
    },
    recordWastage: async (wastage) => {
      try {
        await inventoryService.addWastageRecord(wastage);
        await refreshData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to record wastage');
        throw err;
      }
    },
    recordSale: async (sale) => {
      try {
        await inventoryService.addSaleRecord(sale);
        await refreshData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to record sale');
        throw err;
      }
    },
    getLowStockItems: () => inventory.filter(item => item.quantity <= item.threshold),
    refreshData,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}