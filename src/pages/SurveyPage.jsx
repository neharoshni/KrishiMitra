import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

import './SurveyPage.css';

function SurveyPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [user, setUser] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false); // 👈 NEW

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      navigate('/');
    } else {
      console.log("User Info:", storedUser.name, storedUser.email);
      setUser(storedUser);

      const submissions = JSON.parse(localStorage.getItem('submissions') || '{}');
      if (submissions[storedUser.email]) {
        setSubmitted(true);
        setChatVisible(false); // show icon initially
      }
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setChatVisible(true);

    const submissions = JSON.parse(localStorage.getItem('submissions') || '{}');
    submissions[user.email] = true;
    localStorage.setItem('submissions', JSON.stringify(submissions));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleCloseChat = () => {
    setIsClosing(true);
    setTimeout(() => {
      setChatVisible(false);
      setIsClosing(false);
    }, 300); // match CSS animation duration
  };

  return (
    <div className="survey-container">
      <form className="survey-form" onSubmit={handleSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {user && <h2>Welcome, {user.name} !!</h2>}
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <label>1. Farm Size(in acres)</label>
        <input type="number" required />

        <label>2. Location</label>
        <input type="text" required />

        <label>3. Type of Soil</label>
        <select required>
            <option value="">Select one</option>
            <option value="black">Black Soil</option>
            <option value="red">Red Soil</option>
            <option value="clay">Clay Soil</option>
            <option value="loamey">Loamey Soil</option>
            <option value="sandy">Sandy Soil</option>
        </select>

        <label>Irrigation Capacity</label>
        <select required>
            <option value="">Select one</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="nothing">No water</option>
        </select>


        <button type="submit">Submit</button>
      </form>

      {submitted && !chatVisible && (
        <button className="chat-icon" onClick={() => setChatVisible(true)}>
            <FontAwesomeIcon icon={faUser} style={{color: "#ffffff",}} />        
        </button>
      )}

      {submitted && chatVisible && (
        <div className={`chatbot-popup ${isClosing ? 'fade-out' : 'fade-in'}`}>
          <button className="chat-close" onClick={handleCloseChat}>×</button>
          
          <div className="chatbot-header">
            <h3>Hello {user?.name} 👋</h3>
            <p>Thanks for submitting the questions. Let’s chat if you have more questions!</p>
          </div>

          <div className="chatbot-footer">
            <input
              type="text"
              placeholder="Type your message..."
              className="chatbot-input"
            />
            <button className="chatbot-send">📤</button>
            <button className="chatbot-mic">🎤</button>
          </div>
        </div>
      )}

    </div>
  );
}

export default SurveyPage;
