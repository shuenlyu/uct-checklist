import React, { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { 
  FaTrash, 
  FaPlus, 
  FaFolderOpen, 
  FaFolder, 
  FaChevronDown, 
  FaChevronRight,
  FaGripVertical 
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { customers } from '../models/customer';
import { products } from '../models/product';
import { Survey } from '../models/survey';
import { useApi } from '../utils/api';
import Logger from '../utils/logger';
import AddFolderModal from './AddFolderModal';
import EditModal from './EditModal';
import Loading from './Loading';
import RemoveModal from './RemoveModal';
import SurveyItem from './SurveyItem';

interface Folder {
  id: number;
  name: string;
  files: Survey[];
}

const Surveys = (): React.ReactElement => {
  // State management
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [isRemoveModalOpen, setRemoveModalOpen] = useState(false);
  const [surveyToRemove, setSurveyToRemove] = useState<Survey | null>(null);
  const [isFolderModalOpen, setFolderModalOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderStates, setFolderStates] = useState<{ [key: number]: boolean }>({});
  const [loadedFolders, setLoadedFolders] = useState<{ [key: number]: boolean }>({});
  const [isLoading, setIsLoading] = useState<{ [key: number]: boolean }>({});
  const [modalData, setModalData] = useState<{
    name: string;
    customerId: number;
    productId: number;
    folderId: number;
  } | null>(null);

  const { fetchData, postData, deleteData, putData } = useApi();
  const { userGroup } = useAuth();

  // Initialize folders
  useEffect(() => {
    getFolders();
  }, []);

  const getFolders = async () => {
    try {
      const response = await fetchData('/getFolders');
      Logger.info('Folders:', response.data);
      setFolders(response.data);
      const initialStates = response.data.reduce((acc: { [key: number]: boolean }, folder: Folder) => {
        acc[folder.id] = false;
        return acc;
      }, {});
      setFolderStates(initialStates);
    } catch (error) {
      Logger.error('Error fetching folders:', error);
    }
  };

  const addFolder = async (folderName: string) => {
    if (folderName.trim() === '') return;
    try {
      const response = await postData('/folders', { name: folderName });
      Logger.debug('Add Folder:', response);
      if (response.status === 200) {
        setFolders((prevFolders) => [...prevFolders, ...response.data]);
      }
    } catch (error) {
      Logger.error('Error adding folder:', error);
    }
  };

  const deleteFolder = async (folderId: number) => {
    try {
      const response = await deleteData(`/folders/${folderId}`);
      Logger.debug('Delete Folder:', response);
      if (response.status === 200) {
        setFolders((prevFolders) => prevFolders.filter((folder) => folder.id !== folderId));
      }
    } catch (error) {
      Logger.error('Error deleting folder:', error);
    }
  };

  const openAddModal = () => {
    setModalOpen(true);
    setModalData(null);
  };

  const openFolderModal = () => {
    setFolderModalOpen(true);
  };

  const openEditModal = (
    id: string,
    name: string,
    customerName: string,
    productLine: string,
    folderId: number
  ) => {
    setEditModalOpen(true);
    const customerObj = customers.find((cust) => cust.name === customerName);
    const productObj = products.find((prod) => prod.name === productLine);
    setSelectedId(id);
    setModalData({
      name,
      customerId: customerObj ? customerObj.id : 0,
      productId: productObj ? productObj.id : 0,
      folderId,
    });
  };

  const handleModalSubmit = async (data: {
    name: string;
    customerId: number;
    productId: number;
    folderId: number;
  }) => {
    try {
      let response;
      if (isEditModalOpen) {
        response = await updateSurvey(data.name, data.customerId, data.productId, data.folderId);
        if (response.status === 200) {
          updateFolderFiles(data.folderId, response.data);
        }
      } else {
        response = await createSurvey(data.name, data.customerId, data.productId, data.folderId);
        Logger.info('response data: ', response.data);
        if (response.status === 200) {
          updateFolderFiles(data.folderId, response.data);
        }
      }
    } catch (error) {
      Logger.error('Error submitting modal data:', error);
    }
  };

  const createSurvey = async (name: string, customerId: number, productId: number, folderId: number) => {
    const customerName = customers.find((cust) => cust.id === customerId)?.name || '';
    const productName = products.find((pro) => pro.id === productId)?.name || '';
    const response = await postData('/create', {
      name,
      customer: customerName,
      product: productName,
      folderId,
    });
    if (response.status === 200) {
      setModalOpen(false);
    }
    return response;
  };

  const updateSurvey = async (name: string, customerId: number, productId: number, folderId: number) => {
    const customerName = customers.find((cust) => cust.id === customerId)?.name || '';
    const productName = products.find((pro) => pro.id === productId)?.name || '';
    const response = await fetchData(
      `/changeName?name=${name}&id=${selectedId}&customer=${customerName}&product=${productName}&folderId=${folderId}`
    );
    if (response.status === 200) {
      setEditModalOpen(false);
    }
    return response;
  };

  const duplicateSurvey = async (survey: Survey) => {
    try {
      const response = await postData('/duplicate', {
        name: survey.name + '(copy)',
        customer: survey.customer,
        product: survey.prod_line,
        json: survey.json,
        folderId: survey.folder_id
      });
      if (response.status === 200) {
        updateFolderFiles(survey.folder_id, response.data);
      }
    } catch (error) {
      Logger.error('Error duplicating survey:', error);
    }
  };

  const confirmRemoveSurvey = (survey: Survey) => {
    setSurveyToRemove(survey);
    setRemoveModalOpen(true);
  };

  const removeSurvey = async () => {
    if (!surveyToRemove) return;
    try {
      const response = await fetchData('/delete?id=' + surveyToRemove.id);
      if (response.status === 200) {
        setRemoveModalOpen(false);
        removeSurveyFromFolder(surveyToRemove.folder_id, surveyToRemove.id);
        setSurveyToRemove(null);
      }
    } catch (error) {
      Logger.error('Error removing survey:', error);
    }
  };

  const toggleFolder = async (folderId: number) => {
    if (!loadedFolders[folderId]) {
      setIsLoading((prevState) => ({
        ...prevState,
        [folderId]: true
      }));
      setFolderStates((prevState) => ({
        ...prevState,
        [folderId]: true,
      }));
      try {
        const response = await fetchData(`/folders/${folderId}/files`);
        Logger.info("------- toggleFolder: ", response.data);
        setFolders((prevFolders) =>
          prevFolders.map((folder) =>
            folder.id === folderId ? { ...folder, files: response.data } : folder
          )
        );
        setLoadedFolders((prev) => ({ ...prev, [folderId]: true }));
      } catch (error) {
        Logger.error('Error toggling folder:', error);
      } finally {
        setIsLoading((prevState) => ({
          ...prevState,
          [folderId]: false
        }));
      }
    } else {
      setFolderStates((prevState) => ({
        ...prevState,
        [folderId]: !prevState[folderId],
      }));
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceFolder = folders.find((folder) => folder.id === parseInt(source.droppableId));
    const destinationFolder = folders.find((folder) => folder.id === parseInt(destination.droppableId));
    if (!sourceFolder || !destinationFolder) return;

    const draggedFile = sourceFolder.files[source.index];

    try {
      const response = await putData(`/surveys/${draggedFile.id}/move`, { targetFolderId: destinationFolder.id });
      if (response.status === 200) {
        moveSurveyBetweenFolders(sourceFolder.id, destinationFolder.id, source.index, destination.index, draggedFile);
      }
    } catch (error) {
      Logger.error('Error moving file:', error);
    }
  };

  const updateFolderFiles = (folderId: number, survey: Survey) => {
    setFolders((prevFolders) => {
      const updatedFolders = prevFolders.map((folder) => {
        if (folder.id === folderId) {
          const updatedFiles = folder.files.filter(file => file.id !== selectedId);
          return { ...folder, files: [...updatedFiles, survey] };
        }
        return folder;
      });
      return updatedFolders;
    });
  };

  const removeSurveyFromFolder = (folderId: number, surveyId: string) => {
    setFolders((prevFolders) => {
      const updatedFolders = prevFolders.map((folder) => {
        if (folder.id === folderId) {
          return {
            ...folder,
            files: folder.files.filter((file) => file.id !== surveyId),
          };
        }
        return folder;
      });
      return updatedFolders;
    });
  };

  const moveSurveyBetweenFolders = (sourceFolderId: number, destinationFolderId: number, sourceIndex: number, destinationIndex: number, survey: Survey) => {
    setFolders((prevFolders) =>
      prevFolders.map((folder) => {
        if (folder.id === sourceFolderId) {
          const updatedFiles = [...folder.files];
          updatedFiles.splice(sourceIndex, 1);
          return { ...folder, files: updatedFiles };
        }
        if (folder.id === destinationFolderId) {
          const updatedFiles = [...folder.files];
          updatedFiles.splice(destinationIndex, 0, survey);
          return { ...folder, files: updatedFiles };
        }
        return folder;
      })
    );
  };

  return (
    <div className="p-6">
    

{/* Header Section with Right-Aligned Buttons */}
<div className="mb-8 flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Checklists</h1>
    <p className="text-gray-600">Manage your checklists and folders</p>
  </div>
  
  {/* Action Buttons - Right Aligned */}
  <div className="flex gap-3">
    <button
      onClick={openAddModal}
      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm"
    >
      <FaPlus className="w-4 h-4 mr-2" />
      Add Checklist
    </button>
    <button
      onClick={openFolderModal}
      className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm"
    >
      <FaPlus className="w-4 h-4 mr-2" />
      Add Folder
    </button>
  </div>
</div>

      {/* Folders Section */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="space-y-4">
          {folders.map((folder) => (
            <Droppable key={folder.id} droppableId={folder.id.toString()}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200 ${
                    snapshot.isDraggingOver ? 'border-blue-300 bg-blue-50' : ''
                  }`}
                >
                  {/* Folder Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      className="flex items-center space-x-3 text-left flex-1 hover:text-blue-600 transition-colors duration-200"
                    >
                      {folderStates[folder.id] ? (
                        <FaFolderOpen className="w-5 h-5 text-blue-500" />
                      ) : (
                        <FaFolder className="w-5 h-5 text-gray-500" />
                      )}
                      <span className="text-lg font-semibold text-gray-900">{folder.name}</span>
                      {folderStates[folder.id] ? (
                        <FaChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <FaChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      {folder.files && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {folder.files.length}
                        </span>
                      )}
                    </button>
                    
                    {userGroup === "ALL_SITES" && (
                      <button
                        onClick={() => deleteFolder(folder.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Delete Folder"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Folder Content */}
                  {folderStates[folder.id] && (
                    <div className="p-4">
                      {isLoading[folder.id] ? (
                        <div className="flex justify-center py-8">
                          <Loading />
                        </div>
                      ) : folder.files && folder.files.length > 0 ? (
                        <div className="space-y-2">
                          {folder.files.map((survey, index) => (
                            <Draggable key={survey.id} draggableId={survey.id.toString()} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`transition-all duration-200 ${
                                    snapshot.isDragging ? 'shadow-lg' : ''
                                  }`}
                                >
                                  <div className="flex items-center">
                                    <div {...provided.dragHandleProps} className="p-2 text-gray-400 hover:text-gray-600">
                                      <FaGripVertical className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                      <SurveyItem
                                        survey={survey}
                                        onEdit={openEditModal}
                                        onCopy={duplicateSurvey}
                                        onRemove={confirmRemoveSurvey}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FaFolder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">This folder is empty</p>
                          <button
                            onClick={openAddModal}
                            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Add your first checklist
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* Empty State */}
      {folders.length === 0 && (
        <div className="text-center py-12">
          <FaFolder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No folders yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first folder</p>
          <button
            onClick={openFolderModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            <FaPlus className="w-4 h-4 mr-2" />
            Create Folder
          </button>
        </div>
      )}

      {/* Modals */}
      <EditModal
        isOpen={isModalOpen || isEditModalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditModalOpen(false);
        }}
        onSubmit={handleModalSubmit}
        initialData={modalData || undefined}
        title={isEditModalOpen ? 'Edit Checklist' : 'Create New Checklist'}
        folders={folders}
      />
      
      <RemoveModal
        surveyName={surveyToRemove?.name || ''}
        isOpen={isRemoveModalOpen}
        onClose={() => setRemoveModalOpen(false)}
        onConfirm={removeSurvey}
      />
      
      <AddFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onSubmit={addFolder}
      />
    </div>
  );
};

export default Surveys;