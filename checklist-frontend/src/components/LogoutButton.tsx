import { IoLogOutOutline } from "react-icons/io5";

function LogoutButton() {
    const handleLogout = () => {
        window.location.href = `${process.env.REACT_APP_API_BASE_URL ?? ''}/logout`;
    }

    return (
        <div className="sjs-client-app__logout">
            <button className='sjs-client-app__logout-button' onClick={handleLogout}>
                <IoLogOutOutline title="Logout" color="#f3f3f3" fontSize="32px" />
            </button>
        </div>
    )
}

export default LogoutButton;