import React from "react";
import { Link } from "react-router-dom";
import icon from "../icon.svg";
import { Survey } from "../models/survey";
import Logger from "../utils/logger";

interface SurveyItemProps {
  survey: Survey;
  onEdit: (id: string, name: string, customer: string, product: string) => void;
  onCopy: (survey: Survey) => void;
  onRemove: (survey: Survey) => void;
}

const SurveyItem: React.FC<SurveyItemProps> = ({
  survey,
  onEdit,
  onCopy,
  onRemove,
}) => {
  // Logger.debug('SurveyItem', survey);
  return (
    <table className="sjs-surveys-list" >

      <tr key={survey.id} className="sjs-surveys-list__row">
        <td>
          <span>{survey.name}</span>
          <span>
            <img
              className="edit-icon"
              src={icon}
              onClick={() =>
                onEdit(survey.id, survey.name, survey.customer, survey.prod_line)
              }
              alt="edit icon"
            />
          </span>
          <div></div>
        </td>
        <td>
          <span className="sjs-button" onClick={() => onCopy(survey)}>
            <span>Copy</span>
          </span>
          <Link className="sjs-button" to={"run/" + survey.id}>
            <span>Run</span>
          </Link>
          <Link className="sjs-button" to={"edit/" + survey.id}>
            <span>Edit</span>
          </Link>
          <Link className="sjs-button" to={"results/" + survey.id}>
            <span>Results</span>
          </Link>
          <span
            className="sjs-button sjs-remove-btn"
            onClick={() => onRemove(survey)}
          >
            Remove
          </span>
        </td>
      </tr>
    </table>
  );
};

export default SurveyItem;
