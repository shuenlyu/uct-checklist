import React, { useEffect, useState } from 'react';
import { customers } from '../models/customer';
import { products } from '../models/product';
import styles from './EditModal.module.css';
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
      <div className={styles.modalContainer} onClick={onClose}></div>
      <div className={styles.modalContent}>
        <div className={styles.modalBody}>
          <div className={styles.modalHeader}>
            <h2>{title}</h2>
          </div>
          <select
            value={customer}
            onChange={(e) => setCustomer(Number(e.target.value))}
            className={styles.selectField}
          >
            <option value={0}>Select Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={product}
            onChange={(e) => setProduct(Number(e.target.value))}
            className={styles.selectField}
          >
            <option value={0}>Select Product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={folder}
            onChange={(e) => setFolder(Number(e.target.value))}
            className={styles.selectField}
          >
            <option value={0}>Select Folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Name"
            className={styles.inputField}
          />
          {!isValidChecklist && (
            <div className={styles.errorMessage}>
              Please fill out all fields.
            </div>
          )}
          <div className={styles.buttons}>
            <button
              className={`${styles.modalButton} ${styles.submitButton}`}
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className={styles.spinnerContainer}>
                  <SpinnerComponent />
                </div>
              ) : (
                'Submit'
              )}
            </button>
            <button
              className={`${styles.modalButton} ${styles.cancelButton}`}
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditModal;