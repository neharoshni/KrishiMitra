import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSeedling,
  faTractor,
  faLeaf,
  faCloudSun,
  faWheatAwn
} from '@fortawesome/free-solid-svg-icons';
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const bypassAuth = import.meta.env.VITE_BYPASS_GOOGLE_AUTH === "true";

  // Handle successful Google login
  const handleSuccess = (credentialResponse) => {
    const user = jwtDecode(credentialResponse.credential);
    console.log("User Info:", user);
    localStorage.setItem('user', JSON.stringify(user));
    navigate('/survey');
  };

  // Create a mock user for testing when bypass is enabled
  const createMockUser = () => {
    const mockUser = {
      email: "test@example.com",
      name: "Test User",
      picture: "https://ui-avatars.com/api/?name=Test+User&background=random",
      sub: "mock-user-123",
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iat: Math.floor(Date.now() / 1000)
    };

    console.log("Using mock user for testing:", mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
    navigate('/survey');
  };

  // Check for bypass on component mount
  useEffect(() => {
    if (bypassAuth) {
      console.log("🔑 OAuth Bypass enabled - using mock user");
      createMockUser();
    }
  }, [bypassAuth, navigate]);

  // If bypass is enabled, don't render the login UI
  if (bypassAuth) {
    return (
      <div className="login-container">
        <div className="login-background-elements">
          <FontAwesomeIcon icon={faSeedling} className="bg-icon bg-icon-1" />
          <FontAwesomeIcon icon={faLeaf} className="bg-icon bg-icon-2" />
          <FontAwesomeIcon icon={faCloudSun} className="bg-icon bg-icon-3" />
          <FontAwesomeIcon icon={faWheatAwn} className="bg-icon bg-icon-4" />
        </div>
        <div className="spinner-container login-spinner">
          <FontAwesomeIcon icon={faTractor} className="spinner-logo" />
          <div className="spinner-text">Loading KrishiMitra...</div>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-background-elements">
        <FontAwesomeIcon icon={faSeedling} className="bg-icon bg-icon-1" />
        <FontAwesomeIcon icon={faLeaf} className="bg-icon bg-icon-2" />
        <FontAwesomeIcon icon={faCloudSun} className="bg-icon bg-icon-3" />
        <FontAwesomeIcon icon={faWheatAwn} className="bg-icon bg-icon-4" />
      </div>

      <div className="login-content">
        <div className="login-logo">
          <FontAwesomeIcon icon={faTractor} className="logo-icon" />
          <h1 className="login-title">KrishiMitra</h1>
        </div>

        <h3 className="login-subtitle">
          One-Stop solution for all your Agricultural needs
        </h3>

        <div className="login-features">
          <div className="feature">
            <FontAwesomeIcon icon={faCloudSun} className="feature-icon" />
            <span>Weather Forecasts</span>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faSeedling} className="feature-icon" />
            <span>Crop Management</span>
          </div>
          <div className="feature">
            <FontAwesomeIcon icon={faLeaf} className="feature-icon" />
            <span>Disease Detection</span>
          </div>
          <div className="feature feature-more">
            <FontAwesomeIcon icon={faWheatAwn} className="feature-icon" />
            <span>And more...</span>
          </div>
        </div>

        <div className="animated-google-button">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.log('Login Failed')}
            text="Sign in with Google"
            shape="pill"
          />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
