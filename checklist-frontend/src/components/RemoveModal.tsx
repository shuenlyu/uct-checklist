import React from 'react';

interface RemoveModalProps {
  surveyName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const RemoveModal: React.FC<RemoveModalProps> = ({ surveyName, isOpen, onClose, onConfirm }) => {
  if (!isOpen || surveyName === '') return null;

  return (
    <>
      <div className="modal-container" onClick={onClose}></div>
      <div className="confirm-modal" >
        <div className="confirm-modal-content">
          <div className="confirm-modal-header">
            <p>Confirm to remove checklist: {surveyName}?</p>
          </div>
          <div className="buttons" style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px',
          }}>
            <button className="modal-button cancel-button" onClick={onClose}>
              No
            </button>
            <button className="modal-button" onClick={onConfirm}>
              Yes
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RemoveModal;