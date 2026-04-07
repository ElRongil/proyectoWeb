import User from "../models/user.js";
import bcrypt from "bcryptjs";

export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword
    });

    res.status(201).json({
      email: user.email,
      status: user.status,
      role: user.role
    });

  } catch (error) {
    next(error);
  }
};