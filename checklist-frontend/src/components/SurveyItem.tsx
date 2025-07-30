import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Survey } from "../models/survey";
import { 
  FaEdit, 
  FaCopy, 
  FaPlay, 
  FaCode, 
  FaChartBar, 
  FaTrash,
  FaBuilding,
  FaBox,
  FaUsers
} from 'react-icons/fa';

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
  const { userGroup } = useAuth();

  return (
    <div className="theme-bg-secondary theme-border-light border rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-gray-300">
      <div className="flex items-center justify-between">
        {/* Left Side - Survey Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold theme-text-primary truncate">
              {survey.name}
            </h3>
            <button
              onClick={() =>
                onEdit(survey.id, survey.name, survey.customer, survey.prod_line, survey.folder_id)
              }
              className="flex-shrink-0 p-1.5 theme-icon-secondary theme-hover-blue hover:bg-blue-50 rounded-md transition-colors duration-200"
              title="Edit checklist"
            >
              <FaEdit className="w-4 h-4" />
            </button>
          </div>
          
          {/* Survey Details */}
          <div className="flex flex-wrap items-center gap-4 text-sm theme-text-secondary mb-3">
            <div className="flex items-center space-x-1">
              <FaBuilding className="w-3 h-3" />
              <span>{survey.customer}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FaBox className="w-3 h-3" />
              <span>{survey.prod_line}</span>
            </div>
          </div>

          {/* Groups Badge */}
          {survey.groups && (
            <div className="flex items-center space-x-1 mb-3">
              <FaUsers className="w-3 h-3 theme-icon-folder-open" />
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium theme-badge-blue">
                {survey.groups}
              </span>
            </div>
          )}
        </div>

        {/* Right Side - Action Buttons */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => onCopy(survey)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium theme-btn-gray rounded-md"
            title="Copy checklist"
          >
            <FaCopy className="w-3 h-3 mr-1" />
            Copy
          </button>
          
          <Link
            to={`run/${survey.id}`}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium theme-btn-green rounded-md"
            title="Run checklist"
          >
            <FaPlay className="w-3 h-3 mr-1" />
            Run
          </Link>
          
          <Link
            to={`edit/${survey.id}`}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium theme-btn-blue rounded-md"
            title="Edit checklist"
          >
            <FaCode className="w-3 h-3 mr-1" />
            Edit
          </Link>
          
          <Link
            to={`results/${survey.id}`}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium theme-btn-purple rounded-md"
            title="View results"
          >
            <FaChartBar className="w-3 h-3 mr-1" />
            Results
          </Link>
          
          {userGroup === "ALL_SITES" && (
            <button
              onClick={() => onRemove(survey)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium theme-btn-red rounded-md"
              title="Remove checklist"
            >
              <FaTrash className="w-3 h-3 mr-1" />
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyItem;