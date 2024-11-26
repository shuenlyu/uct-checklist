import React, { useEffect, useState } from 'react';
import { customers } from '../models/customer';
import { products } from '../models/product';
import SpinnerComponent from './SpinnerComponent';

interface Folder {
  id: number;
  name: string;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    customerId: number;
    productId: number;
    folderId: number;
  }) => void;
  initialData?: {
    name: string;
    customerId: number;
    productId: number;
    folderId: number;
  };
  title: string;
  folders: Folder[];
}


const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
  folders,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [customer, setCustomer] = useState<number>(0);
  const [product, setProduct] = useState<number>(0);
  const [folder, setFolder] = useState<number>(0);
  const [isValidChecklist, setIsValidChecklist] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setInputValue(initialData.name);
      setCustomer(initialData.customerId);
      setProduct(initialData.productId);
      setFolder(initialData.folderId);
    } else {
      setInputValue('');
      setCustomer(0);
      setProduct(0);
      setFolder(0);
    }
  }, [initialData, isOpen]);


  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (inputValue === '' || customer === 0 || product === 0 || folder === 0) {
      setIsValidChecklist(false);
      return;
    }
    setIsLoading(true);
    try {
      await onSubmit({
        name: inputValue,
        customerId: customer,
        productId: product,
        folderId: folder,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="modal-container" onClick={onClose}></div>
      <div className="modal-content">
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div className="modal-header">
            <p>{title}</p>
          </div>
          <div className="Add-checklist">
            <div>
              <label htmlFor="customer" style={{ fontWeight: 600 }}>
                Select Customer
              </label>
              <select
                name="customer"
                className="select-dropdown"
                value={customer}
                onChange={(e) => {
                  const selectedCustomerId = parseInt(e.target.value) || 0;
                  setCustomer(selectedCustomerId);
                  setProduct(0);
                  setIsValidChecklist(true);
                }}
              >
                <option value="">Choose a customer from list</option>
                {customers.map((cust) => (
                  <option
                    key={cust.id}
                    style={{ textTransform: 'capitalize' }}
                    value={cust.id}
                  >
                    {cust.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: 20 }}>
              <label htmlFor="product" style={{ fontWeight: 600 }}>
                Select Product Line
              </label>
              <select
                name="product"
                className="select-dropdown"
                value={product}
                onChange={(e) => {
                  setProduct(parseInt(e.target.value) || 0);
                  setIsValidChecklist(true);
                }}
              >
                <option value="">Choose a product line from list</option>
                {products.map((product) => (
                  <option
                    key={product.id}
                    style={{ textTransform: 'capitalize' }}
                    value={product.id}
                  >
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: 20 }}>
              <label htmlFor='folder' style={{ fontWeight: 600 }}>
                Select Folder
              </label>
              <select
                name='folder'
                className='select-dropdown'
                value={folder}
                onChange={(e) => {
                  setFolder(parseInt(e.target.value) || 0);
                  setIsValidChecklist(true);
                }}>
                <option value=''>Choose a folder from list</option>
                {folders.map((folder) => (
                  <option
                    key={folder.id}
                    style={{ textTransform: 'capitalize' }}
                    value={folder.id}
                  >
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: 20 }}>
              <label htmlFor="name" style={{ fontWeight: 600 }}>
                Checklist Name
              </label>
              <input
                type="text"
                placeholder="Add Checklist Name"
                value={inputValue}
                style={{ marginTop: 4 }}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setIsValidChecklist(true);
                }}
              />
            </div>
          </div>
          {!isValidChecklist && (
            <p className="input-remark">
              Customer, Product line & checklist name are required fields
            </p>
          )}
          <div className="buttons" style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px',
          }}>
            <button className="modal-button cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button
              className="modal-button"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? <SpinnerComponent /> : title === 'Enter New Checklist' ? 'Add' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditModal;