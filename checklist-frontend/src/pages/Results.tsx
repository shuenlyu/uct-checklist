import { useEffect, useState } from "react";
import { useParams } from "react-router";
import Layout from "../components/Layout";
import Viewer from "../components/Viewer";
import { useApi } from "../utils/api";

const Results = () => {
  const { id } = useParams();
  const { fetchData } = useApi();
  const [survey, setSurvey] = useState({ json: {}, name: "" });

  const getSurvey = async () => {
    const response = await fetchData("/getSurvey?surveyId=" + id);
    setSurvey(response.data);
  };

  useEffect(() => {
    getSurvey();
  }, []);
  
  return (
    <Layout fullWidth={true}>
      <div style={{ padding: '20px' }}>
        {survey.name !== "" ? (
          <h1 style={{ textAlign: "center", marginBottom: '20px' }}>
            {"'" + survey.name + "' results"}
          </h1>
        ) : (
          <h1>{""}</h1>
        )}
        <div className="sjs-results-container" style={{ width: '100%' }}>
          <Viewer id={id as string} />
        </div>
      </div>
    </Layout>
  );
};

export default Results;