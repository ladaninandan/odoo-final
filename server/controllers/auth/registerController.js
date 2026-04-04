import User from '../../models/User.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // 1. Validate required input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // 3. Format user data
    const formattedName = name.trim();
    const splitName = formattedName.split(' ');
    const first_name = splitName.shift() || 'User';
    const last_name = splitName.join(' ') || '';

    // 4. Create new user in database
    const user = await User.create({
      first_name,
      last_name,
      name: formattedName,
      email: email.toLowerCase().trim(),
      password_hash: password,
      phone: phone || null,
      authProvider: 'local'
    });

    // 5. Send success response
    if (user) {
      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        message: 'User registered successfully' // Made the response informative!
      });
    } else {
      return res.status(400).json({ message: 'Failed to create user, invalid data' });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ message: 'Server error during user registration' });
  }
};
