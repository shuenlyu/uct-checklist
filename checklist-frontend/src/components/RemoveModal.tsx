import React from 'react';
import styles from './RemoveModal.module.css';

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
      <div className={styles.modalContainer} onClick={onClose}></div>
      <div className={styles.confirmModal}>
        <div className={styles.confirmModalHeader}>
          <p>Confirm to remove checklist: {surveyName}?</p>
        </div>
        <div className={styles.buttons}>
          <button
            className={`${styles.modalButton} ${styles.cancelButton}`}
            onClick={onClose}
          >
            No
          </button>
          <button
            className={`${styles.modalButton} ${styles.confirmButton}`}
            onClick={onConfirm}
          >
            Yes
          </button>
        </div>
      </div>
    </>
  );
};

export default RemoveModal;