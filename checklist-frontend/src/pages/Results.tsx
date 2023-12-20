import { useParams } from "react-router";
import Viewer from "../components/Viewer";
import { useApi } from "../utils/api";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";

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
    <Layout>
      <>
        <h1>{"'" + survey.name + "' results"}</h1>
        <div className="sjs-results-container">
          <Viewer id={id as string} />
        </div>
      </>
    </Layout>
  );
};

export default Results;
