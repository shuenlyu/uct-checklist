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
    <Layout>
      <>
        {survey.name !== "" ? (
          <h1 style={{ textAlign: "center" }}>
            {"'" + survey.name + "' results"}
          </h1>
        ) : (
          <h1>{""}</h1>
        )}
        <div className="sjs-results-container">
          <Viewer id={id as string} />
        </div>
      </>
    </Layout>
  );
};

export default Results;
