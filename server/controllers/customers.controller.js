import Customer from '../models/Customer.js';

export const getCustomers = async (req, res) => {
  try {
    const { q, limit = 100 } = req.query;
    const filter = {};
    if (q && String(q).trim()) {
      const term = String(q).trim();
      filter.$or = [
        { name: new RegExp(term, 'i') },
        { phone: new RegExp(term, 'i') },
        { mobile: new RegExp(term, 'i') },
        { email: new RegExp(term, 'i') },
        { city: new RegExp(term, 'i') },
        { state: new RegExp(term, 'i') },
        { country: new RegExp(term, 'i') },
        { address: new RegExp(term, 'i') },
      ];
    }
    const customers = await Customer.find(filter)
      .sort({ updatedAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 100, 500));
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch customers', error: err.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch customer', error: err.message });
  }
};

const trim = (v) => (v == null ? '' : String(v).trim());

export const createCustomer = async (req, res) => {
  try {
    const { name, phone, mobile, email, address, city, state, country, notes } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const customer = await Customer.create({
      name: name.trim(),
      phone: trim(phone),
      mobile: trim(mobile),
      email: trim(email).toLowerCase(),
      address: trim(address),
      city: trim(city),
      state: trim(state),
      country: trim(country),
      notes: notes || '',
    });
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create customer', error: err.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { name, phone, mobile, email, address, city, state, country, notes } = req.body;
    const update = {};
    if (name != null) update.name = String(name).trim();
    if (phone != null) update.phone = trim(phone);
    if (mobile != null) update.mobile = trim(mobile);
    if (email != null) update.email = trim(email).toLowerCase();
    if (address != null) update.address = trim(address);
    if (city != null) update.city = trim(city);
    if (state != null) update.state = trim(state);
    if (country != null) update.country = trim(country);
    if (notes != null) update.notes = notes;

    const customer = await Customer.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update customer', error: err.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete customer', error: err.message });
  }
};
