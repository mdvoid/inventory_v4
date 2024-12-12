import { supabase } from '../lib/supabase';
import { InventoryItem, Warehouse, WastageRecord, SaleRecord } from '../types';

export const inventoryService = {
  // Inventory Items
  async getInventory() {
    console.log('Fetching inventory...');
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        warehouse:warehouses(id, name, location)
      `)
      .order('name');
    
    if (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
    
    console.log('Fetched inventory:', data);
    return data as InventoryItem[];
  },

  // Warehouses
  async getWarehouses() {
    console.log('Fetching warehouses...');
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching warehouses:', error);
      throw error;
    }
    
    console.log('Fetched warehouses:', data);
    return data as Warehouse[];
  },

  async addItem(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) {
    console.log('Adding item:', item);
    const { data, error } = await supabase
      .from('inventory')
      .insert([{
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding item:', error);
      throw error;
    }
    
    console.log('Added item:', data);
    return data as InventoryItem;
  },

  async updateItem(id: string, updates: Partial<InventoryItem>) {
    console.log('Updating item:', id, updates);
    const { data, error } = await supabase
      .from('inventory')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating item:', error);
      throw error;
    }
    
    console.log('Updated item:', data);
    return data as InventoryItem;
  },

  async deleteItem(id: string) {
    console.log('Deleting item:', id);
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  },

  async addWarehouse(warehouse: Omit<Warehouse, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('warehouses')
      .insert([warehouse])
      .select()
      .single();
    
    if (error) throw error;
    return data as Warehouse;
  },

  async updateWarehouse(id: string, updates: Partial<Warehouse>) {
    const { data, error } = await supabase
      .from('warehouses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Warehouse;
  },

  async deleteWarehouse(id: string) {
    const { error } = await supabase
      .from('warehouses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async transferItem(itemId: string, targetWarehouseId: string, quantity: number) {
    // Start a transaction
    const { data: sourceItem } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', itemId)
      .single();

    if (!sourceItem) throw new Error('Item not found');
    if (sourceItem.quantity < quantity) throw new Error('Insufficient quantity');

    const updates = [
      {
        id: itemId,
        quantity: sourceItem.quantity - quantity,
        updated_at: new Date().toISOString()
      }
    ];

    // Check if item exists in target warehouse
    const { data: existingItem } = await supabase
      .from('inventory')
      .select('*')
      .eq('name', sourceItem.name)
      .eq('warehouse_id', targetWarehouseId)
      .single();

    if (existingItem) {
      updates.push({
        id: existingItem.id,
        quantity: existingItem.quantity + quantity,
        updated_at: new Date().toISOString()
      });
    } else {
      const newItem = {
        ...sourceItem,
        id: undefined,
        quantity: quantity,
        warehouse_id: targetWarehouseId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { error: insertError } = await supabase
        .from('inventory')
        .insert([newItem]);
      
      if (insertError) throw insertError;
    }

    // Update quantities
    const { error: updateError } = await supabase
      .from('inventory')
      .upsert(updates);
    
    if (updateError) throw updateError;
  },

  async addWastageRecord(wastage: Omit<WastageRecord, 'id'>) {
    const { data, error } = await supabase
      .from('wastage_records')
      .insert([wastage])
      .select()
      .single();
    
    if (error) throw error;
    
    // Update inventory quantity
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ 
        quantity: supabase.raw('quantity - ?', [wastage.quantity]),
        updated_at: new Date().toISOString()
      })
      .eq('id', wastage.item_id);
    
    if (updateError) throw updateError;
    
    return data as WastageRecord;
  },

  async addSaleRecord(sale: Omit<SaleRecord, 'id'>) {
    const { data, error } = await supabase
      .from('sales_records')
      .insert([sale])
      .select()
      .single();
    
    if (error) throw error;
    
    // Update inventory quantity
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ 
        quantity: supabase.raw('quantity - ?', [sale.quantity]),
        updated_at: new Date().toISOString()
      })
      .eq('id', sale.item_id);
    
    if (updateError) throw updateError;
    
    return data as SaleRecord;
  }
};