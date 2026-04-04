import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import authApi from '../../../api/authApi';
import { loginSuccess } from '../../../store/slices/authSlice';

export const useLogin = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const validate = () => {
    let newErrors = {};
    if (!identifier.trim()) newErrors.identifier = "Email or Phone is absolutely required.";
    else if (identifier.includes('@') && !/^\S+@\S+\.\S+$/.test(identifier)) {
      newErrors.identifier = "Invalid Email format.";
    }

    if (!password) newErrors.password = "Password cannot be blank.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return; // Block immediately if missing format!

    setIsLoading(true);
    setErrors({}); // reset failures
    
    try {
      const payload = identifier.includes('@') ? { email: identifier, password } : { phone: identifier, password };
      const res = await authApi.login(payload);
      const u = res.data;
      dispatch(loginSuccess({
        user: {
          id: u._id,
          first_name: u.first_name ?? u.name,
          last_name: u.last_name ?? '',
          name: u.name ?? u.first_name,
          email: u.email,
          role: u.role,
        },
        accessToken: u.accessToken,
      }));
      navigate('/');
    } catch (err) {
      setErrors({ global: err.response?.data?.message || 'Invalid Credentials' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        const res = await authApi.googleLogin({ code: codeResponse.code });
        const u = res.data;
        dispatch(loginSuccess({
          user: {
            id: u._id,
            first_name: u.first_name ?? u.name,
            last_name: u.last_name ?? '',
            name: u.name ?? u.first_name,
            email: u.email,
            role: u.role,
          },
          accessToken: u.accessToken,
        }));
        navigate('/');
      } catch (err) {
        alert('Google Login Failed');
      }
    },
    flow: 'auth-code',
  });

  return {
    identifier, setIdentifier,
    password, setPassword,
    isLoading, errors,
    handleLogin,
    handleGoogleSuccess,
  };
};
