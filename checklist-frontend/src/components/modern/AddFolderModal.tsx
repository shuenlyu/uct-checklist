import React, { useState } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';

interface FolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (folderName: string) => void;
}

const AddFolderModal: React.FC<FolderModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [folderName, setFolderName] = useState('');

    const handleSubmit = () => {
        if (folderName.trim()) {
            onSubmit(folderName);
            setFolderName('');
            onClose();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
            
            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <FaPlus className="w-4 h-4 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Add New Folder</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                            <FaTimes className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-2">
                            Folder Name
                        </label>
                        <input
                            id="folderName"
                            type="text"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Enter folder name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                            autoFocus
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-lg">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!folderName.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            Create Folder
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddFolderModal;