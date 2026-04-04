import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import authApi from '../../../api/authApi';
import { loginSuccess } from '../../../store/slices/authSlice';

export const useRegister = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const validate = () => {
    let newErrors = {};
    if (!name.trim()) newErrors.name = "Full name is strongly required.";
    else if (name.trim().length < 3) newErrors.name = "Name must be at least 3 characters.";
    
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) newErrors.email = "Please enter a valid email address.";
    
    if (!phone.trim()) newErrors.phone = "Phone number is required.";
    else if (!/^\d{10}$/.test(phone.trim())) newErrors.phone = "Phone automatically requires exactly 10 digits.";
    
    if (password.length < 6) newErrors.password = "Security requires password to be > 6 characters.";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleSignup = useGoogleLogin({
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
        alert('Google Signup Failed');
      }
    },
    flow: 'auth-code',
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return; // Block API if format fails!

    setIsLoading(true);
    try {
      await authApi.register({ name, email, phone, password });
      alert('Registration Successful');
      navigate('/login');
    } catch (err) {
      setErrors({ global: err.response?.data?.message || 'Registration Failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    name, setName,
    email, setEmail,
    phone, setPhone,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    errors, isLoading,
    handleRegister,
    handleGoogleSignup,
  };
};
