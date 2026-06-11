import { changePasswordAPI } from "../../integration/changePasswordApi";

export const handlePasswordChange = async ({
  currentPass,
  newPass,
  confirmPass,
  setErrors,
  setToast,
  clearFields,
}) => {
  // Reset errors
  setErrors({ current: false, newPass: false, confirm: false });

  // Block demo user
  if (currentPass === "admin123") {
    setToast({
      show: true,
      type: "error",
      message: "This is a default user. Password cannot be changed.",
    });
    return;
  }

  // Validation
  const validation = {
    current: currentPass.length < 1,
    newPass: newPass.length < 8 || !/\d/.test(newPass),
    confirm: confirmPass !== newPass || confirmPass.length < 8,
  };

  setErrors(validation);

  if (Object.values(validation).some(Boolean)) {
    setToast({
      show: true,
      type: "error",
      message: "Please check your password entries",
    });
    return;
  }

  try {
    await changePasswordAPI(currentPass, newPass);
    setToast({
      show: true,
      type: "success",
      message: "Password changed successfully!",
    });
    clearFields();
  } catch (err) {
    const msg = err.response?.data?.error || "Failed to update password";
    setToast({
      show: true,
      type: "error",
      message: msg,
    });
  }
};