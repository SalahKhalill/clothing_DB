const { userQueries } = require('../models/db.queries');

const getUserProfile = async (req, res) => {
    try {
        const { rows } = await userQueries.getUserById(req.user.id);
        if (!rows.length) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = rows[0];
        res.json({
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phoneNumber: user.phone_number,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber } = req.body;
        const { rows } = await userQueries.updateUser(req.user.id, {
            firstName,
            lastName,
            phoneNumber
        });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getAddresses = async (req, res) => {
    try {
        const { rows } = await userQueries.getUserAddresses(req.user.id);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const addAddress = async (req, res) => {
    try {
        const { rows } = await userQueries.addUserAddress(req.user.id, req.body);
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateUserAddress = async (req, res) => {
    try {
        const { rows } = await userQueries.updateUserAddress(req.params.id, req.body);
        if (!rows.length) {
            return res.status(404).json({ message: 'Address not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteUserAddress = async (req, res) => {
    try {
        const { rows } = await userQueries.deleteUserAddress(req.params.id);
        if (!rows.length) {
            return res.status(404).json({ message: 'Address not found' });
        }
        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getUserProfile,
    updateProfile,
    getAddresses,
    addAddress,
    updateUserAddress,
    deleteUserAddress
};