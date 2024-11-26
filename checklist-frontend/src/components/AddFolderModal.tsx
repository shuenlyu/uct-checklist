import React, { useState } from 'react';
import styles from './AddFolderModal.module.css';

interface FolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (folderName: string) => void;
}

const AddFolderModal: React.FC<FolderModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [folderName, setFolderName] = useState('');

    const handleSubmit = () => {
        onSubmit(folderName);
        setFolderName('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className={styles.modalContainer} onClick={onClose}></div>
            <div className={styles.modalContent}>
                <h2>Add Folder</h2>
                <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="Folder Name"
                    className={styles.inputField}
                />
                <div className={styles.buttons}>
                    <button className={`${styles.modalButton} ${styles.addButton}`} onClick={handleSubmit}>
                        Add
                    </button>
                    <button className={`${styles.modalButton} ${styles.cancelButton}`} onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </>
    );
};

export default AddFolderModal;