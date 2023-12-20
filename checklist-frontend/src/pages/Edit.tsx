import { useParams } from "react-router";
import Editor from "../components/Editor";
import Layout from "../components/Layout";

const Edit = () => {
  const { id } = useParams();
  return (
    <Layout>
      <div className="sjs-editor-container">
        <Editor id={id as string} />
      </div>
    </Layout>
  );
};

export default Edit;
