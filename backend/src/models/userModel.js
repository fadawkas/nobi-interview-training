import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    phone: { type: String, default: "", trim: true },
    domicile: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    cv: {
      filename: { type: String, default: "" },
      url: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
