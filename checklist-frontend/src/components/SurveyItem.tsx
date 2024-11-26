import React from "react";
import { Link } from "react-router-dom";
import icon from "../icon.svg";
import { Survey } from "../models/survey";
import styles from './SurveyItem.module.css';

interface SurveyItemProps {
  survey: Survey;
  onEdit: (id: string, name: string, customer: string, product: string, folder_id: number) => void;
  onCopy: (survey: Survey) => void;
  onRemove: (survey: Survey) => void;
}

const SurveyItem: React.FC<SurveyItemProps> = ({
  survey,
  onEdit,
  onCopy,
  onRemove,
}) => {
  return (
    <div className={styles.surveyItem}>
      <div className={styles.surveyRow}>
        <div className={styles.surveyName}>
          <span>{survey.name}</span>
          <img
            className={styles.editIcon}
            src={icon}
            onClick={() =>
              onEdit(survey.id, survey.name, survey.customer, survey.prod_line, survey.folder_id)
            }
            alt="edit icon"
          />
        </div>
        <div className={styles.buttons}>
          <button className={styles.button} onClick={() => onCopy(survey)}>
            Copy
          </button>
          <Link className={styles.button} to={`run/${survey.id}`}>
            Run
          </Link>
          <Link className={styles.button} to={`edit/${survey.id}`}>
            Edit
          </Link>
          <Link className={styles.button} to={`results/${survey.id}`}>
            Results
          </Link>
          <button
            className={`${styles.button} ${styles.removeButton}`}
            onClick={() => onRemove(survey)}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyItem;