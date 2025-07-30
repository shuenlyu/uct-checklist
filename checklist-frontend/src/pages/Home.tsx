import Layout from "../components/Layout";
import Surveys from "../components/Surveys";

const Home = () => {
  return (
    <Layout>
      <div
        className="sjs-client-app__content--surveys-list"
        style={{ paddingTop: "20px" }}
      >
        
        <Surveys />
      </div>
    </Layout>
  );
};
export default Home;
