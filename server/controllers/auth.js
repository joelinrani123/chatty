const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { StreamChat } = require('stream-chat');

require('dotenv').config();

const api_key = process.env.STREAM_API_KEY;
const api_secret = process.env.STREAM_API_SECRET;

const serverClient = StreamChat.getInstance(api_key, api_secret);

const signup = async (req, res) => {
  try {
    const { fullName, username, password, phoneNumber } = req.body;

    const userId = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(password, 10);

    await serverClient.upsertUser({
      id: userId,
      name: username,
      fullName,
      phoneNumber,
      hashedPassword,
    });

    const token = serverClient.createToken(userId);

    res.status(200).json({
      token,
      fullName,
      username,
      userId,
      hashedPassword,
      phoneNumber,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const { users } = await serverClient.queryUsers({ name: username });

    if (!users.length) {
      return res.status(400).json({ message: 'User not found' });
    }

    const success = await bcrypt.compare(password, users[0].hashedPassword);

    if (!success) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    const token = serverClient.createToken(users[0].id);

    res.status(200).json({
      token,
      fullName: users[0].fullName,
      username,
      userId: users[0].id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { signup, login };