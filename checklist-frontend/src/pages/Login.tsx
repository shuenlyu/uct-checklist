const Login = () => (
  <div className="sjs-client-app">
    <div className={"sjs-client-app__login"}>
      <button
        type="button"
        className="sjs-client-app__login-button"
        onClick={() => {
          window.location.href = `${process.env.REACT_APP_API_BASE_URL ?? ''}/login`
        }}>
        <h2 className="sjs-client-app__login-button-content">Login with Okta</h2>
      </button>
    </div>
  </div>
)

export default Login