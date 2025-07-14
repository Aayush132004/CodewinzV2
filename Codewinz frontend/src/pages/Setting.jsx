import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from 'axios';
import axiosClient from '../../utils/axiosClient';
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Setting() {
  const { register, handleSubmit, watch, reset } = useForm();
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const watchFile = watch("profilePic");
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (watchFile && watchFile[0]) {
      const file = watchFile[0];
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      
      // Clean up the object URL to avoid memory leaks
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [watchFile]);

  const onSubmit = async (data) => {
    if (!data.profilePic || data.profilePic.length === 0) {
      toast.warning("Please select an image to upload");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", data.profilePic[0]);

    try {
      // Fetching signature
      const signatureResponse = await axiosClient.get(`/profile/create`);
      const { signature, timestamp, public_id, api_key, cloud_name, upload_url } = signatureResponse.data;

      // Prepare form data for Cloudinary
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('public_id', public_id);
      formData.append('api_key', api_key);

      // Upload to Cloudinary
      const uploadResponse = await axios.post(upload_url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Save to our database
      await axiosClient.post("/profile/save", {
        cloudinaryPublicId: uploadResponse.data.public_id,
        secureUrl: uploadResponse.data.secure_url,
      });

      toast.success("Profile picture updated successfully!");
      reset();
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error(err.response?.data?.message || "Failed to update profile picture");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await axiosClient.delete("/user/profile");
      toast.success("Account deleted successfully");
      navigate("/login");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error(err.response?.data?.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-screen w-screen pt-20 bg-gradient-to-br from-[#0f172a] via-[#1e253b] to-[#1e293b]">
    <div className="max-w-md  mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Account Settings</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Picture Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-700">Profile Picture</h2>
          
          <div className="flex flex-col items-center">
            {/* Circular Profile Preview */}
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
              {preview ? (
                <img
                  src={preview}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={user.profile}
                  alt="Current Profile"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* File Input */}
            <label className="mt-4 cursor-pointer">
              <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                Choose New Photo
              </span>
              <input
                type="file"
                accept="image/*"
                {...register("profilePic")}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Upload Button */}
        <button
          type="submit"
          disabled={isUploading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isUploading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          } transition-colors`}
        >
          {isUploading ? 'Uploading...' : 'Update Profile Picture'}
        </button>
      </form>

      {/* Danger Zone */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <h2 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h2>
        
        <button
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isDeleting ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'
          } transition-colors`}
        >
          {isDeleting ? 'Deleting...' : 'Delete Account'}
        </button>
        <p className="mt-2 text-sm text-gray-500">
          This will permanently delete your account and all associated data.
        </p>
      </div>
    </div>
    </div>
  );
}