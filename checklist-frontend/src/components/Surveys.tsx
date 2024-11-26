import React, { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { FaTrash } from 'react-icons/fa';
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
import './Surveys.css';

interface Folder {
  id: number;
  name: string;
  files: Survey[];
}

const Surveys = (): React.ReactElement => {
  // set edit modal state 
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

  useEffect(() => {
    getFolders();
  }, []);

  const getFolders = async () => {
    try {
      const response = await fetchData('/getFolders');
      Logger.debug('Folders:', response.data);
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
    <DragDropContext onDragEnd={onDragEnd}>
      {folders.map((folder) => (
        <Droppable key={folder.id} droppableId={folder.id.toString()}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                marginBottom: "20px",
                padding: "10px",
                borderTop: "1px solid #ddd",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3
                  style={{ cursor: "pointer", margin: 0 }}
                  onClick={() => toggleFolder(folder.id)}
                >
                  {folder.name} <span>{folderStates[folder.id] ? "▼" : "▶"}</span>
                </h3>
                <div>
                  <button
                    onClick={() => deleteFolder(folder.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "20px",
                      color: "gray",
                    }}
                    title="Delete Folder"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              {folderStates[folder.id] && (isLoading[folder.id] ? <Loading /> : (
                folder.files.length > 0 ? (
                  folder.files.map((survey, index) => (
                    <Draggable key={survey.id} draggableId={survey.id.toString()} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <SurveyItem
                            key={survey.id}
                            survey={survey}
                            onEdit={openEditModal}
                            onCopy={duplicateSurvey}
                            onRemove={confirmRemoveSurvey}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))
                ) : (<div style={{ marginTop: '20px' }}> Folder is empty !</div>)))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      ))}
      <div className="sjs-surveys-list__footer">
        <div style={{ display: 'flex', gap: '20px' }}>
          <span
            className="sjs-button sjs-add-btn"
            title="Add"
            onClick={openAddModal}
          >
            Add Checklist
          </span>
          <span className='sjs-button sjs-add-btn'
            title='addfolder'
            onClick={openFolderModal}
          >
            Add Folder
          </span>
        </div>
        <EditModal
          isOpen={isModalOpen || isEditModalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditModalOpen(false);
          }}
          onSubmit={handleModalSubmit}
          initialData={modalData || undefined}
          title={isEditModalOpen ? 'Edit Checklist' : 'Enter New Checklist'}
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
    </DragDropContext>
  );
};

export default Surveys;