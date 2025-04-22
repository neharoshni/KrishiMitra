import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css'; 

function LoginPage() {
  const navigate = useNavigate();

  const handleSuccess = (credentialResponse) => {
    const user = jwtDecode(credentialResponse.credential);
    console.log("User Info:", user);
    localStorage.setItem('user', JSON.stringify(user));
    navigate('/survey');
  };

  return (
    <div className="login-container">
      <h1 className="login-title">KrishiMitra</h1>
      <h3 className="login-subtitle">One-Stop solution for all your Agricultural <br />problems – KrishiMitra</h3>
      <div className="animated-google-button">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log('Login Failed')}
        />
      </div>
    </div>
  );
}

export default LoginPage;
