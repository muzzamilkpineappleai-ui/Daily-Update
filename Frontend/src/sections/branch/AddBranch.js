import { useEffect, useState, useMemo } from "react";
import CancelIcon from "../../../src/assets/icons/Close.png";
import pencilIcon from "../../assets/icons/pencil_line.png";
import deleteIcon from "../../assets/icons/Delete.png";
import Toast from '../../modals/ToastModel';
import Success from '../../assets/icons/Success.png';
import Error from '../../assets/icons/error.png';
import DeleteConfirmModal from '../../modals/DeleteConfirmModal';
import { createBranches, updateBranch } from '../../integration/branchApi';
import '../../Styles/Branch/AddBranchForm.css';

export default function AddBranch({ isOpen, onClose, onAdd, onUpdate, branchToEdit }) {
  const [showToast, setShowToast] = useState(false);
  const [isError, setIsError] = useState(false);
  const [countries, setCountries] = useState([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);

  const [formData, setFormData] = useState({
    country: "",
    branch_name: "",
    currency: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [branches, setBranches] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [toastData, setToastData] = useState({
    title: '', message: '', icon: Success, isDelete: false,
  });

  // Fetch countries
  useEffect(() => {
    setIsLoadingCountries(true);
    fetch("https://restcountries.com/v3.1/all?fields=name,cca2,currencies")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const sorted = data.sort((a, b) => a.name.common.localeCompare(b.name.common));
          setCountries(sorted);
        }
      })
      .catch(() => {
        showToastNotification('Failed to load countries.', false);
      })
      .finally(() => setIsLoadingCountries(false));
  }, []);

  // Reset on open/edit
  useEffect(() => {
    if (branchToEdit) {
      const branchData = {
        country: branchToEdit.country || "",
        branch_name: branchToEdit.branch_name || "",
        currency: branchToEdit.currency || "",
      };
      setFormData(branchData);
      setBranches([branchData]);
      setEditIndex(0);
      setFieldErrors({});
    } else {
      setFormData({ country: "", branch_name: "", currency: "" });
      setFieldErrors({});
      if (!isOpen) {
        setBranches([]);
        setEditIndex(null);
      }
    }
  }, [branchToEdit, isOpen]);

  const handleCountryChange = (e) => {
    const countryName = e.target.value;
    setFormData(prev => ({ ...prev, country: countryName }));
    setFieldErrors(prev => ({ ...prev, country: undefined }));

    if (!countryName) {
      setFormData(prev => ({ ...prev, currency: "" }));
      return;
    }
    const country = countries.find(c => c.name?.common === countryName);
    if (country?.currencies) {
      const key = Object.keys(country.currencies)[0];
      const curr = country.currencies[key];
      setFormData(prev => ({
        ...prev,
        currency: `${key} - ${curr.name || key}`
      }));
    } else {
      setFormData(prev => ({ ...prev, currency: "" }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const showToastNotification = (message, isSuccess = true, isDelete = false) => {
    setToastData({
      title: isSuccess ? 'Success' : 'Error',
      message,
      icon: isDelete ? deleteIcon : isSuccess ? Success : Error,
      isDelete,
    });
    setIsError(!isSuccess);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // ONLY LETTERS, SPACES, HYPHENS, APOSTROPHES, PARENTHESES — NO NUMBERS BLOCKED
  const validateBranchName = (name) => {
    const trimmed = name?.trim();
    if (!trimmed) return "Branch name is required";
    if (trimmed.length < 2) return "Branch name must be at least 2 characters";
    if (trimmed.length > 100) return "Branch name too long (max 100 characters)";

    // Only letters + allowed special chars — NO DIGITS
    const validPattern = /^[A-Za-z\s'\-()À-ÿ]+$/;  // À-ÿ supports accented letters (é, ñ, ü, etc.)

    if (!validPattern.test(trimmed)) {
      return "Numbers and special characters are not allowed.";
    }

    return null; // valid
  };

  const isDuplicateBranch = (newBranch, list = branches) => {
    return list.some((b, i) =>
      i !== editIndex &&
      b.country.toLowerCase() === newBranch.country.toLowerCase() &&
      b.branch_name.toLowerCase() === newBranch.branch_name.toLowerCase()
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFieldErrors({});

    const { country, branch_name, currency } = formData;

    if (!country) {
      setFieldErrors(prev => ({ ...prev, country: "Please select a country" }));
      showToastNotification("Please select a country", false);
      return;
    }

    const nameError = validateBranchName(branch_name);
    if (nameError) {
      setFieldErrors(prev => ({ ...prev, branch_name: nameError }));
      showToastNotification(nameError, false);
      return;
    }

    const newBranch = {
      country: country.trim(),
      branch_name: branch_name.trim(),
      currency: currency.trim(),
    };

    // Edit row
    if (editIndex !== null && !branchToEdit) {
      if (isDuplicateBranch(newBranch)) {
        showToastNotification("This branch already exists in the list", false);
        return;
      }
      const updated = [...branches];
      updated[editIndex] = newBranch;
      setBranches(updated);
      showToastNotification("Branch updated in list!");
      resetForm();
      return;
    }

    // Add new
    if (!branchToEdit) {
      if (isDuplicateBranch(newBranch)) {
        showToastNotification("This branch already exists in the list", false);
        return;
      }
      setBranches(prev => [...prev, newBranch]);
      showToastNotification("Branch added to list!");
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({ country: "", branch_name: "", currency: "" });
    setEditIndex(null);
    setFieldErrors({});
  };

  const handleEdit = (index) => {
    setFormData({ ...branches[index] });
    setEditIndex(index);
    setFieldErrors({});
  };

  const handleDelete = (index) => {
    setDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setBranches(prev => prev.filter((_, i) => i !== deleteIndex));
    showToastNotification("Branch removed from list!", true, true);
    setShowDeleteModal(false);
    setDeleteIndex(null);
    if (editIndex === deleteIndex) resetForm();
  };

  const handleFinalSubmit = async () => {
  if (isSubmitting) return;
  setIsSubmitting(true);

  try {
    if (branchToEdit) {
      // Use formData directly — branches state is never updated in edit mode
      const { country, branch_name, currency } = formData;

      if (!country || !branch_name) {
        showToastNotification("Please fill in all required fields", false);
        return;
      }

      const payload = {
        country: country.trim(),
        branch_name: branch_name.trim(),
        currency: currency.trim(),
      };

      await updateBranch(branchToEdit.id, payload);

      const updatedBranch = {
        ...branchToEdit,  // preserve id, created_at, etc.
        ...payload,       // overwrite with new values
      };

      onUpdate(updatedBranch);
      showToastNotification("Branch updated successfully!");
    } else {
      if (branches.length === 0) return;

      const validBranches = branches.filter(b => b.country && b.branch_name && b.currency);
      if (validBranches.length === 0) {
        showToastNotification("No valid branches to submit", false);
        return;
      }

      const created = await createBranches(validBranches);
      created.forEach(b => onAdd(b));
      showToastNotification("Branches added successfully!");
    }

    handleClose();
  } catch (err) {
    showToastNotification(err.message || "Submission failed", false);
  } finally {
    setIsSubmitting(false);
  }
};

  const handleClose = () => {
    setBranches([]);
    setEditIndex(null);
    setFormData({ country: "", branch_name: "", currency: "" });
    setFieldErrors({});
    onClose();
  };

  const isEditingRow = editIndex !== null && !branchToEdit;

  const branchTable = useMemo(() => (
    <tbody>
      {branches.map((branch, index) => (
        <tr key={index}>
          <td>{branch.country}</td>
          <td>{branch.branch_name}</td>
          <td>{branch.currency}</td>
          <td>
            <button className="addBranchForm-action-btn addBranchForm-edit" onClick={() => handleEdit(index)}>
              <img src={pencilIcon} alt="Edit" />
            </button>
            <button className="addBranchForm-action-btn addBranchForm-delete" onClick={() => handleDelete(index)}>
              <img src={deleteIcon} alt="Delete" />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  ), [branches]);

  if (!isOpen) return null;

  return (
    <div className="addBranchForm-modal-overlay">
      <div className={`addBranchForm-modal-content ${!branchToEdit && branches.length > 0 ? 'addBranchForm-expanded' : ''}`}>
        <div className="addBranchForm-modal-header">
          <h2>{branchToEdit ? "Edit Branch" : "Add New Branch"}</h2>
          <button className="addBranchForm-cancel-btn" onClick={handleClose}>
            <img src={CancelIcon} alt="Close" className="addBranchForm-cancel-icon" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="addBranchForm-form-row">
            <div className="addBranchForm-form-group">
              <label>Country <span className="required">*</span></label>
              <select
                name="country"
                value={formData.country}
                onChange={handleCountryChange}
                disabled={isLoadingCountries}
                required
              >
                <option value="">Select Country</option>
                {countries.map(c => (
                  <option key={c.cca2} value={c.name?.common}>{c.name?.common}</option>
                ))}
              </select>
              {fieldErrors.country && <span className="addBranchForm-error-text">{fieldErrors.country}</span>}
            </div>

            <div className="addBranchForm-form-group">
              <label>Branch Name <span className="required">*</span></label>
              <input
                type="text"
                name="branch_name"
                placeholder="e.g. Main Branch, São Paulo Central"
                value={formData.branch_name}
                onChange={handleChange}
                required
              />
              {fieldErrors.branch_name && (
                <span className="addBranchForm-error-text">{fieldErrors.branch_name}</span>
              )}
            </div>
          </div>

          <div className="addBranchForm-form-row">
            <div className="addBranchForm-form-group">
              <label>Currency</label>
              <input type="text" value={formData.currency} disabled />
            </div>
          </div>

          {!branchToEdit && (
            <div className="addBranchForm-modal-actions">
              <button type="submit" className="addBranchForm-button-btn">
                {isEditingRow ? 'Update Branch' : 'Add Branch'}
              </button>
            </div>
          )}
        </form>

        {!branchToEdit && branches.length > 0 && (
          <div className="addBranchForm-added-branches">
            <table className="addBranchForm-branches-table">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Branch Name</th>
                  <th>Currency</th>
                  <th>Action</th>
                </tr>
              </thead>
              {branchTable}
            </table>
            <button
              type="button"
              className="addBranchForm-submit-btn"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit All Branches'}
            </button>
          </div>
        )}

        {branchToEdit && formData.country && formData.branch_name && (
          <div className="addBranchForm-modal-actions">
            <button
              type="button"
              className="addBranchForm-submit-btn"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Branch'}
            </button>
          </div>
        )}
      </div>

      <Toast
        showToast={showToast}
        isError={isError}
        onClose={() => setShowToast(false)}
        title={toastData.title}
        message={toastData.message}
        icon={toastData.icon}
        isDelete={toastData.isDelete}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={confirmDelete}
      />
    </div>
  );
}