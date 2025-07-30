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
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-gray-300">
      <div className="flex items-center justify-between">
        {/* Left Side - Survey Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {survey.name}
            </h3>
            <button
              onClick={() =>
                onEdit(survey.id, survey.name, survey.customer, survey.prod_line, survey.folder_id)
              }
              className="flex-shrink-0 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
              title="Edit checklist"
            >
              <FaEdit className="w-4 h-4" />
            </button>
          </div>
          
          {/* Survey Details */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
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
              <FaUsers className="w-3 h-3 text-blue-500" />
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {survey.groups}
              </span>
            </div>
          )}
        </div>

        {/* Right Side - Action Buttons */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => onCopy(survey)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
            title="Copy checklist"
          >
            <FaCopy className="w-3 h-3 mr-1" />
            Copy
          </button>
          
          <Link
            to={`run/${survey.id}`}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-200"
            title="Run checklist"
          >
            <FaPlay className="w-3 h-3 mr-1" />
            Run
          </Link>
          
          <Link
            to={`edit/${survey.id}`}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
            title="Edit checklist"
          >
            <FaCode className="w-3 h-3 mr-1" />
            Edit
          </Link>
          
          <Link
            to={`results/${survey.id}`}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors duration-200"
            title="View results"
          >
            <FaChartBar className="w-3 h-3 mr-1" />
            Results
          </Link>
          
          {userGroup === "ALL_SITES" && (
            <button
              onClick={() => onRemove(survey)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200"
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