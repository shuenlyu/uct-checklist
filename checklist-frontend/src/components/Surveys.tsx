import React, { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { FaTrash } from 'react-icons/fa'; // Import the delete icon
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
  // State variables
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [isRemoveModalOpen, setRemoveModalOpen] = useState(false);
  const [surveyToRemove, setSurveyToRemove] = useState<Survey | null>(null);

  // state for addFolderModal
  const [isFolderModalOpen, setFolderModalOpen] = useState(false);


  const { fetchData, postData, deleteData, putData } = useApi();

  // folder management status
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderStates, setFolderStates] = useState<{ [key: number]: boolean }>({});
  const [loadedFolders, setLoadedFolders] = useState<{ [key: number]: boolean }>({});

  // set isLoading state used for displaying loading indicator 
  const [isLoading, setIsLoading] = useState<{ [key: number]: boolean }>({});

  const [modalData, setModalData] = useState<{
    name: string;
    customerId: number;
    productId: number;
  } | null>(null);

  // Fetch surveys on component mount
  useEffect(() => {
    // getSurveys();
    getFolders();
  }, []);

  // Fetch folders from API
  const getFolders = async () => {
    const response = await fetchData('/getFolders');
    Logger.debug('Folders:', response.data);
    setFolders(response.data);

    const initialStates = response.data.reduce((acc: { [key: number]: boolean }, folder: Folder) => {
      acc[folder.id] = false;
      return acc;
    }, {});
    setFolderStates(initialStates);
  }
  // add folder 
  const addFolder = async (folderName: string) => {
    if (folderName.trim() === '') return;
    const response = await postData('/folders', { name: folderName });
    Logger.debug('Add Folder:', response);
    if (response.status === 200) {
      setFolders((prevFolders) => [...prevFolders, ...response.data]);
    }
  }

  const deleteFolder = async (folderId: number) => {
    const response = await deleteData(`/folders/${folderId}`);
    Logger.debug('Delete Folder:', response);
    if (response.status === 200) {
      setFolders((prevFolders) => prevFolders.filter((folder) => folder.id !== folderId));
    }
  };

  // Handle opening and closing modals
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
    productLine: string
  ) => {
    setEditModalOpen(true);
    const customerObj = customers.find((cust) => cust.name === customerName);
    const productObj = products.find((prod) => prod.name === productLine);
    setSelectedId(id);
    setModalData({
      name,
      customerId: customerObj ? customerObj.id : 0,
      productId: productObj ? productObj.id : 0,
    });
    Logger.debug('Edit Modal Data:', modalData);
  };

  const handleModalSubmit = async (data: {
    name: string;
    customerId: number;
    productId: number;
  }) => {
    if (isEditModalOpen) {
      await updateSurvey(data.name, data.customerId, data.productId);
    } else {
      //create survey 
      await createSurvey(data.name, data.customerId, data.productId);
    }
  };

  // Handle creating a new survey
  const createSurvey = async (name: string, customerId: number, productId: number) => {
    Logger.debug('Create Survey:', name, customerId, productId);
    const customerName = customers.find((cust) => cust.id === customerId)?.name || '';
    const productName = products.find((pro) => pro.id === productId)?.name || '';
    const response = await postData('/create', {
      name,
      customer: customerName,
      product: productName,
    });
    Logger.debug('Create Survey:', response);
    if (response.status === 200) {
      Logger.debug('Survey created:', response.data);
      setModalOpen(false);
    }
  };

  // Handle updating an existing survey
  const updateSurvey = async (name: string, customerId: number, productId: number) => {
    const customerName = customers.find((cust) => cust.id === customerId)?.name || '';
    const productName = products.find((pro) => pro.id === productId)?.name || '';
    const response = await fetchData(
      `/changeName?name=${name}&id=${selectedId}&customer=${customerName}&product=${productName}`
    );
    if (response.status === 200) {
      setEditModalOpen(false);
    }
  };

  // Handle duplicating a survey
  const duplicateSurvey = async (survey: Survey) => {
    const response = await postData('/duplicate', {
      name: survey.name + '(copy)',
      customer: survey.customer,
      product: survey.prod_line,
      json: survey.json,
    });
  };

  // Handle removing a survey
  const confirmRemoveSurvey = (survey: Survey) => {
    setSurveyToRemove(survey);
    setRemoveModalOpen(true);
  };

  const removeSurvey = async () => {
    if (!surveyToRemove) return;
    const response = await fetchData('/delete?id=' + surveyToRemove.id);
    if (response.status === 200) {
      setRemoveModalOpen(false);
      setSurveyToRemove(null);
    }
  };

  const toggleFolder = async (folderId: number) => {
    if (!loadedFolders[folderId]) {
      setIsLoading((prevState) => ({
        ...prevState,
        [folderId]: true
      }))
      setFolderStates((prevState) => ({
        ...prevState,
        [folderId]: true, // Expand the folder
      }));
      const response = await fetchData(`/folders/${folderId}/files`);
      Logger.debug('toggleFolder status: ', response);
      setFolders((prevFolders) =>
        prevFolders.map((folder) =>
          folder.id === folderId ? { ...folder, files: response.data } : folder
        )
      );
      setLoadedFolders((prev) => ({ ...prev, [folderId]: true })); // Mark folder as loaded
      setIsLoading((prevState) => ({
        ...prevState,
        [folderId]: false
      }));
    } else {
      // If the folder is already loaded, just toggle its state      
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

    Logger.debug('Dragged File in on DragEnd: ', sourceFolder, destinationFolder);
    try {
      const response = await putData(`/surveys/${draggedFile.id}/move`, { targetFolderId: destinationFolder.id });
      setFolders((prevFolders) =>
        prevFolders.map((folder) => {
          if (folder.id === sourceFolder.id) {
            const updatedFiles = [...folder.files];
            updatedFiles.splice(source.index, 1);
            return { ...folder, files: updatedFiles };
          }
          if (folder.id === destinationFolder.id) {
            const updatedFiles = [...folder.files];
            updatedFiles.splice(destination.index, 0, draggedFile);
            return { ...folder, files: updatedFiles };
          }
          return folder;
        })
      );
    } catch (error) {
      Logger.error('Error moving file: ', error);
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {folders && folders.map((folder) => (
        <Droppable key={folder.id} droppableId={folder.id.toString()}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                marginBottom: "20px",
                padding: "10px",
                borderTop: "1px solid #ddd",
                // border: "1px solid #ddd",
                // borderRadius: "5px",
              }}
            >
              {/* <div className='folder-header'>{folder.name}</div> */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3
                  style={{ cursor: "pointer", margin: 0 }}
                  onClick={() => toggleFolder(folder.id)}
                >
                  {folder.name} <span>{folderStates[folder.id] ? "▼" : "▶"}</span>
                </h3>
                {/* add and delete button */}
                <div>
                  {/* <button
                    // onClick={() => addFile(folder.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "20px",
                      marginRight: "10px",
                    }}
                    title="Add File"
                  >
                    ➕
                  </button> */}
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
              {/* TODO:enable loading component while downloading file from server, and show indicator that no checklist available */}
              {folderStates[folder.id] && (isLoading[folder.id] ? <Loading /> : (
                folder.files && folder.files.length > 0 ? (
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
      ))
      }
      < div className="sjs-surveys-list__footer" >
        <div style={{ display: 'flex', gap: '20px' }}>
          <span
            className="sjs-button sjs-add-btn"
            title="Add"
            onClick={openAddModal}
          >
            Add Checklist
          </span>
          {/* disable add folder button */}
          <span className='sjs-button sjs-add-btn'
            title='addfolder'
            onClick={openFolderModal}
          >
            Add Folder
          </span>
        </div>
        {/* Add/Edit Modal */}
        <EditModal
          isOpen={isModalOpen || isEditModalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditModalOpen(false);
          }}
          onSubmit={handleModalSubmit}
          initialData={modalData || undefined}
          title={isEditModalOpen ? 'Edit Checklist' : 'Enter New Checklist'}
        />

        {/* Remove Confirmation Modal */}
        < RemoveModal
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
    </DragDropContext >
  );
};

export default Surveys;