import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Edit2, Trash2, Package, Plus, ArrowRightLeft, DollarSign, XCircle } from 'lucide-react';
import { InventoryItem } from '../../types';
import InventoryForm from './InventoryForm';
import TransferModal from './TransferModal';
import SalesForm from '../sales/SalesForm';
import WastageForm from '../wastage/WastageForm';
import ErrorMessage from '../ErrorMessage';
import LoadingSpinner from '../LoadingSpinner';

interface InventoryListProps {
  showWarehouseView?: boolean;
}

export default function InventoryList({ showWarehouseView = false }: InventoryListProps) {
  const { inventory, warehouses, deleteItem, loading, error, refreshData } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isSalesOpen, setIsSalesOpen] = useState(false);
  const [isWastageOpen, setIsWastageOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | undefined>();
  const [itemToTransfer, setItemToTransfer] = useState<InventoryItem | undefined>();
  const [itemForSale, setItemForSale] = useState<InventoryItem | undefined>();
  const [itemForWastage, setItemForWastage] = useState<InventoryItem | undefined>();

  useEffect(() => {
    refreshData();
  }, []);

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inventoryByWarehouse = warehouses.map(warehouse => ({
    ...warehouse,
    items: filteredInventory.filter(item => item.warehouse_id === warehouse.id)
  }));

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="bg-black rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Package className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-xl font-semibold text-white">Inventory</h2>
        </div>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Item
          </button>
        </div>
      </div>

      {inventoryByWarehouse.map(warehouse => (
        <div key={warehouse.id} className="mb-8">
          <h3 className="text-lg font-medium text-white mb-4">{warehouse.name} - {warehouse.location}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {warehouse.items.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">{item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`${
                        item.quantity <= item.threshold ? 'text-red-500' : 'text-gray-300'
                      }`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      ${item.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setItemToEdit(item);
                            setIsFormOpen(true);
                          }}
                          className="text-blue-500 hover:text-blue-400"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setItemToTransfer(item);
                            setIsTransferOpen(true);
                          }}
                          className="text-violet-500 hover:text-violet-400"
                        >
                          <ArrowRightLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setItemForSale(item);
                            setIsSalesOpen(true);
                          }}
                          className="text-green-500 hover:text-green-400"
                        >
                          <DollarSign className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setItemForWastage(item);
                            setIsWastageOpen(true);
                          }}
                          className="text-red-500 hover:text-red-400"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <InventoryForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setItemToEdit(undefined);
        }}
        itemToEdit={itemToEdit}
      />

      {itemToTransfer && (
        <TransferModal
          isOpen={isTransferOpen}
          onClose={() => {
            setIsTransferOpen(false);
            setItemToTransfer(undefined);
          }}
          item={itemToTransfer}
        />
      )}

      {itemForSale && (
        <SalesForm
          isOpen={isSalesOpen}
          onClose={() => {
            setIsSalesOpen(false);
            setItemForSale(undefined);
          }}
          item={itemForSale}
        />
      )}

      {itemForWastage && (
        <WastageForm
          isOpen={isWastageOpen}
          onClose={() => {
            setIsWastageOpen(false);
            setItemForWastage(undefined);
          }}
          item={itemForWastage}
        />
      )}
    </div>
  );
}