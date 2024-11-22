import React, { useEffect, useState } from 'react';
import { customers } from '../models/customer';
import { products } from '../models/product';
import { Survey } from '../models/survey';
import { useApi } from '../utils/api';
import Logger from '../utils/logger';
import EditModal from './EditModal';
import Loading from './Loading';
import RemoveModal from './RemoveModal';
import SurveyItem from './SurveyItem';
import './Surveys.css';


const Surveys = (): React.ReactElement => {
  // State variables
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [isRemoveModalOpen, setRemoveModalOpen] = useState(false);
  const [surveyToRemove, setSurveyToRemove] = useState<Survey | null>(null);

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const { fetchData, postData } = useApi();

  const [modalData, setModalData] = useState<{
    name: string;
    customerId:number;
    productId:number;
  }|null>(null);

  // Fetch surveys on component mount
  useEffect(() => {
    getSurveys();
  }, []);

  // Fetch surveys from API
  const getSurveys = async () => {
    const response = await fetchData('/getActive');
    setSurveys(response.data);
  };

  // Handle opening and closing modals
  const openAddModal = () => {
    setModalOpen(true);
    setModalData(null);
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

  const handleModalSubmit = async(data:{
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
      setSurveys([...surveys, response.data]);
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
      const index = surveys.findIndex((obj) => obj.id === selectedId);
      if (index !== -1) {
        surveys[index] = { ...surveys[index], name, customer: customerName, prod_line: productName };
        setSurveys([...surveys]);
      }
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
    if (response.status === 200) {
      setSurveys([...surveys, response.data]);
    }
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
      setSurveys(surveys.filter((s) => s.id !== surveyToRemove.id));
      setRemoveModalOpen(false);
      setSurveyToRemove(null);
    }
  };

  return surveys.length === 0 ? (
    <Loading />
  ) : (
    <>
      <table className="sjs-surveys-list">
        {surveys.map((survey) => (
          <SurveyItem
            key={survey.id}
            survey={survey}
            onEdit={openEditModal}
            onCopy={duplicateSurvey}
            onRemove={confirmRemoveSurvey}
          />
        ))}
      </table>
      <div className="sjs-surveys-list__footer">
        <span
          className="sjs-button sjs-add-btn"
          title="Add"
          onClick={openAddModal}
        >
          Add Checklist
        </span>

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
        <RemoveModal
          surveyName={surveyToRemove?.name || ''}
          isOpen={isRemoveModalOpen}
          onClose={() => setRemoveModalOpen(false)}
          onConfirm={removeSurvey}
        />
      </div>
    </>
  );
};

export default Surveys;