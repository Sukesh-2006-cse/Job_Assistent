import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import './SocialLogin.css';

const SocialLogin = () => {
    const navigate = useNavigate();
    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log('Google Success:', tokenResponse);

            try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoRes.json();

                const response = await fetch('http://127.0.0.1:5000/api/google-auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: userInfo.email,
                        name: userInfo.name,
                        sub: userInfo.sub
                    }),
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error);

                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                alert(`Welcome, ${data.user.name}!`);

                if (data.user.isOnboarded) {
                    navigate('/discover');
                } else {
                    navigate('/onboarding');
                }
            } catch (error) {
                console.error('Google Auth Error:', error);
                alert('Authentication with Google failed. Please check the console for details.');
            }
        },
        onError: (error) => {
            console.log('Login Failed:', error);
            if (error.error === 'popup_closed_by_user') {
                alert('The login popup was closed before completion.');
            } else {
                alert('Google Login failed. This usually happens if popups are blocked by your browser. Please allow popups for this site in your browser settings.');
            }
        },
        flow: 'implicit',
    });

    return (
        <div className="social-login-container">
            <div className="social-separator">
                <span>Or continue with</span>
            </div>

            <button className="google-login-btn" onClick={login}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                Sign in with Google
            </button>
        </div>
    );
};

export default SocialLogin;
