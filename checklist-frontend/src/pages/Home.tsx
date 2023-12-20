import Layout from "../components/Layout";
import Surveys from "../components/Surveys";

const Home = () => (
  <Layout>
    <div className="sjs-client-app__content--surveys-list">
      <h1>My Checklists</h1>
      <Surveys />
    </div>
  </Layout>
);

export default Home;
