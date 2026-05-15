import { User } from "../models/userModel.js";

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const { name, email, phone, domicile, description } = req.body;
    
    // Find the user first
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update basic fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (domicile !== undefined) user.domicile = domicile;
    if (description !== undefined) user.description = description;

    // Handle CV upload if present
    if (req.file) {
      user.cv = {
        filename: req.file.filename,
        // Assuming static path matches how Express serves it in app.js
        url: `/uploads/cv/${req.file.filename}`,
      };
    }

    await user.save();

    // Return updated user without password
    const updatedUser = user.toObject();
    delete updatedUser.password;

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
