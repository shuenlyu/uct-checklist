import { useParams } from "react-router";
import Editor from "../components/Editor";
import Layout from "../components/Layout";

const Edit = () => {
  const { id } = useParams();
  return (
    <Layout fullWidth={true}>
      <div className="sjs-editor-container" style={{ width: '100%', height: '100%' }}>
        <Editor id={id as string} />
      </div>
    </Layout>
  );
};

export default Edit;