export const getMe = async (req, res) => {
  const u = req.user;
  res.json({
    _id: u._id,
    first_name: u.first_name,
    last_name: u.last_name || '',
    email: u.email,
    role: u.role,
    status: u.status,
  });
};
