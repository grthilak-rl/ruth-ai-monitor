import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'safety_supervisor',
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const { firstName, lastName, email, password, role } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    console.log('Sending formData:', formData); // Add this line
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/register`,
        formData
      );
      setMessage(res.data.message || 'Registration successful! Please log in.');
      navigate('/login');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Registration failed.');
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg">
        <h3 className="text-2xl font-bold text-center">Register</h3>
        <form onSubmit={onSubmit}>
          <div className="mt-4">
            <div>
              <label className="block" htmlFor="firstName">First Name</label>
              <input
                type="text"
                placeholder="First Name"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                name="firstName"
                value={firstName}
                onChange={onChange}
                required
              />
            </div>
            <div className="mt-4">
              <label className="block" htmlFor="lastName">Last Name</label>
              <input
                type="text"
                placeholder="Last Name"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                name="lastName"
                value={lastName}
                onChange={onChange}
                required
              />
            </div>
            <div className="mt-4">
              <label className="block" htmlFor="email">Email</label>
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                name="email"
                value={email}
                onChange={onChange}
                required
              />
            </div>
            <div className="mt-4">
              <label className="block" htmlFor="password">Password</label>
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                name="password"
                value={password}
                onChange={onChange}
                minLength="6"
                required
              />
            </div>
            <div className="mt-4">
              <label className="block" htmlFor="role">Role</label>
              <select
                name="role"
                value={role}
                onChange={onChange}
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="safety_supervisor">Safety Supervisor</option>
                <option value="safety_manager">Safety Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-baseline justify-between">
              <button
                type="submit"
                className="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900"
              >
                Register
              </button>
            </div>
            {message && <p className="mt-4 text-center text-red-500">{message}</p>}
            <p className="mt-4 text-center">
              Already have an account? <a href="/login" className="text-blue-600 hover:underline">Login</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;