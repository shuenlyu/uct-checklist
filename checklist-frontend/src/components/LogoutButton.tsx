import { IoLogOutOutline } from "react-icons/io5";

function LogoutButton() {
    const handleLogout = () => {
        window.location.href = `${process.env.REACT_APP_API_BASE_URL ?? ''}/logout`;
    }

    return (
        <div className="sjs-client-app__logout">
            <button className='sjs-client-app__logout-button' onClick={handleLogout}>
            <IoLogOutOutline title="Logout" size={32} color="#f3f3f3" />
            </button>
        </div>
    )
}

export default LogoutButton;