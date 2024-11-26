import React, { useState } from "react";

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
        <div className="confirm-modal">
            <div className="confirm-modal-content">
                <h2>Add Folder</h2>
                <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="Folder Name"
                />
                <div className="buttons" style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    marginTop: '20px',
                }}>
                    <button className='modal-button' onClick={handleSubmit}>Add</button>
                    <button className='modal-button cancel-button' onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default AddFolderModal;